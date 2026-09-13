import {chromium} from 'playwright';

/**
 * GitHub Pages 子路径部署验证
 * ---------------------------
 * 在 http://127.0.0.1:8898/gta-sz-open-roads/ 下加载游戏，
 * 校验：无 404、无未捕获错误、世界初始化完成、资源加载成功、可驾驶。
 */
const BASE = process.env.PAGES_BASE ?? 'http://127.0.0.1:8898/gta-sz-open-roads/';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});

const context = await browser.newContext({viewport: {width: 1280, height: 800}});
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

// 世界规模
const stats = await page.evaluate(() => {
  const w = window.__SHENCHENGJI_CITY__.world;
  return {
    landmarks: w.data.landmarks.length,
    roads: w.data.roads.length,
    meshes: w.scene.meshes.length,
    fps: Math.round(w.engine.getFps()),
  };
});
console.log('✓ 世界统计:', JSON.stringify(stats));

await page.screenshot({path: 'output/pages-deploy-check.png'});

console.log('\n=== 结论 ===');
console.log('404 请求:', notFound.length, notFound.slice(0, 10));
console.log('失败请求:', failed.length, failed.slice(0, 10));
console.log('页面错误:', errors.length, errors.slice(0, 10));
console.log('速度提升:', speedAfter > speedBefore ? 'PASS' : 'FAIL');

const ok = notFound.length === 0 && failed.length === 0 && errors.length === 0 && speedAfter > speedBefore;
console.log(ok ? '\n✅ 部署验证通过' : '\n❌ 存在问题');
process.exitCode = ok ? 0 : 1;

await browser.close();
