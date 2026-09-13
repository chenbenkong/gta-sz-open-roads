/// <reference types="vite/client" />

/**
 * 资源基址（Asset Base）
 * ======================
 *
 * 原项目把静态资源写成根绝对路径，例如 '/city/city.json'。
 * 这在「站点部署在域根」时成立，但在 GitHub Pages 项目页
 * （https://chenbenkong.github.io/gta-sz-open-roads/）下会 404，
 * 因为 '/city/...' 会被解析到域根而不是项目子路径。
 *
 * 本模块把部署基址归一化成「以斜杠结尾、可直接拼接」的前缀：
 *
 *   域根部署          -> ASSET_BASE = '/'
 *   Pages 子路径部署  -> ASSET_BASE = '/gta-sz-open-roads/'
 *
 * 取值优先级（低耦合、可被任意打包器正确保留）：
 *   1) globalThis.__ASSET_BASE__  —— 构建脚本在产物头部注入的确定值
 *   2) import.meta.env.BASE_URL   —— Vite 构建的静态替换
 *   3) 运行时从 <script src> 推导 —— 兼容未注入的构建
 *   4) '/'                        —— 兜底
 *
 * 关键点：推导逻辑刻意引入运行时不确定分支（读取 DOM），
 * 以保证打包器不会把本模块当作纯常量折叠掉。
 */
function readInjected(): string | undefined {
  const g = globalThis as unknown as {__ASSET_BASE__?: unknown};
  const v = g.__ASSET_BASE__;
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function readFromScriptTag(): string | undefined {
  // 入口脚本通常位于 <base>/_bundle/index-*.js，其父目录即部署基址。
  if (typeof document === 'undefined') return undefined;
  const scripts = document.querySelectorAll('script[src][type="module"]');
  for (const el of Array.from(scripts)) {
    const src = el.getAttribute('src');
    if (!src) continue;
    const marker = src.lastIndexOf('/_bundle/');
    if (marker >= 0) return src.slice(0, marker + 1);
  }
  return undefined;
}

function resolveBase(): string {
  const injected = readInjected();
  if (injected) return injected;

  const viteBase =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.BASE_URL as string | undefined)
      : undefined;
  if (typeof viteBase === 'string' && viteBase.length > 0) return viteBase;

  const derived = readFromScriptTag();
  if (derived) return derived;

  return '/';
}

const raw: string = resolveBase();

/** 保证以单个斜杠结尾，便于直接拼接相对片段。 */
export const ASSET_BASE: string = raw.endsWith('/') ? raw : raw + '/';
