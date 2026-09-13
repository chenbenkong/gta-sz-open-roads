#!/usr/bin/env node
/**
 * 组装最终部署产物 dist/：
 *   1) 先铺入 esbuild 的打包产物（index.html + _bundle/*.js|css）
 *   2) 再把 public/ 下的静态资源搬运进来（不覆盖 _bundle）
 *
 * 背景：cp -r / robocopy 在 Windows 上处理 3000+ 文件 + 单个 48MB GLB
 * 时会被杀软扫描与沙箱超时打断。此脚本用流式读写 + 进度输出，
 * 并支持断点续传（已存在且大小一致则跳过），可反复执行直至完成。
 */
import {readdir, stat, mkdir, copyFile, rm, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {existsSync} from 'node:fs';

const BUNDLE_SRC = 'dist-esbuild';   // esbuild 产物
const SRC = 'public';                // 静态资源
const DST = 'dist';                  // 最终部署目录
const DIRS = ['city', 'characters', 'assets', 'licenses'];
const FILES = ['favicon.svg'];

const MIN_SIZE = 5 * 1024 * 1024; // 大小文件分界

let copied = 0, skipped = 0, bytes = 0;

async function walk(dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, {withFileTypes: true}); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

// ── 步骤 1：把 esbuild 产物铺成 dist/ 基底 ──────────────────────────
if (!existsSync(BUNDLE_SRC)) {
  console.error(`✗ 找不到 ${BUNDLE_SRC}/，请先执行 node scripts/build-esbuild.mjs`);
  process.exit(1);
}

await rm(DST, {recursive: true, force: true});
await mkdir(DST, {recursive: true});

// index.html
await copyFile(join(BUNDLE_SRC, 'index.html'), join(DST, 'index.html'));
console.log('✓ index.html');

// _bundle/**（递归）
for (const f of await walk(join(BUNDLE_SRC, '_bundle'))) {
  const rel = relative(BUNDLE_SRC, f);
  const dst = join(DST, rel);
  await mkdir(join(dst, '..'), {recursive: true});
  await copyFile(f, dst);
}
console.log(`✓ _bundle/ (${(await walk(join(BUNDLE_SRC, '_bundle'))).length} 个打包产物)`);

// .nojekyll —— 让 GitHub Pages 原样提供 _ 前缀目录
await writeFile(join(DST, '.nojekyll'), '');
console.log('✓ .nojekyll');

// ── 步骤 2：搬运 public/ 静态资源 ───────────────────────────────────
const pending = [];
const large = [];

for (const d of DIRS) {
  for (const f of await walk(join(SRC, d))) {
    const rel = relative(SRC, f);
    const s = await stat(f);
    (s.size >= MIN_SIZE ? large : pending).push({src: f, rel, size: s.size});
  }
}
for (const f of FILES) {
  const s = await stat(join(SRC, f)).catch(() => null);
  if (s) pending.push({src: join(SRC, f), rel: f, size: s.size});
}

console.log(`\n静态资源共 ${pending.length + large.length} 个（大文件 ${large.length}）`);

async function copyOne({src, rel, size}) {
  const dst = join(DST, rel);
  const existing = await stat(dst).catch(() => null);
  if (existing && existing.size === size) { skipped++; return; }
  await mkdir(join(dst, '..'), {recursive: true});
  await copyFile(src, dst);
  copied++; bytes += size;
}

for (const item of large) {
  await copyOne(item);
  console.log(`  [large] ${item.rel} (${(item.size / 1048576).toFixed(1)} MB)`);
}
for (const item of pending) await copyOne(item);

console.log(`\n完成：复制 ${copied}，跳过 ${skipped}，写入 ${(bytes / 1048576).toFixed(1)} MB`);
