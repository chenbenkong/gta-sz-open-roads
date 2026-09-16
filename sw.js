/* 深城纪 · 资源缓存 Service Worker
 * =================================
 * 为什么需要它：GitHub Pages 对所有静态资源只发 `Cache-Control: max-age=600`，
 * 于是每次隔了 10 分钟再来的玩家都要重新走一遍 ~3500 个请求、约 200MB 的城市资产。
 * 本项目是纯静态站点、无服务端配置权，Service Worker 是唯一能改缓存策略的地方。
 *
 * 策略：**只接管大体积且内容稳定的资产目录**（city / assets / characters / data / licenses），
 * 采用 cache-first。代码（index.html 与 _bundle/）**刻意不接管** ——
 * 它们体积小、每次发版都变，交给浏览器 HTTP 缓存即可，这样就不存在"发版后拿到旧代码"的风险。
 *
 * 失效方式：改 CACHE 版本号。激活时会把所有旧版本缓存删掉。
 *
 * 容错：任何一步出错都直接回落到网络请求，最坏情况等于"没有 Service Worker"，
 * 不会让站点打不开。
 */

const CACHE = 'shenchengji-assets-v1';

// 只接管这些前缀下的资源；其余（含 HTML、_bundle、sw.js 自身）一律不拦截。
const MANAGED = /^\/(?:city|assets|characters|data|licenses)\//;

self.addEventListener('install', (event) => {
  // 立即接管，不等旧页面全部关闭
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    } catch (e) { /* 清理失败不影响使用 */ }
    try { await self.clients.claim(); } catch (e) { /* 同上 */ }
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // 只管同源、且落在受管前缀下的请求
  if (url.origin !== self.location.origin) return;
  if (!MANAGED.test(url.pathname)) return;

  event.respondWith((async () => {
    let cache = null;
    try { cache = await caches.open(CACHE); } catch { /* 打开失败则纯网络 */ }

    if (cache) {
      try {
        const hit = await cache.match(req);
        if (hit) return hit;
      } catch { /* 查询失败则继续走网络 */ }
    }

    const res = await fetch(req);

    // 只缓存完整成功的响应；206 部分内容、opaque 响应一律不缓存
    if (cache && res.ok && res.status === 200 && res.type === 'basic') {
      try {
        // 复制一份交给缓存，原件返回给页面
        const copy = res.clone();
        event.waitUntil(cache.put(req, copy).catch(() => {}));
      } catch { /* 缓存写入失败不影响本次返回 */ }
    }
    return res;
  })());
});
