import {chromium} from 'playwright';

/**
 * 部署诊断：不等待世界就绪，只抓取前 60 秒的 404 / 报错 / 加载进度，
 * 用于快速定位资源路径问题。
 */
const BASE = process.env.PAGES_BASE ?? 'http://127.0.0.1:8899/gta-sz-open-roads/';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'],
});
const context = await browser.newContext({viewport: {width: 1280, height: 800}});
const page = await context.newPage();

const notFound = [];
const failed = [];
const pageErrors = [];
const consoleErrors = [];
let okCount = 0;

page.on('response', (r) => {
  if (r.status() === 404) notFound.push(r.url());
  else if (r.status() >= 200 && r.status() < 300) okCount++;
});
page.on('requestfailed', (r) => failed.push(`${r.url()} :: ${r.failure()?.errorText}`));
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

console.log('打开', BASE);
await page.goto(BASE, {waitUntil: 'domcontentloaded', timeout: 90000});

// 每 10 秒采样一次状态，共 6 次（60 秒）
for (let i = 1; i <= 6; i++) {
  await page.waitForTimeout(10000);
  const state = await page.evaluate(() => {
    const w = window;
    return {
      ready: w.__SHENCHENGJI_CITY__?.ready ?? null,
      hasCity: typeof w.__SHENCHENGJI_CITY__,
      loading: !!document.querySelector('#city-loading'),
      loadingText: document.querySelector('#city-loading')?.textContent?.slice(0, 120) ?? null,
      canvas: (() => { const c = document.querySelector('#game'); return c ? `${c.width}x${c.height}` : null; })(),
    };
  }).catch((e) => ({evalError: e.message}));
  console.log(`[${i * 10}s]`, JSON.stringify(state));
}

console.log('\n===== 诊断汇总 =====');
console.log(`成功响应: ${okCount}`);
console.log(`\n404 (${notFound.length}):`);
[...new Set(notFound)].slice(0, 40).forEach((u) => console.log('  ', u));
console.log(`\n请求失败 (${failed.length}):`);
[...new Set(failed)].slice(0, 20).forEach((u) => console.log('  ', u));
console.log(`\n页面异常 (${pageErrors.length}):`);
[...new Set(pageErrors)].slice(0, 15).forEach((u) => console.log('  ', u));
console.log(`\n控制台错误 (${consoleErrors.length}):`);
[...new Set(consoleErrors)].slice(0, 20).forEach((u) => console.log('  ', u));

await browser.close();
