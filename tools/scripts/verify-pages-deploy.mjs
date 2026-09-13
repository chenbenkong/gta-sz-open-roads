import {chromium} from 'playwright';

/**
 * GitHub Pages 子路径部署验证
 * ---------------------------
 * 在 BASE 下加载游戏并校验：
 *   1) 无 404、无失败请求、无未捕获错误
 *   2) 世界初始化完成、资源加载成功、可驾驶
 *   3) 画面不模糊：硬件缩放级别 <= 1（渲染分辨率不低于画布）
 *      —— 这是针对"画面模糊"缺陷的回归门，级别 > 1 即视为失败
 */
const BASE = process.env.PAGES_BASE ?? 'http://127.0.0.1:8898/gta-sz-open-roads/';
const VIEWPORT = {width: Number(process.env.VW ?? 1280), height: Number(process.env.VH ?? 800)};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});

const context = await browser.newContext({viewport: VIEWPORT, deviceScaleFactor: Number(process.env.DPR ?? 1)});
const page = await context.newPage();

const errors = [];
const failed = [];
const notFound = [];
const requests = [];

page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('[console] ' + m.text());
});
page.on('response', (r) => {
  requests.push(r.url());
  if (r.status() === 404) notFound.push(r.url());
});
page.on('requestfailed', (r) => failed.push(`${r.url()} :: ${r.failure()?.errorText}`));

console.log('打开', BASE);
await page.goto(BASE, {waitUntil: 'domcontentloaded', timeout: 90000});

// 等待世界就绪（首次需下载数百 MB，给足时间）
console.log('等待世界初始化...');
await page.waitForFunction(() => window.__SHENCHENGJI_CITY__?.ready === true, null, {timeout: 600000});
console.log('✓ 世界已就绪');

await page.waitForSelector('#city-loading', {state: 'detached', timeout: 180000}).catch(() => {});
console.log('✓ 加载界面已隐藏');

// 检查 WebGL 是否真正出画面
const render = await page.evaluate(() => {
  const c = document.querySelector('#game');
  const gl = c.getContext('webgl2') ?? c.getContext('webgl');
  return {hasContext: !!gl, width: c.width, height: c.height};
});
console.log('✓ WebGL 画布:', JSON.stringify(render));

// 资源加载统计
const assetReqs = requests.filter((u) => /\/(city|characters|assets)\//.test(u));
const byDir = {};
for (const u of assetReqs) {
  const k = u.match(/\/(city|characters|assets)\//)[1];
  byDir[k] = (byDir[k] ?? 0) + 1;
}
console.log('✓ 资源请求数:', JSON.stringify(byDir), '总计', assetReqs.length);

// 试驾：按下 W，看速度是否上升
const speedBefore = await page.evaluate(() => window.__SHENCHENGJI_CITY__.state.speed);
await page.keyboard.down('w');
await page.waitForTimeout(2500);
await page.keyboard.up('w');
const speedAfter = await page.evaluate(() => window.__SHENCHENGJI_CITY__.state.speed);
console.log(`✓ 驾驶测试: ${speedBefore.toFixed(2)} -> ${speedAfter.toFixed(2)} m/s`);

// 世界规模 + 清晰度门禁
const stats = await page.evaluate(() => {
  const api = window.__SHENCHENGJI_CITY__;
  const w = api.world;
  const q = api.quality;
  return {
    landmarks: w.data.landmarks.length,
    roads: w.data.roads.length,
    meshes: w.scene.meshes.length,
    fps: Math.round(w.engine.getFps()),
    qualityLevel: q.level,
    qualityLocked: q.locked,
    renderScale: Number(q.renderScale.toFixed(4)),
    hardwareScaling: Number(q.hardwareScaling.toFixed(4)),
    renderWidth: q.renderWidth,
    renderHeight: q.renderHeight,
  };
});
console.log('✓ 世界统计:', JSON.stringify(stats));

// ── 清晰度门禁 ────────────────────────────────────────────────────
// hardwareScalingLevel > 1 意味着引擎在低于画布的分辨率上渲染再放大，
// 也就是用户看到的"糊"。这里同时校验引擎自报的渲染尺寸不低于 CSS 画布尺寸。
const canvasCss = await page.evaluate(() => {
  const c = document.querySelector('#game');
  return {clientWidth: c.clientWidth, clientHeight: c.clientHeight, attrWidth: c.width, attrHeight: c.height};
});
const scalingOk = stats.hardwareScaling <= 1.0001;
const coversCanvas = stats.renderWidth >= canvasCss.clientWidth - 1 && stats.renderHeight >= canvasCss.clientHeight - 1;
console.log(`✓ 画布 CSS ${canvasCss.clientWidth}×${canvasCss.clientHeight} · 渲染 ${stats.renderWidth}×${stats.renderHeight} · hardwareScalingLevel ${stats.hardwareScaling}`);
console.log(`  清晰度门禁: scaling<=1 ${scalingOk ? 'PASS' : 'FAIL'} · 渲染覆盖画布 ${coversCanvas ? 'PASS' : 'FAIL'}`);

// 画质自动降级应改变效果成本，但不得降低渲染分辨率（low 档 minRenderScale 为 1）
await page.evaluate(() => window.__SHENCHENGJI_CITY__.setQuality('low'));
await page.waitForTimeout(600);
const low = await page.evaluate(() => window.__SHENCHENGJI_CITY__.quality);
console.log(`✓ 切到 low: ${JSON.stringify({level: low.level, msaa: low.msaa, ssao: low.ssao, bloom: low.bloom, renderScale: Number(low.renderScale.toFixed(4)), render: `${low.renderWidth}×${low.renderHeight}`})}`);
const lowStillSharp = low.hardwareScaling <= 1.0001;
console.log(`  low 档仍不模糊: ${lowStillSharp ? 'PASS' : 'FAIL'}`);

await page.screenshot({path: 'output/pages-deploy-check.png'});

console.log('\n=== 结论 ===');
console.log('404 请求:', notFound.length, notFound.slice(0, 10));
console.log('失败请求:', failed.length, failed.slice(0, 10));
console.log('页面错误:', errors.length, errors.slice(0, 10));
console.log('速度提升:', speedAfter > speedBefore ? 'PASS' : 'FAIL');
console.log('清晰度:', scalingOk && coversCanvas && lowStillSharp ? 'PASS' : 'FAIL');

const ok = notFound.length === 0 && failed.length === 0 && errors.length === 0 && speedAfter > speedBefore
  && scalingOk && coversCanvas && lowStillSharp;
console.log(ok ? '\n✅ 部署验证通过' : '\n❌ 存在问题');
process.exitCode = ok ? 0 : 1;

await browser.close();
