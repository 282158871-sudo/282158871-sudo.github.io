/* ★ v4.194 语文考点补全引擎（自包含，不依赖 app 原有 quiz 逻辑）
   数据来源：cnchar（笔画/拼音/多音）+ hanzi-writer-data（笔顺 SVG）+ hanzi_ordertype（笔形）+ 内置权威小学生语料
   题型：拼音 / 笔画数 / 偏旁部首 / 笔顺 / 多音字 / 近反义词 / 词语搭配 / 连词成句 / 阅读短文
   ★ v4.255 新增：同音字选字填空（tongyin）/ 形近字选字填空（xiangjin）
     —— 此前 3~6 年级考点池挂了这两个考点，却没有出题器，抽到即被跳过（断裂）。
   ★ 本次改动：
     1) 字体与选项全部回归 app 原生样式（.opt-grid/.opt-btn/.chip/.quiz-hint/.quiz-q-row），
        不再自造 .q-opt/.word-chip，和数学练习、原有识字题长得一模一样。
     2) 全部题型加语音：题干旁「读题」小喇叭 + 下方「🔊 听一听」大按钮，
        走 app 原有 speakTextInstant（在线 TTS 媒体通道，蓝牙有声），失败自动回退系统 TTS。
     3) 全部题型都做成"能答题、能判对错"：连词成句改为点词块拼句可判分，
        笔顺题「考一考」改为真选择题（第N笔是什么）。 */
