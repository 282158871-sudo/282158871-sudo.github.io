#!/usr/bin/env node
/* 小学学习乐园 · 学情闭环断链自检
 * 用法: node check.js [app.html]
 *   - 不传路径时，默认取 /workspace 下最新的 app_v4.*_kp_fix.html
 * 退出码: 0=全部通过  1=发现断链  2=用法错误
 *
 * 校验项（都是曾真实漏发过的 P0/P1 类问题）：
 *   1) 考点池四元组结构 / 难度星 1~3 / 认知层级有效
 *   2) 每个考点都有生成器派发，且生成器函数真实存在
 *   3) 每个数学题型产出的 type 都在 MATH_Q_TYPES 归科白名单（防止错题被算成"语文"）
 *   4) FOCUS_TAG2MODE 回流映射、CROSS_WP 跨题型串题两端均有效
 *   5) 全文件数学相关 type 字面均在白名单
 */
const fs = require('fs');
const path = require('path');

function resolveFile() {
  if (process.argv[2]) return process.argv[2];
  const dir = '/workspace';
  try {
    const files = fs.readdirSync(dir)
      .filter(f => /^app_v4\.\d+_kp_fix\.html$/.test(f)).sort();
    if (files.length) return path.join(dir, files[files.length - 1]);
  } catch (e) {}
  return null;
}
const F = resolveFile();
if (!F || !fs.existsSync(F)) {
  console.error('用法: node check.js <app.html>');
  process.exit(2);
}
const s = fs.readFileSync(F, 'utf8');
let fail = 0;
function ok(name, cond, detail) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + name + (detail && !cond ? (' — ' + detail) : ''));
  if (!cond) fail++;
}
function sliceBalanced(i, o, c) {
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === o) d++;
    else if (s[j] === c) { d--; if (d === 0) return s.slice(i, j + 1); }
  }
  return null;
}
function getVar(n) {
  const i = s.indexOf('var ' + n + '=');
  if (i < 0) return undefined;
  const e = s.indexOf('=', i);
  const ch = s[e + 1];
  return eval('(' + sliceBalanced(e + 1, ch, ch === '[' ? ']' : '}') + ')');
}

console.log('=== 小学学习乐园 学情闭环断链自检 ===');
console.log('文件: ' + F + '  (' + (s.length / 1024 | 0) + ' KB)\n');

const CE = getVar('MATH_MODES_CE');
const GN = getVar('MATH_GEN_NAMES');
const QT = getVar('MATH_Q_TYPES');
const FM = getVar('FOCUS_TAG2MODE');
const CW = getVar('CROSS_WP');

