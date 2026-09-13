#!/usr/bin/env node
/**
 * 把 deploy/（含 junction 链接）实体化为可提交 Git 的目录。
 *
 * junction 只是本地零拷贝手段，Git 无法提交。
 * 本脚本把 deploy/ 下所有 junction 目录展开为真实文件，
 * 输出到 gta-sz-pages/（部署仓库工作区）。
 *
 * 支持断点续传：已存在且大小一致的文件跳过。
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'deploy');
const DST = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, '..', 'gta-sz-pages');

let copied = 0, skipped = 0, bytes = 0;
const large = [];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

// 收集所有待拷贝文件
const files = walk(SRC).map((f) => ({
  src: f,
  rel: path.relative(SRC, f),
  size: fs.statSync(f).size,
}));

console.log(`源文件总数: ${files.length}`);

// 大文件优先（便于观察进度、避免小文件先占满时间）
files.sort((a, b) => b.size - a.size);

fs.mkdirSync(DST, {recursive: true});

const t0 = Date.now();
for (const {src, rel, size} of files) {
  const dst = path.join(DST, rel);
  try {
    const st = fs.existsSync(dst) ? fs.statSync(dst) : null;
    if (st && st.size === size) { skipped++; continue; }
    fs.mkdirSync(path.dirname(dst), {recursive: true});
    fs.copyFileSync(src, dst);
    copied++; bytes += size;
    if (size >= 5 * 1024 * 1024) {
      large.push(rel);
      console.log(`  [large] ${rel} (${(size / 1048576).toFixed(1)} MB)`);
    }
    if ((copied + skipped) % 500 === 0) {
      console.log(`  ... 进度 ${copied + skipped}/${files.length}, 已写 ${(bytes / 1048576).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  } catch (e) {
    console.error(`  ✗ ${rel}: ${e.message}`);
  }
}

console.log(`\n完成：复制 ${copied}，跳过 ${skipped}，写入 ${(bytes / 1048576).toFixed(1)} MB，耗时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`目标：${DST}`);