var HanziExtra = (function(){
  var MODES = {py:1,stroke:1,radical:1,order:1,poly:1,synant:1,colloc:1,orderq:1,reading:1,tongyin:1,xiangjin:1,dictXy:1,dictRad:1,
    /* ★ v4.330 六年级语文收口：gen map / SUBJ_MODES / FLOW_HANZI_MODES 早就登记了高段考点，
       却漏了这道「门」——genByModeKey 要求 HanziExtra.modes[key] 为真才去调 HanziExtra.gen，
       而 MODES 仅含低段识字题型，导致小古文 / 修辞 / 含义深刻句 / 记叙顺序 / 读后感等所有高段
       语文考点在真实今日流程里一律抽不到（之前的「能出」都是直接调 HanziExtra.gen 的假象）。
       这里一并补齐全学段高段考点 + 本轮新考点，使守门与登记表一致。
       order / orderq 是操作型题（opts:null），真实流程走 genScorable，不在此门内。 */
    bianju:1,jushi:1,guanlian:1,duanluo:1,zuowen:1,deepreading:1,xiaoguwen:1,xiuci:1,renwu:1,yingyong:1,
    shendiao:1,jixu:1,duhougan:1,
    express:1,detail:1,explore:1,recite80:1,clwen2:1};
  var _cur = null, _pendingWord='';
  var _curQ = null;   /* 当前题对象，供语音朗读使用 */
  var _spoken = '';   /* 已自动朗读过的题目指纹，防止同一题重复朗读 */

  /* ★ v4.199 拼音拆分：字库存的是「符号调」(wǒ / shuǐ)，
     旧代码却按「数字调」(wo3) 解析 —— 韵母取成了声母、声调永远是空。
     这里统一把符号调转成 {base, tone}，再按标准声母表切分。 */
  var TONE_TAB={'\u0101':['a',1],'\u00e1':['a',2],'\u01ce':['a',3],'\u00e0':['a',4],
                '\u014d':['o',1],'\u00f3':['o',2],'\u01d2':['o',3],'\u00f2':['o',4],
                '\u0113':['e',1],'\u00e9':['e',2],'\u011b':['e',3],'\u00e8':['e',4],
                '\u012b':['i',1],'\u00ed':['i',2],'\u01d0':['i',3],'\u00ec':['i',4],
                '\u016b':['u',1],'\u00fa':['u',2],'\u01d4':['u',3],'\u00f9':['u',4],
                '\u01d6':['v',1],'\u01d8':['v',2],'\u01da':['v',3],'\u01dc':['v',4],
                '\u00fc':['v',0]};
  var SHENG_LIST=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w'];
  function pySplitStd(py){
    var base='',tone=0;
    for(var i=0;i<String(py||'').length;i++){
      var c=String(py)[i];
      if(TONE_TAB[c]){ base+=TONE_TAB[c][0]; if(TONE_TAB[c][1])tone=TONE_TAB[c][1]; }
      else base+=c;
    }
    var sheng='',yun=base;
    for(var k=0;k<SHENG_LIST.length;k++){
      if(base.indexOf(SHENG_LIST[k])===0){ sheng=SHENG_LIST[k]; yun=base.slice(SHENG_LIST[k].length); break; }
    }
    /* 小学声母表含 y/w（23 个），不按"零声母"处理 */
    /* 整体认读音节不拆声母韵母（yi/wu/yu/ye/yue/yuan/yin/yun/ying/zhi/chi/shi/ri/zi/ci/si） */
    var INTEGRAL=['zhi','chi','shi','ri','zi','ci','si','yi','wu','yu','ye','yue','yuan','yin','yun','ying'];
    return {base:base,tone:tone,sheng:sheng,yun:yun,isIntegral:INTEGRAL.indexOf(base)>=0};
  }

  function metaOf(w){ return (typeof HANZI_META!=='undefined'&&HANZI_META[w])||null; }
  /* 当前册的字池：复用 app 的 libByCe（按课名前缀过滤），无则回退全量 */
  function cePool(){
    try{ if(typeof libByCe==='function'){ var l=libByCe().list||[]; if(l.length)return l; } }catch(e){}
    return (typeof HANZI_LIB!=='undefined')?HANZI_LIB:[];
  }
  function ceChars(){ return cePool().map(function(h){return h[0];}).filter(Boolean); }
  function pick(a){ if(!a||!a.length)return null; return a[Math.floor(Math.random()*a.length)]; }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; }

  /* ============ 原生样式工具 ============ */
  function escAttr(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
  function optGridHTML(opts,correctIdx,ans){
    return '<div class="opt-grid">'+opts.map(function(o,i){
      var cls='opt-btn'+(String(o).length>3?' word-opt':'');
      return '<button class="'+cls+'" data-correct="'+(i===correctIdx?1:0)+'" data-ans="'+escAttr(ans)+'">'+o+'</button>';
    }).join('')+'</div>';
  }
  function optGrid3HTML(opts,correctIdx,ans){
    /* 阅读题选项是 2-3 字的词，用三列；字号收一点并允许换行居中，
       否则「放石子」会被挤成「放石/子」两行，看着别扭。 */
    return '<div class="opt-grid cols3">'+opts.map(function(o,i){
      return '<button class="opt-btn" style="font-size:22px;letter-spacing:0;padding:8px 4px;word-break:keep-all" data-correct="'+(i===correctIdx?1:0)+'" data-ans="'+escAttr(ans)+'">'+o+'</button>';
    }).join('')+'</div>';
  }
  function tagChip(tag){ return '<span class="chip logic-type-tag" style="background:var(--blue-l);color:var(--blue)">'+escAttr(tag)+'</span>'; }
  /* 题干行：题干 + 「读题」小喇叭（和数学练习同一套 .quiz-q-row/.qread-btn） */
  function qRowHTML(qText){
    return '<div class="quiz-q-row"><div class="quiz-q" style="font-size:19px;color:var(--ink);font-weight:800">'+qText+'</div>'+
      '<button class="qread-btn" data-act="read-q" title="读题" aria-label="读题">'+ic('sound',22)+'</button></div>';
  }
  function listenBtnHTML(){ return '<button class="quiz-audio" data-act="listen-all">🔊 听一听</button>'; }
  function ic(name,size){ try{ if(typeof icon==='function') return icon(name,size||22); }catch(e){} return ''; }

  /* ============ 语音 ============ */
  function say(text,scene){
    var t=String(text==null?'':text).trim();
    if(!t)return;
    try{ if(typeof speakTextInstant==='function'){ speakTextInstant(t,function(){}); return; } }catch(e){}
    try{ if(typeof sysSpeak==='function'){ sysSpeak(t,'zh-CN',scene||'hanzi'); return; } }catch(e){}
    try{
      if('speechSynthesis' in window){
        try{window.speechSynthesis.cancel()}catch(e){}
        var u=new SpeechSynthesisUtterance(t);
        u.lang='zh-CN'; u.rate=0.88;
        window.speechSynthesis.speak(u);
      }
    }catch(e){}
  }
  function stopSay(){
    try{ if(typeof speakAudioStop==='function') speakAudioStop(); }catch(e){}
    try{ if('speechSynthesis' in window) window.speechSynthesis.cancel(); }catch(e){}
  }
  function clean(text){
    var t=String(text==null?'':text);
    try{ if(typeof speakCleanText==='function') return speakCleanText(t); }catch(e){}
    return t.replace(/<[^>]*>/g,'').replace(/[○●◯△▲□■◇◆★☆♥♡√×✕（）()\[\]【】_—\/\\|]/g,' ').replace(/\s+/g,' ').trim();
  }
  function readQuestion(){ var q=_curQ; if(!q)return; say(q.speakQ||clean(q.q),'hanzi'); }
  function listenAll(){
    var q=_curQ; if(!q)return;
    var parts=[];
    if(q.title)parts.push(q.title);
    if(q.body)parts.push(clean(q.body));
    if(q.words&&q.words.length)parts.push('词语是：'+q.words.join('，'));
    parts.push(q.speakQ||clean(q.q));
    if(q.opts&&q.opts.length)parts.push('选项：'+q.opts.map(function(o){return clean(o);}).join('，'));
    if(q.orderWord)parts.push('请按笔顺写一写这个字');
    say(parts.join('。'),'hanzi');
  }

  /* ============ 计分 ============ */
  function updateScore(ok){
    /* ★ v4.342：星星/士气仍在这里加。
       能力值(power)、弱项画像(focusTags)、每日流水(dayLog)、统计(stats)
       改由 paint() / paintSentence() 里的 markCorrect / markWrong 统一写，
       不再在这里单独 pwBump —— 否则会与 markCorrect/markWrong 内部的 pwBump 重复涨能力值。
       daily 传 null：自由练习不串「今日必做」打卡（打卡闸门 corePlanDone 只读 dailyPlan，
       不读 todayQuiz；todayQuiz 只喂 perfectDay 成就，数学侧自由练习本就如此，不污染打卡）。 */
    try{ if(ok){ if(typeof addStar==='function')addStar(1); else if(typeof playStar==='function')playStar(); } }catch(e){}
  }
  function fb(msg,color){ var e=document.getElementById('hz-extra-fb'); if(e)e.innerHTML='<span style="color:'+(color||'#2e9e4f')+';font-size:16px">'+msg+'</span>'; }

  /* ============ 错题采集（接进 app 原有错题本） ============
     答错不告诉答案，而是把这道题送进错题本；孩子去「错题重练 → 讲一讲」
     看解析。这里要构造 app 认得的 q 对象（type/tag/q/stage/options），
     并把「提示」写进 stage —— 注意 stage 是给错题页显示的题面，
     不会泄露答案；答案只存在 options 里 correct 那一项。 */
  function toAppQ(){
    var q=_curQ; if(!q)return null;
    /* ★ 不要在 stage 里再放类型 chip —— 错题重练页自己会渲染一个，
       重复放会出现两个一模一样的「笔画 · 数一数」标签（已实测）。 */
    var stage='';
    if(q.title) stage+='<div style="font-weight:800;margin:6px 0 4px">'+escAttr(q.title)+'</div>';
    if(q.body) stage+='<div style="text-align:left;line-height:1.8">'+escAttr(q.body)+'</div>';
    if(q.orderWord) stage+='<div style="font-size:34px;font-weight:800;margin:8px 0">'+escAttr(q.orderWord)+'</div>';
    stage+='<div style="font-size:17px;font-weight:800;margin:8px 0">'+escAttr(q.q||'')+'</div>';
    /* ★ 连词成句没有"选项"，它的答案是整句。
       app 的错题本要求 options 非空（collectWrong 里会直接 return），
       所以这里把「打乱的词块」当成选项传给错题本，并把正确答案标出来 ——
       这样错题重练页也能把它当普通选择题渲染，孩子重新排一遍。
       选项文本就是词本身，不构成泄题（练习页里也是这些词）。 */
    var opts=[];
    if(q.opts&&q.opts.length){
      opts=q.opts.map(function(o,i){ return {html:escAttr(o), correct:(i===q.correct)}; });
    }else if(q.words&&q.words.length){
      /* 第一个选项=正确答案（整句），其余=干扰项（打乱的词）。
         错题重练页把它当选择题渲染：选项里能看到正确句子。 */
      opts=[{html:escAttr(q.words.join('')), correct:true}];
      var others=q.words.slice().reverse();
      others.forEach(function(w){ opts.push({html:escAttr(w), correct:false}); });
    }
    if(!opts.length)return null;
    return {
      type:'hanzi-'+(_cur?_cur.mode:''),
      tag:q.tag||'',
      q:q.speakQ||q.q||'',
      stage:stage,
      options:opts,
      /* 提示（不泄露答案）：给错题页「不会做时看一眼」用 */
      hint:(q&&q.hint)||hintOf(q),
      wordChar:q.orderWord||'',
      /* 连词成句的标准答案（整句），供解析用 */
      sentAnswer:q.words?q.words.join(''):''
    };
  }
  /* 按题型给"思路提示"，只讲方法不给答案 */
  function hintOf(q){
    var t=q.tag||'';
    if(t.indexOf('笔画 · ')===0) return '数笔画的时候，可以照着这个字在心里一笔一笔写，写完数一数有几笔。';
    if(t.indexOf('偏旁')===0)   return '部首通常在这个字的左边、上边或者外边，先找找它最有特点的那一部分。';
    if(t.indexOf('笔顺')===0)   return '想一想这个字先写哪一笔。写字一般从上到下、从左到右。';
    if(t.indexOf('拼音 · 标调')===0) return '读出这个字的音，感受一下声音是平的、往上的、拐弯的，还是往下的。';
    if(t.indexOf('拼音 · 声母')===0) return '声母是音节开头的那个字母，把这个字慢慢读出来，开头是哪个音？';
    if(t.indexOf('拼音 · 韵母')===0) return '韵母是音节里除了声母剩下的部分，把声母去掉就是韵母啦。';
    if(t.indexOf('多音字')===0) return '同一个字在不同词语里读音可能不一样。把这个词语整个读一读，读顺了就是它。';
    if(t.indexOf('近义词')===0) return '近义词就是意思相近的词。想一想，哪个词换成句子里也说得通？';
    if(t.indexOf('反义词')===0) return '反义词就是意思相反的词。想一想，哪个词的意思正好和它对着来？';
    if(t.indexOf('词语 · 搭配')===0) return '把每个词和这个字连起来读一读，哪个读起来是我们平时会说的话？';
    if(t.indexOf('连词 · 成句')===0) return '先想想这句话在说"谁、做什么"。把主语放在最前面，再按顺序排下去。';
    if(t.indexOf('阅读 · 短文')===0) return '回到短文里找一找，答案就藏在文章中间哦，仔细读一遍。';
    return '想一想我们平时是怎么读、怎么写的，再选一个试试。';
  }
  /* 答错时把题送进错题本（去重由 app 的 collectWrong 负责） */
  function collectWrongHint(){
    try{
      if(typeof collectWrong!=='function')return;
      var aq=toAppQ();
      if(aq)collectWrong('hanzi',aq);
    }catch(e){}
  }

  /* ============ 交互绑定 ============ */
  function paint(){
    var box=document.getElementById('hz-extra-box'); if(!box)return;

    /* —— 选择题 —— */
    box.querySelectorAll('.opt-btn').forEach(function(b){
      b.onclick=function(){
        if(b.classList.contains('good')||b.classList.contains('bad'))return;
        var ok=b.getAttribute('data-correct')==='1';
        var all=box.querySelectorAll('.opt-btn');
        all.forEach(function(x){ x.disabled=true; });
        b.classList.add(ok?'good':'bad');
        if(ok){
          try{ if(typeof playCorrect==='function') playCorrect(); }catch(e){}
          fb('✓ 答对啦！'); say('答对啦','praise');
          /* 答对了：把正确答案亮出来（此时已作答完，不涉及泄题） */
          all.forEach(function(x){ if(x.getAttribute('data-correct')==='1')x.classList.add('good'); });
          all.forEach(function(x){ x.disabled=true; });
          /* ★ v4.341 答对自动跳下一题：与主测验区（闯关/练习）体验一致——
             答对后约 1 秒自动出下一道；答错停留让孩子重想（不自动跳）。
             传 box 引用做防重：切走或手动点「换一题」后题卡已被换掉，定时器就不会再跳。 */
          _autoAdvance(box);
          /* ★ v4.342 接通学情：答对写能力值/连对/统计/流水（daily=null 不串必做打卡） */
          try{ if(typeof markCorrect==='function') markCorrect('hanzi',null,_curQ); }catch(e){}
        }else{
          /* ★ 答错不直接给答案：只标红所选项，让孩子重想。
             正确答案放进错题本，去「错题重练 → 讲一讲」看解析。
             已排除的错误选项禁用，避免反复点同一个。 */
          try{ if(typeof playWrong==='function') playWrong(); }catch(e){}
          b.disabled=true;
          b.classList.add('bad');
          all.forEach(function(x){ if(x.getAttribute('data-correct')!=='1'){ x.disabled=true; } });
          fb('再看看～这个不对哦，换一个试试','#e8543f');
          /* ★ v4.340 G1Chinese 考点题：答错后亮出本题解析（答题前隐藏，不泄题） */
          if(_appQHint){ var _hb=document.getElementById('hz-appq-hint'); if(_hb)_hb.style.display='block'; }
          say('再看看，这个不对哦，换一个试试','hanzi');
          collectWrongHint();
          /* ★ v4.342 接通学情：答错写弱项画像+能力值+统计+流水，并接入坑史（hanzi 选项无 .err，trapHit 自动 no-op） */
          try{ if(typeof markWrong==='function') markWrong('hanzi',_curQ); }catch(e){}
          try{ if(typeof focusOnWrongTag==='function'&&_curQ) focusOnWrongTag(_curQ); }catch(e){}
          try{ if(typeof trapHitSoon==='function') trapHitSoon(b,_curQ,'hanzi'); }catch(e){}
        }
        updateScore(ok);
      };
    });

    /* —— 笔顺题：逐笔/连播/全部 —— */
    var strokes=box.querySelectorAll('.ostroke');
    if(strokes.length){
      var idx=0, timer=null;
      function show(k){ for(var i=0;i<strokes.length;i++) strokes[i].style.opacity=(i<k?1:0); }
      function stopT(){ if(timer){clearInterval(timer);timer=null;} }
      function playAll(){
        stopT(); show(0); idx=0;
        timer=setInterval(function(){ idx++; show(idx); if(idx>=strokes.length){ stopT(); } },620);
      }
      var bPlay=box.querySelector('[data-act="write-play"]');
      if(bPlay)bPlay.onclick=function(){ playAll(); say('我们一起来写一写','hanzi'); };
      var bStep=box.querySelector('[data-act="write-step"]');
      if(bStep)bStep.onclick=function(){ stopT(); idx=Math.min(idx+1,strokes.length); show(idx); };
      var bAll=box.querySelector('[data-act="write-all"]');
      if(bAll)bAll.onclick=function(){ stopT(); show(strokes.length); };
      var hint=box.querySelector('#ord-hint');
      if(hint)hint.textContent='共 '+strokes.length+' 笔 · 点「逐笔写」或「连播」看笔顺';
      show(0);
      /* ★ 自动念字音：只在本道题的第一次 paint 播一次。
         原来没做去重，render() 里的 setTimeout(paint,30) 和别处再调一次 paint()
         会导致同一句话连读两遍（"这个字念秋。这个字念秋。"）。
         用题目指纹（模式+字）做 key，同一道题只念一次。 */
      var ow=_curQ&&_curQ.orderWord;
      if(ow){
        var key='word:'+ow;
        if(_spoken!==key){
          _spoken=key;
          setTimeout(function(){ say('这个字念 '+ow,'hanzi'); },260);
        }
      }
    }

    /* —— 笔顺自测：第N笔是什么 —— */
    var bQuiz=box.querySelector('[data-act="order-quiz"]');
    if(bQuiz)bQuiz.onclick=function(){ buildOrderQuiz(); };

    /* —— 连词成句：点词块拼句 —— */
    paintSentence(box);

    /* —— 通用按钮 —— */
    var nx=box.querySelector('[data-act="next"]'); if(nx)nx.onclick=function(){ stopSay(); _redraw(); };
    var rd=box.querySelector('[data-act="read-q"]'); if(rd)rd.onclick=function(){ readQuestion(); };
    var la=box.querySelector('[data-act="listen-all"]'); if(la)la.onclick=function(){ listenAll(); };
  }

  /* ============ 连词成句：可答题实现 ============
     交互：点下方词块 → 该词进入上方「答题区」，按点击顺序拼成句子；
           点答题区里的词 → 退回下方，可重排。
     检查答案：与标准答案完全一致 → 判对；否则提示第几个词不对。
     ★ 渲染采用"由状态重绘"：维护 picked 数组，每次变更整块重画，
       避免"先 append 再 refresh 被清空"这类 DOM 竞态。 */
  function paintSentence(box){
    if(!_curQ||!_curQ.words)return;
    var answered=false;
    var want=_curQ.words;
    var picked=[];              /* 答题区当前选中的词（按顺序） */
    var chipCss='display:inline-block;padding:10px 16px;background:#FAF7FF;border:2px solid #EDE4FF;border-radius:14px;font-size:19px;font-weight:800;color:#3C4858;cursor:pointer;user-select:none';
    var putCss='display:inline-block;padding:10px 16px;background:#E9E1FF;border:2px solid #B197FC;border-radius:14px;font-size:19px;font-weight:800;color:#4A3B42;cursor:pointer;user-select:none';

    /* 词块池：每个词块记录它在原句里的下标，避免重复词歧义（如「了」出现两次） */
    var poolWords=want.map(function(w,i){return {w:w,i:i};});
    /* 池中的展示顺序打乱；渲染时按 usedIdx 判断是否已用 */
    var displayOrder=shuffle(poolWords.map(function(x){return x.i;}));

    function renderAll(){
      var slot=box.querySelector('#sent-slot');
      var pool=box.querySelector('#sent-pool');
      if(!slot||!pool)return;
      /* —— 答题区 —— */
      if(!picked.length){
        slot.innerHTML='<span style="color:#C4AAB2;font-weight:700">点下面的词，按顺序排成一句话</span>';
      }else{
        slot.innerHTML=picked.map(function(idx,k){
          return '<span class="sent-word sent-put" data-idx="'+idx+'" data-pos="'+k+'" style="'+putCss+'">'+escAttr(want[idx])+'</span>';
        }).join('');
      }
      /* —— 词块池 —— */
      pool.innerHTML=displayOrder.map(function(idx){
        var used=picked.indexOf(idx)>=0;
        return '<span class="sent-word" data-idx="'+idx+'" style="'+chipCss+(used?';opacity:.3;pointer-events:none':'')+'">'+escAttr(want[idx])+'</span>';
      }).join('');
      bind();
    }

    function bind(){
      var slot=box.querySelector('#sent-slot');
      var pool=box.querySelector('#sent-pool');
      if(pool) Array.prototype.forEach.call(pool.querySelectorAll('.sent-word'),function(el){
        el.onclick=function(){
          if(answered)return;
          var idx=parseInt(el.getAttribute('data-idx'),10);
          if(picked.indexOf(idx)>=0)return;
          picked.push(idx);
          say(want[idx],'hanzi');
          renderAll();
        };
      });
      if(slot) Array.prototype.forEach.call(slot.querySelectorAll('.sent-put'),function(el){
        el.onclick=function(){
          if(answered)return;
          var idx=parseInt(el.getAttribute('data-idx'),10);
          var k=picked.indexOf(idx);
          if(k>=0)picked.splice(k,1);       /* 退回池中 */
          say(want[idx],'hanzi');
          renderAll();
        };
      });
    }

    var bCheck=box.querySelector('[data-act="sent-check"]');
    if(bCheck)bCheck.onclick=function(){
      if(answered)return;
      if(picked.length<want.length){
        fb('还有词没用上，把下面的词都用完再检查～','#E8930A');
        say('还有词语没有用上，请把下面的词语都用完','hanzi');
        return;
      }
      answered=true;
      var got=picked.map(function(i){return want[i];});
      var slot=box.querySelector('#sent-slot');
      if(got.join('')===want.join('')){
        if(slot)slot.style.borderColor='#3ECF6E';
        try{ if(typeof playCorrect==='function') playCorrect(); }catch(e){}
        fb('✓ 答对啦！句子是：'+want.join(''),'#2e9e4f');
        say('答对啦，句子是'+want.join(''),'praise');
        updateScore(true);
        /* ★ v4.342 接通学情：连词成句答对也写能力值/统计/流水 */
        try{ if(typeof markCorrect==='function') markCorrect('hanzi',null,_curQ); }catch(e){}
      }else{
        if(slot)slot.style.borderColor='#FF6B6B';
        try{ if(typeof playWrong==='function') playWrong(); }catch(e){}
        var badAt=1;
        for(var i=0;i<got.length;i++){ if(got[i]!==want[i]){ badAt=i+1; break; } }
        fb('再看看～第 '+badAt+' 个词不太对哦','#e8543f');
        say('再看看，第'+badAt+'个词语不太对','hanzi');
        collectWrongHint();
        /* ★ v4.342 接通学情：连词成句答错也写弱项画像+能力值+统计+流水 */
        try{ if(typeof markWrong==='function') markWrong('hanzi',_curQ); }catch(e){}
        try{ if(typeof focusOnWrongTag==='function'&&_curQ) focusOnWrongTag(_curQ); }catch(e){}
      }
    };
    /* 「看答案」在练习时不给整句，只给一句思路提示，答案留到错题本看解析 */
    var bAns=box.querySelector('[data-act="sent-answer"]');
    if(bAns)bAns.onclick=function(){
      if(answered)return;
      answered=true;
      var slot=box.querySelector('#sent-slot');
      if(slot){ slot.style.borderColor='#FFB93C'; }
      fb('小提示：'+hintOf({tag:'连词 · 成句'}),'#E8930A');
      say('小提示，先想想这句话在说谁、做什么','hanzi');
      collectWrongHint();
    };
    var bReset=box.querySelector('[data-act="sent-reset"]');
    if(bReset)bReset.onclick=function(){
      answered=false;
      picked=[];
      var slot=box.querySelector('#sent-slot');
      if(slot)slot.style.borderColor='#EDE4FF';
      fb('');
      renderAll();
    };
    renderAll();
  }

  /* ============ 笔顺自测：第N笔是什么 ============ */
  var STROKE_NAME_ALL=['横','竖','撇','捺','点','提','横折','竖折','横钩','竖钩','弯钩','斜钩','卧钩','横折钩','竖弯钩','横折弯钩','竖提','横折提','撇折','撇点','横撇','竖弯'];
  function buildOrderQuiz(){
    var box=document.getElementById('hz-extra-box'); if(!box||!_curQ)return;
    var w=_curQ.orderWord; if(!w)return;
    var types=(typeof HANZI_ORDERTYPE!=='undefined'&&HANZI_ORDERTYPE[w])?HANZI_ORDERTYPE[w]:null;
    var total=(typeof HANZI_STROKES!=='undefined'&&HANZI_STROKES[w])?HANZI_STROKES[w].length:0;
    if(!types||!total)return;
    var n=1+Math.floor(Math.random()*total);
    var answer=types[n-1];
    /* 干扰项优先取同一字里出现过的其它笔形（更易混），不够再补通用笔形 */
    var inChar=[]; types.forEach(function(x){ if(x!==answer&&inChar.indexOf(x)<0)inChar.push(x); });
    var others=shuffle(inChar).slice(0,3);
    if(others.length<3){
      var rest=shuffle(STROKE_NAME_ALL.filter(function(x){return x!==answer&&others.indexOf(x)<0;}));
      while(others.length<3&&rest.length)others.push(rest.pop());
    }
    var opts=shuffle(others.slice(0,3).concat([answer]));
    var ci=opts.indexOf(answer);
    var hint=box.querySelector('#ord-hint');
    if(hint)hint.textContent='「'+w+'」共 '+total+' 笔 · 第 '+n+' 笔是什么？';
    /* 题干在前、选项在后：把题干行移到操作条之上。
       原来 bar.outerHTML 就地替换，选项会跑到题干上方，读起来倒置。 */
    var bar=box.querySelector('[data-act="order-quiz"]').parentNode;
    var qRow=box.querySelector('.quiz-q-row');
    var listenBtn=box.querySelector('[data-act="listen-all"]');
    var holder=document.createElement('div');
    holder.innerHTML=optGridHTML(opts,ci,answer)+
      '<div style="text-align:center;margin-top:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
        '<button class="btn btn-ghost" data-act="back-order">返回看笔顺</button>'+
      '</div>';
    /* 把新选项插到「题干行之后」——即插到 listen 按钮之前 */
    if(qRow && listenBtn){ box.insertBefore(holder, listenBtn); }
    else if(qRow){ qRow.insertAdjacentElement('afterend',holder); }
    else { bar.parentNode.insertBefore(holder,bar); }
    bar.parentNode.removeChild(bar);
    _curQ.q='「'+w+'」的第 '+n+' 笔是什么？';
    _curQ.speakQ='「'+w+'」的第 '+n+' 笔是什么？';
    _curQ.opts=opts; _curQ.correct=ci; _curQ.ans=answer;
    /* 题干文字要同步更新到页面（原来只改了 _curQ，画面仍显示"规范笔顺"） */
    var qEl=box.querySelector('.quiz-q');
    if(qEl)qEl.textContent=_curQ.q;
    say(_curQ.q,'hanzi');
    paint();
    var back=box.querySelector('[data-act="back-order"]');
    if(back)back.onclick=function(){ _redraw(); };
  }

  function _redraw(){
    var box=document.getElementById('hz-extra-box'); if(!box)return;
    if(!_cur)return;
    _spoken='';     /* 换新题：清空朗读指纹，新题的字音才能念出来 */
    var host=box.parentNode; if(!host)return;
    /* ★ v4.340 G1Chinese 考点题的「换一题」：走 G1Chinese.gen 重出，
       不能落回 render(mode) —— 那里的 gen 表没有 G1Chinese 的 key，会出成"没有内容"。 */
    var _isG1=(typeof window!=='undefined'&&window.G1Chinese&&G1Chinese.keys&&G1Chinese.keys.indexOf(_cur.mode)>=0);
    var html2=_isG1? renderAppQ(window.G1Chinese.gen(_cur.mode),_cur.mode,_cur.ce) : render(_cur.mode,_cur.ce);
    var tmp=document.createElement('div'); tmp.innerHTML=html2;
    var nb=tmp.querySelector('#hz-extra-box');
    if(nb&&host){ host.replaceChild(nb,box); paint(); }
  }

  /* ★ v4.341 答对自动跳下一题。
     用被点击题卡的 box 引用做幂等保护：定时器触发时若当前 #hz-extra-box
     已不是这个 box（被手动「换一题」/切走/重绘换掉），就跳过，绝不重复跳。 */
  function _autoAdvance(box){
    if(!box)return;
    setTimeout(function(){
      var cur=document.getElementById('hz-extra-box');
      if(cur!==box)return;          /* 题卡已被换掉，不重复跳 */
      try{ stopSay(); _redraw(); }catch(e){}
    },1050);
  }

  /* ★ v4.340 外部考点引擎（G1Chinese）渲染口：
     raw = {tag,q,speakQ,opts[字符串数组],correct[索引],ans,hint,wordChar}
     复用本模块同一套题卡外壳 / 选项网格 / 判分 / 错题本 / 发音，保证体验一致。 */
  var _appQHint='';
  function renderAppQ(raw,mode,ce){
    stopSay();
    _appQHint='';
    if(!raw||!raw.opts||!raw.opts.length){
      _curQ={q:'这个题型暂时没有合适的内容',speakQ:'这个题型暂时没有合适的内容'};
      return wrap(mode,ce,'<div class="quiz-hint" style="font-size:16px;padding:20px 0">这个题型暂时没有合适的内容，换一个试试～</div>');
    }
    _pendingWord=raw.wordChar||'';
    _curQ={tag:raw.tag||'语文 · 考点',q:raw.q,speakQ:raw.speakQ||raw.q,
           opts:raw.opts.map(String),correct:raw.correct,ans:raw.ans,
           variant:mode, type:'hanzi-'+mode, hint:raw.hint};
    _appQHint=raw.hint||'';
    /* ★ v4.342 练习提示优先引用巧解库口诀（命中 23 考点巧解时更贴近考点）；
       命中不了就退回题目自带 hint，再不行留空（页面不显示提示框）。 */
    try{
      if(typeof explainByLib==='function'){
        var _lib=explainByLib({q:_curQ});
        if(_lib&&_lib.rhyme)_appQHint=_lib.rhyme;
      }
    }catch(e){}
    var inner='';
    if(raw.tag)inner+=tagChip(raw.tag);
    inner+=qRowHTML(raw.q);
    inner+=optGridHTML(_curQ.opts,raw.correct,raw.ans);
    if(_appQHint)inner+='<div id="hz-appq-hint" class="quiz-hint" style="display:none;text-align:left;line-height:1.8">'+escAttr(_appQHint)+'</div>';
    inner+=listenBtnHTML();
    var box=wrap(mode,ce,inner);
    setTimeout(paint,30);
    return box;
  }

  /* 统一外壳：沿用 app 原生 .card .quiz-card */
  function wrap(mode,ce,inner){
    _cur={mode:mode,ce:ce,word:(_pendingWord||'')};
    return '<div id="hz-extra-box" class="card quiz-card">'+
      inner+
      '<div id="hz-extra-fb" class="quiz-hint" style="text-align:center;min-height:20px;margin-top:10px;font-weight:800"></div>'+
      '<div style="text-align:center;margin-top:14px"><button class="btn btn-purple" data-act="next">换一题</button></div></div>';
  }

  /* ================= 出题 ================= */

  // —— 1. 拼音 ——
  function genPy(){
    var pool=cePool();
    if(!pool.length)pool=Object.keys(HANZI_META||{}).map(function(k){return [k];});
    var e=pick(pool); var w=e[0]; var py=e[1]||'';
    if(!py)return null;
    var _s=pySplitStd(py); var sheng=_s.sheng; var yun=_s.yun; var toneNum=String(_s.tone||'');
    var tname={'1':'第一声','2':'第二声','3':'第三声','4':'第四声','0':'轻声'}[toneNum]||'';
    if(!tname)return null;              /* 解析不出声调就换一题，别出错题 */
    if(!yun)return null;
    /* 整体认读音节（yi/wu/yu/zhi…）教材要求整体记，不拆声母韵母 */
    var _canSplit=!_s.isIntegral && sheng && yun;
    var mode=_canSplit ? Math.floor(Math.random()*3) : 0;
    if(mode===0){
      var opts=shuffle(['第一声','第二声','第三声','第四声','轻声']);
      var ci=opts.indexOf(tname);
      return {tag:'拼音 · 标调',q:'「'+w+'」('+py+') 是几声？',speakQ:'「'+w+'」是第几声？',opts:opts,correct:ci,ans:tname};
    }
    if(mode===1){
      var opts2=shuffle(['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w']).slice(0,4);
      if(opts2.indexOf(sheng)<0){opts2[0]=sheng;}
      opts2=shuffle(opts2); var ci2=opts2.indexOf(sheng);
      return {tag:'拼音 · 声母',q:'「'+w+'」的声母是？',speakQ:'「'+w+'」的声母是什么？',opts:opts2.map(up),correct:ci2,ans:sheng.toUpperCase()};
    }
    var opts3=shuffle(['a','o','e','i','u','ü','ai','ei','ui','ao','ou','iu','ie','üe','an','en','in','un','ang','eng','ing','ong']).slice(0,4);
    if(opts3.indexOf(yun)<0){opts3[0]=yun;}
    opts3=shuffle(opts3); var ci3=opts3.indexOf(yun);
    return {tag:'拼音 · 韵母',q:'「'+w+'」的韵母是？',speakQ:'「'+w+'」的韵母是什么？',opts:opts3,correct:ci3,ans:yun};
  }
  function up(s){return s.toUpperCase();}

  // —— 2. 笔画数 ——
  function genStroke(){
    var ks=ceChars().filter(function(w){return HANZI_META&&HANZI_META[w]&&HANZI_META[w].s;});
    if(!ks.length)ks=Object.keys(HANZI_META||{});
    if(!ks.length)return null;
    var w=pick(ks); var m=HANZI_META[w]; var s=m.s||0;
    /* ★ 笔画太少（1~3 画）的字，"±2" 凑不出 4 个不重复选项，
       会退化成「1、3」这种一眼看穿的题，直接跳过换一个字。 */
    if(!s||s<4)return null;
    var opts=shuffle([s-2,s-1,s,s+1,s+2].filter(function(x){return x>=1&&x<=36})).slice(0,4);
    /* 兜底：还是不足 4 个（极端情况）就换题 */
    if(opts.length<4)return null;
    if(opts.indexOf(s)<0)opts[0]=s; opts=shuffle(opts);
    return {tag:'笔画 · 数一数',q:'「'+w+'」一共有几画？',speakQ:'「'+w+'」一共有几画？',opts:opts.map(String),correct:opts.indexOf(s),ans:s+'画'};
  }

  // —— 3. 偏旁部首 ——
  function genRadical(){
    var ks=ceChars().filter(function(w){return HANZI_META&&HANZI_META[w]&&HANZI_META[w].rad;});
    if(!ks.length)ks=Object.keys(HANZI_META||{});
    if(!ks.length)return null;
    var w=pick(ks); var m=HANZI_META[w]; if(!m||!m.rad)return null;
    var rad=m.rad;
    var allRad=['亻','氵','木','艹','口','日','月','女','扌','讠','忄','纟','火','钅','禾','目','田','虫','鸟','宀','穴','犭','饣','马','鱼','石','王','立','足','车','门','雨','山','土','力','又','寸','广','厂','尸','弓','子','心','页'];
    var opts=shuffle(allRad.filter(function(r){return r!==rad;})).slice(0,3).concat([rad]); opts=shuffle(opts);
    return {tag:'偏旁 · 部首',q:'「'+w+'」的部首（偏旁）是？',speakQ:'「'+w+'」的部首是什么？',opts:opts,correct:opts.indexOf(rad),ans:rad};
  }

  // —— 4. 笔顺 ——
  function genOrder(){
    var ks=ceChars().filter(function(w){return HANZI_STROKES&&HANZI_STROKES[w]&&HANZI_STROKES[w].length;});
    if(!ks.length)ks=Object.keys(HANZI_STROKES||{});
    if(!ks.length)return null;
    var w=pick(ks); var paths=HANZI_STROKES[w]; var n=paths.length;
    /* ★ 关键：hanzi-writer-data 坐标系 Y 轴向上，浏览器 SVG Y 轴向下，
       必须用 transform="translate(0,900) scale(1,-1)" 翻转，否则字会倒过来。 */
    var svg='<svg viewBox="0 0 1024 1024" width="220" height="220" style="background:#FAF8FF;border-radius:16px;display:block;margin:6px auto 0">';
    svg+='<g transform="translate(0,900) scale(1,-1)">';
    paths.forEach(function(p){ svg+='<path d="'+p+'" fill="none" stroke="#EFEAF9" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>'; });
    paths.forEach(function(p,i){ svg+='<path class="ostroke" data-i="'+i+'" d="'+p+'" fill="none" stroke="#9775FA" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" style="opacity:0"/>'; });
    svg+='</g></svg>';
    return {tag:'笔顺 · 书写',q:'「'+w+'」的规范笔顺（共 '+n+' 笔）',speakQ:'「'+w+'」的笔顺，一共 '+n+' 画',svg:svg,opts:null,orderWord:w,orderN:n};
  }

  // —— 5. 多音字 ——
  var POLY={
    '行':['xíng','háng'],'长':['cháng','zhǎng'],'乐':['lè','yuè'],'地':['dì','de'],'得':['dé','de'],'了':['le','liǎo'],
    '着':['zhe','zháo','zhuó'],'都':['dōu','dū'],'只':['zhī','zhǐ'],'少':['shǎo','shào'],'好':['hǎo','hào'],'为':['wéi','wèi'],
    '还':['hái','huán'],'发':['fā','fà'],'重':['zhòng','chóng'],'干':['gān','gàn'],'空':['kōng','kòng'],'种':['zhǒng','zhòng'],
    '当':['dāng','dàng'],'觉':['jué','jiào'],'处':['chù','chǔ'],'应':['yīng','yìng'],'没':['méi','mò'],'分':['fēn','fèn'],
    '背':['bēi','bèi'],'间':['jiān','jiàn'],'朝':['zhāo','cháo'],'降':['jiàng','xiáng'],'卷':['juǎn','juàn'],'便':['biàn','pián'],
    '盛':['shèng','chéng'],'假':['jiǎ','jià'],'兴':['xīng','xìng'],'弹':['dàn','tán'],'曲':['qǔ','qū'],'散':['sàn','sǎn'],
    '中':['zhōng','zhòng'],'转':['zhuǎn','zhuàn'],'圈':['quān','juàn'],'数':['shù','shǔ'],'漂':['piāo','piào'],'难':['nán','nàn'],
    '结':['jié','jiē'],'闷':['mèn','mēn'],'调':['tiáo','diào'],'模':['mó','mú'],'屏':['píng','bǐng'],'抹':['mǒ','mò'],
    '尽':['jǐn','jìn'],'参':['cān','shēn'],'宿':['sù','xiǔ'],'校':['xiào','jiào'],'教':['jiāo','jiào'],'铺':['pū','pù']
  };
  var POLY_SAMPLE={'行':['自行车','银行'],'长':['长城','长大'],'乐':['快乐','音乐'],'地':['土地','轻轻地'],'得':['得到','觉得'],'了':['走了','了解'],
    '着':['看着','着火'],'都':['都是','首都'],'只':['一只','只有'],'少':['多少','少年'],'好':['好人','爱好'],'为':['因为','为了'],
    '还':['还有','还书'],'发':['发现','头发'],'重':['重要','重新'],'干':['干净','干活'],'空':['天空','空白'],'种':['种子','种地'],
    '当':['当时','上当'],'觉':['觉得','睡觉'],'处':['到处','相处'],'应':['应该','回应'],'没':['没有','淹没'],'分':['分开','分外'],
    '背':['背书包','背书'],'间':['中间','间隔'],'朝':['朝阳','朝代'],'降':['下降','投降'],'卷':['卷起','试卷'],'便':['方便','便宜'],
    '盛':['盛开','盛饭'],'假':['真假','放假'],'兴':['兴奋','高兴'],'弹':['子弹','弹琴'],'曲':['歌曲','弯曲'],'散':['散步','散文'],
    '中':['中间','中奖'],'转':['转身','转圈'],'圈':['圆圈','羊圈'],'数':['数字','数数'],'漂':['漂流','漂亮'],'难':['困难','遇难'],
    '结':['结果','结实'],'闷':['闷闷不乐','闷热'],'调':['空调','调动'],'模':['模型','模样'],'屏':['屏幕','屏息'],'抹':['涂抹','抹墙'],
    '尽':['尽管','尽力'],'参':['参加','人参'],'宿':['宿舍','一宿'],'校':['学校','校对'],'教':['教书','教室'],'铺':['铺床','店铺']};
  function genPoly(){
    var ks=Object.keys(POLY); var w=pick(ks);
    var reads=POLY[w]; if(!reads||reads.length<2)return null;
    var pr=POLY_SAMPLE[w]||[w+w,w+w];
    var correctRead=reads[0];
    /* 只有两个读音时选项太少（四选一才够练），
       用同字不同音的常见干扰读音补齐，凑够 4 个选项。 */
    var opts=reads.slice();
    var distractorPool=['yue','le','zhang','chang','hang','xing','de','di','zhe','liao','du','dou','zhi','shao','hao','wei','huan','hai','fa','zhong','chong','gan','kong','zeng','jiao','jue','chu','ying','mei','mo','fen','bei','jian','zhao','chao','jiang','xiang','juan','quan','bian','pian','sheng','cheng','jia','jia3','dan','tan','qu','san','zhuan','shu','piao','nan','jie','men','tiao','diao','meng','ming','ping','mou','jin','shen','su','xiu','xiao','pu'];
    var extra=shuffle(distractorPool.filter(function(x){return reads.indexOf(x)<0;})).slice(0,4-reads.length);
    opts=shuffle(opts.concat(extra)).slice(0,4);
    if(opts.indexOf(correctRead)<0)opts[0]=correctRead; opts=shuffle(opts);
    return {tag:'多音字 · 选读音',q:'「'+w+'」在「'+pr[0]+'」中读什么？',speakQ:'「'+w+'」在「'+pr[0]+'」中读什么？',opts:opts,correct:opts.indexOf(correctRead),ans:reads.join(' / ')};
  }

  // —— 6. 近反义词 ——
  var SYN={'高兴':['开心','快乐'],'美丽':['漂亮','好看'],'立刻':['马上','赶快'],'温暖':['暖和'],'认真':['仔细'],'广大':['广阔'],'光明':['明亮'],'宝贵':['珍贵'],'办法':['方法'],'非常':['十分'],'连忙':['急忙'],'奇怪':['奇异'],'茂盛':['茂密'],'清楚':['明白'],'安静':['宁静'],'故乡':['家乡'],'爱护':['爱惜'],'帮助':['帮忙'],'寒冷':['严寒'],'洁白':['雪白'],'经常':['常常'],'忽然':['突然'],'著名':['有名'],'愉快':['快乐']};
  var ANT={'大':['小'],'多':['少'],'高':['矮','低'],'长':['短'],'快':['慢'],'来':['去'],'进':['出'],'开':['关'],'冷':['热'],'黑':['白'],'新':['旧'],'高兴':['难过','伤心'],'光明':['黑暗'],'温暖':['寒冷'],'美丽':['丑陋'],'仔细':['马虎'],'认真':['马虎'],'安静':['热闹'],'清楚':['模糊'],'朋友':['敌人'],'爱护':['破坏'],'帮助':['刁难'],'开始':['结束'],'胜利':['失败'],'安全':['危险'],'简单':['复杂'],'进步':['退步'],'诚实':['虚伪'],'勇敢':['胆小']};
  function genSynAnt(){
    var useSyn=Math.random()<0.5;
    if(useSyn){
      var ks=Object.keys(SYN).filter(function(k){return SYN[k]&&SYN[k].length;}); if(!ks.length)return null;
      var w=pick(ks); var ans=SYN[w];
      var opts=shuffle(ans.concat(pickFromOther(SYN,w))).slice(0,4);
      if(opts.indexOf(ans[0])<0)opts[0]=ans[0]; opts=shuffle(opts);
      return {tag:'近义词',q:'「'+w+'」的近义词是哪个？',speakQ:'「'+w+'」的近义词是哪个？',opts:opts,correct:opts.indexOf(ans[0]),ans:ans.join(' / ')};
    } else {
      var ks2=Object.keys(ANT).filter(function(k){return ANT[k]&&ANT[k].length;}); if(!ks2.length)return null;
      var w2=pick(ks2); var a2=ANT[w2];
      var opts2=shuffle(a2.concat(pickFromOther(ANT,w2))).slice(0,4);
      if(opts2.indexOf(a2[0])<0)opts2[0]=a2[0]; opts2=shuffle(opts2);
      return {tag:'反义词',q:'「'+w2+'」的反义词是哪个？',speakQ:'「'+w2+'」的反义词是哪个？',opts:opts2,correct:opts2.indexOf(a2[0]),ans:a2.join(' / ')};
    }
  }
  function pickFromOther(map,exc){
    var all=[]; for(var k in map){ if(k!==exc&&map[k]) map[k].forEach(function(x){all.push(x);}); }
    return all.slice(0,3);
  }

  // —— 7. 词语搭配 ——
  var COLLOC={'火':['火车','火苗','火红'],'水':['水果','开水','河水'],'花':['花朵','花园','花钱'],'手':['手机','手心','手法'],'心':['心情','爱心','关心'],'风':['风雨','风筝','风景'],'雨':['雨水','雨衣','雨点'],'书':['书本','书包','书店'],'门':['门口','开门','门牙'],'车':['马车','车站','车门'],'天':['天空','天气','天才'],'地':['土地','地球','地方'],'木':['木头','木马','树木'],'口':['门口','口水','口罩'],'日':['日子','日光','日月'],'月':['月亮','月光','月牙'],'山':['高山','山水','山顶'],'石':['石头','石子','化石']};
  function genCollocation(){
    var ks=Object.keys(COLLOC); if(!ks.length)return null;
    var w=pick(ks); var ans=COLLOC[w];
    var opts=shuffle(ans.concat(pickFromOther(COLLOC,w))).slice(0,4);
    if(opts.indexOf(ans[0])<0)opts[0]=ans[0]; opts=shuffle(opts);
    return {tag:'词语 · 搭配',q:'和「'+w+'」能组成词语的是？',speakQ:'和「'+w+'」能组成词语的是哪个？',opts:opts,correct:opts.indexOf(ans[0]),ans:ans.join(' / ')};
  }

  // —— 8. 连词成句（可答题）——
  var SENTENCES=[
    ['我','在','公园','里','玩耍'],['小明','认真','地','写作业'],['春天','来了','花儿','开了'],['妈妈','买','了','水果'],
    ['小鸟','在','树上','唱歌'],['我们','一起','去','上学'],['太阳','从','东方','升起'],['弟弟','爱','吃','苹果'],
    ['老师','教','我们','读书'],['晚上','星星','亮晶晶'],['爷爷','在','院子','种花'],['小猫','追','着','蝴蝶'],
    ['小朋友','排好','队伍'],['风儿','轻轻','吹过'],['雪花','飘落','下来'],['鱼儿','在水里','游来游去'],
    ['校园','里','真','热闹'],['我','喜欢','画画'],['秋天','是','丰收','的季节'],['书本','带给我','知识']
  ];
  function genOrderQ(){
    var s=pick(SENTENCES);
    /* 打乱后如果恰好等于原顺序，再打乱一次，避免"一上来就是答案" */
    var shuffled=shuffle(s);
    for(var t=0;t<6&&shuffled.join('')===s.join('');t++) shuffled=shuffle(s);
    var chipStyle='display:inline-block;padding:10px 16px;background:#FAF7FF;border:2px solid #EDE4FF;border-radius:14px;font-size:19px;font-weight:800;color:#3C4858;cursor:pointer;user-select:none';
    var pool='<div id="sent-pool" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0">'+
      shuffled.map(function(w){
        return '<span class="sent-word" data-w="'+escAttr(w)+'" data-used="0" style="'+chipStyle+'">'+w+'</span>';
      }).join('')+'</div>';
    var slot='<div id="sent-slot" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;min-height:62px;padding:12px;margin:6px 0;background:#fff;border:2px dashed #EDE4FF;border-radius:16px"></div>';
    var tool='<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">'+
      '<button class="btn btn-green" data-act="sent-check" style="min-height:44px;padding:8px 16px;font-size:15px">检查答案</button>'+
      '<button class="btn btn-ghost" data-act="sent-reset" style="min-height:44px;padding:8px 16px;font-size:15px">重来</button>'+
      '<button class="btn btn-ghost" data-act="sent-answer" style="min-height:44px;padding:8px 16px;font-size:15px">提示一下</button>'+
      '</div>';
    return {tag:'连词 · 成句',q:'把这些词排成一句通顺的话：',speakQ:'请把这些词语排成一句通顺的话',
            chips:slot+pool+tool, words:s.slice(), answer:s.join(''), isSentence:true};
  }

  /* ★ v4.258：连词成句的可判分版本（给今日流程 / 闯关用）。
     原版是拖词块拼句的操作题，没有 options，自动流程只能跳过。
     这里把它翻写成"哪一句排得对"的四选一：一个正确语序 + 三个语序打乱的。
     ★ 三个干扰必须是真错序 —— 如果某个句子短到打乱后碰巧等于正确顺序，
       孩子会看到两个一模一样的选项，所以这里用 seen 去重并重试。 */
  function genSentenceQuiz(){
    if(!SENTENCES||!SENTENCES.length)return null;
    var s=pick(SENTENCES);
    var right=s.join('');
    var seen={}; seen[right]=1;
    var wrongs=[];
    for(var t=0;t<40&&wrongs.length<3;t++){
      var c=shuffle(s).join('');
      if(seen[c])continue;
      seen[c]=1; wrongs.push(c);
    }
    if(wrongs.length<3)return null;   /* 词序组合太少，换一句 */
    var opts=shuffle(wrongs.concat([right]));
    return {tag:'连词 · 句序',q:'下面哪一句排得对？',speakQ:'下面哪一句的词语顺序是对的？',
            opts:opts,correct:opts.indexOf(right),ans:right,
            words:s.slice(),hint:s.join(' ')};
  }

  /* ★ v4.258：笔顺的可判分版本（给今日流程 / 闯关用）。
     原题 genOrder() 返回的是 SVG + 逐笔写交互，没有选项（opts:null），
     所以自动流程永远抽不到"笔顺"这个考点 —— 它在题型表里占着位置，
     轮转游标转到它只是白转一圈，孩子练了也不计掌握度。
     这里复用「考一考」的算法（选第 n 笔，干扰优先取同一个字里出现过的其它笔形，
     这样更像真的笔顺混淆，而不是拿「卧钩」这种无关笔画凑数），
     做成一道不依赖 DOM 的纯四选一。 */
  function genOrderQuiz(){
    if(typeof HANZI_ORDERTYPE==='undefined'||typeof HANZI_STROKES==='undefined')return null;
    var ks=ceChars().filter(function(w){return HANZI_ORDERTYPE[w]&&HANZI_STROKES[w]&&HANZI_STROKES[w].length;});
    if(!ks.length)ks=Object.keys(HANZI_STROKES).filter(function(w){return HANZI_ORDERTYPE[w];});
    if(!ks.length)return null;
    var w=pick(ks);
    var types=HANZI_ORDERTYPE[w], total=HANZI_STROKES[w].length;
    if(!types||!total)return null;
    var n=1+Math.floor(Math.random()*total);
    var answer=types[n-1]; if(!answer)return null;
    var inChar=[]; types.forEach(function(x){ if(x!==answer&&inChar.indexOf(x)<0)inChar.push(x); });
    var others=shuffle(inChar).slice(0,3);
    if(others.length<3){
      var rest=shuffle(STROKE_NAME_ALL.filter(function(x){return x!==answer&&others.indexOf(x)<0;}));
      while(others.length<3&&rest.length)others.push(rest.pop());
    }
    if(others.length<3)return null;
    var opts=shuffle(others.slice(0,3).concat([answer]));
    return {tag:'笔顺 · 第N笔',q:'「'+w+'」的第 '+n+' 笔是什么？',speakQ:'「'+w+'」的第 '+n+' 笔是什么？',
            opts:opts,correct:opts.indexOf(answer),ans:answer,orderWord:w,
            hint:'「'+w+'」一共 '+total+' 笔，跟着笔顺一笔一笔数过来。'};
  }

  // —— 9. 阅读短文 ——
  var READINGS=[
    {t:'小松鼠找花生',b:'树林里长着许多花生。小松鼠想：等花生结了果，我要好好吃一顿。它每天都去看，可是直到秋天，也没看见花生。原来花生藏在泥土里呢！',q:'花生藏在哪里？',a:['泥土里','树上','天上']},
    {t:'美丽的彩虹',b:'下过雨，天边出现一道彩虹。红橙黄绿青蓝紫，像一座弯弯的桥。妹妹拍手说："彩虹真美！"不一会儿，彩虹慢慢不见了。',q:'彩虹有几种颜色？',a:['七种','三种','一种']},
    {t:'小蚂蚁搬家',b:'蚂蚁们排着长长的队伍，把食物搬到新家。一只大蚂蚁在前面带路。它们齐心协力，很快就把家搬好了。下雨前，它们总是这样忙。',q:'蚂蚁为什么搬家？',a:['要下雨了','去玩','找朋友']},
    {t:'月亮船',b:'弯弯的月亮像小船。小船摇啊摇，把我送到云朵上。星星眨着眼，对我说晚安。夜风轻轻吹，我睡着了。',q:'月亮像什么？',a:['小船','大饼','皮球']},
    {t:'乌鸦喝水',b:'一只乌鸦口渴了，看见瓶里有水，可是瓶口太小，喝不着。它叼来小石子，一颗一颗放进瓶里。水面升高了，乌鸦喝到了水。',q:'乌鸦怎么喝到水的？',a:['放石子','用吸管','等下雨']},
    {t:'春风姐姐',b:'春风姐姐轻轻地吹，吹绿了小草，吹开了花朵，吹醒了青蛙。小河里的冰化了，鸭子在水里快活地游。春天真美呀！',q:'谁吹绿了小草？',a:['春风','春雨','春雷']}
  ];
  function genReading(){
    var r=pick(READINGS);
    var opts=shuffle(r.a); var ci=opts.indexOf(r.a[0]);
    return {tag:'阅读 · 短文',title:r.t,body:r.b,q:r.q,speakQ:r.q,opts:opts,correct:ci,ans:r.a[0]};
  }

  /* ============ ★ v4.255 同音字 / 形近字（选字填空） ============
     此前 3~6 年级考点池挂了 tongyin / xiangjin，但 HanziExtra.MODES 无此二键，
     出题链路返回 null 被跳过 —— 考点"挂着却永远出不来"。
     现补齐出题器：选字填空（贴合课本考法），每条 [字A,字B,句A,句B]，
     句中（　）为挖空；干扰项从全表借字，选项随机打乱。 */
  var TY=[
    ['在','再','妈妈正（　）厨房做饭','好（　）见了，明天再来玩'],
    ['作','做','写完（　）业再出去玩','帮妈妈（　）家务'],
    ['进','近','他快步走（　）了教室','公园离我家很（　）'],
    ['工','公','爸爸在一家（　）厂上班','（　）园里的花都开了'],
    ['圆','员','十五的月亮又大又（　）','他是学校的运动（　）'],
    ['到','道','我每天五点回（　）家','我终于知（　）了答案'],
    ['像','象','弯弯的月亮（　）一只小船','动物园里有一头大（　）'],
    ['快','块','汽车开得真（　）','妈妈给了我三（　）零花钱'],
    ['心','新','我买了一个（　）书包','他做事很细（　）'],
    ['声','生','教室里静悄悄，没有（　）音','我们的（　）活越来越好'],
    ['城','成','北京是一座美丽的（　）市','他（　）长了不少'],
    ['时','石','我们要珍惜（　）间','桥墩是用（　）头砌的'],
    ['丽','力','春天是美（　）的季节','他使出全身的气（　）搬起石头'],
    ['目','木','看书太久要休息，保护眼（　）','（　）头可以搭小房子'],
    ['蜂','锋','蜜（　）在花丛里采蜜','这把刀很（　）利'],
    ['辛','幸','妈妈每天（　）苦地工作','他很（　）运，抽中了奖'],
    ['蜜','密','小蜜蜂酿出的（　）很甜','森林里树木长得很（　）集'],
    ['静','净','教室里很安（　）','把桌子擦干（　）'],
    ['极','级','今天的心情好（　）了','我今年上三年（　）'],
    ['值','直','今天轮到我（　）日','一条大路笔（　）地伸向远方'],
    ['决','绝','他（　）心把字练好','（　）对不能撒谎'],
    ['练','炼','我每天（　）习半小时书法','工人叔叔在炉边（　）钢'],
    ['形','型','这个图（　）是三角形','这是一款新（　）号的飞机'],
    ['纪','记','我们要遵守（　）律','我把老师的叮嘱（　）在心里'],
    ['联','连','学校举行了（　）欢会','（　）续下了三天雨']
  ];
  var XJ=[
    ['已','己','我（　）经写完作业了','自（　）的事情自己做'],
    ['未','末','（　）来一定会更好','这个周（　）我们去看电影'],
    ['土','士','种子在（　）壤里发芽','白衣天（　）守护病人'],
    ['入','人','门外走（　）一位老师','（　）们都要遵守交通规则'],
    ['乌','鸟','（　）鸦口渴了，想办法喝水','小（　）在天上自由地飞'],
    ['今','令','（　）天的天气真好','这条消息真（　）人高兴'],
    ['休','体','累了就靠在树下（　）息一会儿','（　）育课上我们练习跳绳'],
    ['找','我','请帮我（　）一下铅笔','（　）是三年级的小学生'],
    ['看','着','你（　），天边有一道彩虹','他听（　）这个消息就跑来了'],
    ['拨','拔','他轻轻（　）动了琴弦','地里的萝卜熟了，一起（　）萝卜'],
    ['折','拆','他把纸（　）成一只小船','这个包裹今天可以（　）开'],
    ['鸣','呜','汽笛长（　），火车开动了','小汽船（　）地一声开走了'],
    ['辨','辩','你要学会分（　）是非','他们俩争（　）了半天'],
    ['燥','躁','天气干（　），要多喝水','他性子急，做事有点急（　）'],
    ['幕','慕','演出的大（　）缓缓拉开','我很敬（　）这位科学家'],
    ['晴','清','今天是个大（　）天','小河的水很（　）澈'],
    ['情','请','她的心（　）特别好','（　）你帮我拿一下书'],
    ['抱','泡','妹妹伸开双手，要妈妈（　）','爷爷坐在院子里（　）茶'],
    ['饱','跑','吃过饭，肚子已经很（　）了','小马（　）得飞快'],
    ['喝','渴','口（　）了就要多喝水','天热要多（　）水'],
    ['买','卖','妈妈去菜市场（　）菜','超市里（　）着各种水果'],
    ['千','干','操场上一（　）多名同学在做操','毛巾被太阳晒（　）了'],
    ['甲','电','（　）骨文是最早的汉字','打雷时要防止雷（　）'],
    ['刀','力','这把（　）很锋利','他臂（　）很大，能提两桶水'],
    ['天','夫','（　）空湛蓝湛蓝的','农（　）在田里辛勤地干活'],
    ['瓜','爪','地（　）里的西瓜熟了','小猫的（　）子很锋利'],
    ['内','肉','教室（　）安安静静','超市的（　）类柜台在二楼']
  ];
  function genFillRow(rows,tag,hintFmt){
    var ok=rows.filter(function(r){return r[0]&&r[1]&&r[2]&&r[3];});
    if(!ok.length)return null;
    var row=pick(ok);
    var useA=Math.random()<0.5;
    var ans=useA?row[0]:row[1], other=useA?row[1]:row[0], sent=useA?row[2]:row[3];
    /* 干扰项从全表借，避开本组两字 */
    var all=[]; rows.forEach(function(r){ all.push(r[0],r[1]); });
    var pool=shuffle(all.filter(function(c){return c!==ans&&c!==other;}));
    var opts=shuffle([ans,other,pool[0]||other,pool[1]||pool[0]||other]);
    var spoken=sent.replace(/（\s*　?\s*）/,'括号里');
    return {tag:tag,wordChar:ans,q:sent,
            speakQ:'这句子里，括号里该填哪个字？'+spoken,
            opts:opts,correct:opts.indexOf(ans),ans:ans,
            hint:hintFmt(row[0],row[1])};
  }
  function genTongyin(){
    return genFillRow(TY,'同音 · 选字',function(a,b){return '「'+a+'」和「'+b+'」读音相同，意思不同，看搭配选字。';});
  }
  function genXiangjin(){
    return genFillRow(XJ,'形近 · 选字',function(a,b){return '「'+a+'」和「'+b+'」长得像，看清部件再选。';});
  }

  /* v4.258：统一打上 variant —— 这是学情大脑的题型指纹。
     缺了它，pwKeyOf() 只能退回用 q.type（今日流程里恒为 'hz_extra'），
     于是偏旁、笔顺、拼音、多音字全部题型被并成 hanzi|hz_extra 一条记录，
     "题型级精确打点"名存实亡。这里一处收口，11 个出题函数都不用动。 */
  function stampVariant(q,mode){
    if(q&&!q.variant)q.variant=q.tag||mode;
    return q;
  }

  /* ★ 查字典 · 音序查字法（一下）/ 部首查字法（二上）
     —— 教材硬考点（语文园地专项），客观可判、含细心坑。
     DICT：字 + 音序首字母（大写）；部首/总笔画取自 HANZI_META，
     剩余笔画 = 总笔画 − 部首笔画（RAD_STROKE 单一来源，避免手算出错）。 */
  var RAD_STROKE={'氵':3,'扌':3,'木':4,'艹':3,'讠':2,'亻':2,'女':3,'子':3,'日':4,'月':4,'忄':3,'纟':3,'犭':3,'鸟':5,'虫':6,'禾':5,'钅':5,'囗':3,'雨':8,'立':5,'走':7,'足':7,'口':3,'门':3,'户':4,'宀':3,'穴':5,'冖':2,'冫':2,'土':3,'彡':3,'刂':2,'阝':2,'人':2,'入':2,'又':2,'见':4,'页':6};
  var DICT=[{w:'江',py:'J'},{w:'河',py:'H'},{w:'打',py:'D'},{w:'树',py:'S'},{w:'桃',py:'T'},{w:'林',py:'L'},{w:'花',py:'H'},{w:'草',py:'C'},{w:'苹',py:'P'},{w:'说',py:'S'},{w:'语',py:'Y'},{w:'词',py:'C'},{w:'们',py:'M'},{w:'他',py:'T'},{w:'你',py:'N'},{w:'妈',py:'M'},{w:'妹',py:'M'},{w:'好',py:'H'},{w:'姐',py:'J'},{w:'字',py:'Z'},{w:'学',py:'X'},{w:'孩',py:'H'},{w:'星',py:'X'},{w:'明',py:'M'},{w:'春',py:'C'},{w:'早',py:'Z'},{w:'时',py:'S'},{w:'晚',py:'W'},{w:'朋',py:'P'},{w:'服',py:'F'},{w:'肚',py:'D'},{w:'快',py:'K'},{w:'忙',py:'M'},{w:'怕',py:'P'},{w:'红',py:'H'},{w:'纸',py:'Z'},{w:'绿',py:'L'},{w:'猫',py:'M'},{w:'狗',py:'G'},{w:'鸡',py:'J'},{w:'鸭',py:'Y'},{w:'蛙',py:'W'},{w:'蚂',py:'M'},{w:'秋',py:'Q'},{w:'种',py:'Z'},{w:'和',py:'H'},{w:'钟',py:'Z'},{w:'铅',py:'Q'},{w:'钱',py:'Q'},{w:'圆',py:'Y'},{w:'国',py:'G'},{w:'回',py:'H'},{w:'因',py:'Y'},{w:'雪',py:'X'},{w:'雷',py:'L'},{w:'霜',py:'S'},{w:'露',py:'L'},{w:'桥',py:'Q'},{w:'桌',py:'Z'},{w:'校',py:'X'},{w:'棵',py:'K'},{w:'杏',py:'X'},{w:'李',py:'L'},{w:'棉',py:'M'},{w:'娘',py:'N'},{w:'站',py:'Z'},{w:'起',py:'Q'},{w:'赶',py:'G'},{w:'跳',py:'T'},{w:'跑',py:'P'},{w:'路',py:'L'},{w:'跟',py:'G'},{w:'唱',py:'C'},{w:'吃',py:'C'},{w:'叫',py:'J'},{w:'听',py:'T'},{w:'叶',py:'Y'},{w:'句',py:'J'},{w:'可',py:'K'},{w:'同',py:'T'},{w:'莲',py:'L'},{w:'蓝',py:'L'},{w:'茶',py:'C'},{w:'节',py:'J'},{w:'芽',py:'Y'},{w:'落',py:'L'},{w:'藏',py:'C'},{w:'间',py:'J'},{w:'问',py:'W'},{w:'闪',py:'S'},{w:'闷',py:'M'},{w:'房',py:'F'},{w:'所',py:'S'},{w:'扇',py:'S'},{w:'安',py:'A'},{w:'它',py:'T'},{w:'家',py:'J'},{w:'定',py:'D'},{w:'穿',py:'C'},{w:'窗',py:'C'},{w:'空',py:'K'},{w:'窝',py:'W'},{w:'写',py:'X'},{w:'冰',py:'B'},{w:'净',py:'J'},{w:'凉',py:'L'},{w:'决',py:'J'},{w:'洗',py:'X'},{w:'没',py:'M'},{w:'法',py:'F'},{w:'活',py:'H'},{w:'池',py:'C'},{w:'海',py:'H'},{w:'温',py:'W'},{w:'游',py:'Y'},{w:'场',py:'C'},{w:'块',py:'K'},{w:'地',py:'D'},{w:'坐',py:'Z'},{w:'坡',py:'P'},{w:'墙',py:'Q'},{w:'影',py:'Y'},{w:'彩',py:'C'},{w:'到',py:'D'},{w:'前',py:'Q'},{w:'刚',py:'G'},{w:'别',py:'B'},{w:'那',py:'N'},{w:'都',py:'D'},{w:'阳',py:'Y'},{w:'阴',py:'Y'},{w:'阵',py:'Z'},{w:'邻',py:'L'},{w:'院',py:'Y'},{w:'从',py:'C'},{w:'众',py:'Z'},{w:'会',py:'H'},{w:'个',py:'G'},{w:'伞',py:'S'},{w:'今',py:'J'},{w:'全',py:'Q'},{w:'以',py:'Y'},{w:'双',py:'S'},{w:'友',py:'Y'},{w:'变',py:'B'},{w:'发',py:'F'},{w:'叔',py:'S'},{w:'观',py:'G'},{w:'现',py:'X'},{w:'觉',py:'J'},{w:'领',py:'L'},{w:'颗',py:'K'},{w:'颜',py:'Y'}];

  function genDictXy(){
    var e=pick(DICT); if(!e)return null;
    var cap=e.py;
    var pool=['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','W','X','Y','Z'];
    var others=shuffle(pool.filter(function(c){return c!==cap;})).slice(0,3);
    var opts=shuffle(others.concat([cap]));
    return {variant:'dictXy',tag:'查字典 · 音序查字',
      q:'用音序查字法查「'+e.w+'」字，应该先查大写字母（　　）。',
      speakQ:'用音序查字法查'+e.w+'字，应该先查哪个大写字母？',
      opts:opts, correct:opts.indexOf(cap), ans:cap};
  }

  function genDictRad(){
    var e=pick(DICT); if(!e)return null;
    var m=HANZI_META&&HANZI_META[e.w]; if(!m||!m.rad)return null;
    var rad=m.rad, rs=RAD_STROKE[rad]; if(rs==null)return null;
    var total=m.s, rem=total-rs; if(rem<0)return null;
    /* 两种问法随机：① 部首识别 ② 剩余笔画（经典坑：把总笔画当剩余） */
    if(Math.random()<0.5){
      var allRad=['亻','氵','木','艹','口','日','月','女','扌','讠','忄','纟','火','钅','禾','目','田','虫','鸟','宀','穴','犭','饣','马','鱼','石','王','立','足','车','门','雨','山','土','力','又','寸','广','厂','尸','弓','子','心','页','人','入'];
      var o2=shuffle(allRad.filter(function(r){return r!==rad;})).slice(0,3).concat([rad]); o2=shuffle(o2);
      return {variant:'dictRad',tag:'查字典 · 部首查字',
        q:'用部首查字法查「'+e.w+'」字，它的部首（偏旁）是（　　）。',
        speakQ:'用部首查字法查'+e.w+'字，它的部首是什么？',
        opts:o2, correct:o2.indexOf(rad), ans:rad};
    }
    var cands=[total,rs,rem+1,rem-1,rem+2,rem-2].filter(function(n){return n>=0&&n!==rem;});
    var od=shuffle(cands).slice(0,3);
    var optC=rad+'，再查'+rem+'画';
    var od2=od.map(function(n){return rad+'，再查'+n+'画';});
    var opts=shuffle(od2.concat([optC]));
    return {variant:'dictRad',tag:'查字典 · 部首查字',
      q:'用部首查字法查「'+e.w+'」字，除去部首还有（　　）画。',
      speakQ:'用部首查字法查'+e.w+'字，除去部首还有几画？',
      opts:opts, correct:opts.indexOf(optC), ans:optC};
  }

  /* ================================================================
     ★ v4.320 三年级语文断层五考点（母题级，全部接入学情驱动）
     ---------------------------------------------------------------
     背景：三年级语文真正缺的不是字词，而是「整句 / 整段 / 整篇」的运用能力。
     前面 13 个生成器（拼音/笔顺/部首/多音字/近反义/搭配/连词成句/阅读/
     同音字/形近字/查字典×2）全都停在字词层，一到句子层面就断档，
     而这恰恰是三年级开始拉开差距的地方。
     设计原则（对齐"有坑的题目才拉得开差距"）：
       · 干扰项不做"随便改两个字"的假答案，而是**改得表面通顺、但没治到病根**
         或 **治了病根、却改出新病** 的版本 —— 这才是真实考场上选错的成因。
       · 每题带病因标签（hint），答错能说清"错在哪"，不是只判对错。
       · variant 由 stampVariant 统一打，pwBump 拿它当学情指纹，题型级打点成立。
     ================================================================ */

  /* ---------- 1. 修改病句（bianju） ----------
     病因分类：成分残缺 / 搭配不当 / 重复啰嗦 / 语序不当 / 前后矛盾 / 用词重复。
     每条数据：[病句, 正确改法, 干扰1(没治根), 干扰2(改出新病), 病因, 讲解]
     干扰项设计是本题型的命门：
       - 干扰1 往往是"补了字但补错了地方"或"换了个近义词但病根还在"；
       - 干扰2 往往是"改顺了句子却改变了原意/ introduces 新搭配错误"。      */
  var BJ=[
    ['我们要养成边读边思考的好方法。','我们要养成边读边思考的好习惯。','我们要养成边读边思考的好方法儿。','我们要经常边读边思考。','用词不当','"方法"是手段，"习惯"才是长期坚持的东西；口语化加"儿"更不成话。'],
    ['他做完作业以后就迫不急待地出去玩了。','他做完作业以后就迫不及待地出去玩了。','他做完作业以后就迫不急待去玩了。','他做完作业就急忙出去玩。','用词不当','正确写法是"迫不及待"，不是"迫不急待"——这是高频错别字对。'],
    ['同学们都到齐了，只有小明没有来。','同学们都到齐了，只有小明还没来。','同学们全都到齐了，只有小明没来。','同学们差不多都到齐了，只有小明没来。','前后矛盾','"都到齐了"说明人已齐，又说"小明没来"，前后矛盾；"都"要改成"几乎都"。'],
    ['这本书的内容让我感到非常兴趣。','这本书的内容让我感到非常有兴趣。','这本书的内容使我感到兴趣。','这本书的内容让我非常有兴趣。','用词不当','"感到"是动词，后面必须接形容词，不能接"兴趣"这个名词。'],
    ['春天的杭州是个美丽的季节。','春天是杭州最美的季节。','春天的杭州是个美丽的地方。','春天的杭州是个美丽的时候。','主宾搭配不当','主语"杭州"和宾语"季节"搭配不上；要么改成"春天里的杭州"，要么把主语换成"春天"。'],
    ['我们班同学基本上都全部到齐了。','我们班同学基本上都到齐了。','我们班同学基本上全都到齐了。','我们班的同学基本上都到齐了。','语义重复','"基本上"和"全部"意思重复，留一个即可——这是"叠词啰嗦"题的典型。'],
    ['图书馆的书架上摆满了各种书籍。','图书馆的书架上摆满了各种书。','图书馆的书架上放满了各种书籍。','图书馆里的书架上摆满了书。','语义重复','"书籍"就是"书"，书面语里"各种书籍"显得啰嗦，删掉"籍"更简洁。'],
    ['他兴高采烈地跑到老师面前，笑容满面的。','他兴高采烈地跑到老师面前，笑容满面。','他高高兴兴地跑到老师面前，笑容满面的。','他兴高采烈地跑向老师，笑容满面。','用词不当','"地"表示动作方式，后面必须接动词，不能接形容词"笑面的"。'],
    ['为了防止交通事故不再发生，我们加强了安全教育。','为了防止交通事故发生，我们加强了安全教育。','为了防止交通事故的发生，我们加强了安全教育。','为了防止交通事故发生，我们增加了安全教育。','否定不当','"防止……不再发生"是双重否定＝"让它发生"，意思反了；去掉"不再"才对。'],
    ['《少年闰土》这篇课文是鲁迅先生写的。','《少年闰土》是鲁迅先生的作品。','《少年闰土》这篇课文是鲁迅写的。','《少年闰土》这篇文章的作者是鲁迅先生。','用词不当','课文是"教材单元里的一篇"，作品才是作者创作的整体，二者要对应。'],
    ['我断定他可能已经走了。','我断定他一定已经走了。','我认为他可能已经走了。','我猜测他也许已经走了。','前后矛盾','"断定"是肯定语气，不能和"可能"同时出现，自相矛盾。'],
    ['广场上聚集了千万名热情的观众。','广场上聚集了成千上万名热情的观众。','广场上聚集了千万名热情的观众们。','广场上聚集了热闹的观众。','用词不当','"千万名"过于笼统夸张，应说"成千上万名"更妥；观众可数，不加"们"。'],
    ['小明和小刚是好朋友，他们常常一起讨论学习上的问题。','小明和小刚是好朋友，他们常常讨论学习上的问题。','小明和小刚是好朋友，他们常常一起讨论学习。','小明和小刚经常一起讨论学习上的问题。','用词不当','"常常"已含"一起"之意，再加"一起"稍显累赘，删"一起"更紧凑。']
  ];
  function genBianju(){
    var ok=BJ.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4]&&r[5];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    var opts=shuffle([ans,row[2],row[3],row[0]]);  /* 病句原句也作为干扰项：直接照抄肯定错 */
    return {tag:'修改病句',title:row[4],
      q:'下面句子有毛病，请选出<b>改得正确</b>的一项：<br><span style="font-size:17px;line-height:1.9">'+esc(row[0])+'</span>',
      speakQ:'下面句子有毛病，请选出改得正确的一项：'+row[0],
      opts:opts, correct:opts.indexOf(ans), ans:ans,
      hint:row[5]};
  }

  /* ---------- 2. 句式互换（jushi） ----------
     同一意思的两种句式：把字句↔被字句、陈述句↔反问句、把字句↔是字句。
     坑在于转换时的字序与"把/被"的错位 —— 学生最常错的是反问句该否定却肯定、
     或"被"字句施受颠倒。干扰项刻意做成"改对了一半"的形态。            */
  var JS_HZ=[
    ['他完成了作业。','作业被他完成了。','他完成了作业了。','他被完成了作业。','把字句 ↔ 被字句','把字句变被字句，施事"他"变成宾语前置："作业被他完成了"；不能写成"他被完成作业"。'],
    ['风刮倒了院子里的老槐树。','院子里的老槐树被风刮倒了。','风把老槐树刮倒了。','老槐树被风吹倒了院子。','把字句 ↔ 被字句','变被字句要把受事"老槐树"提到句首当主语，施事"风"放在"被"后，受事不能带宾语。'],
    ['我把作业做完了。','作业被我做完了。','我把作业做完了吗。','我被作业做完了。','把字句 ↔ 被字句','注意施受关系：我做作业（施事是我），所以"被"后面是我，不是作业。'],
    ['太阳落山了。','太阳不是落山了吗？','太阳落山了吗？','太阳要落山。','陈述句 ↔ 反问句','陈述句改反问句：用"不是……吗"或"难道……吗"，句中要加否定词，不能只在陈述句末尾加"吗"。'],
    ['这本书很有趣。','这本书不是没有趣。','这本书很有趣吗？','这本书不太有趣。','陈述句 ↔ 反问句','反问句要用双重否定的意思表达肯定："难道"比"吗"更准确。'],
    ['你是我的好朋友。','难道你不是我的好朋友吗？','你是我最友好的朋友。','你不但是我的好朋友。','陈述句 ↔ 反问句','反问句常用"难道…吗"结构，语义仍等于原陈述句的肯定。'],
    ['小猫在屋里睡觉。','屋里有一只小猫在睡觉。','小猫在屋里安静地睡觉。','小猫屋里睡觉。','"在"字句改陈述句','"在"字句表示人或物存在、正在进行；改为陈述句要调整语序，不能简单去掉"在"（"小猫屋里睡觉"不成句）。'],
    ['他正在认真地写作业。','他是在认真地写作业。','他正在认真地写作业吗。','他在认真写作业。','"是"字句与"是……的"','"是……的"用来强调，不是陈述；这里强调动作正在进行，用"正在"才对。']
  ];
  function genJushi(){
    var ok=JS_HZ.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4]&&r[5];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    var opts=shuffle([ans,row[2],row[3],row[0]]);
    return {tag:'句式互换',title:row[4],
      q:'把下面的句子换个说法，意思不变，选出<b>正确</b>的一项：<br><span style="font-size:17px;line-height:1.9">'+esc(row[0])+'</span>',
      speakQ:'把这句话换个说法，选出正确的一项：'+row[0],
      opts:opts, correct:opts.indexOf(ans), ans:ans,
      hint:row[5]};
  }

  /* ---------- 3. 关联词（guanlian） ----------
     考"关联词怎么配"和"分句间是并列/因果/转折/条件"。
     坑：因果句误用"并列"看起来仍通顺；"虽然…但是"顺序颠倒；
         "只有…才"（必要条件）与"只要…就"（充分条件）混用 —— 这是最高频错点。
     数据结构刻意改为「整句」：[带空句, 正确整句, 干扰整句1, 干扰整句2, 关系, 讲解]
     早期版本把关联词拆开两两拼接，产出过"虽然而且"这种物理上不可能的乱码选项，
     且过滤时可能把正确项滤掉导致 correct=-1 → 答案 undefined。
     现在每个选项都是一句完整自然的话，选项之间互斥，且恒含正确项。          */
  var GL=[
    ['他________学习，成绩进步很快。','他因为学习，所以成绩进步很快。','他虽然学习，所以成绩进步很快。','他因为学习，但是成绩进步很快。','因果关系','前因后果，用"因为……所以……"；"虽然"是转折，不能接"所以"。'],
    ['________他刻苦练习，跑步成绩才提高了。','只有他刻苦练习，跑步成绩才提高了。','只要他刻苦练习，跑步成绩才提高了。','虽然他刻苦练习，跑步成绩才提高了。','条件关系','"只有……才……"是必要条件；"只要……就……"是充分条件，二者不可混。'],
    ['________下雨，我们就去公园。','如果下雨，我们就去公园。','虽然下雨，我们就去公园。','因为下雨，我们就去公园。','假设关系','假设关系用"如果……就……"，与"虽然……但是……"区分。'],
    ['他________聪明，________刻苦，成绩依然很好。','他不但聪明，而且刻苦，成绩依然很好。','他虽然聪明，而且刻苦，成绩依然很好。','他因为聪明，而且刻苦，成绩依然很好。','递进关系','"不但……而且……"是递进，前后意思一层比一层深。'],
    ['这次考试我________没及格，________进步很大。','这次考试我虽然没有及格，但是进步很大。','这次考试我不但没及格，但是进步很大。','这次考试我如果没有及格，但是进步很大。','转折关系','前后意思相反，用"虽然……但是……"，不能用"不但"。'],
    ['________你肯下功夫，________能学好这门功课。','只要你肯下功夫，就能学好这门功课。','只有你肯下功夫，就能学好这门功课。','虽然你肯下功夫，就能够学好这门功课。','条件关系','"只要……就……"表充分条件：肯下功夫就能学成；"只有……才……"表必要条件，二者不可混。'],
    ['风________停了，________太阳出来了。','风一停了，太阳就出来了。','风虽然停了，太阳就出来了。','风因为停了，太阳就出来了。','承接关系','"一……就……"表示两个动作紧接着发生。'],
    ['________你肯读书，________能学到更多的道理。','只有你肯读书，才能学到更多的道理。','只要你肯读书，就一定学到更多的道理。','虽然你肯读书，就能够学到更多的道理。','条件关系','"只有……才……"表必要条件：肯读书是学到道理的必要前提。']
  ];
  function genGuanlian(){
    var ok=GL.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4]&&r[5];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    /* 四个候选：正确答案 + 两个错句 + 原空句去掉下划线（不填关联词，也是错的）。
       用 uniq 去重后再补足，保证不出现重复项、且答案必在且唯一。 */
    var cand=[ans,row[2],row[3],row[0].replace(/________/g,'').replace(/\s+/g,'')];
    var uniq=[],seen={};
    cand.forEach(function(x){
      if(x&&!seen[x]){seen[x]=1;uniq.push(x);}
    });
    var guard=0;
    while(uniq.length<4&&guard++<40){
      var alt=uniq[0].replace(/[，。]/g,'')+'（'+uniq.length+'）';
      if(!seen[alt]){seen[alt]=1;uniq.push(alt);}
    }
    var opts=shuffle(uniq.slice(0,4));
    var ci=opts.indexOf(ans);
    if(ci<0){ opts[0]=ans; ci=0; }               /* 兜底：答案必须在选项里 */
    return {tag:'关联词',title:row[4],
      q:'在横线上填入<b>恰当的关联词</b>，组成正确的句子：<br><span style="font-size:17px;line-height:1.9">'+esc(row[0])+'</span>',
      speakQ:'在横线上填入恰当的关联词，组成正确的句子。',
      opts:opts, correct:ci, ans:ans,
      hint:row[5]};
  }

  /* ---------- 4. 段落概括（duanluo） ----------
     考"从一段话里抓中心句"。
     坑：凭第一句/最后一句就下结论（首尾句未必是中心）、被具体例子带跑、
     把例子当概括。干扰项 = 具体的例子/细节/以偏概全的说法。               */
  var DL=[
    ['春天来了，小草绿了，桃花红了，柳树也发芽了。天气暖和了，人们脱下棉袄，换上轻薄的春装。到处是踏青的人。','春天来了，到处是生机勃勃的景象。','小草绿了，桃花红了。','人们脱下棉袄去踏青。','概括要抓住"总的说法"，不能停在具体景物或某个细节上。'],
    ['小蚂蚁发现了一块面包屑，它招呼同伴一起来搬。几只蚂蚁抬着面包屑往洞里爬，虽然很慢，却一直不停。','小蚂蚁同心协力地把面包屑搬回了家。','小蚂蚁发现了一块面包屑。','蚂蚁搬面包屑很慢。','概括应说清"做了什么、结果如何"，不是只说其中一环。'],
    ['妈妈每天很早起床，为我准备早饭。下班后又帮我检查作业。我的作业常得满分，这都要感谢妈妈。','妈妈为我付出了很多。','妈妈每天很早起床。','我的作业常得满分。','概括要全面，不能只概括前半段的一处小事。'],
    ['这本书讲的是一只小猴子学本领的故事。小猴子起初什么都想学，结果一样也没学好。后来它专心学本领，终于学会了。','这本书告诉我们要专心做事才能有收获。','这本书讲小猴子学本领。','小猴子最后学会了本领。','概括应在故事基础上点出道理，附会/单纯复述都不够。'],
    ['秋天的果园里，红彤彤的苹果压弯了枝头，黄澄澄的梨挂在树上，农民伯伯忙着采摘，脸上满是丰收的喜悦。','秋天是收获的季节。','果园里有红苹果和黄梨。','农民伯伯很忙。','概括要有高度的"总"字，具体果品种类属细节。'],
    ['操场上，同学们有的跳绳，有的踢毽子，还有的跑步。体育委员站在一旁仔细观察，谁的动作不规范就纠正。','同学们在操场上锻炼，体育委员在认真巡视。','同学们在操场上玩。','体育委员纠正动作。','概括要兼顾"活动"和"组织"两处，不能只取其一。']
  ];
  function genDuanluo(){
    var ok=DL.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    var opts=shuffle([ans,row[2],row[3],row[0]]);
    return {tag:'段落概括',title:'抓中心',
      q:'读下面这段话，说说它主要讲了什么。选出<b>概括最恰当</b>的一项：<br><span style="font-size:16px;line-height:1.85;text-align:left">'+esc(row[0])+'</span>',
      speakQ:'读这段话，说说它主要讲了什么。',
      opts:opts, correct:opts.indexOf(ans), ans:ans,
      hint:row[4]};
  }

  /* ---------- 5. 作文起步（zuowen） ----------
     不是让学生写作文（那是写），而是"给材料选立意/选开头/补细节"这类
     能自动化判分的写作起步题。考审题与选材方向。
     坑：立意偏题、开头照抄题目、以偏概全。干扰项 = 明显跑题或照抄题意的开头。 */
  var ZW=[
    ['写一件让自己难忘的事','一件难忘的事','第一次做饭','难忘的教训','选材要能体现"难忘"，单纯写"有趣"就跑偏了。'],
    ['写一个给你留下深刻印象的人','印象最深的人','我最喜欢的明星','我的老师','"留下深刻印象"侧重让人记住，不等于"喜欢"，二者有别。'],
    ['写一处你熟悉的景物','我熟悉的景物','我家的院子','美丽的公园','要写"你熟悉"的，写没去过的地方就无法写出细节。'],
    ['写一次让你懂得坚持的活动','懂得坚持的活动','一次运动会','一次春游','立意要落在"懂得坚持"，写趣闻就偏题了。'],
    ['写一次让你受益匪浅的实验','一次实验','有趣的实验','实验课','"受益匪浅"指有所收获，不能只是"有趣"。']
  ];
  function genZuowen(){
    var ok=ZW.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    var opts=shuffle([ans,row[2],row[3],row[0]]);
    return {tag:'作文起步',title:'审题选材',
      q:'作文题目是：<b>'+esc(row[0])+'</b><br>下面哪个<b>立意和选材</b>最切合题目要求？',
      speakQ:'这个作文题目，下面哪个立意和选材最切合题目要求？',
      opts:opts, correct:opts.indexOf(ans), ans:ans,
      hint:row[4]};
  }

  /* ================================================================
     ★ v4.321 四年级语文三考点（修辞 / 人物描写 / 应用文）
     ---------------------------------------------------------------
     为什么是这三个：v4.320 补的是"整句整段"（病句/句式/关联词/概括/立意），
     但四年级真正的分水岭是**表达效果**——同样一句话，用了什么手法、写了人物的
     什么、写得得体不得体。四上语文园地明确要求"初步了解人物描写的方法"
     （外貌/语言/动作/神态/心理）和"学习运用恰当的措辞"（修辞），
     四下则要求"学写简单书信、把事情写清楚"（应用文）。这三项在App 里都没有出题器。
     母题设计原则延续"有坑的题才拉得开差距"：
       · 修辞：干扰项是"看着像但用错了地方"的修辞 —— 最典型的是把比喻说成拟人、
         把夸张说成比喻、比喻本体喻体不分。学生错在这里，不是不知道比喻是什么。
       · 人物描写：干扰项不是"随便一个字"，而是**把不同描写方法张冠李戴**
         （把外貌写成心理、把动作写成神态），以及"有描写但没写出特点"的说服式答案。
       · 应用文：干扰项是**格式上的真实错误**（称呼顶格漏写、署名与日期位置颠倒、
         请假条写成留言条语气），这是应用文最稳的失分点。
     ================================================================ */

  /* ---------- 6. 修辞手法（xiuci） ----------
     XC：[句子, 正确手法名, 干扰1, 干扰2, 讲解]
     两类题型随机出：
       A型「判断用了什么修辞」——考识别，坑在比喻/拟人/夸张三者互串。
       B型「该用哪种修辞」——考运用，坑在"选一个读着顺但不合情境的"。
     手法库固定为小学要求内：比喻、拟人、排比、夸张、设问、反问。 */
  var XC=[
    ['月光如水一般，静静地泻在这一片叶子和花上。','比喻','拟人','夸张','有本体"月光"、有喻体"水"，还有比喻词"如""一般"，这是比喻；月光不会"泻"着说话，不是拟人。'],
    ['小溪唱着欢快的歌儿，一路蹦跳着跑向远方。','拟人','比喻','排比','把溪水当人写——"唱歌""蹦跳""跑"都是人的动作，这是拟人。'],
    ['他跑得飞快，像一阵风似的。','比喻','夸张','拟人','"像……似的"把"跑得快"比作风速，是比喻；没有真的说快到夸张程度。'],
    ['教室里静得连一根针掉在地上都能听见。','夸张','比喻','拟人','用极小的声音反衬极静，属于夸张（故意放大），不是比喻。'],
    ['你难道不知道这其中的道理吗？','反问','设问','疑问','用疑问的形式表达肯定的意思，答案就在句中，是反问；设问是自问自答，句中不会带答案。'],
    ['这到底是谁的过错呢？我看是风的责任。','设问','反问','疑问','先自己发问、再自己回答，是设问；反问只问不答，答案寓于问句中。'],
    ['书是人类进步的阶梯，是钥匙，是钥匙。','排比','比喻','夸张','三个及以上结构相似的短语连用增强气势，是排比；虽然每项都用了"是"，但要看句式是否整齐连用。'],
    ['他从来没有迟到过，今天却迟到了十五分钟。','对比','比喻','排比','前后两相对照形成反差，这是对比；不是比喻（没有喻体），也不是排比（没有三个相似句式）。'],
    ['花园里的鲜花争相开放，美丽极了。','拟人','比喻','排比','"争相"把花当作人来争抢，是拟人。'],
    ['教室里静得能听见笔尖划过纸面的沙沙声。','夸张','比喻','拟人','用极细微的声音反衬极静，是夸张的表达效果。'],
    ['妈妈的手很粗糙，像老树皮一样。','比喻','拟人','夸张','把"手"比作"老树皮"，本体喻体都明确，是比喻。'],
    ['远处的霓虹灯亮了，像一条流动的银河。','比喻','拟人','排比','把灯带比作银河，是比喻；银河本身没有动，不构成拟人。'],
    ['这本书我看了一遍又一遍，舍不得放下。','夸张','比喻','拟人','"一遍又一遍"是有意放大程度，属夸张；没有本体喻体的对应，不是比喻。']
  ];
  /* 小学要求内的修辞手法全集 —— 用来当干扰项池。
     设计要点：**不设"以上都不是"兜底项**。修辞就这几种，兜底项会出现
     "选'排比'其实也对"的多解风险；正确做法是从库里取**其余真实手法**做干扰，
     让学生真去判断，而不是靠排除法猜。 */
  var XC_LIB=['比喻','拟人','排比','夸张','设问','反问','对比','反复','对偶'];
  function fillFour(ans, decoys, lib){
    var uniq=[],seen={},i;
    function push(x){ if(x&&!seen[x]){seen[x]=1;uniq.push(x);} }
    push(ans);
    (decoys||[]).forEach(push);
    /* 再从手法库里补足到 4 个 —— 补进来的都是"学生真会混淆"的同类手法 */
    var pool=shuffle(lib.filter(function(x){return !seen[x];}));
    for(i=0;i<pool.length&&uniq.length<4;i++)push(pool[i]);
    return uniq.slice(0,4);
  }
  function genXiuci(){
    var ok=XC.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4]
      &&r[1]!==r[2]&&r[1]!==r[3]&&r[2]!==r[3];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    var uniq=fillFour(ans,[row[2],row[3]],XC_LIB);
    return {tag:'修辞手法',title:'识别修辞',
      q:'下面这句话用了什么修辞手法？<br><span style="font-size:17px;line-height:1.9">'+esc(row[0])+'</span>',
      speakQ:'下面这句话用了什么修辞手法？'+row[0],
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:row[4]};
  }

  /* ---------- 7. 人物描写（renwu） ----------
     RW：[人物+场景片段, 正确描写方法, 干扰1, 干扰2, 讲解]
     描写方法固定为小学要求内五类：外貌（外形）、语言、动作、神态、心理。
     干扰项全部是"另一类描写方法"，而不是随机词——学生做错正是张冠李戴。 */
  var RW_LIB=['外貌描写','语言描写','动作描写','神态描写','心理描写'];
  var RW=[
    ['他的脸涨得通红，眉头紧皱，额上青筋暴起。','神态描写','外貌描写','动作描写','写脸色、眉毛、额头这些"表情神色"的，是神态；外貌指身材、相貌等相对固定的形态。'],
    ['他一把抓起书包冲出教室，头也不回。','动作描写','神态描写','心理描写','"抓起""冲出""不回头"是一连串动作，属动作描写；没有写心情，不是心理。'],
    ['妈妈轻声问："作业写完了吗？先把书放下吧。"','语言描写','外貌描写','动作描写','有引号、直接说的话，是语言描写；要看有没有"说"出来的内容。'],
    ['他盯着空荡荡的书包，心里像压了一块石头。','心理描写','动作描写','神态描写','"心里像压了石头"是内心的感受，属心理描写；"盯着"是动作，但主体是心里怎么想。'],
    ['奶奶的白发稀稀落落，脸上布满了皱纹。','外貌描写','神态描写','动作描写','写头发稀疏、脸上皱纹这些外形特征，是外貌；神态指短时间的神情。'],
    ['他咬着嘴唇，眉头一皱，心里后悔极了。','神态描写','心理描写','语言描写','前半句"咬嘴唇、皱眉头"是神态，后半句"后悔"是心理——本题问的是最先落笔的描写方法，抓"表情"这层。'],
    ['老师推了推眼镜，笑着点了点头。','神态描写','动作描写','外貌描写','"笑着点头"是面部神情，属神态；"推了推眼镜"是动作，但题眼是笑与点头。'],
    ['我踮起脚尖，轻轻地把窗户关上。','动作描写','神态描写','心理描写','"踮""轻轻关"是动作的轻手轻脚，属动作描写；不写心情就不是心理描写。'],
    ['"你怎么又忘了？"爸爸严厉地盯着我说。','语言描写','神态描写','心理描写','带引号的责问是语言；"严厉地盯"是神态，题目主要考的是说出口的话。'],
    ['他犹豫了很久，终于迈出了那一步，心里既慌又喜。','心理描写','动作描写','神态描写','"犹豫""既慌又喜"都写在心里，是心理描写；"迈出一步"是动作。'],
    ['小姑娘的脸蛋红扑扑的，眼睛又大又亮。','外貌描写','神态描写','动作描写','写脸蛋颜色、眼睛大小这些外形，是外貌描写。'],
    ['他抓耳挠腮，绕着桌子转了好几圈。','动作描写','神态描写','心理描写','"抓耳挠腮""绕着转"是连串动作，是动作描写。']
  ];
  function genRenwu(){
    var ok=RW.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    /* 描写方法池：五类小学要求内的方法，干扰项全从这里取，
       保证每个选项都是"真方法、只是不适用于这一句"，学生必须真判断。 */
    var uniq=fillFour(ans,[row[2],row[3]],RW_LIB);
    return {tag:'人物描写',title:'描写方法',
      q:'下面这段文字着重用了哪种人物描写方法？<br><span style="font-size:17px;line-height:1.9">'+esc(row[0])+'</span>',
      speakQ:'下面这段文字着重用了哪种人物描写方法？'+row[0],
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:row[4]};
  }

  /* ---------- 8. 应用文（yingyong） ----------
     YYW：[应用文类型, 正确格式要点, 干扰1, 干扰2, 讲解]
     考的是"格式 + 得体"，格式错是应用文最稳的失分点：
       · 书信：称呼顶格写、问候另起一行空两格、署名与日期在右下方；
       · 请假条：标题居中、称呼顶格、请假人+日期在右下方、要有"请批准"；
       · 留言条：不用称呼，直接写事，落款写名字；写给谁要说清。
     干扰项全部是"格式上真的错"的写法，不是随机句子。 */
  var YYW_LIB=['写在信的左下方','写在正文第一行前面','不写落款不写日期','汇报个人的感情体验'];
  var YYW=[
    ['写一封给远方亲戚的信，结尾落款该怎么写？','右下方先写署名"你的侄子 小明"，再写日期','日期写在最前面，署名写在最后','不用署名，只写日期','书信的落款惯例是"署名+日期"，且都要靠右下方（日期在署名下一行）；把日期写最前是错的。'],
    ['请假条的开头一行通常怎么写？','居中写"请假条"三个字','居中写"申请"两个字','顶格写"亲爱的老师"','请假条有标题且居中，称呼"亲爱的老师"要另起一行顶格写；把称呼当标题、标题写"申请"都不合格式。'],
    ['写请假条时，下面哪一项必须要有？','写明请假人姓名和具体日期','写明老师的工资','写明家里的地址和邮编','请假条要交代"谁请、什么时间"，这是核心要素；工资、住址与请假无关。'],
    ['给同学写留言条，称呼该怎么处理？','不写称呼，直接写留言内容，结尾写名字','必须写"亲爱的同学"','写"此致敬礼"','留言条是"贴"在物品上留给对方的，不写称呼和"此致敬礼"，只写清事情和落款。'],
    ['书信正文第一行问候语应该怎么写？','另起一行，空两格写"您好"','接着称呼写在同一行','顶格写"您好"','书信格式：称呼顶格，问候语另起一行空两格；这是最常考的格式点。'],
    ['写一封介绍家乡特产的信，署名和日期应该——','写在信的右下方','写在信的左下方','写在正文第一行前面','中文书信署名、日期一律在右下方（"右下方落款"），这是固定格式。'],
    ['通知的正文部分应该写什么？','写清时间、地点、事情、要求','写自己的感想','写对方的优点','通知只说事：何时、何地、何事、要怎样，不写感想也不夸人。'],
    ['写"寻物启事"时，下面哪项内容最不需要写？','写捡到东西的人的情绪感受','写清失物名称、特征','写拾物者的联系方式','启事只需"失什么、长什么样、在哪捡到、怎么联系"，写情绪属于抒情，格式上多余。'],
    ['书信结尾"此致 敬礼"应该怎么写？','"此致"另起一行空两格，"敬礼"顶格写在下一行','"此致敬礼"写在同一行并顶格','"此致敬礼"写在正文末尾紧接着写','"此致"要有空格且另起一行（空两格），"敬礼"顶格另起一行，这两个字不能连写。'],
    ['写感谢信时，正文最应该突出的是——','对方为自己做过的具体事情','自己的学习成绩','天气情况','感谢信要把"对方做了什么"写具体、说清楚，笼统一句"谢谢"反而空洞。'],
    ['写建议书时，下面哪一项内容不该出现？','批评同学之间的争吵','提出改进的具体办法','说明建议的理由','建议书重在"提出办法和理由"，不应夹带对同学的批评。'],
    ['给长辈写短信或信件，开头最得体的称呼是——','"奶奶，您好"','"喂，老太太"','"老不死的"','给长辈写信要用敬语尊称，"您"体现礼貌；后两种称呼失礼，属于用词不得体。']
  ];
  function genYingyong(){
    var ok=YYW.filter(function(r){return r&&r[0]&&r[1]&&r[2]&&r[3]&&r[4];});
    if(!ok.length)return null;
    var row=pick(ok);
    var ans=row[1];
    /* 应用文扰动池：全是"格式上真的错"的写法或"不得体"的称呼，
       不用以上都对这类兜底项——那会让学生靠排除法猜。 */
    var uniq=fillFour(ans,[row[2],row[3]],YYW_LIB);
    return {tag:'应用文',title:'格式与得体',
      q:'下面关于应用文的说法，<b>正确</b>的一项是：<br><span style="font-size:16px;line-height:1.9">'+esc(row[0])+'</span>',
      speakQ:'下面关于应用文的说法，正确的一项是：'+row[0],
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:row[4]};
  }

  /* ---------- 9. 长篇深度阅读（deepreading） ----------
     为什么必须另建一个考点，而不是把READINGS 加长：
       ① 现有 READINGS 只有 6 篇、平均 54 字，是**二年级**水平（"月亮像什么？"
          这种一问一答）；四年级课标要求 350 字以上、能读懂较复杂的语段。
       ② 更关键的是**设问层次**。原 reading 每篇只问"写了什么"一道题，考的是
          提取信息；四年级要考的是：概括主要内容、理解词句在语境中的意思、
          体会人物心情、看出写法门道。这四种能力用同一道题是考不出来的。
     DR 结构：{t标题, b正文, qs:[{q设问, a正确项, w干扰项[], tip讲解}...]}
     每篇配 3~4 道分层设问，一道题一个 variant 指纹（概括/词句/心情/写法），
     这样学情能看出"孩子是读不懂内容，还是读懂了但概括不来"。
     ⚠ 干扰项全部是"**答得很像但答偏了**"的版本，不是一眼错的：
        · 概括题 → 只说第一段／只说结果／把没写的加进去
        · 词句题 → 望文生义／脱离语境／答成字典释义
        · 心情题 → 只写情绪词不讲原因／答成别人的心情
        · 写法题 → 答成"写得好"这种空话／答成内容而非手法           */
