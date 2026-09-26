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
  var MODES = {py:1,stroke:1,radical:1,order:1,poly:1,synant:1,colloc:1,orderq:1,reading:1,tongyin:1,xiangjin:1};
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
    try{ if(ok){ if(typeof addStar==='function')addStar(1); else if(typeof playStar==='function')playStar(); } }catch(e){}
    /* ★ v4.258：练习页答题也必须写能力值。
       以前这里只加星星 —— 孩子在识字练习页练几十题，DATA.power 一条都不长，
       能力雷达、薄弱题型识别、负反馈出题全都看不到这些数据（实测 6 题：power 0→0）。
       注意：这里只调 pwBump，不调 markCorrect —— 后者会累加 DATA.stats /
       DATA.todayQuiz / 每日流水，把自由练习混进"今日必做"的完成判定里，
       那是另一套口径，不能串。星星和士气的逻辑保持原样。 */
    try{
      if(typeof pwBump==='function'&&_curQ&&_curQ.variant){
        pwBump('hanzi',{variant:_curQ.variant,type:_curQ.variant},ok);
      }
    }catch(e){}
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
      hint:hintOf(q),
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
        }else{
          /* ★ 答错不直接给答案：只标红所选项，让孩子重想。
             正确答案放进错题本，去「错题重练 → 讲一讲」看解析。
             已排除的错误选项禁用，避免反复点同一个。 */
          try{ if(typeof playWrong==='function') playWrong(); }catch(e){}
          b.disabled=true;
          b.classList.add('bad');
          all.forEach(function(x){ if(x.getAttribute('data-correct')!=='1'){ x.disabled=true; } });
          fb('再看看～这个不对哦，换一个试试','#e8543f');
          say('再看看，这个不对哦，换一个试试','hanzi');
          collectWrongHint();
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
      }else{
        if(slot)slot.style.borderColor='#FF6B6B';
        try{ if(typeof playWrong==='function') playWrong(); }catch(e){}
        var badAt=1;
        for(var i=0;i<got.length;i++){ if(got[i]!==want[i]){ badAt=i+1; break; } }
        fb('再看看～第 '+badAt+' 个词不太对哦','#e8543f');
        say('再看看，第'+badAt+'个词语不太对','hanzi');
        collectWrongHint();
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
    var tmp=document.createElement('div'); tmp.innerHTML=render(_cur.mode,_cur.ce);
    var nb=tmp.querySelector('#hz-extra-box');
    if(nb&&host){ host.replaceChild(nb,box); paint(); }
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

  function gen(mode){
    var map={py:genPy,stroke:genStroke,radical:genRadical,order:genOrder,poly:genPoly,synant:genSynAnt,colloc:genCollocation,orderq:genOrderQ,reading:genReading,tongyin:genTongyin,xiangjin:genXiangjin};
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
  return {modes:MODES, render:render, gen:gen, genScorable:genScorable, pySplitStd:pySplitStd};
})();
