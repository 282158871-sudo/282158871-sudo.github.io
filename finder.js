/* ================================================================
   网上找资料（练习包内的一个工具）· v1
   ---------------------------------------------------------------
   挂在「练习包」页里，按需加载（跟 english_g1.js 一样的套路）：
   主文件只留一个按钮和一个容器，本文件负责全部内容与交互。

   它做什么：
     ① 选册次/学科/单元 → 拼出精准搜索词
     ② 一键直达「免费官方题源」的搜索结果（不抓取、不破解、不代下载）
     ③ 找到的资料存进资料箱（本地）
     ④ 把题目粘进来 → 直接存进练习包（孩子马上能做）/ 出长图 / 存 PDF

   它不做：不爬取任何站点内容、不绕登录墙、不下载付费资源。
   ================================================================ */
(function () {
  'use strict';

  var CN = ['', '一', '二', '三', '四', '五', '六'];
  var TERMS = [['上', '上册'], ['下', '下册']];
  var SUBJ = [{ k: 'math', n: '数学' }, { k: 'chinese', n: '语文' }];
  var VERS = { math: ['人教版', '北师大版', '苏教版'], chinese: ['统编版（部编）'] };
  var UNITS = {
    math: {
      '1上': ['准备课', '位置', '1-5的认识和加减法', '认识图形（一）', '6-10的认识和加减法', '11-20各数的认识', '认识钟表', '20以内的进位加法', '期中复习', '期末复习'],
      '1下': ['认识图形（二）', '20以内的退位减法', '分类与整理', '100以内数的认识', '认识人民币', '100以内的加法和减法（一）', '找规律', '期中复习', '期末复习']
    },
    chinese: {
      '1上': ['我上学了', '第一单元 识字', '第二单元 汉语拼音', '第三单元 汉语拼音', '第四单元 课文', '第五单元 识字', '第六单元 课文', '第七单元 课文', '第八单元 课文', '期末复习'],
      '1下': ['第一单元 识字', '第二单元 课文', '第三单元 课文', '第四单元 课文', '第五单元 识字', '第六单元 课文', '第七单元 课文', '第八单元 课文', '期末复习']
    }
  };
  var KINDS = [
    { k: 'daily', n: '每日一练', q: '每日一练' },
    { k: 'lesson', n: '课时练', q: '课时练 同步练习' },
    { k: 'unit', n: '单元测试卷', q: '单元测试卷 含答案' },
    { k: 'mid', n: '期中卷', q: '期中测试卷 含答案' },
    { k: 'final', n: '期末卷', q: '期末测试卷 含答案' },
    { k: 'ks', n: '专项·口算', q: '口算 专项训练' },
    { k: 'calc', n: '专项·计算', q: '计算 专项训练' },
    { k: 'lit', n: '专项·识字默写', q: '识字 默写 专项训练' },
    { k: 'hol', n: '假期作业', q: '寒暑假作业' },
    { k: 'zs', n: '小升初', q: '小升初 总复习 卷', only6: true }
  ];
  /* 只列免费源。off=官方免费（给「进官网」+「站内搜」）；pub=公共检索（版权自行辨别） */
  var SOURCES = [
    { n: '国家中小学智慧教育平台', lv: 'off', d: '教育部官方：有习题库和组卷功能，可下题目文档、答案文档（含小学数学），需登录', home: 'https://basic.smartedu.cn/', site: 'basic.smartedu.cn' },
    { n: '龙门书局（黄冈小状元出版方）', lv: 'off', d: '黄冈小状元就是这家出的：电子样书、配套视听资源、解题课件', home: 'https://www.longmenshuju.com/', site: 'longmenshuju.com' },
    { n: '状元共享课堂', lv: 'off', d: '黄冈小状元配套资源，电脑端「我的书包」', home: 'https://xzykt.longmenshuju.com/', site: 'longmenshuju.com' },
    { n: '阳光同学学习平台', lv: 'off', d: '阳光同学官方：电子样书、电子试卷、配套听力、名师课程', home: 'https://www.edutech.com.cn/newsite/ygtx.html', site: 'edutech.com.cn' },
    { n: '人教网', lv: 'off', d: '人教版/统编教材官网：电子教材与配套资源', home: 'https://www.pep.com.cn/', site: 'pep.com.cn' },
    { n: '百度（全网）', lv: 'pub', d: '量最大，含各类文库和网盘转载，版权自行辨别', url: 'https://www.baidu.com/s?wd=' },
    { n: '必应（找 PDF 更全）', lv: 'pub', d: '搜 PDF、文档比百度更全', url: 'https://www.bing.com/search?q=' },
    { n: '百度文库', lv: 'pub', d: '文档多，但版权混杂，注意辨别', url: 'https://wenku.baidu.com/search?word=' },
    { n: '微信公众号文章', lv: 'pub', d: '不少老师/公众号会分享资料', url: 'https://weixin.sogou.com/weixin?type=2&query=' }
  ];
  var STATES = ['想找', '已存', '已打印', '已做'];
  var TYPES = [['kousuan', '口算'], ['quiz', '选择'], ['other', '填空/问答'], ['hanzi', '识字'], ['apply', '应用题']];
  var LET = ['A', 'B', 'C', 'D', 'E', 'F'];
  var KEY = 'wb_finder_v1';

  /* ---------- 状态 ---------- */
  function defGrade() {
    var g = 1;
    try { if (typeof gradeNow === 'function') { var v = gradeNow('hanzi'); if (v >= 1 && v <= 6) g = v; } } catch (e) {}
    var m = new Date().getMonth() + 1;                 /* 9-1 月上学期，2-7 月下学期 */
    var t = (m >= 9 || m <= 1) ? '上' : '下';
    return { g: g, t: t };
  }
  var dg = defGrade();
  var S = { sel: { g: dg.g, t: dg.t, subj: 'math', ver: '人教版', unit: '', kind: 'unit' }, pdf: false, box: [], filter: 'all' };
  var ITEMS = [];

  function load() {
    try {
      var r = localStorage.getItem(KEY); if (!r) return;
      var o = JSON.parse(r); if (!o || typeof o !== 'object') return;
      if (o.sel) for (var k in o.sel) { if (S.sel[k] !== undefined && o.sel[k] !== undefined) S.sel[k] = o.sel[k]; }
      if (typeof o.pdf === 'boolean') S.pdf = o.pdf;
      if (Array.isArray(o.box)) S.box = o.box;
    } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function say(msg, ic, color) { try { if (typeof toast === 'function') toast(msg, ic || 'check', color || '#3ECF6E'); } catch (e) {} }
  function icn(n, sz, c) { try { if (typeof icon === 'function') return icon(n, sz || 20, c || '#FF7E9D'); } catch (e) {} return ''; }

  /* ---------- 样式（只注入一次，沿用工作台的配色变量） ---------- */
  function ensureCss() {
    if (document.getElementById('fd-css')) return;
    var st = document.createElement('style'); st.id = 'fd-css';
    st.textContent =
      '.fd-wrap{padding:2px 0}' +
      '.fd-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px}' +
      '.fd-chip{min-height:40px;padding:8px 14px;border:2px solid #F0E2E7;border-radius:999px;background:#fff;' +
      'font-size:14px;font-weight:800;color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;user-select:none}' +
      '.fd-chip.on{background:var(--blue);border-color:var(--blue);color:#fff}' +
      '.fd-chip.g.on{background:var(--green);border-color:var(--green)}' +
      '.fd-chip.y.on{background:var(--yellow);border-color:var(--yellow);color:#7A5200}' +
      '.fd-lbl{font-size:13px;font-weight:800;color:var(--ink-2);margin:14px 0 7px}' +
      '.fd-lbl:first-child{margin-top:0}' +
      '.fd-q{background:var(--blue-l);border-radius:12px;padding:12px}' +
      '.fd-q input{width:100%;border:0;background:transparent;font-size:16px;font-weight:800;color:#0B3D66;outline:none;font-family:inherit}' +
      '.fd-srcs{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}' +
      '@media(min-width:700px){.fd-srcs{grid-template-columns:1fr 1fr}}' +
      '.fd-src{border:2px solid #F0E2E7;border-radius:14px;padding:11px 12px;background:#fff}' +
      '.fd-src.off{border-color:var(--green-l);background:#FAFFFC}' +
      '.fd-src .n{font-weight:800;font-size:14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
      '.fd-src .d{font-size:12px;color:var(--ink-2);margin:5px 0 9px;line-height:1.55}' +
      '.fd-tg{font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px}' +
      '.fd-tg.a{background:var(--green-l);color:#1E8F45}' +
      '.fd-tg.b{background:#F4ECF0;color:var(--ink-2)}' +
      '.fd-item{border:2px solid #F0E2E7;border-radius:14px;padding:12px;margin-bottom:10px;background:#fff}' +
      '.fd-item .t{font-weight:800;font-size:14px;word-break:break-all}' +
      '.fd-item .m{font-size:12px;color:var(--ink-2);margin-top:3px;word-break:break-all}' +
      '.fd-st{font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:var(--yellow-l);color:#8B6914;cursor:pointer}' +
      '.fd-st.s0{background:#F4ECF0;color:var(--ink-2)}.fd-st.s1{background:var(--blue-l);color:#1864AB}' +
      '.fd-st.s2{background:var(--purple-l);color:#6741D9}.fd-st.s3{background:var(--green-l);color:#1E8F45}' +
      '.fd-qi{border:2px solid #F0E2E7;border-radius:12px;padding:10px;margin-bottom:9px;background:#fff}' +
      '.fd-qi .no{font-weight:800;color:#1864AB;font-size:13px}' +
      '.fd-qi .qq{font-size:15px;font-weight:700;margin:5px 0 8px;word-break:break-all}' +
      '.fd-opt{display:inline-block;padding:6px 11px;border:2px solid #F0E2E7;border-radius:999px;font-size:13px;' +
      'background:#fff;cursor:pointer;font-weight:700;margin:3px 5px 3px 0}' +
      '.fd-opt.on{background:var(--green);border-color:var(--green);color:#fff}' +
      '.fd-ans{font-size:13px;color:#1E8F45;font-weight:800;margin-top:6px}' +
      '.fd-ans.bad{color:var(--red)}' +
      '.fd-in{width:100%;border:2px solid #F0E2E7;border-radius:10px;padding:9px 11px;font-size:14px;font-family:inherit;' +
      'min-height:42px;background:#fff;outline:none}' +
      '.fd-sel{border:2px solid #F0E2E7;border-radius:10px;padding:8px 10px;font-size:14px;font-family:inherit;min-height:42px;background:#fff}' +
      'img#fd-img{width:100%;border:2px solid #F0E2E7;border-radius:12px;display:block;margin-top:10px}';
    document.head.appendChild(st);
  }

  /* ---------- 条件 ---------- */
  function gradeList() {
    var a = [];
    for (var g = 1; g <= 6; g++) { TERMS.forEach(function (t) { a.push({ k: g + t[0], n: CN[g] + t[0] }); }); }
    return a;
  }
  function unitList() {
    var key = S.sel.g + S.sel.t, u = UNITS[S.sel.subj];
    if (u && u[key]) return u[key];
    var a = []; for (var i = 1; i <= 8; i++) a.push('第' + i + '单元');
    a.push('期中复习'); a.push('期末复习'); a.push('总复习'); return a;
  }
  function kindList() { return KINDS.filter(function (k) { return !k.only6 || S.sel.g === 6; }); }
  function kindObj() { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].k === S.sel.kind) return KINDS[i]; return KINDS[2]; }
  function gradeName() { return CN[S.sel.g] + '年级' + TERMS[S.sel.t === '上' ? 0 : 1][1]; }
  function subjName() { return S.sel.subj === 'math' ? '数学' : '语文'; }
  function chips(list, cur, f, cls) {
    return '<div class="fd-chips">' + list.map(function (o) {
      return '<div class="fd-chip ' + (cls || '') + (o.k === cur ? ' on' : '') + '" data-fd="' + f + '" data-k="' + esc(o.k) + '">' + esc(o.n) + '</div>';
    }).join('') + '</div>';
  }

  /* ---------- 搜索词与来源 ---------- */
  function buildQuery() {
    var p = [gradeName() + ' ' + subjName() + ' ' + S.sel.ver];
    if (S.sel.unit) p.push(S.sel.unit);
    p.push(kindObj().q);
    return p.join(' ').replace(/\s+/g, ' ').trim();
  }
  function withPdf(q) { return q + (S.pdf ? ' filetype:pdf' : ''); }
  function openUrl(u) { try { window.open(u, '_blank', 'noopener'); } catch (e) { try { location.href = u; } catch (e2) {} } }

  /* ---------- 题目解析 ---------- */
  function parseItems(text) {
    var lines = String(text || '').split(/\r?\n/), out = [], cur = null;
    function pushOpt(txt) {
      var m = String(txt).trim().match(/^([A-F])[\.、．）\)]\s*(.*)$/);
      if (!m || !cur) return false;
      if (m[1] !== LET[cur.choices.length]) return false;
      cur.choices.push(m[2].trim() || ('选项' + m[1]));
      return true;
    }
    function newQ(q) {
      q = String(q).replace(/^[（(]?\d{1,2}[)）\.、]\s*/, '').trim();
      if (!q) return;
      cur = { q: q, choices: [], type: '', ans: '', correct: -1, tip: '' }; out.push(cur);
    }
    lines.forEach(function (raw) {
      var t = String(raw).trim(); if (!t) return;
      if (/^[A-F][\.、．）\)]/.test(t)) {           /* 整行都是选项，可能一行挤了几个 */
        var ok = false;
        t.split(/(?=[B-F][\.、．）\)]\s*\S)/).forEach(function (s) { if (pushOpt(s)) ok = true; });
        if (ok) return;
      }
      var mi = t.search(/[A][\.、．）\)]\s+\S/);     /* 题干和选项挤在同一行 */
      if (mi > 0) {
        newQ(t.slice(0, mi));
        t.slice(mi).split(/(?=[B-F][\.、．）\)]\s*\S)/).forEach(function (s) { pushOpt(s); });
        return;
      }
      newQ(t);
    });
    out.forEach(function (it) { classify(it); });
    return out;
  }
  function classify(it) {
    var s = it.q.replace(/\s/g, '').replace(/＋/g, '+').replace(/－/g, '-').replace(/＝/g, '=')
      .replace(/[（(]\s*[)）]/g, '()').replace(/[？?]/g, '');
    var m = s.match(/^(\d{1,4})([+\-×xX*÷\/])(\d{1,4})=?\(?\)?$/);
    if (m) {
      var a = parseInt(m[1], 10), b = parseInt(m[3], 10), op = m[2], v = null;
      if (op === '+') v = a + b;
      else if (op === '-') v = a - b;
      else if (op === '×' || op === 'x' || op === 'X' || op === '*') v = a * b;
      else if (op === '÷' || op === '/') { v = (b !== 0 && a % b === 0) ? a / b : null; }
      if (v !== null && v >= 0) {
        var opShow = (op === '*' ? '×' : (op === '/' ? '÷' : op));
        it.ans = String(v); it.tip = a + ' ' + opShow + ' ' + b + ' = ' + v;
        if (it.choices.length >= 2) {
          var hit = -1;
          it.choices.forEach(function (c, i) { if (hit < 0 && String(c).replace(/[^\d\-]/g, '') === String(v)) hit = i; });
          if (hit >= 0) { it.type = 'kousuan'; it.correct = hit; return; }
          it.type = 'quiz'; it.correct = -1; return;
        }
        it.type = 'kousuan'; it.q = a + ' ' + opShow + ' ' + b + ' = ( )';
        var pool = [v], add = [1, -1, 2, 10, -2];
        for (var i = 0; i < add.length && pool.length < 4; i++) { var c = v + add[i]; if (c >= 0 && pool.indexOf(c) < 0) pool.push(c); }
        while (pool.length < 4) pool.push(v + pool.length + 20);
        pool = shuffle(pool.slice(0, 4));
        it.choices = pool.map(String); it.correct = pool.indexOf(v);
        return;
      }
    }
    if (it.choices.length >= 2) { it.type = 'quiz'; it.correct = -1; return; }
    it.type = 'other';
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- 一键生成（本机出题·免费，不抓网、断网可用） ---------- */
  var HANZI_P = [
    ['rì yuè', '日月'], ['shuǐ huǒ', '水火'], ['shān shí', '山石'], ['tián tǔ', '田土'],
    ['shàng xià', '上下'], ['dà xiǎo', '大小'], ['rén kǒu', '人口'], ['ěr mù', '耳目'],
    ['shǒu zú', '手足'], ['rì zi', '日子'], ['dà huǒ', '大火'], ['mù tou', '木头'],
    ['kǒu shuǐ', '口水'], ['huǒ shān', '火山'], ['xiǎo niǎo', '小鸟'], ['shuǐ niú', '水牛'],
    ['mù mǎ', '木马'], ['bái yún', '白云'], ['yuè er', '月儿'], ['dà shān', '大山'],
    ['huǒ miáo', '火苗'], ['shuǐ tián', '水田'], ['rù kǒu', '入口'], ['kāi mén', '开门']
  ];
  var ANTON = [
    ['大', '小'], ['上', '下'], ['多', '少'], ['来', '去'], ['开', '关'], ['男', '女'],
    ['前', '后'], ['左', '右'], ['里', '外'], ['黑', '白'], ['高', '低'], ['哭', '笑'],
    ['早', '晚'], ['出', '入'], ['冷', '热'], ['远', '近'], ['快', '慢'], ['新', '旧']
  ];
  var ZUC = [
    ['木', ['木头', '木马', '树木'], ['大火', '水火', '日月']],
    ['水', ['水果', '口水', '水牛'], ['火山', '木头', '大山']],
    ['火', ['火山', '大火', '火苗'], ['水牛', '木头', '白云']],
    ['日', ['日子', '日月', '日光'], ['月儿', '大山', '耳目']],
    ['口', ['口水', '门口', '开口'], ['耳目', '手足', '火山']],
    ['人', ['人口', '大人', '好人'], ['木头', '日月', '火山']],
    ['山', ['大山', '火山', '山水'], ['日子', '口水', '白云']]
  ];
  function rint(n) { return Math.floor(Math.random() * n); }
  function pickOne(a) { return a[rint(a.length)]; }
  function mkCalc(a, b, op, opShow) {
    var v = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : (b !== 0 && a % b === 0) ? a / b : null;
    if (v === null || v < 0) return null;
    var q = a + ' ' + opShow + ' ' + b + ' = ( )';
    var pool = [v], add = [1, -1, 2, 10, -2, 3];
    for (var i = 0; i < add.length && pool.length < 4; i++) { var c = v + add[i]; if (c >= 0 && pool.indexOf(c) < 0) pool.push(c); }
    while (pool.length < 4) pool.push(v + pool.length + 7);
    pool = shuffle(pool.slice(0, 4));
    return { q: q, choices: pool.map(String), type: 'kousuan', ans: String(v), correct: pool.indexOf(v), tip: a + ' ' + opShow + ' ' + b + ' = ' + v };
  }
  function mathItems(n, g, t) {
    var out = [], guard = 0;
    while (out.length < n && guard++ < n * 6) {
      var it = null;
      if (g <= 1 && t === '上') {                       /* 10 以内加减 */
        var op = pickOne(['+', '-']), a, b;
        if (op === '+') { a = rint(10); b = rint(10 - a); } else { b = rint(10); a = b + rint(10 - b); }
        it = mkCalc(a, b, op, op);
      } else if (g <= 1 && t === '下') {                /* 20 以内进位加 / 退位减 */
        var op2 = pickOne(['+', '-']), a2, b2;
        if (op2 === '+') { a2 = rint(10) + 1; b2 = rint(10 - a2) + 1; if (a2 + b2 > 20) b2 = 20 - a2; } else { b2 = rint(20); a2 = b2 + rint(20 - b2); }
        it = mkCalc(a2, b2, op2, op2);
      } else if (g === 2) {                             /* 100 以内加减 + 表内乘法 */
        var op3 = pickOne(['+', '-', '×']), a3, b3;
        if (op3 === '×') { a3 = rint(9) + 1; b3 = rint(9) + 1; it = mkCalc(a3, b3, op3, '×'); }
        else if (op3 === '+') { a3 = rint(90); b3 = rint(99 - a3); it = mkCalc(a3, b3, '+', '+'); }
        else { b3 = rint(90); a3 = b3 + rint(99 - b3); it = mkCalc(a3, b3, '-', '-'); }
      } else if (g === 3 || g === 4) {                  /* 加减乘除（含表外） */
        var op4 = pickOne(['+', '-', '×', '÷']), a4, b4;
        if (op4 === '÷') { b4 = rint(9) + 1; a4 = b4 * (rint(9) + 1); it = mkCalc(a4, b4, op4, '÷'); }
        else if (op4 === '×') { a4 = rint(12) + 1; b4 = rint(12) + 1; it = mkCalc(a4, b4, op4, '×'); }
        else if (op4 === '+') { a4 = rint(900) + 10; b4 = rint(900) + 10; it = mkCalc(a4, b4, '+', '+'); }
        else { b4 = rint(900) + 10; a4 = b4 + rint(900); it = mkCalc(a4, b4, '-', '-'); }
      } else {                                          /* 5-6：大数 + 乘除 */
        var op5 = pickOne(['+', '-', '×', '÷']), a5, b5;
        if (op5 === '÷') { b5 = rint(12) + 1; a5 = b5 * (rint(12) + 1); it = mkCalc(a5, b5, op5, '÷'); }
        else if (op5 === '×') { a5 = rint(20) + 1; b5 = rint(20) + 1; it = mkCalc(a5, b5, op5, '×'); }
        else { a5 = rint(5000) + 100; b5 = rint(5000) + 100; it = mkCalc(a5, b5, op5 === '+' ? '+' : '-', op5 === '+' ? '+' : '-'); }
      }
      if (it) out.push(it);
    }
    return out;
  }
  function chineseItems(n, g, t) {
    var out = [];
    var pool = shuffle(HANZI_P).slice(0, Math.max(4, Math.min(n - 3, HANZI_P.length)));
    pool.forEach(function (p) { out.push({ q: p[0], choices: [], type: 'hanzi', ans: p[1], correct: -1, tip: '答案：' + p[1] }); });
    var ant = shuffle(ANTON).slice(0, Math.max(2, Math.ceil((n - out.length) / 2)));
    ant.forEach(function (a) {
      var others = shuffle(ANTON.filter(function (x) { return x[1] !== a[1] && x[0] !== a[0]; })).slice(0, 3).map(function (x) { return x[1]; });
      var opts = shuffle([a[1]].concat(others)).slice(0, 4);
      out.push({ q: '「' + a[0] + '」的反义词是？', choices: opts, type: 'quiz', ans: a[1], correct: opts.indexOf(a[1]), tip: '反义词：' + a[0] + ' ↔ ' + a[1] });
    });
    var zc = shuffle(ZUC).slice(0, Math.max(1, n - out.length));
    zc.forEach(function (z) {
      var opts = shuffle(z[1].concat(z[2])).slice(0, 4);
      out.push({ q: '下面哪个词里有「' + z[0] + '」字？', choices: opts, type: 'quiz', ans: z[1][0], correct: opts.indexOf(z[1][0]), tip: '含「' + z[0] + '」：' + z[1].join('、') });
    });
    return out.slice(0, n);
  }
  function genItems(n) {
    try {
      if (!(n >= 3)) n = 10; if (n > 30) n = 30;
      var a = S.sel.subj === 'math' ? mathItems(n, S.sel.g, S.sel.t) : chineseItems(n, S.sel.g, S.sel.t);
      return a && a.length ? a : [];
    } catch (e) { return []; }
  }

  /* ---------- 渲染 ---------- */
  function html() {
    var h = '<div class="fd-wrap">' +
      '<div class="admin-tip" style="margin:0 0 12px">这是<b>给家长用的</b>：选好册次和单元，工具帮你拼出搜索词，再点来源直达该站搜索结果，你自己看、自己下载。' +
      '<b>它不抓取任何网站</b>，所以不会哪天失效，也不碰版权。</div>';

    /* ① 条件 */
    h += '<div class="fd-lbl">册次</div>' + chips(gradeList(), S.sel.g + S.sel.t, 'grade', '');
    h += '<div class="fd-lbl">学科</div>' + chips(SUBJ, S.sel.subj, 'subj', 'g');
    h += '<div class="fd-lbl">版本</div>' + chips(VERS[S.sel.subj].map(function (v) { return { k: v, n: v }; }), S.sel.ver, 'ver', 'y');
    h += '<div class="fd-lbl">单元 · 知识点</div>' + chips(
      (['不限（整册）'].concat(unitList())).map(function (u) { return { k: (u === '不限（整册）' ? '' : u), n: u }; }), S.sel.unit, 'unit', 'y');
    h += '<div class="fd-lbl">资料类型</div>' + chips(kindList(), S.sel.kind, 'kind', 'y');

    /* ② 搜索词 + 来源 */
    var q = buildQuery();
    h += '<div class="fd-lbl">搜索词（可以自己改）</div><div class="fd-q"><input id="fd-qi" value="' + esc(q) + '" spellcheck="false"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="btn btn-blue" data-fd="copy">复制搜索词</button>' +
      '<button class="btn ' + (S.pdf ? 'btn-yellow' : 'btn-ghost') + '" data-fd="pdf">只找 PDF：' + (S.pdf ? '开' : '关') + '</button>' +
      '<button class="btn btn-green" data-fd="savebox">存进资料箱</button>' +
      '</div><div class="fd-srcs">' +
      SOURCES.map(function (s, i) {
        var off = s.lv === 'off';
        var acts = off
          ? '<button class="btn btn-blue" style="min-height:38px;padding:6px 12px;font-size:13px" data-fd="open" data-how="home" data-i="' + i + '">进官网</button>' +
            '<button class="btn btn-ghost" style="min-height:38px;padding:6px 12px;font-size:13px" data-fd="open" data-how="site" data-i="' + i + '">站内搜</button>'
          : '<button class="btn btn-blue" style="min-height:38px;padding:6px 12px;font-size:13px" data-fd="open" data-how="pub" data-i="' + i + '">打开搜索结果</button>';
        return '<div class="fd-src ' + (off ? 'off' : '') + '">' +
          '<div class="n">' + esc(s.n) + '<span class="fd-tg ' + (off ? 'a' : 'b') + '">' + (off ? '官方免费' : '公共检索') + '</span></div>' +
          '<div class="d">' + esc(s.d) + '</div>' +
          '<div style="display:flex;gap:7px;flex-wrap:wrap">' + acts + '</div></div>';
      }).join('') + '</div>';

    /* ③ 资料箱 */
    var list = S.box.filter(function (it) { return S.filter === 'all' || String(it.state) === S.filter; });
    h += '<div class="divider" style="height:1px;background:#F0E2E7;margin:16px 0"></div>' +
      '<div class="fd-lbl" style="font-size:15px;color:var(--ink)">' + icn('star', 18, '#FFB93C') + ' 资料箱（' + S.box.length + '）</div>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">' +
      ['all', '0', '1', '2', '3'].map(function (f) {
        return '<button class="btn ' + (S.filter === f ? 'btn-blue' : 'btn-ghost') + '" style="min-height:34px;padding:5px 11px;font-size:13px" data-fd="filter" data-k="' + f + '">' +
          (f === 'all' ? '全部' : STATES[+f]) + '</button>';
      }).join('') + '</div>';
    h += list.length ? list.map(function (it) {
      return '<div class="fd-item"><div class="t">' + esc(it.title) + '</div>' +
        '<div class="m">' + esc(it.meta || '') + (it.src ? ' · 来自 ' + esc(it.src) : '') + '</div>' +
        (it.url ? '<div class="m">' + esc(it.url) + '</div>' : '') +
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;align-items:center">' +
        '<span class="fd-st s' + it.state + '" data-fd="bstate" data-id="' + it.id + '">' + STATES[it.state] + '</span>' +
        '<span class="btn btn-ghost" style="min-height:34px;padding:5px 11px;font-size:13px" data-fd="bstar" data-id="' + it.id + '">' +
        '★'.repeat(it.star || 0) + '☆'.repeat(3 - (it.star || 0)) + '</span>' +
        (it.url ? '<a class="btn btn-blue" style="min-height:34px;padding:5px 11px;font-size:13px" href="' + esc(it.url) + '" target="_blank" rel="noopener">打开</a>' : '') +
        '<span class="btn btn-ghost" style="min-height:34px;padding:5px 11px;font-size:13px" data-fd="bdel" data-id="' + it.id + '">删除</span>' +
        '</div>' +
        '<input class="fd-in" style="margin-top:8px" placeholder="备注" value="' + esc(it.note || '') + '" data-fd="bnote" data-id="' + it.id + '">' +
        '</div>';
    }).join('') : '<div class="admin-tip" style="text-align:center;margin:0">还没有存东西，找到好资料就点上面的「存进资料箱」。</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<input class="fd-in" id="fd-mt" placeholder="标题，如：一上数学第三单元卷" style="flex:2;min-width:160px">' +
      '<input class="fd-in" id="fd-mu" placeholder="链接（可留空）" style="flex:3;min-width:180px">' +
      '<button class="btn btn-green" data-fd="addbox">加进箱子</button></div>';

    /* ④ 题 → 练习包 */
    h += '<div class="divider" style="height:1px;background:#F0E2E7;margin:16px 0"></div>' +
      '<div class="fd-lbl" style="font-size:15px;color:var(--ink)">' + icn('pen', 18, '#4DABF7') + ' 题 → 练习包（网上找到的、或教辅上的题，粘进来）</div>' +
      '<div class="admin-tip" style="margin:0 0 10px">一行一题。<b>算式题会自动算答案</b>并配好选项；选择题请点一下正确答案。确认没错，再点「存进练习包」。</div>' +
      '<div class="fd-gen"><div class="fd-lbl" style="color:var(--purple)">' + icn('sparkle', 16, '#9775FA') + ' 一键生成（本机出题·免费·断网能用）</div>' +
      '<div class="admin-tip" style="margin:0 0 8px">按上面选的册次/学科/单元，在本机直接生成一份练习——<b>不是网上抓的题</b>，永远拿得到。生成后下面会列出题目，确认无误点「存进练习包」即可。</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<input class="fd-in" id="fd-gn" value="' + (S.genN || 10) + '" inputmode="numeric" style="width:62px;text-align:center;min-height:42px">' +
      '<span style="font-size:13px;color:var(--ink-2)">题（3-30）</span>' +
      '<button class="btn btn-purple" data-fd="gen">一键生成</button></div></div>' +
      '<textarea id="fd-raw" class="fd-in" style="min-height:120px;line-height:1.7" placeholder="3 + 2 = ( )&#10;9 - 4 = ( )&#10;下面哪个是「日」的读音？&#10;A. rì  B. yuè  C. shuǐ  D. huǒ"></textarea>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="btn btn-blue" data-fd="parse">解析题目</button>' +
      '<button class="btn btn-ghost" data-fd="demo">放 5 道示例</button></div>' +
      '<div id="fd-parsed">' + parsedHTML() + '</div>' +
      '<div id="fd-sheet"></div>' +
      '<div class="admin-tip" style="margin:12px 0 0">长图出来后，手机上<b>长按图片 → 存储到相册</b>；「打印」在手机上可以存成 PDF。</div>';
    return h + '</div>';
  }

  function parsedHTML() {
    if (!ITEMS.length) return '';
    var h = '<div class="fd-lbl">共 ' + ITEMS.length + ' 题 · 选择题请点一下正确答案</div>';
    h += ITEMS.map(function (it, i) {
      var s = '<div class="fd-qi"><div class="no">第 ' + (i + 1) + ' 题</div>' +
        '<input class="fd-in" data-fd="q" data-i="' + i + '" value="' + esc(it.q) + '">' +
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:7px;align-items:center">' +
        '<select class="fd-sel" data-fd="type" data-i="' + i + '">' +
        TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (it.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') +
        '</select>' +
        '<span class="btn btn-ghost" style="min-height:34px;padding:5px 11px;font-size:13px" data-fd="delq" data-i="' + i + '">删除</span></div>';
      if (it.type === 'kousuan' || it.type === 'quiz') {
        s += '<div>' + it.choices.map(function (c, ci) {
          return '<span class="fd-opt' + (it.correct === ci ? ' on' : '') + '" data-fd="pick" data-i="' + i + '" data-ci="' + ci + '">' + LET[ci] + '. ' + esc(c) + '</span>';
        }).join('') + '</div>' +
          '<div class="fd-ans' + (it.correct < 0 ? ' bad' : '') + '">' +
          (it.correct < 0 ? '还没标正确答案' : '正确答案：' + esc(it.choices[it.correct])) + (it.tip ? ' · ' + esc(it.tip) : '') + '</div>';
      } else {
        s += '<input class="fd-in" style="margin-top:8px" placeholder="参考答案（可留空）" value="' + esc(it.ans) + '" data-fd="ans" data-i="' + i + '">';
      }
      return s + '</div>';
    }).join('');
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<button class="btn btn-green" data-fd="install">' + icn('check', 18, '#fff') + ' 存进练习包</button>' +
      '<button class="btn btn-yellow" data-fd="png">生成卷子长图</button>' +
      '<button class="btn btn-ghost" data-fd="print">打印 / 存 PDF</button>' +
      '<button class="btn btn-ghost" data-fd="json">导出 JSON</button></div>';
    return h;
  }

  /* ---------- 存进练习包（复用工作台自己的入库流程，手机端一个字不用改） ---------- */
  function buildExercises() {
    return ITEMS.map(function (it, i) {
      var o = { id: 'fd' + Date.now().toString(36) + i, type: it.type, title: String(it.q).slice(0, 200), q: String(it.q).slice(0, 500), tip: it.tip || '', choices: [], correct: -1, answer: '' };
      if (it.type === 'kousuan' || it.type === 'quiz') {
        o.choices = it.choices.slice(0, 6); o.correct = it.correct;
        if (o.correct < 0) { o.choices = []; o.correct = -1; o.answer = it.ans || ''; }
        else o.answer = it.choices[o.correct];
      } else { o.answer = it.ans || ''; if (!o.q) o.text = it.q; }
      return o;
    });
  }
  function install() {
    if (!ITEMS.length) { say('先解析题目', 'pencil', '#FF6B6B'); return; }
    var bad = ITEMS.map(function (it, i) { return (it.type === 'quiz' && it.correct < 0) ? (i + 1) : 0; }).filter(Boolean);
    if (bad.length) { say('第 ' + bad.join('、') + ' 题还没标正确答案', 'pencil', '#FF6B6B'); return; }
    try {
      var set = {
        schema: 'wb-practice', id: 'fd' + Date.now().toString(36),
        title: (gradeName() + ' ' + subjName() + ' · ' + kindObj().n + (S.sel.unit ? '（' + S.sel.unit + '）' : '')).slice(0, 80),
        grade: S.sel.g, subject: S.sel.subj === 'math' ? 'math' : 'chinese', kind: 'day',
        importedAt: new Date().toISOString(), exercises: buildExercises()
      };
      var clean = sanitizePracticeSet(set);
      if (!clean) { say('格式没通过，检查一下题目', 'pencil', '#FF6B6B'); return; }
      DATA.practice = mergePracticeSets([clean]); saveData();
      var repo = loadPractices(); repo.installed = repo.installed || {};
      repo.installed[clean.id] = { title: clean.title, grade: clean.grade, subject: clean.subject, items: clean.items.length, importedAt: clean.importedAt };
      savePractices(repo);
      ITEMS = [];
      say('已存进练习包「' + clean.title + '」共 ' + clean.items.length + ' 题', 'check', '#3ECF6E');
      try { state.practiceOpen = clean.id; } catch (e) {}
      try { switchTab('practice'); } catch (e) {}
    } catch (e) { say('存失败了：' + (e && e.message ? e.message : '未知原因'), 'pencil', '#FF6B6B'); }
  }

  /* ---------- 长图 ---------- */
  function sheetLines() {
    return ITEMS.map(function (it, i) {
      if (it.type === 'kousuan' || it.type === 'quiz') {
        return { no: i + 1, q: it.q, opts: it.choices.map(function (c, ci) { return LET[ci] + '. ' + c; }), blank: false };
      }
      return { no: i + 1, q: it.q, opts: [], blank: true };
    });
  }
  function sheetTitle() {
    return gradeName() + ' ' + subjName() + ' · ' + kindObj().n + (S.sel.unit ? '（' + S.sel.unit + '）' : '');
  }
  function drawSheet() {
    var W = 1240, PAD = 70, LH = 46, maxW = W - PAD * 2 - 56;
    var lines = sheetLines();
    var cvs = document.createElement('canvas'), ctx = cvs.getContext('2d');
    var F = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
    function wrap(text, maxW2, font) {
      ctx.font = font; var out = [], cur = '';
      for (var i = 0; i < text.length; i++) {
        if (ctx.measureText(cur + text[i]).width > maxW2 && cur) { out.push(cur); cur = text[i]; }
        else cur += text[i];
      }
      if (cur) out.push(cur); return out.length ? out : [''];
    }
    var d = new Date(), dt = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    var blocks = [{ t: 'title' }, { t: 'sub' }];
    lines.forEach(function (o) {
      var qw = wrap(o.q, maxW, '700 30px ' + F), ow = [];
      o.opts.forEach(function (c) { ow = ow.concat(wrap(c, (maxW - 40) / 2, '400 27px ' + F)); });
      blocks.push({ t: 'q', no: o.no, qw: qw, ow: ow, blank: o.blank });
    });
    var H = PAD * 2 + 150;
    blocks.forEach(function (b) {
      if (b.t === 'title') H += 54;
      else if (b.t === 'sub') H += 40;
      else H += 16 + b.qw.length * LH + (b.ow.length ? Math.ceil(b.ow.length / 2) * 40 + 10 : 0) + (b.blank ? 44 : 0) + 18;
    });
    cvs.width = W; cvs.height = H;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; var y = PAD + 10;
    ctx.textAlign = 'center'; ctx.fillStyle = '#212529'; ctx.font = '800 40px ' + F;
    ctx.fillText(sheetTitle(), W / 2, y); y += 54;
    ctx.fillStyle = '#868E96'; ctx.font = '400 24px ' + F; ctx.fillText(dt + '　·　家庭自用练习', W / 2, y); y += 40;
    ctx.textAlign = 'left'; ctx.strokeStyle = '#212529'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD, y + 6); ctx.lineTo(W - PAD, y + 6); ctx.stroke(); y += 16;
    ctx.fillStyle = '#495057'; ctx.font = '400 24px ' + F;
    ctx.fillText('姓名：__________', PAD, y); ctx.fillText('用时：______分', PAD + 380, y); ctx.fillText('做对：______题', PAD + 720, y);
    y += 26; ctx.beginPath(); ctx.moveTo(PAD, y + 6); ctx.lineTo(W - PAD, y + 6); ctx.stroke(); y += 30;
    blocks.forEach(function (b) {
      if (b.t !== 'q') return;
      ctx.fillStyle = '#1C7ED6'; ctx.font = '800 28px ' + F; ctx.fillText(b.no + '.', PAD, y);
      ctx.fillStyle = '#212529'; ctx.font = '700 30px ' + F;
      b.qw.forEach(function (l, k) { ctx.fillText(l, PAD + 56, y + k * LH); });
      y += b.qw.length * LH;
      if (b.ow.length) {
        ctx.fillStyle = '#495057'; ctx.font = '400 27px ' + F;
        for (var k = 0; k < b.ow.length; k++) {
          ctx.fillText(b.ow[k], PAD + 56 + (k % 2) * ((maxW - 40) / 2 + 40), y + Math.floor(k / 2) * 40);
        }
        y += Math.ceil(b.ow.length / 2) * 40 + 10;
      }
      if (b.blank) {
        ctx.strokeStyle = '#ADB5BD'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(PAD + 56, y + 30); ctx.lineTo(PAD + 56 + 240, y + 30); ctx.stroke(); y += 44;
      }
      y += 18;
    });
    ctx.fillStyle = '#ADB5BD'; ctx.font = '400 20px ' + F; ctx.textAlign = 'center';
    ctx.fillText('小学学习乐园 · 家庭自用', W / 2, H - PAD + 18);
    return cvs;
  }
  function printHTML() {
    var d = new Date(), dt = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    var css = '.sh-t{font-size:20px;font-weight:800;text-align:center}' +
      '.sh-s{text-align:center;font-size:12px;color:#555;margin:4px 0 12px}' +
      '.sh-b{display:flex;gap:18px;font-size:13px;border-top:1.5px solid #333;border-bottom:1.5px solid #333;padding:7px 0;margin-bottom:12px}' +
      '.sh-q{font-size:15px;margin-bottom:14px;line-height:2}';
    return '<style>' + css + '</style><div class="sh-t">' + esc(sheetTitle()) + '</div>' +
      '<div class="sh-s">' + dt + '　·　家庭自用练习</div>' +
      '<div class="sh-b"><span>姓名：__________</span><span>用时：______分</span><span>做对：______题</span></div>' +
      sheetLines().map(function (o) {
        var h = '<div class="sh-q"><b>' + o.no + '.</b> ' + esc(o.q);
        if (o.opts.length) h += '<br>' + o.opts.map(function (c) { return '<span style="display:inline-block;min-width:46%">' + esc(c) + '</span>'; }).join('');
        else h += ' <span style="display:inline-block;width:120px;border-bottom:1px solid #333">&nbsp;</span>';
        return h + '</div>';
      }).join('');
  }
  function dl(name, content, mime) {
    try {
      var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 400);
    } catch (e) { say('这台设备不支持直接下载', 'pencil', '#FF6B6B'); }
  }

  /* ---------- 交互 ---------- */
  function pick(k, f) {
    if (f === 'grade') { S.sel.g = parseInt(k[0], 10); S.sel.t = k.slice(1); S.sel.unit = ''; }
    else if (f === 'subj') { S.sel.subj = k; S.sel.ver = VERS[k][0]; S.sel.unit = ''; }
    else if (f === 'ver') S.sel.ver = k;
    else if (f === 'unit') S.sel.unit = k;
    else if (f === 'kind') S.sel.kind = k;
    save(); render();
  }
  function boxItem(id) { var r = null; S.box.forEach(function (x) { if (x.id === id) r = x; }); return r; }
  function addBox(title, url, src, meta) {
    S.box.unshift({ id: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: title, url: url || '', src: src || '', meta: meta || '', state: url ? 1 : 0, star: 0, note: '', at: Date.now() });
    save(); render(); say('已存进资料箱');
  }

  var ROOT = null;
  function render() {
    if (!ROOT) return;
    var ta = document.getElementById('fd-raw');
    var raw = ta ? ta.value : '';
    var sheet = document.getElementById('fd-sheet');
    var sheetHTML = sheet ? sheet.innerHTML : '';
    ROOT.innerHTML = html();
    var ta2 = document.getElementById('fd-raw'); if (ta2 && raw) ta2.value = raw;
    var sh2 = document.getElementById('fd-sheet'); if (sh2 && sheetHTML) sh2.innerHTML = sheetHTML;
  }

  window.FINDER_render = function (el) {
    if (!el) return;
    ROOT = el; ensureCss();
    if (!ROOT.__fdBound) {
      ROOT.__fdBound = true;
      ROOT.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-fd]') : null; if (!t) return;
        var f = t.getAttribute('data-fd'), k = t.getAttribute('data-k');
        if (f === 'grade' || f === 'subj' || f === 'ver' || f === 'unit' || f === 'kind') { pick(k, f); return; }
        if (f === 'filter') { S.filter = k; save(); render(); return; }
        if (f === 'pdf') { S.pdf = !S.pdf; save(); render(); return; }
        if (f === 'copy') {
          var qi = document.getElementById('fd-qi');
          var txt = withPdf(qi ? qi.value : buildQuery());
          try { if (typeof copyHwTextRaw === 'function') copyHwTextRaw(txt); else dl('搜索词.txt', txt); } catch (e) {}
          say('搜索词已复制'); return;
        }
        if (f === 'savebox') {
          var q2 = withPdf((document.getElementById('fd-qi') || {}).value || buildQuery());
          addBox(gradeName() + ' ' + subjName() + ' · ' + kindObj().n + (S.sel.unit ? '（' + S.sel.unit + '）' : ''),
            'https://www.baidu.com/s?wd=' + encodeURIComponent(q2), '百度（全网）', S.sel.ver + (S.sel.unit ? ' · ' + S.sel.unit : ''));
          return;
        }
        if (f === 'addbox') {
          var ti = document.getElementById('fd-mt'), ui = document.getElementById('fd-mu');
          if (!ti || !ti.value.trim()) { say('先写个标题', 'pencil', '#FF6B6B'); return; }
          addBox(ti.value.trim(), ui ? ui.value.trim() : '', '手动添加', gradeName() + ' ' + subjName());
          return;
        }
        if (f === 'open') {
          var i = parseInt(t.getAttribute('data-i'), 10), s = SOURCES[i], how = t.getAttribute('data-how');
          var q3 = withPdf((document.getElementById('fd-qi') || {}).value || buildQuery());
          if (how === 'home') openUrl(s.home);
          else if (how === 'site') openUrl('https://www.baidu.com/s?wd=' + encodeURIComponent('site:' + s.site + ' ' + q3));
          else openUrl(s.url + encodeURIComponent(q3));
          return;
        }
        if (f === 'bstate' || f === 'bstar' || f === 'bdel') {
          var it = boxItem(t.getAttribute('data-id')); if (!it) return;
          if (f === 'bstate') it.state = (it.state + 1) % 4;
          else if (f === 'bstar') it.star = ((it.star || 0) + 1) % 4;
          else { if (!confirm('删掉这条？')) return; S.box = S.box.filter(function (x) { return x.id !== it.id; }); }
          save(); render(); return;
        }
        if (f === 'gen') {
          var gn = document.getElementById('fd-gn');
          var n = gn ? parseInt(gn.value, 10) : 0;
          if (!(n >= 3)) n = 10; if (n > 30) n = 30;
          S.genN = n; save();
          ITEMS = genItems(n);
          if (!ITEMS.length) { say('生成失败，换下条件再试', 'pencil', '#FF6B6B'); return; }
          render(); say('已生成 ' + ITEMS.length + ' 题（' + subjName() + '）'); return;
        }
        if (f === 'parse' || f === 'demo') {
          var raw = (document.getElementById('fd-raw') || {}).value || '';
          if (f === 'demo') { raw = '3 + 2 = ( )\n9 - 4 = ( )\n7 + 5 = ( )\n12 - 8 = ( )\n6 × 2 = ( )'; var r0 = document.getElementById('fd-raw'); if (r0) r0.value = raw; }
          ITEMS = parseItems(raw);
          if (!ITEMS.length) { say('没读到题，一行一题试试', 'pencil', '#FF6B6B'); return; }
          render(); say('解析出 ' + ITEMS.length + ' 题'); return;
        }
        if (f === 'pick') {
          var qi2 = parseInt(t.getAttribute('data-i'), 10), ci = parseInt(t.getAttribute('data-ci'), 10);
          if (ITEMS[qi2]) ITEMS[qi2].correct = ci;
          render(); return;
        }
        if (f === 'delq') { ITEMS.splice(parseInt(t.getAttribute('data-i'), 10), 1); render(); return; }
        if (f === 'install') { install(); return; }
        if (f === 'png') {
          if (!ITEMS.length) { say('先解析题目', 'pencil', '#FF6B6B'); return; }
          var url = drawSheet().toDataURL('image/png');
          var sh = document.getElementById('fd-sheet');
          if (sh) sh.innerHTML = '<div class="fd-lbl">卷子长图（手机上长按图片 → 存储到相册）</div><img id="fd-img" src="' + url + '" alt="卷子">' +
            '<div style="margin-top:10px"><button class="btn btn-blue" id="fd-dl">下载图片</button></div>';
          var b = document.getElementById('fd-dl');
          if (b) b.onclick = function () { var a = document.createElement('a'); a.href = url; a.download = '卷子_' + sheetTitle() + '.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
          return;
        }
        if (f === 'print') {
          if (!ITEMS.length) { say('先解析题目', 'pencil', '#FF6B6B'); return; }
          var w = window.open('', '_blank');
          if (!w) { say('浏览器拦了弹窗，请允许弹窗后再试', 'pencil', '#FF6B6B'); return; }
          w.document.write('<meta charset="utf-8"><title>' + esc(sheetTitle()) + '</title>' + printHTML());
          w.document.close();
          setTimeout(function () { try { w.print(); } catch (e) {} }, 300);
          return;
        }
        if (f === 'json') {
          if (!ITEMS.length) { say('先解析题目', 'pencil', '#FF6B6B'); return; }
          var set = { schema: 'wb-practice-bundle', sets: [{ id: 'fd' + Date.now().toString(36), title: sheetTitle(), grade: S.sel.g,
            subject: S.sel.subj === 'math' ? 'math' : 'chinese', kind: 'day', importedAt: new Date().toISOString(), items: buildExercises() }] };
          dl('练习包_' + sheetTitle() + '.json', JSON.stringify(set, null, 1), 'application/json');
          return;
        }
      });
      ROOT.addEventListener('input', function (e) {
        var t = e.target.closest ? e.target.closest('[data-fd]') : null; if (!t) return;
        var f = t.getAttribute('data-fd'), i = parseInt(t.getAttribute('data-i'), 10);
        if (f === 'q' && ITEMS[i]) ITEMS[i].q = t.value;
        else if (f === 'ans' && ITEMS[i]) ITEMS[i].ans = t.value;
        else if (f === 'bnote') { var it = boxItem(t.getAttribute('data-id')); if (it) { it.note = t.value; save(); } }
      });
      ROOT.addEventListener('change', function (e) {
        var t = e.target.closest ? e.target.closest('[data-fd="type"]') : null; if (!t) return;
        var i = parseInt(t.getAttribute('data-i'), 10); if (!ITEMS[i]) return;
        ITEMS[i].type = t.value;
        if (t.value === 'quiz' && !ITEMS[i].choices.length) { ITEMS[i].choices = ['A', 'B', 'C', 'D']; ITEMS[i].correct = -1; }
        render();
      });
    }
    render();
  };

  load();
  /* 自检钩子：本机验证用，不影响功能 */
  window.FINDER_TEST = { parseItems: parseItems, buildQuery: buildQuery, buildExercises: buildExercises, drawSheet: drawSheet, genItems: genItems, state: S };
})();