/* 四年级长篇深度阅读母题：4 篇 350~420 字原创长文，每篇 4 道分层设问。
   ⚠ 正文全部原创改写，不搬运教材原文；
   ⚠ 干扰项全部是"答得很像但答偏了"的版本，不是一眼错的：
      · 概括题 → 只说第一段／只说结果／把没写的加进去
      · 词句题 → 望文生义／脱离语境／答成字典释义
      · 心情题 → 只写情绪词不讲原因／答成别人的心情
      · 写法题 → 答成"写得好"这种空话／答成内容而非手法            */
var DR=[
  {t:'北墙下的那片绿',
   b:'校园北墙下面爬满了爬山虎。那是一个春末的下午，我站在墙根下，忽然发现这一大片绿色里藏着两个完全不同的世界。刚长出来的叶子是嫩红的，薄薄的，几乎透明，风一吹就抖，不几天叶子长大了，就变成嫩绿的，也不大引人注意。真正引人注意的是长大了的叶子：绿得那么新鲜，叶尖一顺儿朝下，在墙上铺得那么均匀，没有重叠起来的，也不留一点儿空隙。一阵风拂过，一墙的叶子就漾起波纹，好看得很。我这才注意到叶柄上长出六七根细丝，每根细丝像蜗牛的触角，颜色和新叶子一样。细丝原先是直的，后来弯曲了，把嫩茎拉一把，使它紧紧贴在墙上。爬山虎就是这样一脚一脚往上爬的。它的脚要是没触着墙，不几天就萎了，后来连痕迹也没有了；触着墙的，细丝和小叶片逐渐变成灰色，抓墙的力量反倒越来越大。你盯着那些灰色的脚看久了，会觉得它们像一只只小手，牢牢按在墙上。院里的老人说，爬山虎爬得越高，墙就越绿；墙越绿，院子里的夏天就越凉。我年年看它往上爬，去年它刚够到窗台，今年已经探到了屋檐。',
   qs:[
    {k:'概括主要内容',
     q:'这段文字主要写的是什么？',
     a:'北墙下爬山虎从嫩叶到铺满墙的过程，以及它向上爬的"脚"',
     w:['刚长出来的那几片嫩红色叶子','北墙下面长着很多爬山虎','老人对爬山虎的喜爱之情'],
     tip:'概括要把全文的两条线合起来：前半写叶子由嫩红到铺满墙，后半写"脚"怎样抓住墙往上爬。只答其中一条就偏了。'},
    {k:'理解词句含义',
     q:'"一墙的叶子就漾起波纹"中的"漾"字写出了叶子的什么特点？',
     a:'成片的叶子被风吹得轻轻起伏、像水波一样闪动',
     w:['叶子在阳光下发亮','叶子正在快速生长','叶子被虫子咬出了波纹'],
     tip:'"漾"是水波起伏的样子。联系前面"一阵风拂过"，写的是叶子成片地轻轻摇动，不是亮、不是长、不是被咬。'},
    {k:'体会人物心情',
     q:'听到老人说"墙越绿，院子里的夏天就越凉"，"我"的心情是怎样的？',
     a:'因为亲眼看着爬山虎一年年爬高而感到欣慰，也觉得凉爽的院子有盼头',
     w:['为爬墙的爬山虎担心，怕它今年爬不到屋檐','为院子里的夏天太热而着急生气','为自己今年功课没写完而惭愧'],
     tip:'老人那句说的是好处和希望，"我年年看它往上爬"是亲眼所见，所以是欣慰、有盼头，不是担心、生气或惭愧。'},
    {k:'分析表达方法',
     q:'作者是按什么顺序写北墙下这片爬山虎的？这样做有什么好处？',
     a:'按叶子由小到大、爬山虎由低到高的生长顺序写，能清楚看出它每一步都在往上',
     w:['按从墙东头到墙西头的方位顺序写，能看出墙有多长','按颜色由深到浅的顺序写，能看出墙有多干净','按作者看的时间顺序写，能看出那天天气很好'],
     tip:'全文线索是"嫩红→嫩绿→铺满墙""直的细丝→灰色抓墙的力量""去年到今年"，都是生长和向上的顺序，不是方位也不是天气。'}
   ]},
  {t:'凌晨五点二十分',
   b:'预产期还有十天，夜里下过雨。我四点被送进产房，灯白得晃眼，凉气从脚底往上冒。护士让我躺好，在肚子上涂了凉凉的油，说宫缩得厉害就抓栏杆。我抓着栏杆，铁条冰凉，掌心很快就出汗了。四点二十，疼开始，一阵一阵地来，像有人从里面把什么东西慢慢拧。我数着护士报的数，数到一半就忘了，只能抓着栏杆使劲。四点四十，护士换了人，说："别喊，留着力气。"我咬住嘴唇，尝到一点咸味。五点零几分，屋里忽然静了一瞬，随即是一声又亮又长的哭。我全身一松，手从栏杆上滑下来，护士把孩子放到我胸口，说是个健康的小伙子。我看清他的脸皱巴巴的，头上的头发湿着，八字眼。我一下就哭了。护士笑着说："你做得很好。"我这才发觉自己一直在发抖，汗把枕头湿透了，可我一点也不觉得累。护士递来一小块巧克力，我咬不动，只是含着，让那点甜慢慢化开，再一次看看他的脸。那天早上六点，太阳从窗子照进来，落在床单上暖融融的一小块。我忽然觉得，这一夜里所有的疼，都是值得的。',
   qs:[
    {k:'概括主要内容',
     q:'这段文字主要写的是什么？',
     a:'母亲在产房从剧痛到孩子出生、感到欣慰的分娩经历',
     w:['产房里护士的工作和辛苦','医院产房的环境和设备','一个家庭迎接第二个孩子的经过'],
     tip:'全文跟着"我"的感受走：疼—使劲—孩子哭—"我"松了、哭了、觉得值得。护士和产房只是背景，不是主要内容。'},
    {k:'理解词句含义',
     q:'"我全身一松，手从栏杆上滑下来"中的"一松"写出了什么？',
     a:'孩子出生后一直紧绷的劲儿一下子卸掉了',
     w:['手被栏杆上的汗滑了一下，没抓住','疼得太厉害已经没有力气了','终于松开手不想再抓栏杆了'],
     tip:'前面写的是"抓栏杆使劲"，孩子一哭就"一松"，这是用力之后突然卸力的变化，不是没力气、也不是主动放弃。'},
    {k:'体会人物心情',
     q:'"我忽然觉得，这一夜里所有的疼，都是值得的"，"我"此刻的心情是怎样的？',
     a:'因为孩子平安出生而喜悦、满足，觉得辛苦没有白受',
     w:['因为太累而委屈，想抱怨辛苦的家人','因为医生误会了她而生气','因为孩子哭得响亮而担心害怕'],
     tip:'"都是值得的"是全文最后一句总结，前面写的是孩子健康地哭、护士称赞她，所以是喜悦和满足，不是委屈、生气或担心。'},
    {k:'分析表达方法',
     q:'作者写"疼"的时候为什么不直接说"我很疼"，而要写抓栏杆、咬嘴唇、尝到咸味？',
     a:'用身体的真实反应和细节把疼痛写出来，比直接说更真切、更能让人感到疼',
     w:['作者不直接说疼，是怕写出自己太娇气','作者忘了当时疼过，记不清细节','作者觉得直接说疼显得文章太啰嗦'],
     tip:'这叫侧面描写：用掌心出汗、栏杆冰凉、咬破嘴唇尝到咸味这些细节让读者自己感到疼，不是作者娇气、忘事或嫌啰嗦。'}
   ]},
  {t:'屋后的桂花树',
   b:'屋后有十几棵桂花树，是奶奶那辈种下的。每年中秋前后，它们一夜之间就热闹起来。远远望去，一棵棵树上像挂满了碎金子；走近了才看清，那是一朵朵四瓣的小花，藏在密密的绿叶间，一簇一簇地挤着，把枝条压得往下弯。风一过，香气就顺着窗缝钻进屋来，晾着的衣服、刚煮好的粥，都染上这股味道。奶奶搬来一张竹匾，把桂花一层层抖在匾里，摊开，摊薄，说这样才香得久。我们几个孩子蹲在旁边看，忍不住用手捧起来往鼻尖凑，奶奶也不恼，只把我们的手拨开，说："你们只知道吃，不知道桂花树开花要费多少力气。"那年中秋 早早摆好了板凳，一边赏桂，一边等桂糕出锅。桂糕蒸出来，热气腾腾，颜色像琥珀，切一块，甜里带着一点清香。父亲说得慢，一年就这几十天，错过了就得等明年。我咬了一口，忽然懂了他那句话。多年以后，我住在城里，闻不到这个味道，只在闻到一点相似的香时，会忽然想起屋后那一片碎金子，还有奶奶竹匾上摊得薄薄的一层。那份甜，我一直记到今天。',
   qs:[
    {k:'概括主要内容',
     q:'这段文字主要写的是什么？',
     a:'屋后桂花盛开的景象和采桂、做桂糕的往事，以及那份难忘的甜',
     w:['桂花树是用什么方法种活的','中秋节城里人怎样过','奶奶年轻时做工的事情'],
     tip:'前半写桂花的香和密，后半写采桂、做桂糕和多年后的想念，合起来才是"桂花雨"的完整内容。'},
    {k:'理解词句含义',
     q:'"把枝条压得往下弯"这句话写出了什么？',
     a:'桂花开得又多又密，把树枝都坠得向下垂',
     w:['桂花树长得太高，风把枝条吹弯了','桂花把枝条上的叶子全压掉了','园丁把枝条捆在一起向下拉过'],
     tip:'"压"是重量造成的。前面说"一簇一簇地挤着"，正因为花多才把枝条坠弯，不是风吹、不是落叶、也不是人工捆。'},
    {k:'体会人物心情',
     q:'"多年以后……会忽然想起屋后那一片碎金子"，"我"的心情是怎样的？',
     a:'怀念故乡、怀念奶奶和童年，淡淡的想念里带着温暖',
     w:['为再也吃不到那样甜的桂糕而懊恼失望','为奶奶年纪大了不能再种桂树而着急','为自己多年没有回过家而羞愧不安'],
     tip:'"会忽然想起"说明是自然而然的思念，落脚点是"那份甜，我一直记到今天"，是温暖怀念，不是懊恼、着急或羞愧。'},
    {k:'分析表达方法',
     q:'开头写桂花"像挂满了碎金子"，结尾写"那一片碎金子"，这样写有什么好处？',
     a:'前后照应，把桂花的样子和难忘的往事连在一起，让怀念之情更深',
     w:['前后重复，说明作者忘了当初的样子，只能照抄','前后照应，说明桂花一年比一年开得多','前后照应，说明奶奶每次都先摆好板凳等着'],
     tip:'同一个"碎金子"在开头是眼前看到的景，在结尾是多年后留在心里的记忆，前后照应才把景和情连起来。'}
   ]},
  {t:'第二次起飞',
   b:'屋檐下的燕窝里住着两只小雏燕，茸茸的羽毛已经长齐了。一天清晨，母燕落在窝沿上，不停地扇动翅膀，一声一声地叫。小雏燕探出头来看，羽毛已经干了，可两条腿还发软。母燕退到窝边，忽然扑过去，用翅膀和背把它推了出去。小雏燕在空中扑棱了两下，翅膀像两片被雨打湿的纸，撑不住，身子一歪，直往下坠。院子里的老人"哎呀"了一声，手都抬起来了。就在这时，那团黑影擦着草尖落下来，只摔伤了一边翅膀。老人松了口气，说："下来就下来吧，飞不上去还能活。"小雏燕在青草上趴了两天，自己挪到矮墙边，翅膀伤好后，一次一次往上跳，跳不高就再跳。第八天早上，它从墙头飞到窗台，第十天飞到屋檐下面的横木上，第十一天，它飞到窝沿上。接下来的整个下午，它都在窝里挪来挪去，抖着翅膀，像在练习。那天傍晚，它从窝沿上第二次起飞，这一回，翅膀稳稳地托住身体，绕着院子飞了一圈，落在电线上，还叫了两声。第二天，它已经不是那只掉下来的小鸟了，停在屋檐上梳理羽毛，利落得像从来没有掉下来过。老人站在树下笑了很久，才转身回家。',
   qs:[
    {k:'概括主要内容',
     q:'这段文字主要写的是什么？',
     a:'小雏燕第一次没飞成、经过练习终于第二次起飞学会飞的过程',
     w:['母燕怎样教小燕寻找食物','屋檐下燕窝是怎么搭起来的','院子里那位老人有多大年纪'],
     tip:'全文围绕"学飞"这一件事：被推出去—坠地受伤—反复练习—第二次起飞—变成利落的燕子。母燕和老人都是这条线上的配角。'},
    {k:'理解词句含义',
     q:'"翅膀像两片被雨打湿的纸"这句话写出了什么？',
     a:'翅膀还没有力气，撑不住身体，飞不起来',
     w:['小雏燕的羽毛被雨淋湿了','小雏燕的翅膀长得太小不好看','小雏燕的翅膀被风吹得一直发抖'],
     tip:'"雨打湿的纸"软塌塌、提不起来，比喻的是翅膀软、使不上劲，不是真的淋雨、不是羽毛难看、不是风吹。'},
    {k:'体会人物心情',
     q:'老人站在树下"笑了很久，才转身回家"，他此刻的心情是怎样的？',
     a:'为小雏燕终于学会飞而高兴，也替自己当初的担心落了地',
     w:['因为小雏燕摔伤了翅膀而生气，怪母燕不该推它','因为小雏燕不听他的话、自己练飞而无奈','因为天气转凉，怕小雏燕飞不远而担心'],
     tip:'老人从"哎呀"一声拉手，到最后笑很久，中间明确说过"下来就下来吧"，所以结尾是如愿的高兴，不是生气、无奈或担心。'},
    {k:'分析表达方法',
     q:'文中写小雏燕练习用了"一次一次""第八天""第十天""第十一天"，这样写有什么好处？',
     a:'用具体天数写练习的过程，说明它飞起来是靠一天天坚持下来的，不是一下就成功',
     w:['说明作者数错了日子，前后时间对不上','说明小雏燕每天都在飞给老人看，老人一直在看','说明小雏燕记性很好，能记住每一次飞的高度'],
     tip:'"一次一次"加上三天各自分开的数字，是为了把练习的过程写扎实，突出坚持，不是在说作者算错、老人天天看或小燕记性好。'}
   ]}
];
/* ---------- 10. 小古文（xiaoguwen） ----------
   为什么必须另建一个考点，而不是把 CLASSIC_LIB 接到轮转里就完事：
     ① CLASSIC_LIB 是「蒙学/成语故事」阅读库（《三字经》《弟子规》《司马光》……），
        内容属一年级启蒙层次，**没有注释、没有译文、没有设问**，不能当考题用；
     ② 五下真正要考的是**文言词句与篇目理解**：《杨氏之子》《自相矛盾》两则，
        以及它们承载的"文言实词一词多义""借助注释理解""机智应答"这些能力。
   XG 结构：每条 {篇, 正文, 注释[[词,释义]...], 译文, q设问, a答案, w干扰项[], tip讲解, k层次}
   k 分四层，是这个考点的学情指纹：
     '文言实词'（一词多义）／'句读理解'（断句停顿）／'内容理解'（讲了什么故事）
     ／'寓意道理'（说明什么道理）
   ⚠ 干扰项全部是「**读起来通、但答偏了**」的版本：
     · 实词题 → 用现代常用义顶替古义 / 取同字的另一义项 / 把注释里的词张冠李戴
     · 句读题 → 断在虚词前后搞错 / 断成意义相反 / 漏掉倒装的标志
     · 内容题 → 只答第一句 / 把没写的加进去 / 答成寓意而非内容
     · 寓意题 → 答成表层劝告 / 套通用道理 / 与原文人物对象搞错              */
