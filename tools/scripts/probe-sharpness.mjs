/**
 * 分辨率状态早期探针
 * ==================
 * 只等到 Babylon 引擎被构造（画布尺寸脱离默认 300x150 即说明引擎已接管），
 * 立刻读取 hardwareScalingLevel / 渲染尺寸，不等待 200MB 资产与世界初始化完成。
 *
 * 目的：在软件渲染（SwiftShader）下也能快速、确定地验证"分辨率不模糊"。
 * 这是针对 `setHardwareScalingLevel(v > 1)` 模糊缺陷的回归探针。
 *
 * 用法：
 *   node scripts/probe-sharpness.mjs [baseUrl]
 */
import {chromium} from 'playwright';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8899/gta-sz-open-roads/';
const CASES = [
  {w: 1280, h: 800, dpr: 1},
  {w: 1920, h: 1080, dpr: 1},
  {w: 2560, h: 1440, dpr: 1},
  {w: 3440, h: 1440, dpr: 1},
  {w: 1920, h: 1080, dpr: 2},
  {w: 1280, h: 800, dpr: 2},
];

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});

let failures = 0, probed = 0;

for (const c of CASES) {
  const ctx = await browser.newContext({viewport: {width: c.w, height: c.h}, deviceScaleFactor: c.dpr});
  const page = await ctx.newPage();
  try {
    await page.goto(BASE, {waitUntil: 'domcontentloaded', timeout: 60000});
    // 等一个真实 WebGL 上下文 + 引擎已按视口设置画布尺寸。
    // 用 raf 轮询直接读 DOM，比 waitForFunction 更早返回。
    await page.waitForFunction(() => {
      const el = document.querySelector('#game');
      if (!el) return false;
      const gl = el.getContext('webgl2') ?? el.getContext('webgl');
      return !!gl && el.width > 320 && el.height > 200;
    }, null, {timeout: 90000, polling: 250});

    const info = await page.evaluate(() => {
      const el = document.querySelector('#game');
      const api = window.__SHENCHENGJI_CITY__;
      const q = typeof api?.quality === 'object' ? api.quality : null;
      return {
        css: {w: el.clientWidth, h: el.clientHeight},
        attr: {w: el.width, h: el.height},
        quality: q,
      };
    });

    const level = info.quality ? info.quality.hardwareScaling : 1 / ((info.attr.w / info.css.w) || 1);
    const rw = info.quality ? info.quality.renderWidth : info.attr.w;
    const rh = info.quality ? info.quality.renderHeight : info.attr.h;
    const sharp = level <= 1.0001;
    const covers = rw >= info.css.w - 1 && rh >= info.css.h - 1;
    probed++;
    if (!sharp || !covers) failures++;
    console.log(
      `  ${c.w}x${c.h} dpr${c.dpr}: level=${level.toFixed(4)} 渲染 ${rw}x${rh} 画布 ${info.css.w}x${info.css.h}` +
      ` 档位=${info.quality?.level ?? '(待定)'} ${sharp && covers ? '✓ 清晰' : '✗ 模糊'}`,
    );
  } catch (e) {
    console.log(`  ${c.w}x${c.h} dpr${c.dpr}: 探测超时 — ${e.message.split('\n')[0]}`);
    failures++;
  } finally {
    await ctx.close();
  }
}

await browser.close();
console.log(`\n探测 ${probed}/${CASES.length} 个视口`);
console.log(failures === 0 ? '✅ 清晰度通过：无任何视口低于原生分辨率' : `❌ ${failures} 个视口不合格`);
process.exitCode = failures === 0 ? 0 : 1;
