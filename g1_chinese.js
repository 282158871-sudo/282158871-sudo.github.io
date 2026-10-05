/* ★ v4.339 一年级语文考点引擎（自包含）
   结构对齐《10_一年级语文考点结构表_23考点.md》：8 板块 / 23 考点。
   key = 考点（登记单位）；考点内多问法叫 variant（衣裳），不单独登记。
   教材：统编 2024 修订新版一上（38 课）+ 部编版一下（37 课）。

   两条铁律：
   1) 能从现有数据算出的考点不手写题库 —— 拼音走 HanziExtra.pySplitStd + HANZI_LIB 的拼音字段；
      笔顺走 HANZI_ORDERTYPE。保证不超纲、答案唯一。
   2) 必须手写词库的考点（古诗/日积月累/量词/反义词），数据标注教材出处。 */
var G1Chinese = (function(){
  'use strict';

  /* ========== 通用工具 ========== */
  function rnd(n){ return Math.floor(Math.random()*n); }
  function pick(a){ return a[rnd(a.length)]; }
  function shuffle(a){
    var r=a.slice();
    for(var i=r.length-1;i>0;i--){ var j=rnd(i+1),t=r[i]; r[i]=r[j]; r[j]=t; }
    return r;
  }
  function esc0(s){ return String(s==null?'':s); }
  /* 取 n 个与 ans 不同的干扰项；excl 里的值即使是合法替代品也要排除
     （例：问「日加一笔变成什么」，干扰项不能再放 白/田/目，否则出现两个正确答案） */
  function distract(ans,pool,n,fb,excl){
    var A=esc0(ans),out=[],guard=0;
    excl=excl||[];
    while(out.length<n && guard<400){
      guard++;
      var v=esc0(pick(pool));
      if(!v||v===A) continue;
      if(excl.indexOf(v)>=0) continue;
      if(out.indexOf(v)<0) out.push(v);
    }
    fb=fb||['—','—','—'];
    for(var k=0;k<fb.length&&out.length<n;k++){
      var f=esc0(fb[k]);
      if(f&&f!==A&&out.indexOf(f)<0&&excl.indexOf(f)<0) out.push(f);
    }
    return out;
  }
  /* 组装标准题：4 选项、唯一正确答案 */
  function mk(o){
    var ans=esc0(o.ans);
    var ds=distract(ans,o.pool||[],3,o.fb,o.excl);
    var opts=shuffle([ans].concat(ds));
    return {
      tag:o.tag||'语文', variant:o.variant||'', q:o.q, body:o.body||'',
      speakQ:o.speakQ||o.q, opts:opts, correct:opts.indexOf(ans),
      ans:ans, hint:o.hint||'', wordChar:o.wordChar||''
    };
  }
  /* 当前册字池（延迟读 App 全局，规避加载顺序） */
  function cePool(){
    try{ if(typeof libByCe==='function'){ var l=libByCe().list||[]; if(l.length)return l; } }catch(e){}
    try{ if(typeof HANZI_LIB!=='undefined'&&HANZI_LIB&&HANZI_LIB.length) return HANZI_LIB; }catch(e){}
    return [];
  }
  function pyPool(){ return cePool().filter(function(h){ return h&&h[0]&&typeof h[1]==='string'&&h[1]; }); }
  function split(py){
    try{ if(typeof HanziExtra!=='undefined'&&HanziExtra.pySplitStd) return HanziExtra.pySplitStd(py); }catch(e){}
    return {base:String(py||''),tone:0,sheng:'',yun:'',isIntegral:false};
  }
  /* 按条件挑字：返回 {ch, py, sp} */
  function findChar(cond,tries){
    var P=pyPool(); if(!P.length) return null;
    tries=tries||80;
    for(var i=0;i<tries;i++){
      var h=pick(P), ch=h[0], py=h[1], sp=split(py);
      if(cond(ch,py,sp)) return {ch:ch,py:py,sp:sp};
    }
    return null;
  }
  function orderType(ch){
    try{ if(typeof HANZI_ORDERTYPE!=='undefined'&&HANZI_ORDERTYPE[ch]) return HANZI_ORDERTYPE[ch]; }catch(e){}
    return null;
  }

  /* ========== 数据 A · 汉语拼音 ========== */
  var SHENG23=['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'];
  var YUN_DAN=['a','o','e','i','u','v'];                                  /* 单韵母 6 */
  var YUN_FU=['ai','ei','ui','ao','ou','iu','ie','ve'];                   /* 复韵母 8（ve=üe） */
  var YUN_ER=['er'];                                                      /* 特殊韵母 1 */
  var YUN_QIAN=['an','en','in','un','vn'];                                /* 前鼻 5 */
  var YUN_HOU=['ang','eng','ing','ong'];                                  /* 后鼻 4 */
  var ZHENGTI16=['zhi','chi','shi','ri','zi','ci','si','yi','wu','yu','ye','yue','yuan','yin','yun','ying'];
  var ALL_YUN=YUN_DAN.concat(YUN_FU,YUN_ER,YUN_QIAN,YUN_HOU);
  /* 非整体认读的普通音节池（做干扰项用） */
  var NORMAL_SY=['ba','pa','ma','fa','da','ta','na','la','ge','ke','he','bo','po','mo','bi','pi','mi','bu','pu','mu',
                 'hu','gu','ku','di','ti','ni','li','du','tu','nu','lu','zuo','cuo','suo','zhuo','chuo','shuo',
                 'jia','qia','xia','hua','gua','kua','duo','tuo','nuo','luo','hao','kou','gou','dou','tai','mai'];
  /* 四线三格占格 —— 教材明确：ɑ o e u m n 中格；b f d t l 上中格；p 中下格（一上·汉语拼音2） */
  var ZHANGE=[
    {ls:['a','o','e','u','m','n'],ans:'中格'},
    {ls:['b','f','d','t','l','i','k','h'],ans:'上格和中格'},
    {ls:['p','g','q','y'],ans:'中格和下格'},
    {ls:['j'],ans:'上格、中格和下格'}
  ];
  var LETTER_PAIR=[['a','A'],['b','B'],['c','C'],['d','D'],['e','E'],['f','F'],['g','G'],['h','H'],['i','I'],['j','J'],
                   ['k','K'],['l','L'],['m','M'],['n','N'],['o','O'],['p','P'],['q','Q'],['r','R'],['s','S'],['t','T'],
                   ['u','U'],['v','V'],['w','W'],['x','X'],['y','Y'],['z','Z']];
  /* 轻声词 —— 一上·园地七「亲属称谓读好轻声」 */
  var QINGSHENG=['妈妈','爸爸','爷爷','奶奶','姐姐','弟弟','哥哥','妹妹','姑姑','叔叔','舅舅','姥姥',
                 '月亮','故事','头发','石头','萝卜','葡萄','风筝','尾巴','衣服','朋友','告诉','地方','窗户'];
  /* 形近/易混字母组 —— 教材强调 b-d-p-q */
  var CONF_LETTER=[{g:['b','d'],t:'下面哪个是弯向左边的？'},];
  var MIX_LETTER=[
    {a:'b',d:['d','p','q'],why:'b 的半圆朝右下方，d 的半圆朝左下方'},
    {a:'d',d:['b','p','q'],why:'d 的半圆朝左下方'},
    {a:'p',d:['q','b','d'],why:'p 的半圆在右上方'},
    {a:'q',d:['p','b','d'],why:'q 的半圆在左上方'}
  ];
  /* 易混韵母 —— 教材强调 ei-ie、ui-iu、üe-ün、ou-er */
  var MIX_YUN=[
    {a:'ei',d:['ie','er','ai'],w:'ei'},
    {a:'ie',d:['ei','er','ai'],w:'ie'},
    {a:'ui',d:['iu','ei','ue'],w:'ui'},
    {a:'iu',d:['ui','ie','ou'],w:'iu'},
    {a:'ou',d:['er','ao','uo'],w:'ou'},
    {a:'er',d:['ou','ei','re'],w:'er'},
    {a:'ve',d:['vn','ie','ei'],w:'üe'},
    {a:'vn',d:['ve','un','in'],w:'ün'}
  ];
  /* 声调符号表 */
  var TONE_MAP={a:'aāáǎà',o:'oōóǒò',e:'eēéěè',i:'iīíǐì',u:'uūúǔù',v:'üǖǘǚǜ'};
  function toneSym(ch,t){
    var m=TONE_MAP[ch];
    if(!m||t<1||t>4) return ch;
    return m.charAt(t);
  }
  /* 标调位置：有a标a→没a找oe→iu并列标在后 */
  function toneIndex(base){
    var i=base.indexOf('a'); if(i>=0) return i;
    var io=base.indexOf('o'), ie=base.indexOf('e');
    if(io>=0&&ie>=0) return Math.min(io,ie);
    if(io>=0) return io;
    if(ie>=0) return ie;
    var iu=base.indexOf('iu'); if(iu>=0) return iu+1;
    var ui=base.indexOf('ui'); if(ui>=0) return ui+1;
    for(var k=base.length-1;k>=0;k--){ if('aioeuv'.indexOf(base.charAt(k))>=0) return k; }
    return -1;
  }
  function markTone(base,tone){
    if(tone<1||tone>4) return base;
    var i=toneIndex(base);
    if(i<0) return base;
    var out='';
    for(var k=0;k<base.length;k++) out+=(k===i)?toneSym(base.charAt(k),tone):base.charAt(k);
    return out;
  }
  function yunShow(y){ return (y==='v')?'ü':(y==='ve')?'üe':(y==='vn')?'ün':y; }
  /* ========== 数据 B · 识字（多音字/同音字/形近字/部首表义/笔顺规则/字形结构/加减笔） ========== */
  /* 多音字（据词定音）—— 一上·园地七 + 一下易读错清单 */
  var DUOYIN=[
    {ch:'长',i:[{p:'cháng',w:'长江'},{p:'zhǎng',w:'长大'}]},
    {ch:'着',i:[{p:'zhe',w:'看着'},{p:'zháo',w:'着急'}]},
    {ch:'只',i:[{p:'zhī',w:'一只鸟'},{p:'zhǐ',w:'只有'}]},
    {ch:'少',i:[{p:'shǎo',w:'多少'},{p:'shào',w:'少年'}]},
    {ch:'乐',i:[{p:'lè',w:'快乐'},{p:'yuè',w:'音乐'}]},
    {ch:'地',i:[{p:'dì',w:'土地'},{p:'de',w:'高兴地唱'}]},
    {ch:'了',i:[{p:'le',w:'来了'},{p:'liǎo',w:'不了'}]},
    {ch:'空',i:[{p:'kōng',w:'天空'},{p:'kòng',w:'有空'}]},
    {ch:'觉',i:[{p:'jué',w:'觉得'},{p:'jiào',w:'睡觉'}]},
    {ch:'背',i:[{p:'bēi',w:'背包'},{p:'bèi',w:'后背'}]},
    {ch:'还',i:[{p:'hái',w:'还有'},{p:'huán',w:'还书'}]},
    {ch:'种',i:[{p:'zhòng',w:'种树'},{p:'zhǒng',w:'种子'}]},
    {ch:'数',i:[{p:'shǔ',w:'数一数'},{p:'shù',w:'数学'}]},
    {ch:'发',i:[{p:'fā',w:'发现'},{p:'fà',w:'头发'}]},
    {ch:'都',i:[{p:'dōu',w:'都是'},{p:'dū',w:'首都'}]},
    {ch:'好',i:[{p:'hǎo',w:'好人'},{p:'hào',w:'好奇'}]},
    {ch:'看',i:[{p:'kàn',w:'看见'},{p:'kān',w:'看门'}]},
    {ch:'干',i:[{p:'gān',w:'干净'},{p:'gàn',w:'干活'}]}
  ];
  /* 同音字选字填空 —— 教材经典 ★易错 */
  var TONGYIN=[
    {opts:['公','工'],s:'(　)园里有好看的花。',a:'公',w:'「公园」的「公」'},
    {opts:['公','工'],s:'爸爸是(　)人。',a:'工',w:'「工人」的「工」'},
    {opts:['在','再'],s:'我(　)家里写作业。',a:'在',w:'表示位置用「在」'},
    {opts:['在','再'],s:'我们明天(　)见。',a:'再',w:'表示又一次用「再」'},
    {opts:['有','友'],s:'我没(　)那么多书。',a:'有',w:'表示拥有用「有」'},
    {opts:['有','友'],s:'他是我的好朋(　)。',a:'友',w:'「朋友」的「友」'},
    {opts:['木','目'],s:'这是一块(　)头。',a:'木',w:'「木头」的「木」'},
    {opts:['木','目'],s:'老师的(　)光很慈祥。',a:'目',w:'「目光」的「目」'},
    {opts:['东','冬'],s:'太阳从(　)方升起。',a:'东',w:'「东方」的「东」'},
    {opts:['东','冬'],s:'(　)天会下雪。',a:'冬',w:'「冬天」的「冬」'},
    {opts:['青','清'],s:'山上有很多(　)草。',a:'青',w:'「青草」的「青」'},
    {opts:['青','清'],s:'小溪里的水很(　)。',a:'清',w:'「清水」的「清」'},
    {opts:['棵','颗'],s:'路边有一(　)大树。',a:'棵',w:'一棵树用「棵」'},
    {opts:['棵','颗'],s:'天上有许多(　)星星。',a:'颗',w:'一颗星星用「颗」'},
    {opts:['坐','座'],s:'请(　)下来。',a:'坐',w:'动作aye用「坐」'},
    {opts:['坐','座'],s:'远处有一(　)大山。',a:'座',w:'一座山用「座」'},
    {opts:['时','石'],s:'下雨(　)要带伞。',a:'时',w:'「时候」的「时」'},
    {opts:['时','石'],s:'河边有一块大(　)头。',a:'石',w:'「石头」的「石」'},
    {opts:['完','玩'],s:'我们一起去(　)吧。',a:'玩',w:'玩耍用「玩」'},
    {opts:['完','玩'],s:'作业做(　)了。',a:'完',w:'完成用「完」'},
    {opts:['刀','力'],s:'小明的(　)气很大。',a:'力',w:'「力气」的「力」'},
    {opts:['刀','力'],s:'我用小(　)削铅笔。',a:'刀',w:'「小刀」的「刀」'}
  ];
  /* 形近字选字填空 —— 教材 ★易错 */
  var XINGJIN=[
    {opts:['儿','几'],s:'你有(　)个好朋友？',a:'几',w:'问数量用「几」'},
    {opts:['力','刀'],s:'这把小(　)很锋利。',a:'刀',w:'小刀的「刀」'},
    {opts:['午','牛'],s:'爷爷家养了一头(　)。',a:'牛',w:'牛的一竖要出头'},
    {opts:['己','已'],s:'我自(　)会穿衣服。',a:'己',w:'自己的「己」'},
    {opts:['人','入'],s:'请大家走(　)教室。',a:'入',w:'进去用「入」'},
    {opts:['土','士'],s:'解放军的战(　)很勇敢。',a:'士',w:'战士的「士」'},
    {opts:['大','太'],s:'太阳(　)亮了。',a:'太',w:'太有一点'},
    {opts:['白','自'],s:'你有(　)己的想法吗？',a:'自',w:'自己的「自」里是目'},
    {opts:['开','升'],s:'五星红旗(　)起来了。',a:'升',w:'升旗的「升」'},
    {opts:['天','夫'],s:'今天的下雨(　)气很好。',a:'天',w:'天气的「天」'},
    {opts:['日','田'],s:'(　)出东方红。',a:'日',w:'日出的「日」要写得窄'},
    {opts:['见','贝'],s:'我看(　)一只小鸟。',a:'见',w:'看见的「见」'}
  ];
  /* 部首表义 —— 一上·园地六七「发现日字旁和女字旁所代表的意思」 */
  var RADMEAN=[
    {r:'氵',m:'和水有关',eg:'江、河、海、洗'},
    {r:'讠',m:'和说话有关',eg:'说、话、语、请'},
    {r:'扌',m:'和手的动作有关',eg:'打、拍、拉、抱'},
    {r:'艹',m:'和植物有关',eg:'草、花、苹、菜'},
    {r:'虫',m:'和虫子有关',eg:'蚂、蚁、蛇、蜻'},
    {r:'口',m:'和嘴巴有关',eg:'叫、吃、唱、问'},
    {r:'目',m:'和眼睛有关',eg:'眼、睛、看、眨'},
    {r:'忄',m:'和心情有关',eg:'快、情、怕、忙'},
    {r:'辶',m:'和走路有关',eg:'过、远、近、送'},
    {r:'亻',m:'和人有关',eg:'你、他、休、体'},
    {r:'日',m:'和太阳、时间有关',eg:'明、时、早、晚'},
    {r:'女',m:'和女性有关',eg:'妈、奶、姐、妹'},
    {r:'冫',m:'和寒冷有关',eg:'冷、冰、冬'},
    {r:'鸟',m:'和鸟类有关',eg:'鸡、鸭、鹅、鸦'},
    {r:'月',m:'和身体有关',eg:'肚、腿、朋、胖'},
    {r:'木',m:'和树木有关',eg:'树、林、松、桥'},
    {r:'纟',m:'和丝线、纺织有关',eg:'红、绿、纸'},
    {r:'饣',m:'和食物有关',eg:'饭、饱、饼'}
  ];
  /* 笔顺规则 7 条 —— 一上·园地一「先横后竖、先撇后捺」+ 园地六「从上到下、从左到右」 */
  var BISHUN_RULE=[
    {r:'先横后竖',eg:['十','干','丰','土'],w:'「十」先写横，再写竖'},
    {r:'先撇后捺',eg:['人','八','天','木','大'],w:'「人」先写撇，再写捺'},
    {r:'从上到下',eg:['三','云','才'],w:'「三」从上往下一横一横写'},
    {r:'从左到右',eg:['儿','林','明','好'],w:'「林」先写左边的木，再写右边的木'},
    {r:'先外后内',eg:['月','同','问'],w:'「月」先写外面的框'},
    {r:'先中间后两边',eg:['小','水','办'],w:'「小」先写中间的竖钩'},
    {r:'先里面再封口',eg:['日','田','回','国'],w:'「日」里面的横写完，最后写封口的横'}
  ];
  /* 易混笔画 ★ —— 一上·园地七「分辨弯钩和竖钩、撇折和竖折、竖弯钩和竖弯、斜钩和卧钩」 */
  var STROKE_CONFUSE={
    '竖钩':['竖弯钩','弯钩','竖提'],
    '竖弯钩':['竖钩','竖弯','斜钩'],
    '竖弯':['竖弯钩','竖提','横折'],
    '弯钩':['竖钩','斜钩','卧钩'],
    '斜钩':['卧钩','竖钩','弯钩'],
    '卧钩':['斜钩','竖弯钩','弯钩'],
    '撇折':['竖折','横撇','横折'],
    '竖折':['撇折','竖弯','横折'],
    '横折':['横钩','竖折','撇折'],
    '横折钩':['横折','横钩','竖折折钩'],
    '竖提':['竖钩','竖弯','横折'],
    '横斜钩':['横折钩','斜钩','横折弯钩']
  };
  /* 字形结构 */
  var ZISTRUCT=[
    {s:'独体字',c:['人','口','手','日','月','水','火','山','田','木','禾','大','小','上','下','中','天','牛','羊','鸟','马','虫','鱼','雨','门','白','刀','力','云','车','心','子','女','王','土','石','目','头','了','不','又']},
    {s:'左右结构',c:['明','林','江','河','比','和','你','他','好','妈','姐','妹','时','晚','听','叫','吃','红','绿','地','把','拉','桥','船','朋','脸','场','张','低']},
    {s:'上下结构',c:['草','花','字','尖','尘','只','青','春','星','雪','桌','写','前','关','多','号','苹','菜','家','爸','笑','笔']},
    {s:'半包围结构',c:['问','闪','间','过','这','边','还','近','远','画','风','匹']},
    {s:'全包围结构',c:['回','国','园','圆','四']}
  ];
  /* 加一笔 / 减一笔变新字 ★ */
  var ADD_ONE=[
    {b:'日',a:['目','白','田','甲','由','电','旧','旦']},
    {b:'口',a:['日','中']},
    {b:'木',a:['禾','本','术','未','末']},
    {b:'大',a:['天','太','犬','头']},
    {b:'人',a:['大','个']},
    {b:'十',a:['土','士','干','千']},
    {b:'二',a:['三','土','干']},
    {b:'三',a:['王']},
    {b:'目',a:['自']},
    {b:'米',a:['来']},
    {b:'了',a:['子']},
    {b:'乌',a:['鸟']},
    {b:'月',a:['用']},
    {b:'白',a:['自']},
    {b:'牛',a:['生']},
    {b:'云',a:['去']},
    {b:'止',a:['正']},
    {b:'王',a:['玉','主']}
  ];
  var SUB_ONE=[
    {b:'自',a:['白','目']},{b:'鸟',a:['乌']},{b:'天',a:['大']},{b:'来',a:['米']},
    {b:'本',a:['木']},{b:'用',a:['月']},{b:'去',a:['云']},{b:'公',a:['八']},
    {b:'电',a:['日']},{b:'白',a:['口']},{b:'田',a:['口','日']},{b:'子',a:['了']},
    {b:'生',a:['牛']},{b:'少',a:['小']},{b:'王',a:['三','土']},{b:'太',a:['大']}
  ];
  /* ========== 数据 C · 写字（易写错清单，出处：一上·第1/7单元「易写错的字」） ========== */
  var EASYWRONG=[
    {ch:'三',q:'写「三」字时，三横要怎么写？',a:'间距均匀，第三横最长',d:['三横都一样长','上长下短','间距随便']},
    {ch:'日',q:'写「日」字要注意什么？',a:'要写方正，中间短横起笔在左竖上',d:['要写扁一些','中间没有横','写成圆形']},
    {ch:'田',q:'写「田」字要按什么顺序？',a:'先外面再里面，最后封口',d:['先里面再外面','从上到下','先写中间的十']},
    {ch:'十',q:'写「十」字要注意什么？',a:'竖把横平均分，竖写在竖中线上',d:['横要比竖短','竖要偏左','先写竖再写横']},
    {ch:'月',q:'「月」字的第一笔是什么？',a:'竖撇，不是竖',d:['竖','横','点']},
    {ch:'头',q:'「头」字的最后一笔是什么？',a:'点，不是捺',d:['捺','横','撇']},
    {ch:'在',q:'「在」字里面被包围的部分是哪个字？',a:'土，不是工',d:['工','王','士']},
    {ch:'我',q:'「我」字的第五笔是什么？',a:'斜钩，不是竖提',d:['竖提','竖钩','卧钩']}
  ];

  /* ========== 数据 D · 词语 ========== */
  /* 反义词 —— 一上·第7单元字词盘点 */
  var ANTONYM=[['大','小'],['多','少'],['上','下'],['左','右'],['前','后'],['里','外'],['来','去'],
               ['黑','白'],['早','晚'],['远','近'],['高','矮'],['长','短'],['冷','热'],['开','关'],
               ['出','入'],['有','无'],['哭','笑'],['快','慢'],['弯','直'],['双','单'],['好','坏'],
               ['天','地'],['古','今'],['老','少'],['东','西'],['南','北'],['外','内'],['明','暗'],
               ['圆','扁'],['生','熟'],['反','正'],['分','合'],['深','浅'],['进','退'],['轻','重']];
  /* 近义词 —— 一上·第7单元「里-内 弯-曲 常常-经常」 */
  var SYNONYM=[['里','内'],['弯','曲'],['常常','经常'],['好看','漂亮'],['高兴','开心'],['朋友','伙伴'],
               ['美丽','漂亮'],['立刻','马上'],['渐渐','慢慢'],['明白','懂得'],['赶快','赶紧'],
               ['到处','处处'],['看见','看到'],['喜欢','喜爱'],['连忙','赶紧']];
  /* 量词搭配 ★ —— 一上/一下「量词积累」 */
  var LIANGCI=[
    {n:'牛',a:'头',o:['只','条','个']},{n:'马',a:'匹',o:['头','只','条']},
    {n:'鱼',a:'条',o:['头','个','朵']},{n:'小鸟',a:'只',o:['条','头','座']},
    {n:'花',a:'朵',o:['条','把','颗']},{n:'白云',a:'片',o:['条','颗','把']},
    {n:'大树',a:'棵',o:['只','条','座']},{n:'星星',a:'颗',o:['棵','片','条']},
    {n:'大桥',a:'座',o:['条','棵','片']},{n:'小河',a:'条',o:['座','只','片']},
    {n:'船',a:'只',o:['条','座','把']},{n:'书',a:'本',o:['个','张','把']},
    {n:'铅笔',a:'支',o:['个','把','本']},{n:'尺子',a:'把',o:['个','张','支']},
    {n:'橡皮',a:'块',o:['个','把','张']},{n:'老师',a:'位',o:['个',' Bare','名']},
    {n:'衣服',a:'件',o:['个','双','顶']},{n:'雨伞',a:'把',o:['件','个','张']},
    {n:'眼睛',a:'双',o:['个','张','对']},{n:'手',a:'双',o:['个','张','把']},
    {n:'井',a:'口',o:['个','条','座']},{n:'教室',a:'间',o:['个','座','所']},
    {n:'学校',a:'所',o:['个','间','座']},{n:'飞机',a:'架',o:['个','辆','条']},
    {n:'汽车',a:'辆',o:['架','条','座']},{n:'叶子',a:'片',o:['朵','条','颗']},
    {n:'尾巴',a:'条',o:['把','个','只']},{n:'月亮',a:'轮',o:['个','条','片']},
    {n:'红旗',a:'面',o:['个','张','条']},{n:'毛巾',a:'条',o:['张','块','把']}
  ];
  /* 修饰词搭配 ★ —— 一上·第7单元「修饰词积累」 */
  var XIUSHI=[
    {w:'月儿',a:'弯弯的',o:['圆圆的','绿绿的','黑黑的']},
    {w:'船',a:'小小的',o:['大大的','高高的','白白的']},
    {w:'星星',a:'闪闪的',o:['甜甜的','长长的','尖尖的']},
    {w:'天',a:'蓝蓝的',o:['红红的','弯弯的','平平的']},
    {w:'云朵',a:'雪白的',o:['弯弯的','黑黑的','高高的']},
    {w:'小草',a:'青青的',o:['白白的','长长的','圆圆的']},
    {w:'苹果',a:'红红的',o:['蓝蓝的','青青的','弯弯的']},
    {w:'太阳',a:'火红的',o:['雪白的','弯弯的','小小的']},
    {w:'河水',a:'清清的',o:['红红的','高高的','甜甜的']},
    {w:'衣裳',a:'暖和的',o:['凉凉的',' hard','尖尖的']},
    {w:'荷叶',a:'圆圆的',o:['尖尖的','弯弯的','长长的']},
    {w:'尾巴',a:'长长的',o:['圆圆的','甜甜的','青青的']},
    {w:'大山',a:'高高的',o:['白白的','甜甜的','平平的']},
    {w:'棉花',a:'雪白的',o:['青青的','弯弯的','圆圆的']},
    {w:'脸蛋',a:'红红的',o:['蓝蓝的','青青的','细细的']}
  ];
  /* 特殊词式 —— 一上/一下词语盘点 */
  var AABB=['开开心心','干干净净','高高兴兴','许许多多','漂漂亮亮','仔仔细细','明明白白','快快乐乐',
            '大大小小','多多少少','上上下下','来来往往','日日夜夜','风风雨雨','平平安安','大大方方',
            '认认真真','安安静静','说说笑笑','打打闹闹'];
  var ABB=['绿油油','红彤彤','黄澄澄','白花花','亮晶晶','黑乎乎','胖乎乎','静悄悄','慢吞吞','干巴巴',
           '水灵灵','笑哈哈','甜丝丝','胖墩墩'];
  var ABAB=['碧绿碧绿','雪白雪白','火红火红','金黄金黄','乌黑乌黑','湛蓝湛蓝','通红通红','漆黑漆黑'];
  /* 真 ABAC：自A自B / A来A去 式 */
  var ABAC=['自言自语','走来走去','飞来飞去','游来游去','跑来跑去','不知不觉','不闻不问'];
  /* 又A又B 式（不算 ABAC，单独一类，避免与 ABAC 正则 x[0]===x[2] 误判重叠） */
  var YOUYOU=['又大又红','又香又甜','又高又大','又细又长','又白又胖','又大又圆','又说又笑','又唱又跳'];
  var YOUYUE=[
    {t:'苹果又大又(　)。',a:'红',o:['香','甜','圆'],k:'又…又…'},
    {t:'弟弟又唱又(　)。',a:'跳',o:['跑','笑','走'],k:'又…又…'},
    {t:'雨越下越(　)。',a:'大',o:['小','黑','亮'],k:'越…越…'},
    {t:'天越来越(　)。',a:'黑',o:['白','红','绿'],k:'越…越…'},
    {t:'小树越长越(　)。',a:'高',o:['矮','低','细'],k:'越…越…'},
    {t:'小马越跑越(　)。',a:'快',o:['慢','远','近'],k:'越…越…'}
  ];
  var YIBIAN=[
    {t:'妹妹一边唱歌，一边(　)。',a:'跳舞',o:['睡觉','看书','跑步'],k:'一边…一边…'},
    {t:'要明天下雨，我们就(　)。',a:'不出去玩了',o:['去公园','去游泳','晒太阳'],k:'要是…就…'},
    {t:'一边走，一边(　)。',a:'唱歌',o:['躺着','睡着','坐着'],k:'一边…一边…'}
  ];
  var HENXX=[
    {t:'很多很多的(　)',a:'房子',o:['小河','大山','白云'],k:'很X很X'},
    {t:'很绿很绿的(　)',a:'树叶',o:['太阳','棉花','苹果'],k:'很X很X'},
    {t:'很红很红的(　)',a:'苹果',o:['小河','大树','雪花'],k:'很X很X'},
    {t:'很清很清的(　)',a:'河水',o:['大山','棉花','雪花'],k:'很X很X'}
  ];
  var KANYIYI=[{b:'看看',a:'看一看'},{b:'说说',a:'说一说'},{b:'走走',a:'走一走'},
               {b:'读读',a:'读一读'},{b:'讲讲',a:'讲一讲'},{b:'跑跑',a:'跑一跑'},{b:'听听',a:'听一听'}];
  /* 词语归类与分类 */
  var WORD_GROUP=[
    {g:'称呼人物',w:['你','我','他','我们','他们'],o:['左右','三个','上下']},
    {g:'数目',w:['一','二','三','四','五个'],o:['前后','爸爸','红色']},
    {g:'方位',w:['前','后','左','右','东','南','西','北'],o:['一二','爸爸','红色']},
    {g:'亲属称谓',w:['爸爸','妈妈','爷爷','奶奶','姐姐','弟弟'],o:['铅笔','火车','春夏']}
  ];
  var WORD_CLASS=[
    {g:'文具',w:['铅笔','尺子','橡皮','作业本','文具盒','转笔刀'],o:['黄瓜','汽车','牙膏','苹果']},
    {g:'蔬菜',w:['黄瓜','茄子','豆角','萝卜','土豆','南瓜'],o:['铅笔','飞机','肥皂','西瓜']},
    {g:'瓜果',w:['苹果','桃子','杏子','西瓜','梨','枣'],o:['牙膏','麻雀','南瓜','火车']},
    {g:'交通工具',w:['汽车','飞机','轮船','火车','自行车'],o:['黄瓜','毛巾','铅笔','白菜']},
    {g:'日用品',w:['牙膏','牙刷','肥皂','毛巾','脸盆'],o:['汽车','大象','香蕉','尺子']},
    {g:'动物',w:['猴子','兔子','大象','老虎','青蛙','小鸟'],o:['黄瓜','铅笔','飞机','萝卜']}
  ];
  /* ========== 数据 E · 句子 ========== */
  var JUSHI=[
    {k:'谁干什么',yes:['牛牛拍皮球。','妈妈织毛衣。','明明扫地。','老师改作业。','爷爷浇花。'],
     no:['江上有一座大桥。','弯弯的月儿像小船。','雨越下越大。','北京是我国的首都。']},
    {k:'什么地方有什么',yes:['江上有一座大桥。','天上有一架飞机。','河里有一群鸭子。','学校里有许多同学。','公园里有一片草地。'],
     no:['牛牛拍皮球。','北京是我国的首都。','弯弯的月儿像小船。','他的书包呢？']},
    {k:'打比方（什么像什么）',yes:['弯弯的月儿像小船。','闪闪的星星像宝石。','红红的脸蛋像苹果。','蓝蓝的天空像大海。'],
     no:['牛牛拍皮球。','雨越下越大。','你去北京吗？','河里有一群鸭子。']},
    {k:'表示事物变化（越…越…）',yes:['雨越下越大。','人越来越多。','小树越长越高。','小马越跑越快。'],
     no:['牛牛拍皮球。','弯弯的月儿像小船。','天上有一架飞机。','我们爱北京。']}
  ];
  var JUBU=[
    {s:'北京(　)我国的首都。',a:'是'},{s:'五星红旗(　)我国的国旗。',a:'是'},
    {s:'雨点儿(　)云彩里飘落下来。',a:'从'},{s:'小松鼠(　)树上跳下来。',a:'从'},
    {s:'树叶(　)树上飘落下来。',a:'从'},{s:'我们(　)北京。',a:'爱'},
    {s:'我们(　)五星红旗。',a:'爱'},{s:'我(　)一个好朋友。',a:'有'}
  ];
  var YUQI=[
    {s:'你去北京(　)？',a:'吗',w:'问事情，答案要回答是或不是'},
    {s:'我的书包(　)？',a:'呢',w:'问东西在哪儿'},
    {s:'他是你的朋友(　)？',a:'吧',w:'猜一猜的时候用「吧」'},
    {s:'你去上学(　)？',a:'吗',w:'问事情'},
    {s:'我的尺子(　)？',a:'呢',w:'问东西在哪儿'},
    {s:'今天要下雨(　)？',a:'吧',w:'表示猜想用「吧」'}
  ];
  var COUNT_SENT=[
    {t:'春天来了。小草绿了。小鸟唱起歌来。真好听！',a:'4'},
    {t:'我家有一只小猫。它很可爱。你喜欢它吗？',a:'3'},
    {t:'太阳出来了。天气暖洋洋的。我们去公园玩。公园里真热闹啊！',a:'4'},
    {t:'秋天到了。树叶黄了。一片片叶子落下来。',a:'3'},
    {t:'下雨了。雨点打在窗户上。真好听。',a:'3'},
    {t:'小公鸡和小鸭子一块儿出去玩。他们来到草地上。小公鸡吃得很欢。',a:'3'}
  ];
  var COUNT_PARA=[
    {t:'春天来了，小草绿了。\n\n小鸟在树上唱歌。它们很开心。\n\n我们在草地上做游戏。',a:'3'},
    {t:'我家门口有一棵小树。\n\n小树开花了，很香。\n\n我们都喜欢这棵小树。',a:'3'},
    {t:'下雨了。\n\n河水满了。\n\n小鱼在水里游来游去。\n\n真好看！',a:'4'},
    {t:'早上，太阳出来了。\n\n我去上学。路上遇见了同学。',a:'2'}
  ];
  /* ========== 数据 F · 阅读（短文取自一上/一下教材课文，保证不超纲） ========== */
  var SHORT_READ=[
    {t:'乌鸦喝水',body:'一只乌鸦口渴了，到处找水喝。乌鸦看见一个瓶子，瓶子里有水。可是瓶子里水不多，瓶口又小，乌鸦喝不着水。乌鸦看见旁边有许多小石子，想出办法来了。乌鸦把小石子一颗一颗地放进瓶子里。瓶子里的水渐渐升高，乌鸦就喝着水了。',
     qs:[{q:'乌鸦口渴了，到处找什么？',a:'水',o:['虫子','果子','米']},
         {q:'乌鸦为什么喝不着水？',a:'瓶子里水不多，瓶口又小',o:['瓶子里没有水','乌鸦不喜欢水','瓶子太高了']},
         {q:'乌鸦想出了什么办法？',a:'把小石子放进瓶子里',o:['把瓶子推倒','找别的地方','等下雨']},
         {q:'把石子放进去以后，水怎么样了？',a:'渐渐升高',o:['变少了','没有了','变凉了']}]},
    {t:'雪地里的小画家',body:'下雪啦，下雪啦！雪地里来了一群小画家。小鸡画竹叶，小狗画梅花，小鸭画枫叶，小马画月牙。不用颜料不用笔，几步就成一幅画。青蛙为什么没参加？他在洞里睡着啦。',
     qs:[{q:'雪地里来了谁？',a:'一群小画家',o:['一群小鸟','一群小猫','一群小猪']},
         {q:'小狗画的是什么？',a:'梅花',o:['竹叶','枫叶','月牙']},
         {q:'小鸭画的是什么？',a:'枫叶',o:['竹叶','梅花','月牙']},
         {q:'为什么青蛙没参加？',a:'他在洞里睡着了',o:['他生病了','他搬家了','他去别处玩了']}]},
    {t:'小公鸡和小鸭子',body:'小公鸡和小鸭子一块儿出去玩。他们来到草地上。小公鸡找到了许多虫子，吃得很欢。小鸭子捉不到虫子，急得直哭。小公鸡看见了，捉到虫子就给小鸭子吃。',
     qs:[{q:'谁找到了许多虫子？',a:'小公鸡',o:['小鸭子','小鸟','小狗']},
         {q:'小鸭子为什么急得直哭？',a:'捉不到虫子',o:['走丢了','下雨了','太累了']},
         {q:'最后小公鸡是怎么做的？',a:'把虫子给小鸭子吃',o:['自己全吃了','回家了','叫妈妈']},
         {q:'他们先来到什么地方？',a:'草地上',o:['河里','山上','树上']}]},
    {t:'要下雨了',body:'小白兔在山坡上割草。他直起身子，伸了伸腰。这时候，一只小燕子从他头上飞过。小白兔大声喊：「燕子，燕子，你为什么飞得这么低呀？」燕子说：「要下雨了，空气很潮湿，虫子的翅膀沾了小水珠，飞不高。我正忙着捉虫子呢！」',
     qs:[{q:'小白兔在山坡上做什么？',a:'割草',o:['捉虫','睡觉','跑步']},
         {q:'谁从小白兔头上飞过？',a:'小燕子',o:['小鸟','蝴蝶','蜻蜓']},
         {q:'燕子为什么飞得低？',a:'要下雨了，虫子飞不高',o:['它累了','它迷路了','它在玩']},
         {q:'空气怎么样时虫子飞不高？',a:'很潮湿',o:['很干燥','很热','很冷']}]}
  ];
  /* ========== 数据 G · 积累（古诗 / 课文原文 / 日积月累） ========== */
  var GUSHI=[
    {t:'咏鹅',a:'唐 · 骆宾王',l:['鹅，鹅，鹅，','曲项向天歌。','白毛浮绿水，','红掌拨清波。'],ce:'一上 · 语文园地一'},
    {t:'画',a:'唐 · 王维',l:['远看山有色，','近听水无声。','春去花还在，','人来鸟不惊。'],ce:'一上 · 语文园地'},
    {t:'悯农（其二）',a:'唐 · 李绅',l:['锄禾日当午，','汗滴禾下土。','谁知盘中餐，','粒粒皆辛苦。'],ce:'一上 · 语文园地'},
    {t:'古朗月行（节选）',a:'唐 · 李白',l:['小时不识月，','呼作白玉盘。','又疑瑶台镜，','飞在青云端。'],ce:'一上 · 语文园地'},
    {t:'静夜思',a:'唐 · 李白',l:['床前明月光，','疑是地上霜。','举头望明月，','低头思故乡。'],ce:'一下 · 课文8'},
    {t:'春晓',a:'唐 · 孟浩然',l:['春眠不觉晓，','处处闻啼鸟。','夜来风雨声，','花落知多少。'],ce:'一下 · 背诵'},
    {t:'赠汪伦',a:'唐 · 李白',l:['李白乘舟将欲行，','忽闻岸上踏歌声。','桃花潭水深千尺，','不及汪伦送我情。'],ce:'一下 · 背诵'},
    {t:'寻隐者不遇',a:'唐 · 贾岛',l:['松下问童子，','言师采药去。','只在此山中，','云深不知处。'],ce:'一下 · 背诵'},
    {t:'池上',a:'唐 · 白居易',l:['小娃撑小艇，','偷采白莲回。','不解藏踪迹，','浮萍一道开。'],ce:'一下 · 课文12'},
    {t:'小池',a:'宋 · 杨万里',l:['泉眼无声惜细流，','树阴照水爱晴柔。','小荷才露尖尖角，','早有蜻蜓立上头。'],ce:'一下 · 课文12'},
    {t:'画鸡',a:'明 · 唐寅',l:['头上红冠不用裁，','满身雪白走将来。','平生不敢轻言语，','一叫千门万户开。'],ce:'一下 · 语文园地'}
  ];
  var KEWEN=[
    {t:'金木水火土',l:['一二三四五，','金木水火土。','天地分上下，','日月照今古。'],ce:'一上 · 识字2'},
    {t:'对韵歌',l:['云对雨，雪对风，','花对树，鸟对虫。','山清对水秀，','柳绿对桃红。'],ce:'一上 · 识字5'},
    {t:'秋天',l:['天气凉了，树叶黄了，','一片片叶子从树上落下来。','天空那么蓝，那么高。','一群大雁往南飞。'],ce:'一上 · 阅读1'},
    {t:'小小的船',l:['弯弯的月儿小小的船，','小小的船儿两头尖。','我在小小的船里坐，','只看见闪闪的星星蓝蓝的天。'],ce:'一上 · 阅读5'},
    {t:'影子',l:['影子在前，影子在后，','影子常常跟着我，','就像一条小黑狗。','影子在左，影子在右，','影子常常陪着我，','它是我的好朋友。'],ce:'一上 · 阅读6'},
    {t:'两件宝',l:['人有两件宝，','双手和大脑。','双手会做工，','大脑会思考。','用手又用脑，','才能有创造。'],ce:'一上 · 阅读7'},
    {t:'比尾巴',l:['谁的尾巴长？','谁的尾巴短？','谁的尾巴好像一把伞？','猴子的尾巴长。','兔子的尾巴短。','松鼠的尾巴好像一把伞。'],ce:'一上 · 阅读8'},
    {t:'江南',l:['江南可采莲，','莲叶何田田。','鱼戏莲叶间。'],ce:'一上 · 阅读2'},
    {t:'四季',l:['草芽尖尖，他对小鸟说：','我是春天。','荷叶圆圆，他对青蛙说：','我是夏天。'],ce:'一上 · 阅读4'},
    {t:'升国旗',l:['五星红旗，我们的国旗。','国歌声中，徐徐升起。','迎风飘扬，多么美丽。','向着国旗，我们立正。'],ce:'一上 · 识字8'}
  ];
  var RIJI=[
    {t:'一年之计在于春',a:'一日之计在于晨。',ce:'一上 · 语文园地'},
    {t:'一寸光阴一寸金',a:'寸金难买寸光阴。',ce:'一上 · 语文园地'},
    {t:'前人栽树',a:'后人乘凉。',ce:'一上 · 语文园地'},
    {t:'千里之行',a:'始于足下。',ce:'一上 · 语文园地'},
    {t:'百尺竿头',a:'更进一步。',ce:'一上 · 语文园地'},
    {t:'种瓜得瓜',a:'种豆得豆。',ce:'一上 · 语文园地'},
    {t:'朝霞不出门',a:'晚霞行千里。',ce:'一下 · 语文园地'},
    {t:'有雨山戴帽',a:'无雨半山腰。',ce:'一下 · 语文园地'},
    {t:'早晨下雨当日晴',a:'晚上下雨到天明。',ce:'一下 · 语文园地'},
    {t:'蚂蚁搬家蛇过道',a:'大雨不久要来到。',ce:'一下 · 语文园地'},
    {t:'竹篮打水',a:'一场空。',ce:'一下 · 语文园地'},
    {t:'芝麻开花',a:'节节高。',ce:'一下 · 语文园地'},
    {t:'十五个吊桶打水',a:'七上八下。',ce:'一下 · 语文园地'},
    {t:'不知则问',a:'不能则学。',ce:'一下 · 语文园地'},
    {t:'一日无书',a:'百事荒芜。',ce:'一下 · 语文园地'},
    {t:'读万卷书',a:'行万里路。',ce:'一下 · 语文园地'}
  ];
  /* ========== 数据 H · 表达 ========== */
  var KOUYU=[
    {s:'在图书馆看书，应该怎样说话？',a:'小声说，不要打扰别人',o:['大声说','边跑边喊','不用说话就大声笑']},
    {s:'上讲台给同学讲故事，应该怎样说话？',a:'大声说，让大家听得见',o:['小声说','悄悄说','不出声']},
    {s:'给别人打电话，开头应该说什么？',a:'您好，请问××在家吗',o:['喂，你是谁','快叫你妈','直接说事']},
    {s:'向同桌借橡皮，应该怎么说？',a:'我可以借你的橡皮用一下吗',o:['把橡皮给我','拿来','我要用']},
    {s:'借了别人的东西用完以后，要说什么？',a:'谢谢你',o:['不还了','再见','知道了']},
    {s:'向全班介绍自己，下面哪一句不合适？',a:'我不喜欢你们',o:['大家好，我叫小明','我今年七岁了','我喜欢画画']}
  ];
  /* ========== 出题器 ========== */
  var GEN={};
  /* 变体调度：逐个试，取第一个能出出来的 */
  function tryGen(fns,tries){
    tries=tries||16;
    for(var i=0;i<tries;i++){
      try{ var q=pick(fns)(); if(q) return q; }catch(e){}
    }
    return null;
  }
  function vToU(s){ return String(s).replace(/v/g,'ü'); }

  /* ===== A1pyRead 拼音认读与书写 ===== */
  var YUN_CAT=[
    {k:'单韵母',l:YUN_DAN,ot:YUN_FU.concat(YUN_ER,YUN_QIAN,YUN_HOU)},
    {k:'复韵母',l:YUN_FU,ot:YUN_DAN.concat(YUN_ER,YUN_QIAN,YUN_HOU)},
    {k:'特殊韵母',l:YUN_ER,ot:YUN_DAN.concat(YUN_FU,YUN_QIAN,YUN_HOU)},
    {k:'前鼻韵母',l:YUN_QIAN,ot:YUN_DAN.concat(YUN_FU,YUN_ER,YUN_HOU)},
    {k:'后鼻韵母',l:YUN_HOU,ot:YUN_DAN.concat(YUN_FU,YUN_ER,YUN_QIAN)}
  ];
  var ZHANGE_ANS=['中格','上格和中格','中格和下格','上格、中格和下格'];
  GEN.A1pyRead=function(){
    var vs=[
      /* 韵母归类 ★易混 */
      function(){
        var c=pick(YUN_CAT), y=pick(c.l);
        return mk({tag:'拼音 · 认读',variant:'韵母归类',q:'下面哪个是'+c.k+'？',
          ans:yunShow(y),pool:c.ot.map(yunShow),hint:'单韵母6个：a o e i u ü；复韵母8个里有 ai ei ui ao ou iu ie üe；前鼻 an en in un ün；后鼻 ang eng ing ong。'});
      },
      /* 整体认读判定 */
      function(){
        var a=pick(ZHENGTI16);
        return mk({tag:'拼音 · 认读',variant:'整体认读',q:'下面哪个是整体认读音节？',
          ans:a,pool:NORMAL_SY,hint:'整体认读音节一共 16 个：zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying，不用拼，直接读。'});
      },
      /* 平舌 / 翘舌 ★ */
      function(){
        var isq=rnd(2);
        var c=findChar(function(ch,py,sp){
          var s=sp.sheng;
          if(isq) return s==='zh'||s==='ch'||s==='sh'||s==='r';
          return s==='z'||s==='c'||s==='s';
        });
        if(!c) return null;
        return mk({tag:'拼音 · 认读',variant:'平翘舌音',q:'「'+c.ch+'」('+c.py+') 是'+ (isq?'翘舌音':'平舌音') +'吗？它的声母是？',
          ans:c.sp.sheng,pool:['z','c','s','zh','ch','sh','r','y','w'],wordChar:c.ch,
          hint:'翘舌音：zh ch sh r；平舌音：z c s。'});
      },
      /* 前鼻 / 后鼻韵 ★ */
      function(){
        var ish=rnd(2);
        var c=findChar(function(ch,py,sp){
          var y=sp.yun;
          return ish ? YUN_HOU.indexOf(y)>=0 : YUN_QIAN.indexOf(y)>=0;
        });
        if(!c) return null;
        return mk({tag:'拼音 · 认读',variant:'前后鼻韵',q:'「'+c.ch+'」('+c.py+') 的韵母属于哪一类？',
          ans:ish?'后鼻韵母':'前鼻韵母',pool:['前鼻韵母','后鼻韵母','单韵母','复韵母'],wordChar:c.ch,
          hint:'前鼻韵母 an en in un ün；后鼻韵母 ang eng ing ong。'});
      },
      /* 易混韵母 ei-ie / ui-iu / üe-ün / ou-er ★★ */
      function(){
        var m=pick(MIX_YUN);
        return mk({tag:'拼音 · 认读',variant:'易混韵母',q:'下面哪个韵母是 '+m.w+' ？',
          ans:m.w,pool:m.d,hint:'注意看字母顺序：ei—ie、ui—iu、ou—er，念法完全不一样。'});
      },
      /* 形近字母 b-d-p-q — 教材强调 ★★ */
      function(){
        var m=pick(MIX_LETTER);
        return mk({tag:'拼音 · 认读',variant:'形近字母',q:'下面哪个是声母「'+m.a+'」？',
          ans:m.a,pool:m.d,hint:m.why+'。'});
      },
      /* 四线三格占格 */
      function(){
        var z=pick(ZHANGE), l=pick(z.ls);
        return mk({tag:'拼音 · 书写',variant:'占格',q:'字母「'+l+'」在四线三格里写在哪些格子？',
          ans:z.ans,pool:ZHANGE_ANS,wordChar:l,
          hint:'ɑ o e u m n 只占中格；b f d t l i k h 占上格和中格；p g q y 占中格和下格；j 三格都占。'});
      },
      /* 大小写字母表 — 一下·园地一 必考必会 */
      function(){
        var p=pick(LETTER_PAIR);
        return rnd(2)
          ? mk({tag:'拼音 · 认读',variant:'字母大小写',q:'小写字母「'+p[0]+'」的大写字母是哪个？',ans:p[1],pool:['B','D','P','Q','G','R','E','F','N','U'],hint:'汉语拼音字母表和英文字母表写法一样，读音不同。'})
          : mk({tag:'拼音 · 认读',variant:'字母大小写',q:'大写字母「'+p[1]+'」对应的小写字母是哪个？',ans:p[0],pool:['b','d','p','q','g','a','e','i','u','n'],hint:'汉语拼音字母表和英文字母表写法一样，读音不同。'});
      },
      /* 数一数 / 认声母韵母（保底，永远能出） */
      function(){
        return rnd(2)
          ? mk({tag:'拼音 · 认读',variant:'声母表',q:'汉语拼音一共有多少个声母？',ans:'23',pool:['21','24','26','16'],hint:'背一背声母表：b p m f d t n l g k h j q x zh ch sh r z c s y w，一共 23 个。'})
          : mk({tag:'拼音 · 认读',variant:'整体认读数',q:'整体认读音节一共有多少个？',ans:'16',pool:['23','24','6','8'],hint:'zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying，一共 16 个。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== A2pySpell 音节拼读 ===== */
  GEN.A2pySpell=function(){
    var vs=[
      /* 两拼 / 三拼 ★ */
      function(){
        var c=findChar(function(ch,py,sp){ return sp.base.length>=3; });
        if(!c) return null;
        var y=c.sp.yun;
        var is3=(y.length>=2 && 'iuv'.indexOf(y.charAt(0))>=0);
        return mk({tag:'拼音 · 拼读',variant:'两拼三拼',q:'「'+c.ch+'」('+c.py+') 这个音节是几拼？',
          ans:is3?'三拼音节':'两拼音节',pool:['两拼音节','三拼音节','整体认读音节','零声母音节'],wordChar:c.ch,
          hint:'声母 + 韵母是两拼；声母 + 介母 + 韵母是三拼。'});
      },
      /* 找介母 ★ */
      function(){
        var c=findChar(function(ch,py,sp){
          var y=sp.yun;
          return y.length>=2 && 'iuv'.indexOf(y.charAt(0))>=0;
        });
        if(!c) return null;
        return mk({tag:'拼音 · 拼读',variant:'找介母',q:'三拼音节「'+c.ch+'」('+c.py+') 的介母是哪个？',
          ans:vToU(c.sp.yun.charAt(0)),pool:['a','o','e','i','u','ü'],wordChar:c.ch,
          hint:'三拼音节＝声母＋介母＋韵母，中间的 i u ü 就是介母。'});
      },
      /* 零声母 */
      function(){
        var c=findChar(function(ch,py,sp){ return !sp.sheng && sp.base.length>0; });
        if(!c) return null;
        return mk({tag:'拼音 · 拼读',variant:'零声母',q:'「'+c.ch+'」('+c.py+') 这个音节有：',
          ans:'只有韵母，没有声母',pool:['只有声母，没有韵母','声母韵母都有','什么也没有'],wordChar:c.ch,
          hint:'像 āi é ài 这样只有韵母、没有声母的音节叫零声母音节。'});
      },
      /* 轻声 ★ */
      function(){
        var w=pick(QINGSHENG);
        return mk({tag:'拼音 · 拼读',variant:'轻声',q:'「'+w+'」这个词里，读轻声的是第几个字？',
          ans:'第二个字',pool:['第一个字','两个字都不是','两个字都是'],wordChar:w.charAt(0),
          hint:'叠词的后一个字、亲属称呼的后一个字，常常读得又轻又短，叫轻声。'});
      },
      /* 看拼音选汉字 / 看字选拼音（保底） */
      function(){
        var c=findChar(function(){ return true; });
        if(!c) return null;
        if(rnd(2)){
          var same=findChar(function(ch,py,sp){ return sp.base===c.sp.base && ch!==c.ch; });
          var pool=cePool().map(function(h){return h[0];});
          if(same) pool=pool.concat([same.ch]);
          return mk({tag:'拼音 · 拼读',variant:'看拼音选字',q:'下面哪个字读 '+c.py+' ？',ans:c.ch,pool:pool,wordChar:c.ch,hint:'先拼读音节，再想一想是哪个字。'});
        }
        var pool2=pyPool().map(function(h){return h[1];});
        return mk({tag:'拼音 · 拼读',variant:'看字选拼音',q:'「'+c.ch+'」的读音是哪个？',ans:c.py,pool:pool2,wordChar:c.ch,hint:'注意声母韵母和声调要都对。'});
      }
    ];
    return tryGen(vs);
  };

  /* ü 音节表：——★ 一上 280 个生字里【没有】j/q/x+ü、y+ü 的字（实测只有 女nǚ、绿lǜ），
     所以这两类最经典的拼写坑题不能依赖字库，改用拼音教学本身的音节出题，完全在教材范围内。 */
  var U_JQX=['ju','qu','xu','jue','que','xue','juan','quan','xuan','jun','qun','xun'];
  var U_Y=['yu','yue','yuan','yun'];
  var U_NL=['nǚ','lǜ'];
  var U_PLAIN=['zu','gu','ku','hu','lu','cu','su','zhu','chu','shu','ru'];

  /* ===== A3pyRule 拼写规则（全是易错 ★★） ===== */
  function readToneCN(t){ return ['第一声','第二声','第三声','第四声','轻声'][t]||'轻声'; }
  GEN.A3pyRule=function(){
    var vs=[
      /* 标调位置：有a标a，没a找o e */
      function(){
        var c=findChar(function(ch,py,sp){
          if(sp.tone<1||sp.tone>4) return false;
          return sp.base.indexOf('a')>=0 || sp.base.indexOf('o')>=0 || sp.base.indexOf('e')>=0;
        });
        if(!c) return null;
        var idx=toneIndex(c.sp.base);
        if(idx<0) return null;
        return mk({tag:'拼音 · 拼写规则',variant:'标调位置',q:'「'+c.ch+'」的拼音写作 '+c.py+'，它的声调标在哪个字母上？',
          ans:vToU(c.sp.base.charAt(idx)),pool:['a','o','e','i','u','ü'].map(vToU),wordChar:c.ch,
          hint:'标调口诀：有 a 不放过，没 a 找 o、e。'});
      },
      /* i u 并列标在后 ★★ */
      function(){
        var c=findChar(function(ch,py,sp){
          return sp.tone>=1 && sp.tone<=4 && (sp.base.indexOf('iu')>=0||sp.base.indexOf('ui')>=0);
        });
        if(!c) return null;
        var iui=c.sp.base.indexOf('iu'), iui2=c.sp.base.indexOf('ui');
        var lies=(iui>=0)||(iui2>=0);
        if(!lies) return null;
        return mk({tag:'拼音 · 拼写规则',variant:'iu并列标后',q:'「'+c.ch+'」写作 '+c.py+'，i 和 u 并列时声调标在哪儿？',
          ans:vToU(c.sp.base.charAt(toneIndex(c.sp.base))),pool:['i','u','a','o'],wordChar:c.ch,
          hint:'i u 并列标在后：谁在后面就标在谁头上。'});
      },
      /* i 上标调去点 ★★ */
      function(){
        return mk({tag:'拼音 · 拼写规则',variant:'i去点',q:'i 标上声调的时候，要怎么做？',
          ans:'去掉上面的点',pool:['点照样留着','再加一个点','把点写在下面'],
          hint:'i 戴上声调帽子就要把点摘掉：ī í ǐ ì。'});
      },
      /* ü 遇 j q x 去两点 ★★（改用教学音节，不再依赖字库） */
      function(){
        var sy=pick(U_JQX);
        return mk({tag:'拼音 · 拼写规则',variant:'ü遇jqx去点',q:'「'+sy+'」这个音节里的 u，实际读什么？',
          ans:'ü',pool:['u','uo','un','ou'],wordChar:sy.charAt(0),
          hint:'小 ü 见到 j q x，去掉两点还读 ü。'});
      },
      /* ü 遇 y 去两点 ★★ */
      function(){
        var sy=pick(U_Y);
        return mk({tag:'拼音 · 拼写规则',variant:'ü遇y去点',q:'下面哪个音节里的 u，实际读音是 ü？',
          ans:sy,pool:U_PLAIN,wordChar:sy.charAt(0),
          hint:'小 ü 见到 y，也要去掉两点：yu yue yuan yun。'});
      },
      /* n l 后的 ü 保留两点 ★★ */
      function(){
        var sy=pick(U_NL);
        return mk({tag:'拼音 · 拼写规则',variant:'nl后ü保留',q:'下面哪个音节里，ü 上的两点不能去掉？',
          ans:sy,pool:U_JQX.concat(U_Y),
          hint:'只有碰到 j q x y 才去掉两点；碰上 n l 一定要留着：nǚ、lǜ。'});
      },
      /* 标调口诀（保底） */
      function(){
        return mk({tag:'拼音 · 拼写规则',variant:'标调口诀',q:'标调的时候「i u 并列」应该怎么办？',
          ans:'谁在后面标谁',pool:['永远标 i','永远标 u','两个都标'],
          hint:'口诀：i u 并列标在后。'});
      }
    ];
    return tryGen(vs);
  };
  /* ===== B1ziYin 字音辨析 ===== */
  GEN.B1ziYin=function(){
    var vs=[
      /* 多音字据词定音 ★★ */
      function(){
        var d=pick(DUOYIN), it=pick(d.i);
        var others=[];
        d.i.forEach(function(x){ if(x.p!==it.p) others.push(x.p); });
        var pool=others.concat(['zhāo','zhào','zhī','zhí','lè','yuè','de','dì','le','liǎo']);
        return mk({tag:'字音 · 多音字',variant:'据词定音',q:'「'+it.w+'」里的「'+d.ch+'」读什么？',
          ans:it.p,pool:pool,wordChar:d.ch,
          hint:'「'+d.ch+'」是多音字，要看它在词语里的意思来定音。'});
      },
      /* 同音字识别 */
      function(){
        var c=findChar(function(){ return true; });
        if(!c) return null;
        var same=findChar(function(ch,py,sp){ return sp.base===c.sp.base && ch!==c.ch; });
        if(!same) return null;
        var pool=cePool().map(function(h){return h[0];});
        return mk({tag:'字音 · 同音',variant:'找同音字',q:'下面哪个字和「'+c.ch+'」的读音完全相同？',
          ans:same.ch,pool:pool,excl:[c.ch],wordChar:c.ch,
          hint:'读音相同，意思和写法不一样。'});
      },
      /* 声母相同归类
         ★ 答案必须是【另一个】同声母的字，不能把题干里的字自己放进选项。 */
      function(){
        var c=findChar(function(ch,py,sp){ return !!sp.sheng; });
        if(!c) return null;
        var other=findChar(function(ch,py,sp){ return sp.sheng===c.sp.sheng && ch!==c.ch; },120);
        if(!other) return null;
        /* ★ 干扰项必须排除【所有】与该字同声母的字，否则一道题里会有好几个正确答案 */
        var pool=pyPool().filter(function(h){
          return split(h[1]).sheng!==c.sp.sheng;
        }).map(function(h){return h[0];});
        return mk({tag:'字音 · 声母',variant:'同声母',q:'下面哪个字的声母和「'+c.ch+'」一样？',
          ans:other.ch,pool:pool,excl:[c.ch],wordChar:c.ch,
          hint:'「'+c.ch+'」的声母是 '+c.sp.sheng+'，也要找一个声母是 '+c.sp.sheng+' 的字。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== B2ziXing 字形与笔顺 ===== */
  var ALL_STROKE_NAME=['横','竖','撇','捺','点','提','横折','横钩','竖折','竖提','竖钩','竖弯','弯钩',
                       '斜钩','卧钩','撇折','横撇','横折钩','竖弯钩','横斜钩','竖折折钩','横折弯钩'];
  var STRUCT_ANS=['独体字','左右结构','上下结构','半包围结构','全包围结构'];
  GEN.B2ziXing=function(){
    var vs=[
      /* 笔画名称 ★（依托 HANZI_ORDERTYPE 逐字取真值，杜绝手写错题） */
      function(){
        var c=findChar(function(ch){ var a=orderType(ch); return a&&a.length>1; });
        if(!c) return null;
        var a=orderType(c.ch), n=rnd(a.length), name=a[n];
        var pool=(STROKE_CONFUSE[name]||[]).concat(ALL_STROKE_NAME);
        return mk({tag:'字形 · 笔画',variant:'笔画名称',q:'「'+c.ch+'」的第 '+(n+1)+' 笔叫什么笔画？',
          ans:name,pool:pool,wordChar:c.ch,
          hint:'「'+c.ch+'」的笔顺是：'+a.join('、')+'。'});
      },
      /* 易混笔画辨析 ★★ —— 一上·园地七 */
      function(){
        var c=findChar(function(ch){
          var a=orderType(ch);
          if(!a) return false;
          for(var i=0;i<a.length;i++) if(STROKE_CONFUSE[a[i]]) return true;
          return false;
        });
        if(!c) return null;
        var a=orderType(c.ch), cand=[];
        for(var i=0;i<a.length;i++) if(STROKE_CONFUSE[a[i]]) cand.push({n:i,name:a[i]});
        var t=pick(cand);
        return mk({tag:'字形 · 笔画',variant:'易混笔画',q:'「'+c.ch+'」的第 '+(t.n+1)+' 笔是哪个笔画？注意看清有没有钩。',
          ans:t.name,pool:STROKE_CONFUSE[t.name],wordChar:c.ch,
          hint:'竖钩和竖弯钩、斜钩和卧钩、撇折和竖折很容易混，要看末尾有没有钩、往哪边钩。'});
      },
      /* 笔顺规则 ★ —— 一上·园地一 / 园地六 */
      function(){
        var r=pick(BISHUN_RULE), ch=pick(r.eg);
        var a=orderType(ch);
        if(!a) return null;
        /* 轻量校验：确保这条规则在该字上说得通 */
        var ok=true;
        if(r.r==='先横后竖' && !(a[0]==='横')) ok=false;
        if(r.r==='先撇后捺' && !(a.indexOf('撇')>=0 && a.indexOf('捺')>=0 && a.indexOf('撇')<a.indexOf('捺'))) ok=false;
        if(r.r==='先里面再封口' && !(a.length>=3)) ok=false;
        if(!ok) return null;
        var pool=[];
        BISHUN_RULE.forEach(function(x){ if(x.r!==r.r) pool.push(x.r); });
        return mk({tag:'字形 · 笔顺',variant:'笔顺规则',q:'写「'+ch+'」这个字，要按哪条笔顺规则来写？',
          ans:r.r,pool:pool,wordChar:ch,hint:r.w+'。'+ch+'的笔顺是：'+a.join('、')+'。'});
      },
      /* 字形结构 */
      function(){
        var z=pick(ZISTRUCT), ch=pick(z.c);
        var pool=[];
        STRUCT_ANS.forEach(function(s){ if(s!==z.s) pool.push(s); });
        return mk({tag:'字形 · 结构',variant:'字形结构',q:'「'+ch+'」是什么结构的字？',
          ans:z.s,pool:pool,wordChar:ch,hint:'先看能不能拆成左右或上下两部分，再看有没有包起来。'});
      },
      /* 加一笔 ★★ */
      function(){
        var it=pick(ADD_ONE), ans=pick(it.a);
        var pool=cePool().map(function(h){return h[0];});
        return mk({tag:'字形 · 变字',variant:'加一笔',q:'「'+it.b+'」加一笔，可以变成下面哪个字？',
          ans:ans,pool:pool,excl:it.a.concat([it.b]),wordChar:it.b,
          hint:'在原来的字上加一画，位置不同就能变成不同的字。'});
      },
      /* 减一笔 ★★ */
      function(){
        var it=pick(SUB_ONE), ans=pick(it.a);
        var pool=cePool().map(function(h){return h[0];});
        return mk({tag:'字形 · 变字',variant:'减一笔',q:'「'+it.b+'」减一笔，可以变成下面哪个字？',
          ans:ans,pool:pool,excl:it.a.concat([it.b]),wordChar:it.b,
          hint:'去掉一画，看看还剩什么字。'});
      },
      /* 笔画计数（保底，与现有 stroke 同源但重命名进位 Structure） */
      function(){
        var c=findChar(function(ch){ return !!orderType(ch); });
        if(!c) return null;
        var n=orderType(c.ch).length;
        return mk({tag:'字形 · 笔画数',variant:'数一数',q:'「'+c.ch+'」一共有几画？',
          ans:String(n),pool:[String(n-1),String(n+1),String(n+2),String(Math.max(1,n-2))],wordChar:c.ch,
          hint:'一笔一笔点着数，不要漏掉中间的横或点。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== B3ziYi 字义与用字 ===== */
  GEN.B3ziYi=function(){
    var vs=[
      /* 部首表义 ★ —— 一上·园地六七「发现日字旁和女字旁所代表的意思」 */
      function(){
        var m=pick(RADMEAN);
        var pool=[];
        RADMEAN.forEach(function(x){ if(x.m!==m.m) pool.push(x.m); });
        return mk({tag:'部首 · 表义',variant:'部首表义',q:'带有偏旁「'+m.r+'」的字，意思大多和什么有关？（例：'+m.eg+'）',
          ans:m.m,pool:pool,hint:'偏旁会告诉我们这个字大概讲什么，'+m.r+'的字大多'+m.m+'。'});
      },
      /* 同音字选字 ★★ */
      function(){
        var t=pick(TONGYIN);
        return mk({tag:'用字 · 同音字',variant:'选字填空',q:t.s,
          ans:t.a,pool:t.opts.concat(['白','月','手','大']),wordChar:t.a,hint:t.w+'。'});
      },
      /* 形近字选字 ★★ */
      function(){
        var t=pick(XINGJIN);
        return mk({tag:'用字 · 形近字',variant:'选字填空',q:t.s,
          ans:t.a,pool:t.opts.concat(['木','口','日','山']),wordChar:t.a,hint:t.w+'。'});
      },
      /* 组词（保底，永远能出） */
      function(){
        var P=cePool(); if(!P.length) return null;
        for(var i=0;i<40;i++){
          var h=pick(P);
          if(h&&h[2]) {
            return mk({tag:'用字 · 组词',variant:'选词',q:'哪个词语里有「'+h[0]+'」这个字？',
              ans:h[2],pool:P.map(function(x){return x[2];}).filter(Boolean),wordChar:h[0],
              hint:'读一读每个词，看哪个词里出现了这个字。'});
          }
        }
        return null;
      }
    ];
    return tryGen(vs);
  };

  /* ===== B4chaZi 查字典（音序查字法，一下·园地一） ===== */
  GEN.B4chaZi=function(){
    var c=findChar(function(ch,py,sp){ return !!sp.base; });
    if(!c) return null;
    var up=(c.sp.base.charAt(0)||'').toUpperCase();
    return mk({tag:'查字典 · 音序',variant:'音序查字',q:'用音序查字法查「'+c.ch+'」字，应该先查哪个大写字母？',
      ans:up,pool:['A','B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','W','X','Y','Z'],wordChar:c.ch,
      hint:'先找这个字读音的第一个字母，写成大写。"'});
  };

  /* ===== C1xieZi 书写规范 ===== */
  GEN.C1xieZi=function(){
    var e=pick(EASYWRONG);
    return mk({tag:'写字 · 规范',variant:'易写错字',q:e.q,ans:e.a,pool:e.d,
      wordChar:e.ch,hint:'课本「易写错的字」里专门提醒过「'+e.ch+'」。'});
  };
  /* ===== D1ciYi 词义辨析（反义词 / 近义词） ===== */
  GEN.D1ciYi=function(){
    var isAnt=rnd(2)===0;
    var list=isAnt?ANTONYM:SYNONYM;
    var p=pick(list), rev=rnd(2)===0;
    var qw=rev?p[1]:p[0], ans=rev?p[0]:p[1];
    var pool=[];
    list.forEach(function(x){ if(x[0]!==ans&&x[1]!==ans){ pool.push(x[0]); pool.push(x[1]); } });
    return mk({tag:'词语 · '+(isAnt?'反义词':'近义词'),variant:isAnt?'反义词':'近义词',
      q:'「'+qw+'」的'+(isAnt?'反义词':'近义词')+'是哪个？',
      ans:ans,pool:pool,wordChar:qw,
      hint:isAnt?'反义词意思相反。':'近义词意思相近。'});
  };

  /* ===== D2ciPei 词语搭配（量词 / 修饰词） ===== */
  GEN.D2ciPei=function(){
    var vs=[
      function(){
        var it=pick(LIANGCI);
        var pool=[];
        LIANGCI.forEach(function(x){ if(x.a!==it.a) pool.push(x.a); });
        return mk({tag:'词语 · 量词',variant:'量词搭配',q:'一(　)'+it.n+' —— 括号里应该填哪个量词？',
          ans:it.a,pool:pool,fb:it.o,hint:'不同的东西配不同的量词，要背下来：一头牛、一匹马、一条鱼。'});
      },
      function(){
        var it=pick(XIUSHI);
        var pool=[];
        XIUSHI.forEach(function(x){ if(x.a!==it.a) pool.push(x.a); });
        return mk({tag:'词语 · 搭配',variant:'修饰词',q:'(　)'+it.w+' —— 下面哪个词搭配合适？',
          ans:it.a,pool:pool,fb:it.o,hint:'课文里就是这么写的，读一读感觉一下。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== D3ciJi 词语积累 · 特殊词式 ===== */
  GEN.D3ciJi=function(){
    var vs=[
      /* 叠词 AABB / ABB / ABAB / ABAC / 又A又B ★★
         ★ 坑：干扰项必须全部来自【其他】词式，否则同一道题里会冒出好几个同类词——多答案。
         ★ 又A又B 单独成类，不与 ABAC 混（ABAC 正则 x[0]===x[2] 会把「又大又红」误判为 ABAC）。 */
      function(){
        var CAT=[{k:'AABB',l:AABB,hi:'前两字相同、后两字也相同，比如 高高兴兴。'},
                 {k:'ABB',l:ABB,hi:'后两字相同，比如 绿油油。'},
                 {k:'ABAB',l:ABAB,hi:'一三相同、二四相同，比如 碧绿碧绿。'},
                 {k:'ABAC',l:ABAC,hi:'一三相同、二四不同，比如 自言自语、走来走去。'},
                 {k:'又A又B',l:YOUYOU,hi:'又…又…，比如 又大又红。'}];
        var kind=pick(CAT), a=pick(kind.l), pool=[];
        CAT.forEach(function(x){
          if(x.k!==kind.k) x.l.forEach(function(w){ if(w!==a) pool.push(w); });
        });
        return mk({tag:'词语 · 叠词',variant:kind.k+'式',q:'下面哪个词语是 '+kind.k+' 式的？',
          ans:a,pool:pool,hint:kind.hi});
      },
      /* 又…又… / 越…越… ★ */
      function(){
        var it=pick(YOUYUE);
        return mk({tag:'词语 · 句式',variant:it.k,q:it.t,ans:it.a,pool:it.o.concat(['小','亮','红','圆']),excl:it.o,
          hint:'照样子填一填，要填进去后念得通顺。'});
      },
      /* 一边…一边… / 要是…就… */
      function(){
        var it=pick(YIBIAN);
        return mk({tag:'词语 · 句式',variant:it.k,q:it.t,ans:it.a,pool:it.o,hint:'这是课本里要照样子说的句子。'});
      },
      /* 很 X 很 X */
      function(){
        var it=pick(HENXX);
        return mk({tag:'词语 · 句式',variant:it.k,q:it.t,ans:it.a,pool:it.o,hint:'「很…很…」后面要接说得通的东西。'});
      },
      /* 看一看 */
      function(){
        var it=pick(KANYIYI);
        var pool=[];
        KANYIYI.forEach(function(x){ if(x.a!==it.a) pool.push(x.a); });
        return mk({tag:'词语 · 句式',variant:'看一看',q:'照样子写一写：'+it.b+' → 应该写成什么？',
          ans:it.a,pool:pool,fb:['看一看看','看看了','看一看看'],hint:'动词叠起来以后，中间加个「一」。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== D4ciLei 词语归类与分类 ===== */
  GEN.D4ciLei=function(){
    var vs=[
      function(){
        var g=pick(WORD_GROUP), a=pick(g.w), pool=[];
        WORD_GROUP.forEach(function(x){ if(x.g!==g.g) x.w.forEach(function(w){ if(w!==a) pool.push(w); }); });
        return mk({tag:'词语 · 归类',variant:'词语归类',q:'下面哪个词属于「'+g.g+'」这一类？',
          ans:a,pool:pool,fb:g.o,hint:g.g+'：'+g.w.join('、')+'。'});
      },
      function(){
        var g=pick(WORD_CLASS), a=pick(g.w), pool=[];
        WORD_CLASS.forEach(function(x){ if(x.g!==g.g) x.w.forEach(function(w){ if(w!==a) pool.push(w); }); });
        return mk({tag:'词语 · 分类',variant:'词语分类',q:'下面哪个属于「'+g.g+'」？',
          ans:a,pool:pool,fb:g.o,hint:g.g+'：'+g.w.join('、')+'。'});
      },
      function(){
        var g=pick(WORD_CLASS), pool=[];
        WORD_CLASS.forEach(function(x){ if(x.g!==g.g) pool.push(pick(x.w)); });
        return mk({tag:'词语 · 分类',variant:'找出不同类',q:'下面哪个不是「'+g.g+'」？',
          ans:pick(g.o),pool:g.w,hint:g.g+'应该有：'+g.w.slice(0,4).join('、')+'。'});
      }
    ];
    return tryGen(vs);
  };
  /* 局部转义：body 是 HTML 通道，必须自己转义再拼进去 */
  function e2(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  /* 在一行文字里挖掉一个汉字，返回 {html, ch} */
  function blankOne(line){
    var idx=[];
    for(var i=0;i<line.length;i++){ if(/[\u4e00-\u9fa5]/.test(line.charAt(i))) idx.push(i); }
    if(idx.length<2) return null;
    var p=pick(idx), ch=line.charAt(p);
    return {html:e2(line.slice(0,p))+'<span class="blank-cell" style="display:inline-flex">?</span>'+e2(line.slice(p+1)), ch:ch};
  }
  /* 取一首诗文里所有汉字做字池 */
  function charsOf(lines){
    var out=[];
    lines.forEach(function(l){
      for(var i=0;i<l.length;i++){ var c=l.charAt(i); if(/[\u4e00-\u9fa5]/.test(c)) out.push(c); }
    });
    return out;
  }

  /* ===== E1juShi 句式 ===== */
  GEN.E1juShi=function(){
    var vs=[
      function(){
        var j=pick(JUSHI), a=pick(j.yes);
        return mk({tag:'句子 · 句式',variant:j.k,q:'下面哪一句是「'+j.k+'」的句子？',
          ans:a,pool:j.no,hint:'读一读每句话，看它先说谁、再说什么。'});
      },
      function(){
        var j=pick(JUBU);
        return mk({tag:'句子 · 补式',variant:'句子补式',q:j.s,
          ans:j.a,pool:['是','从','爱','在','有','到'],hint:'把每个字试着放进去读一读，通顺的那个才对。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== E2juXu 句序（连词成句） ===== */
  GEN.E2juXu=function(){
    /* 复用 HanziExtra 里已写好的连词成句出题器（此前它没被登记，等于躺库存） */
    try{
      if(typeof HanziExtra!=='undefined' && HanziExtra.genScorable){
        var q=HanziExtra.genScorable('orderq',{},1);
        if(q&&q.opts&&q.opts.length){
          return {tag:'句子 · 连词成句',variant:'句序',q:q.q,speakQ:q.speakQ||q.q,
                  opts:q.opts.map(String),correct:q.correct,ans:String(q.ans),
                  hint:q.hint||'先想好谁在前面，再排后面的词语。',wordChar:''};
        }
      }
    }catch(err){}
    return null;
  };

  /* ===== E3biaoD 标点与语气 ===== */
  GEN.E3biaoD=function(){
    var it=pick(YUQI);
    return mk({tag:'句子 · 语气',variant:'语气词',q:it.s,
      ans:it.a,pool:['吗','呢','吧','啊','呀'],hint:it.w+'。'});
  };

  /* ===== E4shuJu 句子与段落计数 ===== */
  GEN.E4shuJu=function(){
    var vs=[
      function(){
        var it=pick(COUNT_SENT);
        return mk({tag:'句子 · 数一数',variant:'数句子',body:'<div class="kb-line" style="text-align:left;line-height:2">'+e2(it.t)+'</div>',
          q:'这段话一共有几句话？',ans:it.a,pool:['2','3','4','5','6','7'],
          hint:'数句子就看有几个句号（。）、问号（？）、感叹号（！），逗号不算。'});
      },
      function(){
        var it=pick(COUNT_PARA);
        var html=it.t.split('\n\n').map(function(p){ return '<div class="kb-line" style="text-align:left;line-height:2">'+e2(p)+'</div>'; }).join('');
        return mk({tag:'句子 · 数一数',variant:'数自然段',body:html,
          q:'这篇短文一共有几个自然段？',ans:it.a,pool:['2','3','4','5','6'],
          hint:'开头空两格就是新的一段，一段算一个自然段。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== F1tiQu 提取信息 ===== */
  GEN.F1tiQu=function(){
    var art=pick(SHORT_READ), q=pick(art.qs);
    return mk({tag:'阅读 · 提取信息',variant:art.t,
      body:'<div class="kb-line" style="text-align:left;line-height:2">'+e2(art.body)+'</div>',
      q:q.q,ans:q.a,pool:q.o,hint:'回到短文里找一找，答案就在里面。'});
  };

  /* ===== F2liJie 理解词句 ===== */
  GEN.F2liJie=function(){
    var art=pick(SHORT_READ), q=pick(art.qs);
    return mk({tag:'阅读 · 理解',variant:art.t,
      body:'<div class="kb-line" style="text-align:left;line-height:2">'+e2(art.body)+'</div>',
      q:q.q+'（说一说你是从哪儿看出来的）',ans:q.a,pool:q.o,
      hint:'先读懂整篇短文，再回到那个地方仔细看看。'});
  };

  /* ===== G1keWen 按课文原文填空 ★★ ===== */
  GEN.G1keWen=function(){
    var k=pick(KEWEN);
    for(var t=0;t<10;t++){
      var line=pick(k.l), b=blankOne(line);
      if(!b) continue;
      var pool=[];
      KEWEN.forEach(function(x){ charsOf(x.l).forEach(function(c){ pool.push(c); }); });
      if(charsOf([line]).indexOf(b.ch)<0) continue;
      return mk({tag:'积累 · 课文填空',variant:k.t,
        body:'<div class="kb-line" style="text-align:left;line-height:2.1">'+b.html+'</div>',
        q:'《'+k.t+'》里挖掉了一个字，它是哪个？',ans:b.ch,pool:pool,wordChar:b.ch,
        hint:'背诵一下《'+k.t+'》这一段：'+line});
    }
    return null;
  };

  /* ===== G2guShi 古诗背诵 ===== */
  GEN.G2guShi=function(){
    var vs=[
      /* 挖字填空 */
      function(){
        var g=pick(GUSHI);
        for(var t=0;t<10;t++){
          var line=pick(g.l), b=blankOne(line);
          if(!b) continue;
          var pool=[];
          GUSHI.forEach(function(x){ charsOf(x.l).forEach(function(c){ pool.push(c); }); });
          return mk({tag:'积累 · 古诗填空',variant:g.t,
            body:'<div class="kb-line" style="text-align:left;line-height:2.1">'+b.html+'</div>',
            q:'《'+g.t+'》里挖掉了一个字，它是哪个？',ans:b.ch,pool:pool,wordChar:b.ch,
            hint:'《'+g.t+'》'+g.a+'：'+line});
        }
        return null;
      },
      /* 连句：给上句选下句 */
      function(){
        var g=pick(GUSHI);
        if(g.l.length<2) return null;
        var i=rnd(g.l.length-1);
        var pool=[];
        GUSHI.forEach(function(x){ if(x.t!==g.t) x.l.forEach(function(l){ pool.push(l); }); });
        pool=pool.concat(g.l.filter(function(l,j){ return j!==i && j!==i+1; }));
        return mk({tag:'积累 · 古诗连句',variant:g.t,q:'《'+g.t+'》里「'+g.l[i]+'」的下一句是什么？',
          ans:g.l[i+1],pool:pool,hint:'《'+g.t+'》'+g.a+'，背一背就接上了。'});
      }
    ];
    return tryGen(vs);
  };

  /* ===== G3riJi 日积月累 ===== */
  GEN.G3riJi=function(){
    var it=pick(RIJI), pool=[];
    RIJI.forEach(function(x){ if(x.a!==it.a) pool.push(x.a); });
    return mk({tag:'积累 · 日积月累',variant:'谚语名句',q:'「'+it.t+'」的下一句是什么？',
      ans:it.a,pool:pool,hint:it.ce+' 要求背诵积累。'});
  };

  /* ===== H1kouYu 口语交际 ===== */
  GEN.H1kouYu=function(){
    var it=pick(KOUYU);
    return mk({tag:'表达 · 口语交际',variant:'口语交际',q:it.s,
      ans:it.a,pool:it.o,hint:'和别人说话要有礼貌，还要看场合说话声音大小不一样。'});
  };

  /* ===== H2xieHua 写话起步 ===== */
  var XIEHUA=[
    {q:'看图写一两句话时，下面哪一项可以不用写？',a:'可以不用写题目',o:['图上画的是谁','在什么地方干什么','句子结束要加句号']},
    {q:'看图写话的第一步应该做什么？',a:'先仔细观察图上画的是谁、在什么地方、干什么',o:['直接开始写字','先把时间写长一点','先写结尾']},
    {q:'看图写话里，句子写完应该怎么办？',a:'末尾加上句号',o:['空两格继续写','什么都不加','换成问号']},
    {q:'下面哪一句话适合用来介绍自己？',a:'大家好，我叫小明，今年七岁了。',o:['你去上学吗？','请把书给我。','今天天气真好。']},
    {q:'看图上有两个小朋友在扫地，下面哪句写得最好？',a:'放学了，小明和小红一起在教室里扫地。',o:['他们很高兴。','有一个扫把。','地上有纸。']}
  ];
  GEN.H2xieHua=function(){
    var it=pick(XIEHUA);
    return mk({tag:'表达 · 写话起步',variant:'看图写话',q:it.q,ans:it.a,pool:it.o,
      hint:'写话要说清：什么时候、谁、在哪儿、干什么。'});
  };
  /* ========== 考点登记表（登记层：23 个考点，不多不少） ==========
     板块: A 汉语拼音 / B 识字 / C 写字 / D 词语 / E 句子 / F 阅读 / G 积累 / H 表达 */
  var MODES={
    A1pyRead:1,A2pySpell:1,A3pyRule:1,
    B1ziYin:1,B2ziXing:1,B3ziYi:1,B4chaZi:1,
    C1xieZi:1,
    D1ciYi:1,D2ciPei:1,D3ciJi:1,D4ciLei:1,
    E1juShi:1,E2juXu:1,E3biaoD:1,E4shuJu:1,
    F1tiQu:1,F2liJie:1,
    G1keWen:1,G2guShi:1,G3riJi:1,
    H1kouYu:1,H2xieHua:1
  };
  /* 教材坐标：考点名｜板块｜年级册次｜单元/课 */
  var COORD={
    A1pyRead:['拼音认读与书写','汉语拼音','一上','第2~4单元 · 园地三/四/七'],
    A2pySpell:['音节拼读','汉语拼音','一上','第2~4单元 · 园地七'],
    A3pyRule:['拼写规则','汉语拼音','一上','拼音6/9/10-11 · 园地'],
    B1ziYin:['字音辨析','识字','一上/一下','全册 · 园地七'],
    B2ziXing:['字形与笔顺','识字','一上/一下','全册 · 园地一/六/七'],
    B3ziYi:['字义与用字','识字','一上/一下','全册 · 园地六/七'],
    B4chaZi:['查字典','识字','一下','语文园地一'],
    C1xieZi:['书写规范','写字','一上/一下','第1/7单元易写错清单'],
    D1ciYi:['词义辨析','词语','一上/一下','第7单元字词盘点'],
    D2ciPei:['词语搭配','词语','一上/一下','词语盘点'],
    D3ciJi:['特殊词式','词语','一上/一下','词语盘点'],
    D4ciLei:['词语归类分类','词语','一上/一下','语文园地'],
    E1juShi:['句式','句子','一上/一下','句型盘点'],
    E2juXu:['句序','句子','一上/一下','句子起步'],
    E3biaoD:['标点与语气','句子','一上/一下','句型盘点'],
    E4shuJu:['句子与段落计数','句子','一下','课文《端午粽》等'],
    F1tiQu:['提取信息','阅读','一上/一下','阅读单元 · 课文'],
    F2liJie:['理解词句','阅读','一上/一下','阅读单元 · 课文'],
    G1keWen:['课文背诵','积累','一上','识字/阅读单元'],
    G2guShi:['古诗背诵','积累','一上/一下','园地一/五 · 一下课文'],
    G3riJi:['日积月累','积累','一上/一下','园地四~八'],
    H1kouYu:['口语交际','表达','一上','园地一/七'],
    H2xieHua:['写话起步','表达','一下','语文园地']
  };
  function gen(key){
    var f=GEN[key];
    if(!f) return null;
    for(var i=0;i<3;i++){
      try{ var q=f(); if(q) return q; }catch(err){}
    }
    return null;
  }
  return {modes:MODES, coord:COORD, gen:gen, keys:Object.keys(MODES)};
})();
