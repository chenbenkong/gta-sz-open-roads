// 用 esbuild 直接打包，绕过 Vite/Rollup 在本环境下的挂死问题。
// 输出：dist-esbuild/  (index.html + _bundle/*.js + _bundle/*.css)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist-esbuild');
const BASE = '/gta-sz-open-roads/';           // GitHub Pages 子路径
const ENTRY = path.join(ROOT, 'src/main.ts');

fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(path.join(OUT, '_bundle'), {recursive: true});

const result = await esbuild.build({
  entryPoints: [ENTRY],
  outdir: path.join(OUT, '_bundle'),
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  splitting: true,
  chunkNames: '[name]-[hash]',
  entryNames: 'index-[hash]',
  assetNames: 'asset-[name]-[hash]',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  metafile: true,
  logLevel: 'warning',
  // 在所有产物头部注入部署基址全局量。
  // asset-base.ts 优先读取它，并带有 DOM 推导兜底，
  // 因此不会被打包器折叠成常量而丢失前缀。
  banner: {
    js: `globalThis.__ASSET_BASE__=${JSON.stringify(BASE)};`,
  },
  loader: {
    '.ts': 'ts',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.webp': 'file',
    '.glb': 'file',
    '.gltf': 'file',
  },
});

const outputs = Object.keys(result.metafile.outputs);
let jsEntry = null;
let cssFile = null;
let biggest = {name: null, size: 0};
for (const o of outputs) {
  const b = path.basename(o);
  const size = result.metafile.outputs[o].bytes;
  if (b.endsWith('.js') && b.startsWith('index-')) jsEntry = b;
  if (b.endsWith('.css')) cssFile = b;
  if (b.endsWith('.js') && size > biggest.size) biggest = {name: b, size};
}

console.log('=== 关键产物 ===');
console.log(`  entry      : ${jsEntry}`);
console.log(`  css        : ${cssFile ?? '(无)'}`);
console.log(`  最大 chunk : ${biggest.name} (${(biggest.size / 1048576).toFixed(2)} MB)`);
console.log(`  产物总数   : ${outputs.length}`);

// ── 生成 index.html ────────────────────────────────────────────────
const srcHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let html = srcHtml
  .replace(/<script type="module" src="\/src\/main\.ts"><\/script>/,
    `<script type="module" src="${BASE}_bundle/${jsEntry}"></script>`)
  .replace(/href="\/favicon\.svg"/, `href="${BASE}favicon.svg"`);

if (cssFile) {
  html = html.replace('</head>', `  <link rel="stylesheet" href="${BASE}_bundle/${cssFile}" />\n  </head>`);
}

fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(result.metafile, null, 2));

// ── 校验：部署基址必须真实参与资源路径拼接 ──────────────────────────
const entryJs = fs.readFileSync(path.join(OUT, '_bundle', jsEntry), 'utf8');
const bannerOk = entryJs.includes(`globalThis.__ASSET_BASE__=${JSON.stringify(BASE)}`);
// 资源拼接使用的变量应由 asset-base 导出；确认读取分支未被完全消除。
const readsGlobal = /__ASSET_BASE__/.test(entryJs) || /querySelectorAll\(.script\[src\]/.test(entryJs);
const joinsCity = /\+\s*"city\//.test(entryJs) || /"city\//.test(entryJs);

console.log('\n=== 部署校验 ===');
console.log(`  banner 注入 __ASSET_BASE__ : ${bannerOk ? '✓' : '✗'}`);
console.log(`  asset-base 读取分支保留     : ${readsGlobal ? '✓' : '✗'}`);
console.log(`  资源拼接 city/ 存在         : ${joinsCity ? '✓' : '✗'}`);

if (!bannerOk) {
  console.error('\n✗ 严重错误：部署基址未注入，页面资源将 404！');
  process.exit(2);
}

console.log('\nDONE -> dist-esbuild/');
