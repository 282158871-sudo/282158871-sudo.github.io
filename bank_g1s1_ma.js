/* ==================================================================
   题库分片：一年级上册 · 数学（bank_g1s1_ma）
   ★ v4.347 补齐：一上八个单元全部覆盖（1 生活中的数 / 2 比较 / 3 加与减(一)
     / 4 分类 / 5 位置与顺序 / 6 认识图形 / 7 加与减(二) / 8 认识钟表），
     共 68 张卡（首批 30 + 本轮 38）。
     —— 本轮另修：① 单元卷「同卷不重复」：题库卡用 p._used 排除、生成器回退只走
        纯生成器（bankOff），不再绕过排除把已出过的卡或串了题型的卡又抽一遍；
        ② 单元内 ask 文案去重（U3/U4/U6/U8 同问换说法），一张卷不出现俩一模一样的问句。
   ------------------------------------------------------------------
   造题三条铁律（sfSelfTest 会逐条钉死，改题后必须重跑自检）：
     铁律14 不发明教材：line / coord / skin 必须能在 SF_LINE 找到出处。
                        coord 逐字照抄 SF_LINE；scope 必须与 coord 解析出来的
                        年级/册/单元一致 —— 双写不一致自检立刻红。
     铁律15 一卡一屏不堆字：stem 每段 ≤18 字、段数 ≤3；一屏视觉块 ≤3。
     铁律16 解析是硬要求：why 不许空（答后要读、错本要讲）；
                        pit（易错点）也要写，第三段语音会重复念一遍。
   ------------------------------------------------------------------
   本片用到的母题锚（抄自 SF_LINE，改动前先回去核对）：
     cmp      一上 · 第1单元 生活中的数 / 一下 · 第3单元   u1
              skins: 比多少 / 数字比大小 / 算式比大小
     compare  一上 · 第2单元 比较                         u2
              skins: 比多少 / 比长短 / 比高矮 / 比轻重
     calc     一上 · 第3单元 加与减(一) / 一下 · 加与减   u3
              skins: 10以内加减 / 进位加 / 退位减 / 填括号 / 连加连减
     classify 一上 · 第4单元 分类                         u4
              skins: 挑出不同类 / 同类归一堆
     pos      一上 · 第5单元 位置与顺序                   u5
              skins: 第几个 / 左右 / 上下 / 前后
     solidshape 一上 · 第6单元 认识图形                   u6
              skins: 认立体图形 / 图形分类
     ten      一上 · 第7单元 加与减(二)                   u7
              skins: 凑十·找补数 / 凑十·拆数
     clock    一上 · 第8单元 认识钟表                     u8
              skins: 认整时 / 认半时
     blank / ineq / sign / sort / filter  一上 · 课本能力点  u0
              blank: 加法填括号 / 减法填括号
              ineq: 最大能填几 / 最小能填几
              sign: 填加号减号
              sort: 从小到大排 / 从大到小排
              filter: 小于N的挑出来
   ------------------------------------------------------------------
   ★ 超纲红线：一上只学「10 以内加减」和「20 以内进位加」（凑十法）。
     退位减、20 以内减法是一下内容，本片一律不出。
   ------------------------------------------------------------------
   ★ 手机排版：题干用数组分段，每段一行；配图宽度 ≤ 244（390 屏不横滚）。
   ================================================================== */