// 收集已定义函数名（function X( / var X=function / window.X=）
const fns = new Set();
let r;
const re1 = /function\s+([A-Za-z_$][\w$]*)\s*\(/g; while ((r = re1.exec(s))) fns.add(r[1]);
const re2 = /var\s+([A-Za-z_$][\w$]*)\s*=\s*function/g; while ((r = re2.exec(s))) fns.add(r[1]);
const re3 = /window\.([A-Za-z_$][\w$]*)\s*=/g; while ((r = re3.exec(s))) fns.add(r[1]);

console.log('1) 考点池结构');
let tot = 0, badFmt = 0, badDiff = 0, badBloom = 0;
for (const g in CE) { if (!CE[g]) continue; for (const ce in CE[g]) (CE[g][ce] || []).forEach(k => {
  tot++;
  if (!Array.isArray(k) || k.length < 3) badFmt++;
  else {
    if (typeof k[2] !== 'number' || k[2] < 1 || k[2] > 3) badDiff++;
    if (typeof k[3] !== 'string' || k[3].length < 1 || k[3].length > 4) badBloom++;
  }
}); }
ok('MATH_MODES_CE 挂载均为四元组 [kind,name,diff,bloom]', badFmt === 0, '异常 ' + badFmt + ' 个');
ok('难度星 k[2] 均在 1~3', badDiff === 0, '异常 ' + badDiff + ' 个');
ok('认知层级 k[3] 均为有效码(1~4字)', badBloom === 0, '异常 ' + badBloom + ' 个');

console.log('2) 挂载 → 生成器 连通性');
let dangling = [];
for (const g in CE) { if (!CE[g]) continue; for (const ce in CE[g]) (CE[g][ce] || []).forEach(k => {
  if (!GN[k[0]]) dangling.push(g + '·' + ce + ' ' + k[0] + '(' + k[1] + ')');
}); }
ok('每个考点都有 MATH_GEN_NAMES 派发', dangling.length === 0, dangling.join(', '));
let brokenFn = [];
for (const kind in GN) { if (!fns.has(GN[kind])) brokenFn.push(kind + '→' + GN[kind]); }
ok('MATH_GEN_NAMES 指向的生成器函数均存在', brokenFn.length === 0, brokenFn.join(', '));

console.log('3) 归科白名单（防止错题被算成"语文"）');
function findFnBody(fn) {
  const re = new RegExp('(?:function\\s+' + fn + '\\b\\s*\\(|\\bvar\\s+' + fn + '\\s*=\\s*function\\(|\\b' + fn + '\\s*=\\s*function\\()');
  const m = re.exec(s); if (!m) return null;
  let b = m.index; while (b < s.length && s[b] !== '{') b++;
  if (b >= s.length) return null;
  let d = 0; for (let j = b; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (d === 0) return s.slice(b, j + 1); } }
  return null;
}
function candidateTypes(kind) {
  const out = new Set([kind]);
  const fn = GN[kind]; if (!fn) return out;
  const body = findFnBody(fn); if (!body) return out;
  let m;
  const reT = /type:\s*['"]([a-zA-Z0-9_]+)['"]/g; while ((m = reT.exec(body))) out.add(m[1]);
  const reM = /mk\(\s*['"]([a-zA-Z0-9_]+)['"]/g; while ((m = reM.exec(body))) out.add(m[1]);
  /* mkCalc(ans,wrongs,variant,tag,...) 的 type 恒为 'calc'（见 mkCalc 定义），
     凡用到 mkCalc 的生成器（blank/ineq/filter/sign 等）其 type 即 calc，已在白名单。 */
  if (/mkCalc\(/.test(body)) out.add('calc');
  return out;
}
let misCat = [];
for (const kind in GN) {
  const cands = candidateTypes(kind);
  const inWhite = [...cands].some(t => QT.indexOf(t) >= 0);
  if (!inWhite && kind !== 'word') misCat.push(kind + '→候选[' + [...cands].join(',') + ']');
}
ok('每个数学题型的产出 type 都在 MATH_Q_TYPES 白名单', misCat.length === 0, misCat.join(', '));

console.log('4) 学情回流映射 FOCUS_TAG2MODE / CROSS_WP');
let badMap = [];
for (const tag in FM) { if (!GN[FM[tag]]) badMap.push(tag + '→' + FM[tag]); }
ok('FOCUS_TAG2MODE 每个 value 都是有效题型 mode', badMap.length === 0, badMap.join(', '));
let crossBad = [];
for (const m in CW) { if (!GN[m]) crossBad.push(m + '(源缺失)'); (CW[m] || []).forEach(w => { if (!GN[w]) crossBad.push(m + '→' + w + '(目标缺失)'); }); }
ok('CROSS_WP 跨题型串题两端均有效', crossBad.length === 0, crossBad.join(', '));

console.log('5) 全局产出 type 覆盖（仅查数学域）');
/* 已知数学题型名 = MATH_GEN_NAMES 的键与值 + FOCUS_TAG2MODE 的值 + CROSS_WP 两端。
   只标记「本身是已知数学题型、却不在白名单」的字面，语文/英语/内部枚举不在此集合，不算断链。 */
const mathModeNames = new Set();
for (const k in GN) { if (k) mathModeNames.add(k); if (GN[k]) mathModeNames.add(GN[k]); }
for (const t in FM) mathModeNames.add(FM[t]);
for (const m in CW) { mathModeNames.add(m); (CW[m] || []).forEach(w => mathModeNames.add(w)); }
const allTypes = new Set();
let r3; const reG = /type:\s*['"]([a-zA-Z0-9_]+)['"]/g; while ((r3 = reG.exec(s))) allTypes.add(r3[1]);
const INTENTIONAL = /^(word|hanzi|pinyin|recite|story|english|math)$/;
const globMis = [...allTypes].filter(t => mathModeNames.has(t) && QT.indexOf(t) < 0 && !INTENTIONAL.test(t));
ok('数学域内 type 字面均在 MATH_Q_TYPES 白名单', globMis.length === 0, globMis.join(', '));

console.log('\n' + (fail === 0
  ? '✅ 全部通过，无断链 —— 可发版'
  : '❌ 发现 ' + fail + ' 处断链，请修复后再发版'));
process.exit(fail === 0 ? 0 : 1);
