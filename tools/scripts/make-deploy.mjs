#!/usr/bin/env node
/**
 * 把 esbuild 产物 + public 静态资源组装成最终部署目录。
 *
 * 零拷贝策略：不搬运 222MB 的 public 资源，而是直接以 public/ 为站点根，
 * 把打包产物写进去。避免 Windows 杀软扫描大文件导致的超时。
 *
 * 产出：deploy/  完整可部署目录
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BUNDLE = path.join(ROOT, 'dist-esbuild');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'deploy');

if (!fs.existsSync(BUNDLE)) {
  console.error('✗ 缺少 dist-esbuild/，请先运行 node scripts/build-esbuild.mjs');
  process.exit(1);
}

// 清空并重建
fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(OUT, {recursive: true});

// 1) public/ 下的大目录：用 junction（目录联接）零拷贝挂载
const LINK_DIRS = ['city', 'characters', 'assets', 'licenses'];
let linked = 0;
for (const d of LINK_DIRS) {
  const src = path.join(PUB, d);
  const dst = path.join(OUT, d);
  if (!fs.existsSync(src)) continue;
  try {
    fs.symlinkSync(src, dst, 'junction');
    linked++;
    console.log(`✓ 链接 ${d}/  ->  public/${d}`);
  } catch (e) {
    console.log(`! ${d}/ 链接失败（${e.code}），改为物理拷贝`);
    copyTree(src, dst);
  }
}

// 2) 打包产物 _bundle/
const bundleOut = path.join(OUT, '_bundle');
fs.mkdirSync(bundleOut, {recursive: true});
let n = 0;
for (const f of fs.readdirSync(path.join(BUNDLE, '_bundle'))) {
  fs.copyFileSync(path.join(BUNDLE, '_bundle', f), path.join(bundleOut, f));
  n++;
}
console.log(`✓ _bundle/ (${n} 个打包产物)`);

// 3) 根级文件
fs.copyFileSync(path.join(BUNDLE, 'index.html'), path.join(OUT, 'index.html'));
console.log('✓ index.html');

for (const f of ['favicon.svg']) {
  const src = path.join(PUB, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, f));
}

// 4) .nojekyll —— GitHub Pages 需它原文提供 _ 前缀目录
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('✓ .nojekyll');

// 5) data/ —— 源码里 new URL('../data/map-places.json', import.meta.url)
//    运行时会解析到 <base>/data/map-places.json
const dataSrc = path.join(ROOT, 'data', 'map-places.json');
if (fs.existsSync(dataSrc)) {
  fs.mkdirSync(path.join(OUT, 'data'), {recursive: true});
  fs.copyFileSync(dataSrc, path.join(OUT, 'data', 'map-places.json'));
  console.log(`✓ data/map-places.json (${(fs.statSync(dataSrc).size / 1024).toFixed(1)} KB)`);
} else {
  console.log('! 未找到 data/map-places.json');
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, {recursive: true});
  for (const e of fs.readdirSync(src, {withFileTypes: true})) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('\n=== deploy/ 顶层 ===');
console.log(fs.readdirSync(OUT).join('  '));
console.log('\nDONE -> deploy/');