window.SF_BANK_CHUNKS = window.SF_BANK_CHUNKS || {};
(function () {
  var U3 = '一上 · 第3单元 加与减(一) / 一下 · 加与减';
  var U7 = '一上 · 第7单元 加与减(二)';
  var U0 = '一上 · 课本能力点';
  var U1 = '一上 · 第1单元 生活中的数 / 一下 · 第3单元';
  var U2 = '一上 · 第2单元 比较';
  var U4 = '一上 · 第4单元 分类';
  var U5 = '一上 · 第5单元 位置与顺序';
  var U6 = '一上 · 第6单元 认识图形';
  var U8 = '一上 · 第8单元 认识钟表';

  /* ---------- 配图：SVG 零件 ---------- */
  function ball(cx, cy, fill, stroke, dash) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="2"' + (dash ? ' stroke-dasharray="3 3"' : '') + '/>';
  }
  function tri(cx, cy, fill, stroke, dash) {
    return '<polygon points="' + cx + ',' + (cy - 11) + ' ' + (cx - 11) + ',' + (cy + 9) + ' ' +
      (cx + 11) + ',' + (cy + 9) + '" fill="' + fill + '" stroke="' + stroke +
      '" stroke-width="2"' + (dash ? ' stroke-dasharray="3 3"' : '') + '/>';
  }
  /* 一图两式/四式用：左边 a 个、右边 b 个，中间一道虚线隔开 */
  function picTwo(a, b, shape, hiIdx) {
    var f = (shape === 'tri') ? tri : ball;
    var s = '<svg viewBox="0 0 244 34" width="244" height="34" style="max-width:100%;display:block">';
    var i;
    for (i = 0; i < a; i++) s += f(14 + i * 24, 17, '#9775FA', '#7C5CE0', false);
    s += '<line x1="' + (14 + a * 24 - 7) + '" y1="3" x2="' + (14 + a * 24 - 7) +
      '" y2="31" stroke="#C3CCE0" stroke-width="2" stroke-dasharray="3 3"/>';
    for (i = 0; i < b; i++) s += f(14 + (a + 1) * 24 + i * 24, 17, '#FFB3C7', '#F06595', false);
    return s + '</svg>';
  }
  /* 凑十用的十格图：上排 10 格（前 n 个实心），下排 m 个补数。
     hi=true 时把「要补进去的那一格」描绿边，孩子一眼看到差几个。 */
  function tenBox(n, m, hi) {
    var s = '<svg viewBox="0 0 244 62" width="244" height="62" style="max-width:100%;display:block">';
    var i;
    for (i = 0; i < 10; i++) {
      var on = i < n, st = on ? '#7C5CE0' : '#D8DEEE';
      if (hi && i === n) st = '#1FA953';
      s += ball(14 + i * 24, 14, on ? '#9775FA' : '#fff', st, !on && !hi);
    }
    for (i = 0; i < m; i++) s += ball(14 + i * 24, 47, '#4DABF7', '#1B6BB0', false);
    return s + '</svg>';
  }
  /* 操作题「画一画」：已画好的 n 个 + 待画的 m 个虚线空位 */
  function drawBox(n, m) {
    var s = '<svg viewBox="0 0 244 34" width="244" height="34" style="max-width:100%;display:block">';
    var i;
    for (i = 0; i < n; i++) s += ball(14 + i * 24, 17, '#9775FA', '#7C5CE0', false);
    for (i = 0; i < m; i++) s += ball(14 + (n + 1) * 24 + i * 24, 17, '#fff', '#C3CCE0', true);
    return s + '</svg>';
  }
  /* 操作题的「看示范」：一句话 + 一张完成图 + 算式。答后讲题也读这段。 */
  function demo(txt, svg) {
    return '<div style="font-size:15px;font-weight:800;color:#1FA953;margin-bottom:6px">' + txt + '</div>' +
      (svg || '');
  }
  /* 全部画完的样子（画一画类操作题的示范图） */
  function drawDone(n) {
    var s = '<svg viewBox="0 0 244 34" width="244" height="34" style="max-width:100%;display:block">';
    for (var i = 0; i < n; i++) s += ball(14 + i * 24, 17, '#9775FA', '#7C5CE0', false);
    return s + '</svg>';
  }
  function eq(t) {
    return '<div style="margin-top:8px;font-size:22px;font-weight:900;letter-spacing:1px;color:#1B6BB0">' + t + '</div>';
  }
  var D = demo;

  /* ---------- 配图：新单元专用 SVG（244 宽为主，单图 96 居中） ---------- */
  /* 一排彩色方块（第几个 / 计数）。框里标位置号，孩子一眼数到第几个。 */
  function seqRow(colors){
    var n=colors.length, s='<svg viewBox="0 0 244 36" width="244" height="36" style="max-width:100%;display:block">';
    for(var i=0;i<n;i++){
      var x=10+i*46;
      s+='<rect x="'+x+'" y="6" width="36" height="26" rx="7" fill="'+colors[i]+'" stroke="#C3CCE0" stroke-width="2"/>';
      s+='<text x="'+(x+18)+'" y="24" font-size="15" text-anchor="middle" fill="#fff" font-weight="800">'+(i+1)+'</text>';
    }
    return s+'</svg>';
  }
  /* 一排小图形（分类 / 数图形）：circ 圆 / sq 方 / tri 三角 */
  function shapeRow(types){
    var s='<svg viewBox="0 0 244 40" width="244" height="40" style="max-width:100%;display:block">';
    types.forEach(function(t,i){
      var cx=14+i*46+18, cy=20, col=['#9775FA','#FFB3C7','#4DABF7','#FFD43B'][i%4];
      if(t==='sq') s+='<rect x="'+(cx-15)+'" y="5" width="30" height="30" rx="5" fill="'+col+'" stroke="#7C5CE0" stroke-width="2"/>';
      else if(t==='tri') s+='<polygon points="'+cx+',5 '+(cx-16)+',35 '+(cx+16)+',35" fill="'+col+'" stroke="#7C5CE0" stroke-width="2"/>';
      else s+='<circle cx="'+cx+'" cy="20" r="16" fill="'+col+'" stroke="#7C5CE0" stroke-width="2"/>';
    });
    return s+'</svg>';
  }
  /* 立体图形：cube 正方体 / cuboid 长方体 / cyl 圆柱 / ball 球。
     ★ 一上只学立体图形（长方体/正方体/圆柱/球），平面图形是一下内容，本片一律不出。 */
  function solidShapes(t){
    var f='#9775FA', st='#7C5CE0';
    if(t==='ball')return '<circle cx="48" cy="48" r="38" fill="'+f+'" stroke="'+st+'" stroke-width="3"/><circle cx="36" cy="36" r="10" fill="#fff" opacity=".5"/>';
    if(t==='cyl')return '<ellipse cx="48" cy="24" rx="28" ry="9" fill="'+f+'" stroke="'+st+'" stroke-width="3"/><rect x="20" y="24" width="56" height="48" fill="'+f+'" stroke="'+st+'" stroke-width="3"/><ellipse cx="48" cy="72" rx="28" ry="9" fill="'+f+'" stroke="'+st+'" stroke-width="3"/>';
    if(t==='cube')return '<rect x="20" y="26" width="52" height="52" fill="'+f+'" stroke="'+st+'" stroke-width="3"/><path d="M20 26 L36 12 L88 12 L72 26 Z" fill="#B79CF0" stroke="'+st+'" stroke-width="3"/><path d="M72 26 L88 12 L88 64 L72 78 Z" fill="#8E6FE0" stroke="'+st+'" stroke-width="3"/>';
    return '<rect x="16" y="28" width="56" height="40" fill="'+f+'" stroke="'+st+'" stroke-width="3"/><path d="M16 28 L34 14 L90 14 L72 28 Z" fill="#B79CF0" stroke="'+st+'" stroke-width="3"/><path d="M72 28 L90 14 L90 54 L72 68 Z" fill="#8E6FE0" stroke="'+st+'" stroke-width="3"/>';
  }
  function solidImg(t){ return '<svg viewBox="0 0 96 96" width="96" height="96" style="max-width:100%">'+solidShapes(t)+'</svg>'; }
  function solidRow(types){
    var s='<svg viewBox="0 0 244 96" width="244" height="96" style="max-width:100%;display:block">';
    types.forEach(function(t,i){ s+='<g transform="translate('+(14+i*58)+',0)">'+solidShapes(t)+'</g>'; });
    return s+'</svg>';
  }
  /* 钟表盘：h=1~12，m=0 整时 / 30 半时。半时时针走到两数字中间。 */
  function clockFace(h,m){
    var cx=48, cy=48, r=38;
    var s='<svg viewBox="0 0 96 96" width="96" height="96" style="max-width:100%">';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#fff" stroke="#4DABF7" stroke-width="3"/>';
    for(var i=0;i<12;i++){ var a=i*30*Math.PI/180; var x1=cx+Math.sin(a)*(r-4), y1=cy-Math.cos(a)*(r-4), x2=cx+Math.sin(a)*(r-9), y2=cy-Math.cos(a)*(r-9); s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#C3CCE0" stroke-width="2"/>'; }
    var ha=(h%12 + (m===30?0.5:0))*30*Math.PI/180;
    var ma=(m===30?180:0)*Math.PI/180;
    var hx=cx+Math.sin(ha)*(r*0.5), hy=cy-Math.cos(ha)*(r*0.5);
    var mx=cx+Math.sin(ma)*(r*0.78), my=cy-Math.cos(ma)*(r*0.78);
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+mx+'" y2="'+my+'" stroke="#1B6BB0" stroke-width="4" stroke-linecap="round"/>';
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+hx+'" y2="'+hy+'" stroke="#333" stroke-width="4" stroke-linecap="round"/>';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="3.5" fill="#333"/>';
    return s+'</svg>';
  }
  /* 比较类配图：比长短 / 比高矮 / 比轻重 */
  function cmpLen(redLong){
    var rl=redLong?156:64, bl=redLong?64:156;
    var s='<svg viewBox="0 0 244 40" width="244" height="40" style="max-width:100%;display:block">';
    s+='<line x1="20" y1="14" x2="'+(20+rl)+'" y2="14" stroke="#FF6B6B" stroke-width="6" stroke-linecap="round"/>';
    s+='<line x1="20" y1="30" x2="'+(20+bl)+'" y2="30" stroke="#4DABF7" stroke-width="6" stroke-linecap="round"/>';
    return s+'</svg>';
  }
  function cmpHt(leftTall){
    var lh=leftTall?72:34, rh=leftTall?34:72;
    var s='<svg viewBox="0 0 244 88" width="244" height="88" style="max-width:100%;display:block">';
    s+='<rect x="60" y="'+(84-lh)+'" width="38" height="'+lh+'" rx="7" fill="#FF6B6B" stroke="#C3CCE0" stroke-width="2"/>';
    s+='<rect x="146" y="'+(84-rh)+'" width="38" height="'+rh+'" rx="7" fill="#4DABF7" stroke="#C3CCE0" stroke-width="2"/>';
    return s+'</svg>';
  }
  function cmpScale(leftHeavy){
    var s='<svg viewBox="0 0 244 88" width="244" height="88" style="max-width:100%;display:block">';
    s+='<rect x="118" y="14" width="8" height="60" fill="#999"/>';
    var lx=44, rx=200, ly=leftHeavy?48:22, ry=leftHeavy?22:48;
    s+='<line x1="122" y1="16" x2="'+lx+'" y2="'+ly+'" stroke="#999" stroke-width="4" stroke-linecap="round"/>';
    s+='<line x1="122" y1="16" x2="'+rx+'" y2="'+ry+'" stroke="#999" stroke-width="4" stroke-linecap="round"/>';
    s+='<circle cx="'+lx+'" cy="'+(ly+14)+'" r="14" fill="'+(leftHeavy?'#FF6B6B':'#4DABF7')+'" stroke="#C3CCE0" stroke-width="2"/>';
    s+='<circle cx="'+rx+'" cy="'+(ry+14)+'" r="14" fill="'+(leftHeavy?'#4DABF7':'#FF6B6B')+'" stroke="#C3CCE0" stroke-width="2"/>';
    return s+'</svg>';
  }

  window.SF_BANK_CHUNKS['g1s1_ma'] = [

    /* ================= 第3单元 加与减(一) · 基础达标 ================= */
    { id: 'MA1-U3-J01', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'judge', tier: 'base', skin: '10以内加减', tag: '口算',
      stem: ['小明有 6 颗糖，', '妈妈又给了他 3 颗。'],
      ask: '现在一共有 9 颗糖。对吗？', lead: '先算 6+3 等于几，再判断',
      opt: ['对', '错'], ans: 0, shuffle: false,
      why: '6+3=9，一共是 9 颗，所以这句话是对的。',
      pit: '看见「又给了」就是变多，用加法。',
      rhyme: '又给又来又飞来，一律用加法。' },

    { id: 'MA1-U3-J02', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'judge', tier: 'base', skin: '10以内加减', tag: '口算',
      stem: ['盘子里有 7 个苹果，', '吃掉 3 个。'],
      ask: '还剩 5 个。对吗？', lead: '吃掉了，是变多还是变少？',
      opt: ['对', '错'], ans: 1, shuffle: false,
      why: '吃掉用减法：7-3=4，还剩 4 个，不是 5 个，所以这句话是错的。',
      pit: '7-3 要从 7 往回数 3 个：6、5、4，答案是 4，别顺口说成 5。',
      rhyme: '吃掉就是用掉，一律用减法。' },

    { id: 'MA1-U3-C01', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'base', skin: '10以内加减', tag: '一图两式',
      art: picTwo(3, 5, 'tri'), layout: { artW: 'md' },
      stem: ['看图，列一道加法算式。'], ask: '该选哪道加法算式？',
      opt: ['3+5=8', '3+5=9', '5-3=2'], ans: 0,
      why: '左边 3 个，右边 5 个，合起来是 8，所以 3+5=8。',
      pit: '先数清左边、右边各有几个，再相加；数过的可以点一下。',
      rhyme: '一图能列两道加，左右换换都可以。' },

    { id: 'MA1-U3-C02', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'base', skin: '10以内加减', tag: '口算',
      stem: ['算一算。'], ask: '4 + 5 = ？',
      opt: ['9', '8', '10'], ans: 0,
      why: '4 和 5 合起来是 9。也可以想 5+4：从 5 往后数 4 个，是 9。',
      pit: '两个小数相加，从大的那个往上数更快，不容易数错。',
      rhyme: '小数加大数，从大数往上数。' },

    { id: 'MA1-U3-C03', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'base', skin: '10以内加减', tag: '口算',
      stem: ['算一算。'], ask: '10 - 6 = ？',
      opt: ['4', '5', '3'], ans: 0,
      why: '想加法算减法：6 加几等于 10？6+4=10，所以 10-6=4。',
      pit: '减法卡住了，就想「几加它等于 10」，一算就出来。',
      rhyme: '减法想加法，一算就出来。' },

    { id: 'MA1-U3-O01', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'operate', tier: 'base', skin: '10以内加减', tag: '画一画',
      art: drawBox(4, 3), layout: { artW: 'md' },
      stem: ['先画 4 个○，', '再画 3 个○。'],
      ask: '一共画了几个○？',
      opt: ['7', '6', '8'], ans: 0,
      opDemo: D('照着画：4 个添上 3 个', drawDone(7)) + eq('4 + 3 = 7'),
      why: '4 个再添上 3 个，一共 7 个：4+3=7。',
      pit: '画一个、数一个，画完再从头数一遍，别漏画也别多画。',
      rhyme: '画一个，数一个，画完再数一遍。' },

    { id: 'MA1-U3-C04', v: 1, subj: 'math', line: 'blank', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'choice', tier: 'base', skin: '加法填括号', tag: '填括号',
      stem: ['括号里藏着几？'], ask: '（ ） + 3 = 8',
      opt: ['5', '4', '6'], ans: 0,
      why: '想：8-3=5，所以括号里是 5。验算一遍：5+3=8，对了。',
      pit: '求括号里的数，用「得数减去另一个数」，不是把两个数加起来。',
      rhyme: '求括号，用减法，得数减掉另一家。' },

    { id: 'MA1-U3-C05', v: 1, subj: 'math', line: 'blank', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'choice', tier: 'base', skin: '减法填括号', tag: '填括号',
      stem: ['括号里藏着几？'], ask: '9 - （ ） = 4',
      opt: ['5', '6', '4'], ans: 0,
      why: '想：9-4=5，所以括号里是 5。验算一遍：9-5=4，对了。',
      pit: '减号后面的括号，用「前面那个数减得数」来求，别用加法。',
      rhyme: '减号后面求括号，大数减掉得数就得到。' },

    /* ================= 第3单元 · 能力提升 ================= */
    { id: 'MA1-U3-C06', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'up', skin: '连加连减', tag: '连加',
      stem: ['算一算。'], ask: '3 + 2 + 4 = ？',
      opt: ['9', '8', '10'], ans: 0,
      why: '从左往右一步一步算：先 3+2=5，再 5+4=9。',
      pit: '连加不能三个数一起凑，要先算前两个，拿得数再加第三个。',
      rhyme: '从左往右一步步，算完一步再下一步。' },

    { id: 'MA1-U3-J03', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'judge', tier: 'up', skin: '连加连减', tag: '连加',
      stem: ['小明拍球：第一次 2 下，', '第二次 3 下，第三次 4 下。'],
      ask: '三次一共拍了 9 下。对吗？', lead: '先算 2+3，再加 4',
      opt: ['对', '错'], ans: 0, shuffle: false,
      why: '2+3=5，5+4=9，一共拍了 9 下，所以是对的。',
      pit: '一步一步来：2+3 得 5，别急着把 4 也加进去，先记下 5。',
      rhyme: '连加从左往右算，一步一步别跳步。' },

    { id: 'MA1-U3-C07', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'up', skin: '10以内加减', tag: '一图四式',
      art: picTwo(4, 5, 'ball'), layout: { artW: 'md' },
      stem: ['看图，列一道减法算式。'], ask: '该选哪道减法算式？',
      opt: ['9-4=5', '9-5=3', '4+5=9'], ans: 0,
      why: '一共 9 个，去掉左边 4 个，还剩右边 5 个，所以 9-4=5。',
      pit: '减法要用「一共 9 个」去减，不是拿 5 去减 4 —— 那是比多少，不是去掉。',
      rhyme: '一共减左边，剩下的在右边。' },

    { id: 'MA1-U3-C08', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'up', skin: '10以内加减', tag: '解决问题',
      stem: ['草地上有 8 只小鸡，', '跑走了 3 只。'],
      ask: '还剩几只？算式是哪个？',
      opt: ['8-3=5', '8+3=11', '8-3=6'], ans: 0,
      why: '跑走了就是少了，用减法：8-3=5，还剩 5 只。',
      pit: '「跑走、飞走、吃掉、用掉」都是变少，一律用减法，别看成加法。',
      rhyme: '跑走飞走吃掉，通通用减法。' },

    { id: 'MA1-U3-P01', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'composite', tier: 'up', skin: '10以内加减', tag: '一情境多问',
      stem: ['小明有 5 颗糖，', '小红有 3 颗糖。'],
      sub: [
        { ask: '两人一共有几颗糖？', opt: ['8', '9', '7'], ans: 0, why: '5+3=8，问「一共」用加法。' },
        { ask: '小明比小红多几颗？', opt: ['2', '3', '8'], ans: 0, why: '5-3=2，问「多多少」用减法。' }
      ],
      why: '问「一共」用加法，问「多多少」用减法 —— 先看清问的是什么。',
      pit: '第二问是比多少，不是再合一次；看到「比」字就要想到减法。',
      rhyme: '问一共用加法，问相差用减法。' },

    { id: 'MA1-U3-C09', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'choice', tier: 'up', skin: '连加连减', tag: '连减',
      stem: ['算一算。'], ask: '10 - 3 - 2 = ？',
      opt: ['5', '6', '4'], ans: 0,
      why: '从左往右算：10-3=7，7-2=5。',
      pit: '连减也是从左往右，先减第一个、拿得数再减第二个，不能一次减完。',
      rhyme: '连减也是一步步，从左往右别跳步。' },

    { id: 'MA1-U3-P02', v: 1, subj: 'math', line: 'calc', coord: U3, scope: { g: 1, ce: 0, u: 3 },
      kind: 'composite', tier: 'up', skin: '连加连减', tag: '一情境多问',
      stem: ['停车场原来有 9 辆车，', '开走了 4 辆，', '又开来 2 辆。'],
      sub: [
        { ask: '开走后还剩几辆？', opt: ['5', '6', '4'], ans: 0, why: '9-4=5，开走用减法。' },
        { ask: '现在一共有几辆？', opt: ['7', '6', '8'], ans: 0, why: '5+2=7，开来用加法。' },
        { ask: '现在的比原来的少几辆？', opt: ['2', '3', '1'], ans: 0, why: '9-7=2，比多少用减法。' }
      ],
      why: '开走用减法、开来用加法，一步一步算；最后一问再拿现在和原来比一比。',
      pit: '第三问比的是「现在的 7 辆」和「原来的 9 辆」，不是和开走的 4 辆比。',
      rhyme: '开走减，开来加，一步一步算到家。' },

    /* ================= 第3单元 · 拓展探究 ================= */
    { id: 'MA1-U3-A01', v: 1, subj: 'math', line: 'sign', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'advanced', tier: 'ext', skin: '填加号减号', tag: '填符号',
      stem: ['在□里填上 + 或 -。'], ask: '6 □ 2 = 8',
      opt: ['+', '-'], ans: 0,
      why: '6+2=8，所以填加号；6-2=4，不等于 8，所以不能填减号。',
      pit: '得数比前面那个数大就用加号，变小就用减号 —— 先看一眼大小。',
      rhyme: '得数变大就用加，得数变小就用减。',
      hint: '先算 6+2 等于几，再算 6-2 等于几，看哪个能得 8。' },

    { id: 'MA1-U3-A02', v: 1, subj: 'math', line: 'sign', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'advanced', tier: 'ext', skin: '填加号减号', tag: '填符号',
      stem: ['在□里填上 + 或 -，', '两道都要成立。'], ask: '7 □ 2 = 9，9 □ 3 = 6',
      opt: ['+ , -', '- , +', '+ , +'], ans: 0,
      why: '第一道 7+2=9，填加号；第二道 9-3=6，填减号。所以是先 + 后 -。',
      pit: '两个空要一个一个算，别看第一个填了加号，第二个就跟着填加号。',
      rhyme: '一个一个算，别急着一次填完。',
      hint: '先只看第一道：7 加 2 是 9，所以第一个空填 +。再看第二道。' },

    { id: 'MA1-U3-A03', v: 1, subj: 'math', line: 'ineq', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'advanced', tier: 'ext', skin: '最大能填几', tag: '最大能填几',
      stem: ['□里最大能填几？'], ask: '（ ） + 4 < 9',
      opt: ['4', '5', '3'], ans: 0,
      why: '先想等于 9 的时候填 5（5+4=9）。题目要求「小于 9」，等于 9 不行，所以最大只能填 4。',
      pit: '「<」是不能等于 —— 算出等于的那个数，还要再退 1 才对。',
      rhyme: '先算等于几，小于再退一。',
      hint: '5+4 正好等于 9，题目要求比 9 小，那就试试比 5 小 1 的数。' },

    /* ================= 第7单元 加与减(二) · 基础达标 ================= */
    { id: 'MA1-U7-C10', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'choice', tier: 'base', skin: '凑十·拆数', tag: '凑十法',
      stem: ['用凑十法算一算。'], ask: '9 + 4 = ？',
      opt: ['13', '12', '14'], ans: 0,
      why: '9 差 1 凑成 10，把 4 分成 1 和 3：9+1=10，10+3=13。',
      pit: '别一个一个数，先把 9 凑成 10 —— 9 只要 1 就够了。',
      rhyme: '一九一九好朋友，凑成十就不发愁。' },

    { id: 'MA1-U7-O02', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'operate', tier: 'base', skin: '凑十·拆数', tag: '圈一圈',
      art: tenBox(9, 5, true), layout: { artW: 'md' },
      stem: ['算 9 + 5，先圈出 10 个。'],
      ask: '圈完 10 个，外面还剩几个？',
      opt: ['4', '5', '6'], ans: 0,
      opDemo: D('从第二排拿 1 个补进第一排', tenBox(10, 4, false)) + eq('9 + 5 = 14'),
      why: '9 差 1 凑成 10，从 5 里拿走 1 个，还剩 4 个。所以 9+5=14。',
      pit: '圈 10 个的时候，第一排只有 9 个，要从第二排拿 1 个补进去。',
      rhyme: '九要一，八要二，凑成十再相加。' },

    { id: 'MA1-U7-J04', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'judge', tier: 'base', skin: '凑十·拆数', tag: '凑十法',
      stem: ['算 8 + 5，小明这样算：', '先算 8+2=10，', '再算 10+3=13。'],
      ask: '他算得对吗？', lead: '看 5 拆成了 2 和几',
      opt: ['对', '错'], ans: 0, shuffle: false,
      why: '8 差 2 凑成 10，把 5 分成 2 和 3：8+2=10，10+3=13。他算得对。',
      pit: '拆的是小的那个数（5），拆出来的 2 是给 8 凑十用的，不是随便拆。',
      rhyme: '八要二，把五拆成二和三。' },

    { id: 'MA1-U7-C11', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'choice', tier: 'base', skin: '凑十·拆数', tag: '凑十法',
      stem: ['用凑十法算一算。'], ask: '8 + 7 = ？',
      opt: ['15', '14', '16'], ans: 0,
      why: '8 差 2 凑成 10，把 7 分成 2 和 5：8+2=10，10+5=15。',
      pit: '拆 7 的时候要拆成 2 和 5（2 给 8 凑十），不能拆成 3 和 4。',
      rhyme: '八要二，七拆二和五，十加五得十五。' },

    { id: 'MA1-U7-C12', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'choice', tier: 'base', skin: '凑十·找补数', tag: '凑十法',
      stem: ['括号里藏着几？'], ask: '9 + （ ） = 15',
      opt: ['6', '5', '7'], ans: 0,
      why: '想：15-9=6，或者想 9 再添上 6 才是 15，所以括号里是 6。',
      pit: '求括号用减法：得数 15 减掉已知的 9。别拿 9 和 15 相加。',
      rhyme: '求括号，用减法，得数减掉已知数。' },

    { id: 'MA1-U7-O03', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'operate', tier: 'base', skin: '凑十·找补数', tag: '圈一圈',
      art: tenBox(8, 6, true), layout: { artW: 'md' },
      stem: ['算 8 + 6，先圈出 10 个。'],
      ask: '要从 6 里拿出几个去凑十？',
      opt: ['2', '3', '4'], ans: 0,
      opDemo: D('8 差 2 凑成 10，把 6 分成 2 和 4', tenBox(10, 4, false)) + eq('8 + 6 = 14'),
      why: '8 差 2 就凑成 10，所以从 6 里拿 2 个出来，剩 4 个：10+4=14。',
      pit: '看上面一排还差几个到 10，就从下面拿几个 —— 8 差 2，不是差 3。',
      rhyme: '看大数差几个，就从小数拿几个。' },

    /* ================= 第7单元 · 能力提升 ================= */
    { id: 'MA1-U7-P03', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'composite', tier: 'up', skin: '凑十·拆数', tag: '一情境多问',
      stem: ['盒子里有 9 个球，', '又放进去 6 个。'],
      sub: [
        { ask: '现在一共有几个球？', opt: ['15', '14', '16'], ans: 0, why: '9+1=10，10+5=15。' },
        { ask: '用凑十法，6 要分成几和几？', opt: ['1 和 5', '2 和 4', '3 和 3'], ans: 0, why: '9 差 1 凑成 10，所以 6 分成 1 和 5。' }
      ],
      why: '9 凑十只要 1，所以把 6 拆成 1 和 5：先 9+1=10，再 10+5=15。',
      pit: '拆几要看另一个数差几到 10 —— 9 只差 1，不是差 2。',
      rhyme: '九要一，八要二，七要三，六要四。' },

    { id: 'MA1-U7-C13', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'choice', tier: 'up', skin: '凑十·拆数', tag: '解决问题',
      stem: ['小红做了 7 朵花，', '小明做了 5 朵花。'],
      ask: '两人一共做了几朵花？',
      opt: ['12', '11', '13'], ans: 0,
      why: '7 差 3 凑成 10，把 5 分成 3 和 2：7+3=10，10+2=12。',
      pit: '拆 5 要拆成 3 和 2（3 给 7 凑十），不是拆成 2 和 3 去给别的数。',
      rhyme: '七要三，五拆三和二，十加二得十二。' },

    { id: 'MA1-U7-J05', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'judge', tier: 'up', skin: '凑十·拆数', tag: '凑十法',
      stem: ['算 7 + 6，小明说：', '得数是 12。'],
      ask: '他说得对吗？', lead: '用凑十法自己算一遍',
      opt: ['对', '错'], ans: 1, shuffle: false,
      why: '7 差 3 凑成 10，把 6 分成 3 和 3：7+3=10，10+3=13。得数是 13，不是 12。',
      pit: '7+6 最容易错算成 12 —— 拆完 6 还剩 3，10+3=13，别把剩下的 3 记成 2。',
      rhyme: '七要三，六拆三和三，十加三得十三。' },

    /* ================= 第7单元 · 拓展探究 ================= */
    { id: 'MA1-U7-A04', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'advanced', tier: 'ext', skin: '凑十·拆数', tag: '凑十法',
      stem: ['两个加数都很大，别怕。'], ask: '8 + 9 = ？',
      opt: ['17', '16', '18'], ans: 0,
      why: '挑 9 来凑十：9 差 1，把 8 分成 1 和 7，9+1=10，10+7=17。（挑 8 也一样：8+2=10，10+7=17）',
      pit: '两个数都接近 10，随便挑一个凑十就行，别两个一起凑。',
      rhyme: '两个都大不用怕，挑一个凑十就好啦。',
      hint: '挑 9 来凑十，9 只要 1，那就从 8 里拿走 1，还剩几？' },

    { id: 'MA1-U7-A05', v: 1, subj: 'math', line: 'ineq', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'advanced', tier: 'ext', skin: '最大能填几', tag: '最大能填几',
      stem: ['□里最大能填几？'], ask: '9 + （ ） < 14',
      opt: ['4', '5', '6'], ans: 0,
      why: '9+5=14，题目要求「小于 14」，正好等于 14 不行，所以最大只能填 4（9+4=13）。',
      pit: '「<」是不能等于 —— 算出等于的那个数 5，还要再退 1 变成 4。',
      rhyme: '先算等于几，小于再退一。',
      hint: '先算 9 加几等于 14，再想想要比 14 小，该退多少。' },

    { id: 'MA1-U7-A06', v: 1, subj: 'math', line: 'ten', coord: U7, scope: { g: 1, ce: 0, u: 7 },
      kind: 'advanced', tier: 'ext', skin: '凑十·拆数', tag: '凑十法',
      stem: ['算 8 + 6，下面哪种', '拆法是对的？'],
      ask: '把 6 拆成几和几？',
      opt: ['2 和 4', '1 和 5', '3 和 3'], ans: 0,
      why: '8 差 2 凑成 10，所以 6 要拆成 2 和 4：8+2=10，10+4=14。',
      pit: '拆几要看另一个数差几到 10 —— 8 差 2，所以拿 2，不是拿 1。',
      rhyme: '看大数差几个，就从小数拿几个。',
      hint: '先想：8 再添上几就是 10？添上的那个数，就是要从 6 里拿出来的。' },

    /* ================= 第1单元 生活中的数 · 基础达标 ================= */
    { id: 'MA1-U1-J01', v: 1, subj: 'math', line: 'cmp', coord: U1, scope: { g: 1, ce: 0, u: 1 },
      kind: 'judge', tier: 'base', skin: '比多少', tag: '比多少',
      art: picTwo(5, 3, 'ball'), layout: { artW: 'md' },
      stem: ['左边有 5 个○，', '右边有 3 个○。'],
      ask: '左边的○比右边多。对吗？', lead: '先数一数两边各几个',
      opt: ['对', '错'], ans: 0, shuffle: false,
      why: '5 比 3 大，左边 5 个、右边 3 个，所以左边多，这句话是对的。',
      pit: '比多少先把两边数清楚，再比大小，别看谁画得大。',
      rhyme: '比多少，先数清，再比大小分得明。' },

    { id: 'MA1-U1-C01', v: 1, subj: 'math', line: 'cmp', coord: U1, scope: { g: 1, ce: 0, u: 1 },
      kind: 'choice', tier: 'base', skin: '比多少', tag: '比多少',
      art: picTwo(4, 7, 'ball'), layout: { artW: 'md' },
      stem: ['看图比一比。'], ask: '哪边的○多？',
      opt: ['左边', '右边'], ans: 1,
      why: '左边 4 个、右边 7 个，右边更多，所以选右边。',
      pit: '数清楚两边个数再比，别凭感觉。',
      rhyme: '谁多谁少数一数，比出来就不糊涂。' },

    { id: 'MA1-U1-C02', v: 1, subj: 'math', line: 'cmp', coord: U1, scope: { g: 1, ce: 0, u: 1 },
      kind: 'choice', tier: 'base', skin: '数字比大小', tag: '比大小',
      stem: ['比一比，在○里', '填上 >、< 或 =。'], ask: '7 ○ 9',
      opt: ['<', '>', '='], ans: 0,
      why: '7 比 9 小，小的数用小于号 <，开口朝大数，所以 7 < 9。',
      pit: '小于号 < 像张着嘴朝大数，大数在右边就填 <，别填反。',
      rhyme: '小对尖、大对宽，小于号朝大数。' },

    { id: 'MA1-U1-C03', v: 1, subj: 'math', line: 'cmp', coord: U1, scope: { g: 1, ce: 0, u: 1 },
      kind: 'choice', tier: 'base', skin: '数字比大小', tag: '比大小',
      stem: ['比一比，在○里', '填上 >、< 或 =。'], ask: '5 ○ 5',
      opt: ['<', '>', '='], ans: 2,
      why: '5 和 5 一样多，一样多用等于号 =。',
      pit: '两个数相等才填 =，别看到一样大就乱填。',
      rhyme: '同样多，用等号，两边一样齐。' },

    { id: 'MA1-U1-C04', v: 1, subj: 'math', line: 'cmp', coord: U1, scope: { g: 1, ce: 0, u: 1 },
      kind: 'choice', tier: 'base', skin: '算式比大小', tag: '比大小',
      stem: ['算一算，比一比。'], ask: '3 + 2 ○ 4',
      opt: ['>', '<', '='], ans: 0,
      why: '先算左边：3+2=5，5 比 4 大，所以填大于号 >。',
      pit: '比大小前先把算式算出来，拿得数去比，别直接比数字。',
      rhyme: '先算再比，才不会比错。' },

    { id: 'MA1-U1-C05', v: 1, subj: 'math', line: 'cmp', coord: U1, scope: { g: 1, ce: 0, u: 1 },
      kind: 'choice', tier: 'base', skin: '算式比大小', tag: '比大小',
      stem: ['算一算，比一比。'], ask: '4 + 1 ○ 6',
      opt: ['>', '<', '='], ans: 1,
      why: '先算左边：4+1=5，5 比 6 小，所以填小于号 <。',
      pit: '左边得数 5、右边 6，5 小，开口朝 6（右边）。',
      rhyme: '先算再比，才不会比错。' },

    /* ================= 第1单元 · 能力提升 + 拓展探究 ================= */
    { id: 'MA1-U1-A01', v: 1, subj: 'math', line: 'sort', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'advanced', tier: 'ext', skin: '从大到小排', tag: '排序',
      stem: ['把数排排队。'], ask: '把 2、9、5、4 从大到小排，排在最后的是（ ）。',
      opt: ['2', '9', '4'], ans: 0,
      why: '从大到小：9、5、4、2，排在最后（最小）的是 2。',
      pit: '从大到小是从最大的往下数，最后一个一定是最小的。',
      rhyme: '从大到小，越排越小，尾巴是最小。',
      hint: '先圈出最大的 9，再圈 5、4，最后剩下的就是最小的。' },

    { id: 'MA1-U1-A02', v: 1, subj: 'math', line: 'filter', coord: U0, scope: { g: 1, ce: 0, u: 0 },
      kind: 'advanced', tier: 'ext', skin: '小于N的挑出来', tag: '比大小',
      stem: ['比一比，挑一挑。'], ask: '比 6 小的数有（ ）个：1、3、8、2、5。',
      opt: ['4', '3', '5'], ans: 0,
      why: '比 6 小的有 1、3、2、5，一共 4 个；8 比 6 大，不算。',
      pit: '一个一个点名：小于 6 才数，8 要踢掉。',
      rhyme: '小于 N，挨个看，够小才数上。',
      hint: '把每个数和 6 比，比 6 小的打勾，再数勾了几个。' },

    /* ================= 第2单元 比较 · 基础达标 ================= */
    { id: 'MA1-U2-J01', v: 1, subj: 'math', line: 'compare', coord: U2, scope: { g: 1, ce: 0, u: 2 },
      kind: 'judge', tier: 'base', skin: '比长短', tag: '比长短',
      art: cmpLen(true), layout: { artW: 'md' },
      stem: ['红线和蓝线比长短，', '红线更长。'],
      ask: '他说得对吗？', lead: '看两条线谁长谁短',
      opt: ['对', '错'], ans: 0, shuffle: false,
      why: '红线画得比蓝线长，所以红线更长，他说的对。',
      pit: '比长短看线本身的长短，不看颜色。',
      rhyme: '比长短，看线身，长就是长别看色。' },

    { id: 'MA1-U2-C01', v: 1, subj: 'math', line: 'compare', coord: U2, scope: { g: 1, ce: 0, u: 2 },
      kind: 'choice', tier: 'base', skin: '比高矮', tag: '比高矮',
      art: cmpHt(true), layout: { artW: 'md' },
      stem: ['看图比高矮。'], ask: '谁高？',
      opt: ['左边', '右边'], ans: 0,
      why: '左边的人更高，所以选左边。',
      pit: '比高矮要从脚底对齐比，别看谁画在上方。',
      rhyme: '比高矮，脚对齐，谁高谁矮一眼知。' },

    { id: 'MA1-U2-C02', v: 1, subj: 'math', line: 'compare', coord: U2, scope: { g: 1, ce: 0, u: 2 },
      kind: 'choice', tier: 'base', skin: '比轻重', tag: '比轻重',
      art: cmpScale(true), layout: { artW: 'md' },
      stem: ['看图比轻重。'], ask: '哪边重？',
      opt: ['左边', '右边'], ans: 0,
      why: '天平往下沉的一边更重，左边往下沉，所以左边重。',
      pit: '天平低的那边重，翘起来的那边轻。',
      rhyme: '天平沉，那边重；天平翘，那边轻。' },

    { id: 'MA1-U2-C03', v: 1, subj: 'math', line: 'compare', coord: U2, scope: { g: 1, ce: 0, u: 2 },
      kind: 'choice', tier: 'base', skin: '比多少', tag: '比多少',
      art: picTwo(4, 7, 'ball'), layout: { artW: 'md' },
      stem: ['看图比多少。'], ask: '哪边多？',
      opt: ['左边', '右边'], ans: 1,
      why: '左边 4 个、右边 7 个，右边多。',
      pit: '数清楚两边个数再比，别凭感觉。',
      rhyme: '谁多谁少数一数，比出来就不糊涂。' },

    /* ================= 第2单元 · 能力提升 + 拓展探究 ================= */
    { id: 'MA1-U2-P01', v: 1, subj: 'math', line: 'compare', coord: U2, scope: { g: 1, ce: 0, u: 2 },
      kind: 'composite', tier: 'up', skin: '比高矮', tag: '一情境多问',
      stem: ['小明比小红高，', '小明也比小红重。'],
      sub: [
        { ask: '谁高？', opt: ['小明', '小红'], ans: 0, why: '小明比小红高，所以小明高。' },
        { ask: '谁重？', opt: ['小明', '小红'], ans: 0, why: '小明比小红重，所以小明重。' }
      ],
      why: '比高矮、比轻重都要看「谁和谁比」，题目说小明比小红高、重，答案都是小明。',
      pit: '两问都是小明和红红比，别把第二问看成比别的。',
      rhyme: '看清谁和谁比，答案才不跑偏。' },

    { id: 'MA1-U2-A01', v: 1, subj: 'math', line: 'compare', coord: U2, scope: { g: 1, ce: 0, u: 2 },
      kind: 'advanced', tier: 'ext', skin: '比长短', tag: '比长短',
      stem: ['三根绳子排排队。'], ask: '红最长，蓝最短，黄在中间。黄比红（ ）。',
      opt: ['长', '短'], ans: 1,
      why: '黄在红和蓝中间，比最长的红短，比最短的蓝长，所以黄比红短。',
      pit: '中间的总是比最大的小、比最小的大。',
      rhyme: '中间档，不大也不小。',
      hint: '红最长，黄在中间，那黄一定比红短一截。' },

    /* ================= 第4单元 分类 · 基础达标 ================= */
    { id: 'MA1-U4-C01', v: 1, subj: 'math', line: 'classify', coord: U4, scope: { g: 1, ce: 0, u: 4 },
      kind: 'choice', tier: 'base', skin: '挑出不同类', tag: '分类',
      art: shapeRow(['circ', 'circ', 'circ', 'sq']), layout: { artW: 'md' },
      stem: ['找出不同类。'], ask: '哪个图形不一样？',
      opt: ['第1个', '第2个', '第3个', '第4个'], ans: 3,
      why: '前三个都是圆形，第4个是方形，所以第4个不同类。',
      pit: '先看形状：三个圆里混了一个方，那个就是不同的。',
      rhyme: '长得不一样，就是不同类。' },

    { id: 'MA1-U4-C02', v: 1, subj: 'math', line: 'classify', coord: U4, scope: { g: 1, ce: 0, u: 4 },
      kind: 'choice', tier: 'base', skin: '挑出不同类', tag: '分类',
      art: shapeRow(['circ', 'sq', 'tri', 'circ']), layout: { artW: 'md' },
      stem: ['找出不同类。'], ask: '与众不同的是哪一个？',
      opt: ['第1个', '第2个', '第3个', '第4个'], ans: 2,
      why: '图里有圆、方、三角、圆，只有 1 个三角，所以第3个不同类。',
      pit: '数一数每种形状各有几个，单独一个的就是不同类。',
      rhyme: '长得不一样，就是不同类。' },

    { id: 'MA1-U4-C03', v: 1, subj: 'math', line: 'classify', coord: U4, scope: { g: 1, ce: 0, u: 4 },
      kind: 'choice', tier: 'base', skin: '同类归一堆', tag: '分类',
      art: shapeRow(['circ', 'sq', 'circ', 'sq']), layout: { artW: 'md' },
      stem: ['按颜色分一分。'], ask: '紫色的图形有（ ）个。',
      opt: ['2', '3', '4'], ans: 0,
      why: '第1个和第3个是紫色（圆），一共 2 个；第2、4是粉色（方）。',
      pit: '按颜色看，别被形状带偏，紫色的就是那两个圆。',
      rhyme: '按颜色归堆，紫的一堆、粉的一堆。' },

    /* ================= 第4单元 · 能力提升 + 拓展探究 ================= */
    { id: 'MA1-U4-P01', v: 1, subj: 'math', line: 'classify', coord: U4, scope: { g: 1, ce: 0, u: 4 },
      kind: 'composite', tier: 'up', skin: '同类归一堆', tag: '一情境多问',
      art: shapeRow(['circ', 'sq', 'circ', 'sq']), layout: { artW: 'md' },
      stem: ['图上有圆和方。'],
      sub: [
        { ask: '圆形有几个？', opt: ['2', '3', '1'], ans: 0, why: '第1、3个是圆，共2个。' },
        { ask: '方形有几个？', opt: ['2', '3', '1'], ans: 0, why: '第2、4个是方，共2个。' }
      ],
      why: '分类就是先看清每一类有什么，再一个个数清楚。',
      pit: '圆和方各数一遍，别漏数也别重复数。',
      rhyme: '一类一类数，清清楚楚。' },

    { id: 'MA1-U4-A01', v: 1, subj: 'math', line: 'classify', coord: U4, scope: { g: 1, ce: 0, u: 4 },
      kind: 'advanced', tier: 'ext', skin: '同类归一堆', tag: '分类',
      art: shapeRow(['circ', 'sq', 'tri', 'circ', 'sq']), layout: { artW: 'md' },
      stem: ['按形状分一分。'], ask: '这些图形能分成（ ）类。',
      opt: ['2', '3', '4'], ans: 1,
      why: '形状有圆、方、三角三种，所以能分成 3 类。',
      pit: '按形状看一共有几种不同的，就是能分几类。',
      rhyme: '形状有几种，就能分几类。',
      hint: '圈出圆、方、三角，数一数有几种不同的形状。' },

    /* ================= 第5单元 位置与顺序 · 基础达标 ================= */
    { id: 'MA1-U5-C01', v: 1, subj: 'math', line: 'pos', coord: U5, scope: { g: 1, ce: 0, u: 5 },
      kind: 'choice', tier: 'base', skin: '第几个', tag: '位置',
      art: seqRow(['#FF6B6B', '#4DABF7', '#37B24D', '#FFD43B', '#9775FA']), layout: { artW: 'md' },
      stem: ['从左往右数。'], ask: '第 3 个是什么颜色？',
      opt: ['绿色', '红色', '黄色'], ans: 0,
      why: '从左到右：第1红、第2蓝、第3绿、第4黄、第5紫，第3个是绿色。',
      pit: '数第几个要从指定的一头开始，这里从左数，别从右数。',
      rhyme: '第几个，先定头，从左还是从右数。' },

    { id: 'MA1-U5-C02', v:1, subj: 'math', line: 'pos', coord: U5, scope: { g: 1, ce: 0, u: 5 },
      kind: 'choice', tier: 'base', skin: '左右', tag: '位置',
      stem: ['小红的左边是小明。'], ask: '小明在小红的哪边？',
      opt: ['左边', '右边'], ans: 0,
      why: '小红说「左边是小明」，说明小明在她的左边。',
      pit: '「A 的左边是 B」= B 在 A 的左边，别反着说。',
      rhyme: '谁的左边是谁，就从谁出发看。' },

    { id: 'MA1-U5-C03', v: 1, subj: 'math', line: 'pos', coord: U5, scope: { g: 1, ce: 0, u: 5 },
      kind: 'choice', tier: 'base', skin: '上下', tag: '位置',
      stem: ['苹果放在盘子的上面。'], ask: '苹果在盘子的哪边？',
      opt: ['上面', '下面'], ans: 0,
      why: '题目说苹果在盘子上面，所以苹果在上面。',
      pit: '上就是高处的那一层，下是垫着的那一层。',
      rhyme: '上在上头，下在下头。' },

    { id: 'MA1-U5-C04', v: 1, subj: 'math', line: 'pos', coord: U5, scope: { g: 1, ce: 0, u: 5 },
      kind: 'choice', tier: 'base', skin: '前后', tag: '位置',
      stem: ['小明排在小红的前面。'], ask: '谁走在前面？',
      opt: ['小明', '小红'], ans: 0,
      why: '小明在小红前面，所以小明走在前面。',
      pit: '「A 在 B 前面」= A 靠前，别看成 B 靠前。',
      rhyme: '前面的人先走，后面的跟后头。' },

    /* ================= 第5单元 · 能力提升 + 拓展探究 ================= */
    { id: 'MA1-U5-P01', v: 1, subj: 'math', line: 'pos', coord: U5, scope: { g: 1, ce: 0, u: 5 },
      kind: 'composite', tier: 'up', skin: '第几个', tag: '一情境多问',
      stem: ['一排 5 个人，', '小明左数第 2。'],
      sub: [
        { ask: '小明从左数第几？', opt: ['第2', '第1', '第3'], ans: 0, why: '题目说了左数第2。' },
        { ask: '小明从右数第几？（共5人）', opt: ['第4', '第2', '第3'], ans: 0, why: '5人一排，左数第2，从右边数就是第4（5+1-2=4）。' }
      ],
      why: '同一排人，从左数和从右数位置会不同，要分清楚从哪头数。',
      pit: '右数的位置 = 总数 + 1 - 左数的位置。',
      rhyme: '从哪头数，就报哪头的第几。' },

    { id: 'MA1-U5-A01', v: 1, subj: 'math', line: 'pos', coord: U5, scope: { g: 1, ce: 0, u: 5 },
      kind: 'advanced', tier: 'ext', skin: '第几个', tag: '位置',
      stem: ['排队小窍门。'], ask: '5 个小朋友排队，从左边数第 2 个，从右边数第（ ）个。',
      opt: ['4', '3', '2'], ans: 0,
      why: '一共5人，左数第2，右数就是第4（5+1-2=4）。',
      pit: '右数位置 = 总人数 + 1 - 左数位置，别直接拿2当答案。',
      rhyme: '两头数，加起来，加1再减就出来。',
      hint: '画5个圈，从左标1~5，再倒着数，第2个从右是第几？' },

    /* ================= 第6单元 认识图形（立体图形）· 基础达标 ================= */
    { id: 'MA1-U6-C01', v: 1, subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'choice', tier: 'base', skin: '认立体图形', tag: '图形',
      art: solidImg('cube'), layout: { artW: 'sm' },
      stem: ['看图，认图形。'], ask: '图上的积木叫什么图形？',
      opt: ['正方体', '长方体', '球', '圆柱'], ans: 0,
      why: '方方正正、每个面都一样大，是正方体。',
      pit: '一上只学立体图形：正方体方方的、球圆圆的、圆柱两头圆、长方体长长。',
      rhyme: '方方正正是正方体。' },

    { id: 'MA1-U6-C02', v: 1, subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'choice', tier: 'base', skin: '认立体图形', tag: '图形',
      art: solidImg('cyl'), layout: { artW: 'sm' },
      stem: ['看图，认图形。'], ask: '这是什么立体图形？',
      opt: ['圆柱', '正方体', '球', '长方体'], ans: 0,
      why: '上下两个圆面、中间直直的，是圆柱。',
      pit: '圆柱两头是圆、能滚动；长方体两头是长方、滚不动。',
      rhyme: '两头圆圆是圆柱。' },

    { id: 'MA1-U6-C03', v: 1, subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'choice', tier: 'base', skin: '认立体图形', tag: '图形',
      art: solidImg('ball'), layout: { artW: 'sm' },
      stem: ['看图，认图形。'], ask: '图中的物体是什么形状？',
      opt: ['球', '圆柱', '正方体'], ans: 0,
      why: '圆滚滚、没有平平的面，是球。',
      pit: '球能到处滚；正方体有平平的面、站得稳。',
      rhyme: '圆滚滚的是球。' },

    { id: 'MA1-U6-C04', v: 1,subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'choice', tier: 'base', skin: '图形分类', tag: '图形',
      stem: ['下面的图形中，', '能滚起来的是（ ）。'],
      ask: '（球 / 正方体）',
      opt: ['球', '正方体'], ans: 0,
      why: '球圆滚滚能滚动，正方体方方的不能滚。',
      pit: '能滚的图形都有弯弯的面（球、圆柱），方方的滚不动。',
      rhyme: '有弯面才滚得动。' },

    { id: 'MA1-U6-C05', v: 1, subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'choice', tier: 'base', skin: '图形分类', tag: '图形',
      art: solidRow(['cube', 'cube', 'ball', 'cyl']), layout: { artW: 'md' },
      stem: ['数一数图中的积木。'], ask: '图上一共有（ ）个立体图形。',
      opt: ['4', '3', '5'], ans: 0,
      why: '2 个正方体、1 个球、1 个圆柱，一共 4 个立体图形。',
      pit: '一个一个数，数完再报总数，别漏掉哪个。',
      rhyme: '一个一个数，数全再报数。' },

    /* ================= 第6单元 · 能力提升 + 拓展探究 ================= */
    { id: 'MA1-U6-P01', v: 1, subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'composite', tier: 'up', skin: '图形分类', tag: '一情境多问',
      art: solidRow(['cube', 'cyl']), layout: { artW: 'md' },
      stem: ['看图中的积木。'],
      sub: [
        { ask: '正方体的面是（ ）的。', opt: ['方方平平', '圆圆的'], ans: 0, why: '正方体六个面都是方方平平的。' },
        { ask: '圆柱上下两个面是（ ）。', opt: ['圆', '方'], ans: 0, why: '圆柱上下是两个圆面。' }
      ],
      why: '立体图形的面有方有圆：正方体面方、圆柱两头圆。',
      pit: '别把圆柱两头想成方的，圆柱两头是圆。',
      rhyme: '方的是方、圆的是圆。' },

    { id: 'MA1-U6-A01', v: 1, subj: 'math', line: 'solidshape', coord: U6, scope: { g: 1, ce: 0, u: 6 },
      kind: 'advanced', tier: 'ext', skin: '图形分类', tag: '图形',
      stem: ['哪个站得稳？'], ask: '下面哪个图形能稳稳放在桌上？（ ）',
      opt: ['正方体', '球'], ans: 0,
      why: '正方体有平平的面，能站稳；球圆滚滚，放桌上会滚走。',
      pit: '有平平的面才站得稳，圆滚滚的球站不稳。',
      rhyme: '有平面才站得稳。',
      hint: '想想哪个图形一放就不动，哪个会滚。' },

    /* ================= 第8单元 认识钟表 · 基础达标 ================= */
    { id: 'MA1-U8-C01', v: 1, subj: 'math', line: 'clock', coord: U8, scope: { g: 1, ce: 0, u: 8 },
      kind: 'choice', tier: 'base', skin: '认整时', tag: '钟表',
      art: clockFace(3, 0), layout: { artW: 'sm' },
      stem: ['看钟面，认时间。'], ask: '现在是几时？',
      opt: ['3时', '9时', '6时'], ans: 0,
      why: '分针指着 12、时针指着 3，就是 3 时（整时）。',
      pit: '整时：分针一定指着 12，看时针指着几就是几时。',
      rhyme: '分针指12，时针指几是几时。' },

    { id: 'MA1-U8-C02', v: 1, subj: 'math', line: 'clock', coord: U8, scope: { g: 1, ce: 0, u: 8 },
      kind: 'choice', tier: 'base', skin: '认整时', tag: '钟表',
      art: clockFace(8, 0), layout: { artW: 'sm' },
      stem: ['看钟面，认时间。'], ask: '钟面上现在是几时？',
      opt: ['8时', '3时', '12时'], ans: 0,
      why: '分针指着 12、时针指着 8，就是 8 时（整时）。',
      pit: '整时看时针：时针指着 8 就是 8 时，别看分针。',
      rhyme: '分针指12，时针指几是几时。' },

    { id: 'MA1-U8-C03', v: 1, subj: 'math', line: 'clock', coord: U8, scope: { g: 1, ce: 0, u: 8 },
      kind: 'choice', tier: 'base', skin: '认半时', tag: '钟表',
      art: clockFace(3, 30), layout: { artW: 'sm' },
      stem: ['看钟面，认时间。'], ask: '现在是几时半？',
      opt: ['3时半', '4时半', '3时'], ans: 0,
      why: '分针指着 6、时针走到 3 和 4 中间，就是 3 时半。',
      pit: '半时：分针一定指着 6，时针在两个数字中间，看它刚走过几就是几时半。',
      rhyme: '分针指6，时针走一半，是几时半。' },

    { id: 'MA1-U8-C04', v: 1, subj: 'math', line: 'clock', coord: U8, scope: { g: 1, ce: 0, u: 8 },
      kind: 'choice', tier: 'base', skin: '认半时', tag: '钟表',
      art: clockFace(9, 30), layout: { artW: 'sm' },
      stem: ['看钟面，认时间。'], ask: '钟面上是几时半？',
      opt: ['9时半', '9时', '10时半'], ans: 0,
      why: '分针指着 6、时针走到 9 和 10 中间，就是 9 时半。',
      pit: '半时看时针刚走过几：走过 9，就是 9 时半，不是 10 时半。',
      rhyme: '分针指6，时针走一半，是几时半。' },

    /* ================= 第8单元 · 能力提升 + 拓展探究 ================= */
    { id: 'MA1-U8-P01', v: 1, subj: 'math', line: 'clock', coord: U8, scope: { g: 1, ce: 0, u: 8 },
      kind: 'composite', tier: 'up', skin: '认整时', tag: '一情境多问',
      stem: ['小明每天 7 时起床，', '7 时半吃早饭。'],
      sub: [
        { ask: '他几时起床？', opt: ['7时', '7时半', '8时'], ans: 0, why: '题目说 7 时起床。' },
        { ask: '他几时吃早饭？', opt: ['7时半', '7时', '8时半'], ans: 0, why: '题目说 7 时半吃早饭。' }
      ],
      why: '认时间要分清整时（分针指12）和半时（分针指6），题目写的就是答案。',
      pit: '起床是整时 7 时、早饭是半时 7 时半，别看混。',
      rhyme: '整时半时看清，再对号入座。' },

    { id: 'MA1-U8-A01', v: 1, subj: 'math', line: 'clock', coord: U8, scope: { g: 1, ce: 0, u: 8 },
      kind: 'advanced', tier: 'ext', skin: '认半时', tag: '钟表',
      stem: ['看时针和分针。'], ask: '时针在 8 和 9 中间，分针指向 6，是（ ）。',
      opt: ['8时半', '9时半'], ans: 0,
      why: '分针指向 6 是半时；时针走到 8 和 9 中间，就是 8 时半。',
      pit: '半时看时针刚走过几：刚走过 8，就是 8 时半，不是 9 时半。',
      rhyme: '分针指6是半时，时针走过几是几时半。',
      hint: '分针指6一定半时；时针在8、9中间，就是8时半。' }
  ];
})();