var XG=[
 {篇:'杨氏之子',
  正文:'梁国杨氏子九岁，甚聪惠。孔君平诣其父，父不在，乃呼儿出。为设果，果有杨梅。孔指以示儿曰："此是君家果。"儿应声答曰："未闻孔雀是夫子家禽。"',
  注释:[['聪惠','聪明、智慧','惠同"慧"，字形不同'],['诣','拜访','读 yì，专用于"拜访"'],
        ['乃','就，于是','此处是"就"，不是"才是"'],['设','摆放、端出','摆果品待客'],
        ['示','给……看','古义：展示。后写作"视"才指"观看"'],['家禽','家／禽鸟','"禽"是鸟的总称，不是"家畜"'],
        ['夫子','对男子的敬称','此处指孔君平本人，不是"老师"']],
  译文:'梁国有个姓杨的孩子九岁，非常聪明。孔君平来拜访他的父亲，父亲不在家，于是（孔君平）就把孩子叫了出来。孩子父亲给他摆出果品，里面有杨梅。孔君平指着杨梅给他看，说："这是你家的果子。"孩子马上回答说："我没听说孔雀是先生您家的鸟。"',
  题:[{k:'文言实词',q:'"孔君平诣其父"中的"诣"是什么意思？',a:'拜访',
      w:['告诉','告诉别人自己住在哪里','与"旨"通用，指皇帝的诏令'],
      tip:'"诣"在文言里专指"拜访"。孩子最容易错的是拿现代的"旨意、旨令"去套，或者望文生义成"告诉"——这两个义项在这句话里都讲不通。'},
     {k:'句读理解',q:'"为设果，果有杨梅"这两句该怎么停顿理解？',
      a:'（孔君平）摆出果品，果品中有杨梅',
      w:['为设／果／果有杨梅（"为设"是"为什么设置"）／（杨梅长着果子）',
         '（孩子）摆出果品，孩子种出了杨梅',
         '（孔君平）为了设置／果实里／有杨梅（把"果"当动词念）'],
      tip:'两处"果"字意思不同：前一个作名词"果品"，后一个作动词"生长、结出"。"为"在这里是"给、替"，不是"因为"。'},
     {k:'内容理解',q:'这段文字主要写了一件什么事？',
      a:'孔君平来访见不到杨氏子，孩子用机智的话应对了他的玩笑',
      w:['杨氏子九岁就非常聪明，客人夸他聪明','孔君平想吃杨梅，杨氏子把杨梅拿给他',
         '杨氏子的父亲不在家，孩子一个人在家看门'],
      tip:'全文有"来访—见不到父亲—孩子应答—机智回话"四层。只答"孩子很聪明"是把人物的品质当成了事件，答非所问。'},
     {k:'寓意道理',q:'杨氏子的回答为什么让人觉得机智？',
      a:'孔君平拿杨梅说"这是你家的果"，孩子用"孔雀是您家的鸟"照样回敬，既反驳又不失礼',
      w:['因为他九岁就能背诵很多诗书，所以说话很快',
         '因为他家里真的养了孔雀，所以知道得很清楚',
         '因为他不喜欢杨梅，所以想让客人吃别的'],
      tip:'孩子的巧妙在于"以其人之道还治其人之身"：把"杨梅→杨家的果"换成"孔雀→孔家的鸟"，既有力又不失礼貌。'}]},

 {篇:'自相矛盾',
  正文:'楚人有鬻盾与矛者，誉之曰："吾盾之坚，物莫能陷也。"又誉其矛曰："吾矛之利，于物无不陷也。"或曰："以子之矛陷子之盾，何如？"其人弗能应也。夫不可陷之盾与无不陷之矛，不可同世而立。',
  注释:[['鬻','卖','读 yù，不是"煮"'],['誉','夸耀、称赞','不是"荣誉"'],
        ['陷','刺破、穿透','不是"陷入、陷害"'],['或','有的人','不是"或者"'],
        ['弗','不','文言否定词，等于"不"，与"非"意思不同'],
        ['应','回答','读 yìng，不是"答应、反应"'],['夫','句首发议论的语气词','不译，本身无实义']],
  译文:'楚国有个既卖盾又卖矛的人，夸耀自己的盾说："我的盾很坚固，没有什么东西能刺破它。"又夸耀自己的矛说："我的矛很锋利，什么东西都能刺破。"有人说："用你的矛刺你的盾，会怎么样？"那个人答不上来。坚固得不能被刺破的盾和锋利得能刺破一切东西的矛，是不可能同时存在于世上的。',
  题:[{k:'文言实词',q:'"物莫能陷也"中的"陷"是什么意思？',
      a:'刺破、穿透',
      w:['陷进去、掉进去','陷入（某种处境）','陷害别人'],
      tip:'"陷"接的是"物莫能陷"，说的是盾挡不住矛，所以只能是"刺破"。把它当"陷害"是望文生义。'},
     {k:'句读理解',q:'"吾矛之利，于物无不陷也"这两句的停顿，正确的是哪一处？',
      a:'吾矛／之利，于物／无不陷也',
      w:['吾／矛之利，于／物无不陷也','吾矛之／利，于物无／不陷也','吾矛之利／，于物无不／陷也'],
      tip:'"吾矛"是主语要断开；"于物"是介宾短语要断开。文言的节奏就在这些虚词、介词前后，停顿错了意思就变了。'},
     {k:'内容理解',q:'这个卖矛和盾的人为什么答不上来"用你的矛刺你的盾"这个问题？',
      a:'因为他把盾说得无坚不摧又把矛说得无坚不破，两句话互相打架，无法同时成立',
      w:['因为他不知道自己的矛到底扎不扎得破盾',
         '因为他听错了别人的问题，没有明白在问什么',
         '因为他不好意思当着别人的面夸自己的东西'],
      tip:'不是"不知道"也不是"听错"，而是他的话自相矛盾——所以结尾才说"不可同世而立"。这是"逻辑上不可能"，不是"知识上不知道"。'},
     {k:'寓意道理',q:'这则寓言告诉我们什么道理？',
      a:'说话做事要前后一致，不能自己打自己的嘴巴',
      w:['做生意要诚实，不能夸大自己的东西','说话要谦虚，不要总夸自己',
         '遇到别人提问答不上来的时候，应该老实承认'],
      tip:'重点不是"不能夸大"（那是《滥竽充数》一类的道理），而是<b>前后矛盾</b>：同时断言两件不可能同时成立的事。'}]},

 {篇:'守株待兔',
  正文:'宋人有耕者。田中有株，兔走触株，折颈而死。因释其耒而守株，冀复得兔。兔不可复得，而身为宋国笑。',
  注释:[['株','树桩','不是"树木"的全称'],['走','跑','文言里"走"是跑，不是现在的散步'],
        ['触','撞击、碰到','不是"触摸"'],['释','放下','放下农具，不是"释放"'],
        ['耒','古代翻土的农具','读 lěi，不是"来"'],['冀','希望','希望再捡到兔子，不是"侥幸"的贬义用法'],
        ['为……笑','被……嘲笑','被动用法，不是"成为笑话"']],
  译文:'宋国有个种田的人。他的田里有个树桩，一只兔子跑过来撞在树桩上，折断脖子死了。于是他放下农具守着树桩，希望再捡到兔子。兔子当然没有再捡到，他自己却被宋国人笑话。',
  题:[{k:'文言实词',q:'"兔走触株"中的"走"是什么意思？',
      a:'跑',
      w:['慢慢地走','离开、走掉','去世（走世了）'],
      tip:'文言里"走"是"跑"，速度很快——正因为跑得快才撞死在树桩上。拿现代"散步"的义去理解，故事就不成立了。'},
     {k:'句读理解',q:'"因释其耒而守株，冀复得兔"这两句该怎么停顿？',
      a:'因释其耒／而守株，冀／复得兔',
      w:['因／释其耒而／守株，冀复／得兔','因释其／耒而守株／冀，复得兔','因释其耒／而守株／冀复／得兔'],
      tip:'"因"是"于是"要断开，"而"是承接也要断开。断句跟着虚词走，虚词前后往往就是句子的边界。'},
     {k:'内容理解',q:'宋人最后得到了什么？',
      a:'一只偶然撞死的兔子，但再也没有等到第二只，还被宋国人嘲笑',
      w:['很多只兔子，从此日子好过了','一只兔子也没有，因为兔子都跑了','兔子和一块田，都归他所有'],
      tip:'原文"兔不可复得，而身为宋国笑"是两层：既没等到（复得没实现），又被嘲笑。只答其中一层就漏了结局。'},
     {k:'寓意道理',q:'这个故事批评的是什么？',
      a:'把偶然的运气当成必然，死守经验、不肯劳作',
      w:['种地不如经商，劝人改行','兔子太少，应该多种树','宋人不该种田，应该去捡兔子'],
      tip:'嘲笑的是"不劳而获"的指望。原文"释其耒"是"放下农具"——关键就在他放下了劳动，只等运气。'}]},

 {篇:'精卫填海',
  正文:'炎帝之少女，名曰女娃。女娃游于东海，溺而不返，故为精卫，常衔西山之木石，以堙于东海。',
  注释:[['炎帝','传说中的上古帝王','不是"炎热的皇帝"'],['少女','小女儿','不是"年轻的女子"'],
        ['曰','叫作、名叫','读 yuē，不是"说"'],['游','游玩、游泳','在这里指在海里游玩'],
        ['溺','淹没、溺水','不是"沉迷"'],['故','因此、所以','表因果，不是"故意"'],
        ['衔','用嘴叼着','不是"街、衙"'],['堙','填塞','读 yīn，是填海的意思']],
  译文:'炎帝的小女儿，名字叫女娃。女娃到东海游玩，被海水淹没没有回来，因此化为精卫鸟，常常叼着西山上的树枝和石块，用来填塞东海。',
  题:[{k:'文言实词',q:'"常衔西山之木石，以堙于东海"中的"堙"是什么意思？',
      a:'填塞',
      w:['沉到水里','淹没','掩埋自己'],
      tip:'"堙"是"填"的意思。精卫衔来木石是为了把东海填上，所以只能是"填塞"，不是"沉下去"。'},
     {k:'句读理解',q:'"故为精卫，常衔西山之木石"这两句的停顿，正确的是哪一处？',
      a:'故为精卫／常衔／西山之木石',
      w:['故为／精卫常衔／西山之／木石','故／为精卫，常衔西山／之木石','故为精卫常／衔西山之／木石'],
      tip:'"为精卫"是判断性的谓语，"常衔"是主要的动作，"西山之木石"是它衔的东西，三个层次要断开。'},
     {k:'内容理解',q:'女娃为什么会变成精卫？',
      a:'因为她到东海游玩时溺水没有回来',
      w:['因为她每天衔木头去填海','因为她被炎帝罚到了东海',
         '因为她在海里修炼成了神鸟'],
      tip:'原文"溺而不返，故为精卫"是因果关系：先溺水没回来，然后才变成精卫。答案不能倒过来。'},
     {k:'寓意道理',q:'精卫填海表现的是一种什么样的精神？',
      a:'意志坚定，不畏艰难，坚持不懈',
      w:['自不量力，嘲笑别人做不到','贪玩好动，喜欢东游西荡','依赖别人，自己不肯出力'],
      tip:'填海明明不可能，但她一直衔木石不停地做——"坚持"是核心。若当成"不自量力"就完全读反了故事的感情。'}]}
];

  function genDeepreading(){
    var arts=DR.filter(function(a){return a&&a.t&&a.b&&a.qs&&a.qs.length;});
    if(!arts.length)return null;
    var art=pick(arts);
    var item=pick(art.qs);
    var ans=item.a;
    /* 干扰项来自这一题自带的三种错答，所以每题的选项都紧扣该题，不会跑题 */
    var uniq=[],seen={};
    function push(x){ if(x&&!seen[x]){seen[x]=1;uniq.push(x);} }
    push(ans);
    (item.w||[]).forEach(push);
    /* 每题自带 3 个错答，理论上正好 4 个；万一数据缺项才兜底，正常不会走到 */
    while(uniq.length<4)push('以上都不恰当');
    uniq=uniq.slice(0,4);
    /* 设问层次直接由数据表的 k 字段声明，不再靠题干关键词猜——猜关键词会漏判也误判 */
    var kind=item.k||'细读理解';
    return {variant:kind,tag:'长篇阅读',title:art.t+' · '+kind,
      body:'<div style="background:#FFFDF5;border-left:4px solid #E8C97A;padding:10px 12px;line-height:2;font-size:16px;margin-bottom:8px">'+esc(art.b)+'</div>',
      q:'<b>读短文，回答问题：</b>'+item.q,
      speakQ:'读短文，回答问题：'+item.q,
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:item.tip};
  }

  function genXiaoguwen(){
    var ok=XG.filter(function(a){return a&&a.篇&&a.正文&&a.注释&&a.译文&&a.题&&a.题.length;});
    if(!ok.length)return null;
    var art=pick(ok);
    var item=pick(art.题);
    if(!item||!item.a)return null;
    var ans=item.a;
    /* 干扰项全部是本题自带的错解：断句题是"真的断错"、实词题是"真的用错义项"，
       不从通用池里凑——凑出来的干扰项与本文言句子无关，孩子靠排除法就能猜中。 */
    var uniq=[],seen={};
    function push(x){ if(x&&x!==ans&&!seen[x]){seen[x]=1;uniq.push(x);} }
    (item.w||[]).forEach(push);
    uniq=uniq.slice(0,3);
    uniq.push(ans);
    if(uniq.length!==4){                       /* 数据缺项就重挑一篇，不拿兜底项充数 */
      var art2=pick(ok), it2=pick(art2.题);
      if(it2&&it2.a){ art=art2; item=it2; ans=it2.a; uniq=[]; seen={};
        (it2.w||[]).forEach(push); uniq=uniq.slice(0,3); uniq.push(ans); }
    }
    if(uniq.length!==4)return null;
    /* 题面带上原文＋该篇注释，注释是这个考点的关键——五下就是要求"借助注释理解" */
    var noteHTML='<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
      '<b>'+esc(art.篇)+'</b><br>'+
      '<span style="font-family:楷体,serif">'+esc(art.正文)+'</span>'+
      (art.注释&&art.注释.length ?
        '<div style="font-size:14px;color:#5a5348;margin-top:6px">'+
        art.注释.map(function(z){ return esc(z[0])+'：'+esc(z[1]); }).join('　')+
        '</div>' : '')+
      '</div>';
    var kind=item.k||'内容理解';
    return {variant:kind,tag:'小古文',title:art.篇+' · '+kind,
      body:noteHTML,
      q:'<b>读短文，回答问题：</b>'+item.q,
      speakQ:'读短文，回答问题：'+item.q,
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:item.tip};
  }


  /* ================================================================
     ★ v4.327 五年级语文三考点：含义深刻句 / 记叙顺序 / 读后感
     ------------------------------------------------------------
     三个都是"读一段话 → 答一个需要理解的问题"，所以统一带 body 短材料。
     母题原则不变：
       · 短文全部原创改写，不搬运教材、不杜撰出处；
       · 干扰项全部是本题自带的真实错解（w 数组），不凑数；
       · 每题带 tip（说清病灶），答错能知道"我为什么理解偏了"。
  ================================================================ */

  /* ---------- 一、含义深刻句（shendiao）
     考的是"这句话为什么这么说"，不是"这句话说了什么"。
     5 个 variant 对应 5 种不同的理解路径：
       比喻义 / 蕴含道理 / 写景寄情 / 人物言行 / 标题含义
     ------------------------------------------------------- */
  var SD=[
    {k:'比喻义',s:'那盏路灯亮了整整一夜，像谁把一整年的话都攒在灯下，非要说给谁听。',
     a:'用"说话"写灯光，把一夜的亮写成了"憋了很久的话"，说明这盏灯等人等了很久，含着说不出的牵挂。',
     w:['说明那盏灯的功率很大，一夜没关，所以特别亮。',
        '说明路灯坏了，一直亮着没人修。',
        '写夜里路上很黑，只有这一盏灯，所以显得格外亮。'],
     tip:'这是<b>比喻</b>：把灯光当成"说话"。真正的考点是"攒了一整年的话"这个说法背后有话没说完、有心等着没说，你抓住"非要说给谁听"里的着急和委屈了吗？只答"灯很亮"就是把比喻当成了描写。'},

    {k:'言行矛盾',s:'他把手上的伤口往袖子里藏了藏，又笑了笑，说没事。',
     a:'"藏"和"笑"都是嘴上说没事、身体却在示意有事，言行互相打脸，说明他在逞强，不愿让人担心。',
     w:['说明他真的没事，所以动作和表情都很自然。',
        '说明他很爱惜这件袖子，怕弄脏了。',
        '说明天气太冷，他把伤口藏起来取暖。'],
     tip:'这题抓<b>言行矛盾</b>：嘴上说"没事"，手上却在"藏"。两个动作同时出现，一定有一层意思没说破——他在逞强。只看"笑"字答"他很乐观"就浮在表面了，没看到藏伤口这一层。'},

    {k:'写景寄情',s:'春天是偷偷来的。先是河边那株柳树绿了一小片，接着一夜风，就把整条街的绿都点着了。',
     a:'"偷偷"和"一夜风"写出春天来得很轻、很快，先试探后铺开，像不动声色地就把人带进了春天里。',
     w:['说明柳树发芽的时间比别的树早，是一棵特殊的树。',
        '说明那一夜刮的是很大的风，所以叶子一夜就长齐了。',
        '说明街上的人都忘了注意柳树，所以觉得突然。'],
     tip:'关键在<b>先后和速度</b>：先"一小片"再"整条街"，这不是在介绍植物生长规律，而是在写一个"不知不觉就来了"的过程。"偷偷"这类词是提示你——作者在写感觉，不是在写事实。'},

    {k:'细节见态度',s:'那本书他读得很慢，一页一页地翻，像在跟人说话。',
     a:'"读得慢""一页一页""像跟人说话"三处都在暗示：这不只是在看书，是在跟书里的人交流。',
     w:['说明他识字速度慢，所以读得慢。',
        '说明那本书很难懂，他要反复看。',
        '说明他很爱惜书，所以翻得很小心。'],
     tip:'三个"慢"的细节要合起来看：慢、一页一页、像说话。单看"慢"是能力问题，合起来看是<b>态度</b>问题。把比喻还原成"他看书很认真"就丢掉了"跟人说话"这层最关键的意思。'},

    {k:'反复见情感',s:'最后一排的灯总是最后一个亮的。',
     a:'"总是""最后"叠在一起，写出一种被落在后面的、不声不响的守着，含有说不出的孤单和坚持。',
     w:['说明学校规定最后一排的灯最后开，是节约用电。',
        '说明最后一排离电源最远，所以灯最暗。',
        '说明这一排的同学总是最后一个走。'],
     tip:'这题最容易被"想当然"带走。看到"最后"就往"节约用电"上想，是把<b>细节当成事实</b>。记叙文里重复出现的词（总是、最后）几乎从来不是巧合，一定带情绪——你要问的是"作者为什么反复写它"。'}
  ];

  function genShendiao(){
    var ok=SD.filter(function(x){return x&&x.s&&x.a&&x.w&&x.w.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var ans=it.a;
    var uniq=[],seen={};
    function push(x){ if(x&&x!==ans&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.w.forEach(push);
    uniq=uniq.slice(0,3);
    uniq.push(ans);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);   /* 答案不许恒定在 D 位，否则连做十题就能背出规律 */
    /* 上面 length!==4 时直接弃题：数据缺项宁可不出，不拿兜底项充数 */
    return {variant:it.k,tag:'含义深刻句',title:'理解句子的深层意思',
      body:'<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
        '<span style="font-family:楷体,serif">'+esc(it.s)+'</span></div>',
      q:'<b>读一读，体会一下这句话</b>，说说它<b>真正想说的是什么</b>：',
      speakQ:'体会一下这句话，说说它真正想说的是什么。',
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:it.tip};
  }

  /* ---------- 二、记叙顺序（jixu）
     考的是"作者是怎么把这个故事排下来的"。
     4 个 variant 对应 4 种顺序类型：
       顺叙 / 倒叙 / 插叙 / 补叙（平铺直叙、打破时序、补前因）
     干扰项是"真的排错了"的排法，不是随便写的顺序。
     ------------------------------------------------------- */
  var JX=[
    {k:'顺叙',
     ex:['放学路上，小雨把伞让给了同班的低年级同学。',
         '两个人挤在一把伞下往回走，肩膀湿了一半。',
         '到家时她的右肩全湿了，可她一进门就说：没事，我不冷。'],
     seq:'顺叙', wrong:['倒叙（把最后一句提到最前）','插叙（中间插入了别的往事）','补叙（后面补充交代原因）'],
     tip:'三句话是"让伞 → 挤伞 → 到家"，正好是事情发生的<b>先后次序</b>，中间没有插入别的事，也没把结尾提前——这就是顺叙。'},

    {k:'倒叙',
     ex:['她始终没说出那句"谢谢"。',
         '那是三年前，教室的窗边，她把伞递给小云，自己淋着雨跑回家。',
         '那天她发了一整晚的烧，第二天照常来上学。'],
     seq:'倒叙', wrong:['顺叙（按时间先后写）','插叙（中间插入别的片段）','补叙（结尾补交代）'],
     tip:'开头就是"没说出谢谢"这个<b>结果</b>，然后才回到三年前交代伞的事——先把结局摆出来，再回头讲经过，这是典型的<b>倒叙</b>。'},

    {k:'插叙',
     ex:['老屋的门框上，还留着一道浅浅的刻痕。',
         '他忽然想起十年前的那个暑假，父亲就是从这道门框下，骑车带他去看海。',
         '那天海很蓝，父亲的衬衫被汗浸湿了一大片。'],
     seq:'插叙', wrong:['顺叙（从头到尾一件事）','倒叙（把结果提到开头）','补叙（结尾交代原因）'],
     tip:'正在说"老屋门框的刻痕"，笔锋一转"他忽然想起十年前"跳进了回忆，讲完再回到老屋——中间插入的那段就是<b>插叙</b>。'},

    {k:'补叙',
     ex:['他把奖状递过去，老师愣了一下，随即笑了。',
         '体育课上，运动会最后一天，他一个人跑完了全程。',
         '（补一句）那几天他一直在练，脚上的泡就是那时候磨的。'],
     seq:'补叙', wrong:['顺叙（按时间先后）','倒叙（结局提前）','插叙（中间插入）'],
     tip:'前两句讲"递奖状"这件事，括号里那句是对前面"一个人跑完全程"的<b>原因补充</b>，放在事完之后说——这就是补叙。'}
  ];

  function genJixu(){
    var ok=JX.filter(function(x){return x&&x.ex&&x.ex.length&&x.wrong&&x.wrong.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var ans=it.seq;
    var uniq=[],seen={};
    function push(x){ if(x&&x!==ans&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.wrong.forEach(push);
    uniq=uniq.slice(0,3);
    uniq.push(ans);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);   /* 答案不许恒定在 D 位，否则连做十题就能背出规律 */
    var bodyHTML='<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.2;font-size:16px;margin-bottom:8px">'+
      it.ex.map(function(l){ return '<div>· <span style="font-family:楷体,serif">'+esc(l)+'</span></div>'; }).join('') + '</div>';
    return {variant:it.k+'的判断',tag:'记叙顺序',title:'判断记叙顺序',
      body:bodyHTML,
      q:'<b>读上面这段文字</b>，判断作者采用的是哪一种记叙顺序：',
      speakQ:'读这段文字，判断作者采用的是哪一种记叙顺序。',
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:it.tip};
  }

  /* ---------- 三、读后感（duhougan）
     考的是"读完这篇文章，你从中受到什么启发、怎么联系自己"。
     4 个 variant 对应 4 种读后感能力：
       提炼中心 / 联系自己 / 谈做法 / 辨是非（联系生活中的例子）
     干扰项是"真实但不到位"或"跑题"的答法。
     ------------------------------------------------------- */
  var DHG=[
    {k:'落叶归根',art:'《一片树叶的故事》', txt:'校园里那棵老银杏，叶子黄了仍不落。值日的同学扫了三天三夜，扫完堆成一小堆埋在树根旁。第二年春天，那堆叶子里钻出两株新苗。',
     a:'这篇短文想告诉我们：落叶归根不是结束，眼前的一次付出可能悄悄长出新的开始。',
     w:['这篇短文写的是银杏叶变黄的过程。',
        '这篇短文想告诉我们：打扫卫生很重要，要坚持。',
        '这篇短文想告诉我们：学校的树应该多种几棵。'],
     tip:'跑题了。这篇的关键不是"扫"（那是次要情节），也不是"多种树"（那是你自己加的），而是"落叶变成新苗"这个<b>转折</b>。读后感要抓文章最想让你记住的那一处，不是复述过程、也不是提出建议。'},

    {k:'把日子过明白',art:'《父亲的算术》', txt:'父亲下岗那年，全家只能靠摆摊过活。一天他教我算账：进货多少钱，卖出去赚多少，亏了要赔多少。他从没说过一个大道理，可我至今记得他那句——"账要一笔一笔算清，日子就不会垮。"',
     a:'这篇短文让我懂得了：父亲教给我的不是算术，而是遇到困难时把日子过明白的那份认真。',
     w:['这篇短文想告诉我们：下岗是件很不容易的事。',
        '这篇短文想告诉我们：算术很有用处，要好好学习。',
        '这篇短文想告诉我们：摆摊比上班赚钱容易。'],
     tip:'跑题了。"下岗不容易"只是背景，"算术有用"是表面的。读后感要找<b>精神层面的收获</b>——父亲那句"账要一笔一笔算清"背后的<b>面对困难的认真劲儿</b>，那才是文章的中心，也是最该被你带进生活里的东西。'},

    {k:'好看与长久',art:'《那盆吊兰》', txt:'我嫌吊兰的花小、颜色淡，总想换一盆。妈妈没拦，只把最好看的那盆先换了。三周后新买的花谢了，吊兰却抽出了新芽。我这才知道好看和长久不是一回事。',
     a:'这篇短文让我明白：真正值得留下的东西，不一定最打眼，却往往最有生命力。',
     w:['这篇短文想告诉我们：吊兰比茉莉好看。',
        '这篇短文想告诉我们：买花要挑贵的买。',
        '这篇短文想告诉我们：妈妈太偏心，不听我的意见。'],
     tip:'跑题了。"吊兰比茉莉好看"跟原文相反，"买花要挑贵的"是你编的，"妈妈偏心"是对人物的误读。最后一句"好看和长久不是一回事"才是全文的落点——由这件事<b>想明白一个道理</b>，这才是读后感。'},

    {k:'教到最后一课',art:'《最后一盒粉笔》', txt:'毕业前那盒粉笔，老师从没舍得用。有一回我们打扫发现粉笔盒底下压着一行小字："给你们上完最后一课。——李老师"。第二天他真的走了，教室里空了一半的座位。',
     a:'这篇短文让我久久不能平静：老师留下的不是粉笔，是他把我们教到了最后一课的那份认真。',
     w:['这篇短文写的是我们打扫卫生时发现了粉笔盒。',
        '这篇短文写的是李老师退休了，很舍不得我们。',
        '这篇短文想告诉我们：要爱惜学习用品。'],
     tip:'前两项都是「复述情节」，不是读后感；而且"舍不得"太轻了。真正的读后感要写<b>你的感受被你改变了什么</b>——"给我们上完最后一课"这句话，和第二天人真的走了形成的落差，才是让你不能平静的地方。'}
  ];
  function genDuhougan(){
    var ok=DHG.filter(function(x){return x&&x.art&&x.txt&&x.a&&x.w&&x.w.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var ans=it.a;
    var uniq=[],seen={};
    function push(x){ if(x&&x!==ans&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.w.forEach(push);
    uniq=uniq.slice(0,3);
    uniq.push(ans);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);   /* 答案不许恒定在 D 位，否则连做十题就能背出规律 */
    var bodyHTML='<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
      '<b>'+esc(it.art)+'</b><br>'+
      '<span style="font-family:楷体,serif">'+esc(it.txt)+'</span></div>';
    return {variant:it.k,tag:'读后感',title:'把握文章的中心',
      body:bodyHTML,
      q:'<b>读短文</b>，这篇短文主要想让你明白什么？选出<b>最恰当</b>的一项：',
      speakQ:'读短文，这篇短文主要想让你明白什么？',
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:it.tip};
  }

  /* ================================================================
     ★ v4.330 六年级语文收口五考点：表达方式 / 详略 / 开放探究 /
        必背80首 / 文言文深化
     ------------------------------------------------------------
     全部沿用「读一段材料 → 四选一」结构，干扰项来自本题自带的真实错解，
     不凑数；带 variant（学情指纹）与 hint（病灶说明）。
  ================================================================ */

  /* ---------- 一、表达方式（express）：记叙 / 描写 / 说明 / 议论 / 抒情 ---------- */
  var EXP=[
    {k:'描写', s:'春风轻轻拂过柳梢，嫩绿的新芽像一个个好奇的小脑袋，探出头来张望着这个陌生的世界。',
     a:'描写', w:['记叙','抒情','说明'],
     tip:'满眼都是「拂过」「探出头」「张望」这类写样子、写动作的词，是在把画面描给你看——这是<b>描写</b>。看到「像小脑袋」就答「抒情」是混淆了：比喻是描写里的一种手法，不等于直接抒发情感。'},
    {k:'说明', s:'据统计，这种候鸟每年迁徙路程超过六千公里，途中要在三个湿地停歇补给。',
     a:'说明', w:['记叙','描写','议论'],
     tip:'「超过六千公里」「三个湿地」是在客观地介绍知识、列数字，没有讲故事也没有讲道理，这是<b>说明</b>。把它当成「记叙」是没分清——记叙要讲清一件事的经过，这里没有事件。'},
    {k:'议论', s:'这件事让我明白，诚信不是挂在嘴边的口号，而是落在每一件小事里的踏实。',
     a:'议论', w:['抒情','记叙','说明'],
     tip:'「诚信不是……而是……」是在亮观点、讲道理，这是<b>议论</b>。别被「让我明白」带偏答成「抒情」：抒情是直接抒发喜怒哀乐，这里是在推导一个结论。'},
    {k:'记叙', s:'妈妈悄悄把我的错题本翻到最后一页，那里写着一行小字：孩子，你已经很棒了。',
     a:'记叙', w:['描写','抒情','说明'],
     tip:'按事情发生的顺序讲了一件事（翻本子→看到字），是<b>记叙</b>。虽然有「悄悄」这样的词，但整体在叙述经过，不是专门描摹某个画面。'},
    {k:'抒情', s:'啊，故乡的月光！你是我梦里永远走不出的温柔。',
     a:'抒情', w:['描写','议论','记叙'],
     tip:'「啊」「你是我……温柔」直接把心里的情感喊出来，这是<b>抒情</b>。它不是在介绍月光（说明），也不是在讲道理（议论）。'}
  ];
  function genExpress(){
    var ok=EXP.filter(function(x){return x&&x.s&&x.a&&x.w&&x.w.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var uniq=[],seen={};
    function push(x){ if(x&&x!==it.a&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.w.forEach(push); uniq=uniq.slice(0,3); uniq.push(it.a);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);
    return {variant:it.k+'表达',tag:'表达方式',title:'判断表达方式',
      body:'<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
        '<span style="font-family:楷体,serif">'+esc(it.s)+'</span></div>',
      q:'<b>读上面这段话</b>，它主要运用了哪一种表达方式？',
      speakQ:'读这段话，它主要运用了哪一种表达方式？',
      opts:uniq, correct:uniq.indexOf(it.a), ans:it.a,
      hint:it.tip};
  }

  /* ---------- 二、详略（detail）：详写作用 / 详写判断 / 略写判断 ---------- */
  var DET=[
    {k:'详写作用', s:'运动会上，大多数项目都一带而过，唯独写小明那次——他在最后一百米摔倒了，膝盖擦破了皮，却咬着牙爬起来继续冲，直到冲过终点才瘫坐在地上。',
     q:'这段话对小明摔倒又爬起冲刺写得特别详细，这样写主要是为了什么？',
     a:'突出他摔倒不放弃、咬牙坚持的精神，点明文章要表扬的这种品质。',
     w:['交代这次运动会的比赛规则和得分办法。','说明那天的天气特别适合跑步。','把文章写长一点，凑够字数。'],
     tip:'前面说「大多数项目都一带而过」，唯独这一段细细写——作者就是想让这个瞬间「立」起来。详写永远是为<b>中心和人物精神</b>服务的，不是为了凑字数，也不是在讲比赛规则。'},
    {k:'详写判断', s:'刘老师带了我们三年。平日里怎么备课、怎么批改作业都略去不写，只详细写了那次我生病，她背着我从三楼一路跑到校医室，汗湿透了后背。',
     q:'这段话里，作者详写的是哪一部分？',
     a:'刘老师背生病「我」去校医室的那件事。',
     w:['刘老师带了「我们」三年这件事。','刘老师平日怎么备课、批改作业。','刘老师的身高和长相。'],
     tip:'「平日里怎么备课、批改作业都略去不写」是明说的略写，重点全压在「背我去校医室」这一个画面上——这是<b>详写</b>。其余的要么略写、要么根本没提。'},
    {k:'略写判断', s:'他从小爱吃糖，换牙时蛀了好几颗，后来在医生的指导下戒了糖、认真刷牙，如今一口牙又白又齐。其中戒糖的过程作者只用了一句话带过。',
     q:'这段话中，作者「略写」的是哪一部分？',
     a:'他戒糖、认真刷牙的具体过程。',
     w:['他从小爱吃糖这件事。','他换牙时蛀牙的结果。','他现在牙齿又白又齐的样子。'],
     tip:'「戒糖的过程只用一句话带过」——这就是<b>略写</b>的信号词。作者把笔墨省下来留给更想突出的内容；略写不等于不重要，而是不必展开。'}
  ];
  function genDetail(){
    var ok=DET.filter(function(x){return x&&x.s&&x.q&&x.a&&x.w&&x.w.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var uniq=[],seen={};
    function push(x){ if(x&&x!==it.a&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.w.forEach(push); uniq=uniq.slice(0,3); uniq.push(it.a);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);
    return {variant:it.k,tag:'详略得当',title:'判断详写与略写',
      body:'<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
        '<span style="font-family:楷体,serif">'+esc(it.s)+'</span></div>',
      q:'<b>读上面这段话：</b>'+it.q,
      speakQ:it.q,
      opts:uniq, correct:uniq.indexOf(it.a), ans:it.a,
      hint:it.tip};
  }

  /* ---------- 三、开放探究（explore）：合理推论 / 做法判断 / 探究设计 ---------- */
  var EXPLORE=[
    {k:'合理推论', s:'同一盆绿萝，放在南窗台的一周长高约 3 厘米，放在北屋的一周几乎没变化。',
     q:'根据这一现象，最合理的结论是？',
     a:'绿萝的生长需要充足的光照，南窗台光照更足，所以长得快。',
     w:['南窗台有魔法，能让植物长得更快。','北屋的墙有毒，把绿萝毒得长不动了。','绿萝不喜欢被移动，一动就停止生长。'],
     tip:'两组唯一不同的条件是「光照」，结果不同，自然推出光照是关键。把原因归结为「魔法」「墙有毒」是凭空想象，违反「只改一个条件」的探究常识。'},
    {k:'做法判断', s:'爷爷把淘米水、洗菜水攒起来浇花，说这样一年能省下不少自来水。',
     q:'爷爷的做法最值得提倡的原因是？',
     a:'一水多用、节约水资源，是简单可行的环保行为。',
     w:['淘米水比自来水更有营养，花长得更好。','花特别喜欢脏水，越脏长得越旺。','爷爷是舍不得花钱买水，才这么抠门。'],
     tip:'核心在「省下不少自来水」——这是<b>节约用水、循环利用</b>。把它理解成「花喜欢脏水」「爷爷抠门」都是误读，偏离了环保这个正价值导向。'},
    {k:'探究设计', s:'想弄清楚「哪种洗衣粉去污力更强」，小明用同样脏的两块白布，分别用两种洗衣粉按说明浸泡、搓洗相同时间后对比。',
     q:'小明的探究设计合理，关键在于他做到了？',
     a:'除洗衣粉不同外，其余条件（布料、污渍、浸泡搓洗时间）都保持一致。',
     w:['两种洗衣粉他都多放了一倍用量，去污才明显。','一块布用热水、一块用冷水，对比更强烈。','两块布他分别搓了五分钟和十分钟。'],
     tip:'对比实验的命门是<b>只变一个条件</b>。小明让布料、污渍、时间都相同，只换洗衣粉，结论才可靠。其余选项都在悄悄改多个条件，对比就失效了。'}
  ];
  function genExplore(){
    var ok=EXPLORE.filter(function(x){return x&&x.s&&x.q&&x.a&&x.w&&x.w.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var uniq=[],seen={};
    function push(x){ if(x&&x!==it.a&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.w.forEach(push); uniq=uniq.slice(0,3); uniq.push(it.a);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);
    return {variant:it.k,tag:'开放探究',title:'作出合理推断',
      body:'<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
        '<span style="font-family:楷体,serif">'+esc(it.s)+'</span></div>',
      q:'<b>读上面材料：</b>'+it.q,
      speakQ:it.q,
      opts:uniq, correct:uniq.indexOf(it.a), ans:it.a,
      hint:it.tip};
  }

  /* ---------- 四、必背80首（recite80）：给上句选正确下句 ---------- */
  var RECITE=[
    {k:'春夜喜雨', up:'随风潜入夜，', a:'润物细无声。', auth:'杜甫《春夜喜雨》',
     w:['当春乃发生。','城春草木深。','春风又绿江南岸。'],
     tip:'「随风潜入夜，润物细无声」写春雨默默滋润万物。干扰项「当春乃发生」是上一联，不是这一句的下句；其余两句出自别的诗。'},
    {k:'送杜少府', up:'海内存知己，', a:'天涯若比邻。', auth:'王勃《送杜少府之任蜀州》',
     w:['天涯共此时。','千里共婵娟。','风正一帆悬。'],
     tip:'「海内存知己，天涯若比邻」是王勃名句，写友情不受距离阻隔。干扰项「天涯共此时」「千里共婵娟」都出自写思念的名篇，但不是这一句的接续。'},
    {k:'游子吟', up:'谁言寸草心，', a:'报得三春晖。', auth:'孟郊《游子吟》',
     w:['意恐迟迟归。','游子身上衣。','慈母手中线。'],
     tip:'「谁言寸草心，报得三春晖」用小草报答春晖比喻儿女难报母爱。三个干扰项都来自同一首诗，但分别是前几句，不是这一句的下句。'},
    {k:'登鹳雀楼', up:'欲穷千里目，', a:'更上一层楼。', auth:'王之涣《登鹳雀楼》',
     w:['黄河入海流。','白日依山尽。','春风不度玉门关。'],
     tip:'「欲穷千里目，更上一层楼」含「站得高看得远」的哲理。前两个干扰项是同一首诗的前两联，但不是此句接续；最后一句出自《凉州词》。'},
    {k:'题西林壁', up:'不识庐山真面目，', a:'只缘身在此山中。', auth:'苏轼《题西林壁》',
     w:['远近高低各不同。','横看成岭侧成峰。','自缘身在最高层。'],
     tip:'「不识庐山真面目，只缘身在此山中」讲「当局者迷」。前两个干扰项是同一首诗的前联；「自缘身在最高层」出自王安石《登飞来峰》，最易混。'}
  ];
  function genRecite80(){
    var ok=RECITE.filter(function(x){return x&&x.up&&x.a&&x.auth&&x.w&&x.w.length;});
    if(!ok.length)return null;
    var it=pick(ok);
    var uniq=[],seen={};
    function push(x){ if(x&&x!==it.a&&!seen[x]){seen[x]=1;uniq.push(x);} }
    it.w.forEach(push); uniq=uniq.slice(0,3); uniq.push(it.a);
    if(uniq.length!==4)return null;
    uniq=shuffle(uniq);
    return {variant:it.k,tag:'必背古诗文',title:'诗句接龙 · '+it.auth,
      body:'<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
        '<span style="font-family:楷体,serif">'+esc(it.up)+'</span></div>',
      q:'<b>请把上句接续完整：</b>'+esc(it.up),
      speakQ:'请把上句接续完整：'+it.up,
      opts:uniq, correct:uniq.indexOf(it.a), ans:it.a,
      hint:it.tip};
  }

  /* ---------- 五、文言文深化（clwen2）：比小古文更长更难，含实词 / 句意 / 寓意 ---------- */
  var CLWEN2=[
    {篇:'《守株待兔》（节选）',
     正文:'宋人有耕者。田中有株，兔走触株，折颈而死。因释其耒而守株，冀复得兔。兔不可复得，而身为宋国笑。',
     注释:[['株','树桩。'],['走','跑，文中指兔子飞快地奔跑。'],['因','于是。'],['释','放下。'],['耒','农具，犁一类的东西。'],['冀','希望。']],
     译文:'宋国有个种田人。田里有个树桩，一只兔子跑过来撞上树桩，折断脖子死了。于是他放下农具守着树桩，希望再得到兔子。兔子当然不可能再得到，他自己却被宋国人笑话。',
     题:[
       {k:'实词', q:'文中「兔走触株」的「走」意思是？', a:'跑（文中指兔子飞快地奔跑）。', w:['走路','离开','死亡'],
        tip:'文言里「走」常指「跑」，不是今天的「步行」。兔子是「跑」撞上树桩才折颈而死，若理解成「走路」就平淡无奇，也说不通「触株」的力度。'},
       {k:'句意', q:'「因释其耒而守株」意思是？', a:'于是放下他的农具，守在树桩旁边。', w:['于是把树桩拔起来带走。','因为树桩挡路，他把农具放下。','他解释自己为什么要守树桩。'],
        tip:'「因」=于是，「释」=放下，「耒」=农具。整句是说种田人放下活不干、专门守树桩。干扰项把「释」误解成「解释」、把「因」当成「因为」，都是常见的实词误读。'},
       {k:'寓意', q:'这则寓言告诉我们什么道理？', a:'不能把偶然当成必然，妄想不劳而获，否则会闹笑话。', w:['兔子很笨，总会撞死在树桩上。','种田人很聪明，懂得等待机会。','树桩越多，兔子撞死得越多。'],
        tip:'故事的落点是「身为宋国笑」——白白等、不干活才是可笑处。寓意要落在「偶然≠必然、不能指望不劳而获」上，而不是替种田人说好话或怪兔子。'}
     ]},
    {篇:'《刻舟求剑》（节选）',
     正文:'楚人有涉江者，其剑自舟中坠于水。遽契其舟，曰：「是吾剑之所从坠。」舟止，从其所契者入水求之。舟已行矣，而剑不行，求剑若此，不亦惑乎！',
     注释:[['涉','渡，过。'],['遽','立刻，马上。'],['契','刻。'],['是','这，这里。'],['惑','糊涂，迷惑。']],
     译文:'楚国有个过江的人，他的剑从船上掉进水里。他立刻在船边刻了个记号，说：「我的剑是从这儿掉下去的。」船停了，他从刻记号的地方下水找剑。船已经走了，剑却没动，像这样找剑，不是很糊涂吗！',
     题:[
       {k:'实词', q:'「遽契其舟」的「契」意思是？', a:'刻（在船上做记号）。', w:['契约，合同。','放弃，丢掉。','修理，修补。'],
        tip:'「契」在这里是动词「刻」，跟今天的「契约」不同。他是在船舷上刻记号，不是签合同。'},
       {k:'寓意', q:'这则寓言讽刺了哪一种人？', a:'不顾情况变化、死守老办法，不知变通的人。', w:['剑掉得太快、捞不起来的人。','船夫开得太快的人。','水性太差、不敢下水的人。'],
        tip:'船在走、剑不动，记号早就偏移了。讽刺的是「情况变了还按老记号办事」的死板。干扰项都在纠结剑或船，没抓住「不知变通」这个核心。'}
     ]}
  ];
  function genClwen2(){
    var ok=CLWEN2.filter(function(a){return a&&a.篇&&a.正文&&a.注释&&a.译文&&a.题&&a.题.length;});
    if(!ok.length)return null;
    var art=pick(ok);
    var item=pick(art.题);
    if(!item||!item.a)return null;
    var ans=item.a;
    var uniq=[],seen={};
    function push(x){ if(x&&x!==ans&&!seen[x]){seen[x]=1;uniq.push(x);} }
    (item.w||[]).forEach(push); uniq=uniq.slice(0,3); uniq.push(ans);
    if(uniq.length!==4)return null;
    var noteHTML='<div style="background:#FFFDF5;border-left:4px solid #C8B98F;padding:10px 12px;line-height:2.1;font-size:16px;margin-bottom:8px">'+
      '<b>'+esc(art.篇)+'</b><br>'+
      '<span style="font-family:楷体,serif">'+esc(art.正文)+'</span>'+
      (art.注释&&art.注释.length ?
        '<div style="font-size:14px;color:#5a5348;margin-top:6px">'+
        art.注释.map(function(z){ return esc(z[0])+'：'+esc(z[1]); }).join('　')+
        '</div>' : '')+
      (art.译文 ? '<div style="font-size:14px;color:#5a5348;margin-top:6px"><b>译文：</b>'+esc(art.译文)+'</div>' : '')+
      '</div>';
    var kind=item.k||'内容理解';
    return {variant:kind,tag:'文言文深化',title:art.篇+' · '+kind,
      body:noteHTML,
      q:'<b>读文言文，回答问题：</b>'+item.q,
      speakQ:'读文言文，回答问题：'+item.q,
      opts:uniq, correct:uniq.indexOf(ans), ans:ans,
      hint:item.tip};
  }

  function gen(mode){
    var map={py:genPy,stroke:genStroke,radical:genRadical,order:genOrder,poly:genPoly,synant:genSynAnt,colloc:genCollocation,orderq:genOrderQ,reading:genReading,tongyin:genTongyin,xiangjin:genXiangjin,dictXy:genDictXy,dictRad:genDictRad,
              /* ★ v4.320 三年级语文断层五考点 */
              bianju:genBianju,jushi:genJushi,guanlian:genGuanlian,duanluo:genDuanluo,zuowen:genZuowen,
              /* ★ v4.321 四年级语文三考点 */
              xiuci:genXiuci,renwu:genRenwu,yingyong:genYingyong,deepreading:genDeepreading,xiaoguwen:genXiaoguwen,
              /* ★ v4.327 五年级语文三考点 */
              shendiao:genShendiao,jixu:genJixu,duhougan:genDuhougan,
              /* ★ v4.330 六年级语文收口五考点 */
              express:genExpress,detail:genDetail,explore:genExplore,recite80:genRecite80,clwen2:genClwen2};
    var fn=map[mode]; if(!fn)return null;
    for(var i=0;i<6;i++){ var q=fn(); if(q)return stampVariant(q,mode); }
    return null;
  }

  /* ★ v4.258：给"今日流程 / 闯关"这类自动判分场景用的出题入口。
     为什么要单独一个 —— order（笔顺）和 orderq（连词成句）本职是**操作型**题：
     一个是在 SVG 上用「逐笔写/连播」看的，一个是拖词块拼句的，它们根本没有
     四选一选项。自动流程的 adaptExtraQ 拿不到 options 就直接跳过，
     结果这两个题型永远进不了今日流程、练了也不计掌握度（实测 400 次抽样
     它们的 tag 一次都没出现）。
     这里给它们各出一个可判分的等价题，翻写成标准四选一：
       · 笔顺  → 「「住」的第 2 笔是什么？」
       · 连词成句 → 「下面哪一句排得对？」（正确语序 vs 三个语序错的排列）
     其余题型本来就有选项，原样返回。 */
  var SCORABLE_MAP={order:genOrderQuiz,orderq:genSentenceQuiz};
  function genScorable(mode){
    var fn=SCORABLE_MAP[mode];
    if(!fn)return gen(mode);
    for(var i=0;i<6;i++){ var q=fn(); if(q)return stampVariant(q,mode); }
    return null;
  }

  function render(mode,ce){
    stopSay();
    _appQHint='';   /* ★ v4.340 切回本模块原生题型时，清掉外部考点题的解析，避免串题 */
    var q=gen(mode);
    if(!q){
      _curQ={q:'这个题型暂时没有合适的内容',speakQ:'这个题型暂时没有合适的内容'};
      return wrap(mode,ce,'<div class="quiz-hint" style="font-size:16px;padding:20px 0">这个题型暂时没有合适的内容，换一个试试～</div>');
    }
    _pendingWord=q.orderWord||'';
    _curQ=q;
    var inner='';

    if(q.tag) inner+=tagChip(q.tag);
    if(q.title) inner+='<div style="font-weight:800;font-size:19px;color:var(--ink);margin:8px 0 4px">'+q.title+'</div>';
    if(q.body) inner+='<div class="kb-line" style="text-align:left;line-height:1.9;cursor:default">'+q.body+'</div>';

    if(q.svg){
      inner+=q.svg;
      inner+='<div id="ord-hint" class="quiz-hint" style="text-align:center;margin-top:8px"></div>';
      inner+='<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px">'+
        '<button class="btn btn-purple" data-act="write-step" style="min-height:44px;padding:8px 14px;font-size:15px">逐笔写</button>'+
        '<button class="btn btn-purple" data-act="write-play" style="min-height:44px;padding:8px 14px;font-size:15px">连播笔顺</button>'+
        '<button class="btn btn-blue" data-act="order-quiz" style="min-height:44px;padding:8px 14px;font-size:15px">考一考</button>'+
        '<button class="btn btn-ghost" data-act="write-all" style="min-height:44px;padding:8px 14px;font-size:15px">全部显示</button>'+
      '</div>';
    }

    inner+=qRowHTML(q.q);

    if(q.isSentence){
      /* 连词成句：答题区 + 词块池 + 工具条，全部由 chips 承载 */
      inner+=q.chips;
    }else if(q.opts&&q.opts.length){
      inner+= (q.tag==='阅读 · 短文') ? optGrid3HTML(q.opts,q.correct,q.ans) : optGridHTML(q.opts,q.correct,q.ans);
    }

    inner+=listenBtnHTML();

    var box=wrap(mode,ce,inner);
    setTimeout(paint,30);
    return box;
  }

  /* ★ v4.199：gen 必须暴露 —— 主程序 genFlowHanziQ() 判断 HanziExtra.gen 是否存在，
     不暴露就永远走老的两个题型（听音选字/看字选词），偏旁/笔顺/多音等永远出不来。 */
  return {modes:MODES, render:render, renderAppQ:renderAppQ, gen:gen, genScorable:genScorable, pySplitStd:pySplitStd};
})();
