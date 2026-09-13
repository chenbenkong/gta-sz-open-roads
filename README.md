# 深城纪 · 一路向海（GTA_SZ Open Roads）

沿深圳真实路网自由驾驶的浏览器 3D 游戏，基于开源项目
[linranff/GTA_SZ](https://github.com/linranff/GTA_SZ) 构建，部署于 GitHub Pages。

**在线游玩**：https://chenbenkong.github.io/gta-sz-open-roads/

---

## 操作说明

| 按键 | 功能 |
|------|------|
| `W` / `↑` | 加速 |
| `S` / `↓` | 刹车 / 倒车 |
| `A` / `←` | 左转 |
| `D` / `→` | 右转 |
| `空格` | 手刹 |
| `C` | 切换视角（车外 / 车内 / 无人机） |
| `R` | 复位车辆 |
| `H` | 切换抬头显示 |
| `M` | 切换昼夜 |
| `Esc` | 打开菜单 |

> 首次加载需下载约 200 MB 城市模型，请耐心等待进度条走完（阶段 1–17）。

---

## 仓库结构

```
├── index.html              # 页面入口（已指向 _bundle 打包产物）
├── _bundle/                # JS/CSS 打包产物（esbuild 生成）
├── city/                   # 城市三维数据（道路、建筑、贴图）
├── characters/             # 角色模型
├── assets/                 # 载具与街景模型
├── data/                   # 运行时数据（地图地点表）
├── licenses/               # 依赖许可文本
├── .nojekyll               # 关闭 Jekyll，使 _ 前缀目录可被访问
└── tools/                  # 构建与验证脚本（不参与站点运行）
```

---

## 构建说明

本项目**不使用 Vite 构建**（Vite/Rollup 在此环境下会在 bundling 阶段挂死），
改用 esbuild 直接打包，速度快且产物确定。

```bash
# 1. 打包（约 20-40 秒）
node tools/build-esbuild.mjs

# 2. 组装部署目录
node tools/make-deploy.mjs

# 3. 本地预览
npx serve deploy
```

### 关键实现细节

**子路径资源前缀。** 原项目把静态资源写成根绝对路径（`/city/city.json`），
在 GitHub Pages 项目页（`/gta-sz-open-roads/`）下会 404。
`src/asset-base.ts` 负责解析部署基址：

```
globalThis.__ASSET_BASE__   ← 构建脚本注入（优先）
import.meta.env.BASE_URL    ← Vite 构建时替换
<script src> DOM 推导       ← 兜底
'/'
```

构建脚本会通过 esbuild 的 `banner` 在所有产物头部注入：

```js
globalThis.__ASSET_BASE__="/gta-sz-open-roads/";
```

> ⚠️ 这里刻意保留了一个运行时不可确定分支（读取 DOM），
> 否则打包器会把该模块折叠成常量 `'/'`，导致前缀全部丢失。

**`import.meta.env` 的安全访问。** 原生 ESM 下 `import.meta.env` 为 `undefined`，
直接读属性会抛 `TypeError` 并使整个模块加载失败。项目内所有访问均已改为
可选链形式（`import.meta.env?.X`）。

---

## 数据来源与许可

| 内容 | 来源 | 许可 |
|------|------|------|
| 道路网络 | OpenStreetMap 贡献者 | ODbL 1.0 |
| 地形高程 | Copernicus 30m DSM | 免费开放 |
| 材质贴图 | Poly Haven | CC0 |
| 城市资产 | 原项目 linranff/GTA_SZ | 见 `licenses/` |

<!--
⚠️ 合规提示（部署前请确认）
public/characters/manifest.json 中标注
  "publicReleaseAuthorization": "not verified"
该目录下角色模型为 miHoYo 版权素材的 MMD 改造版本。
公开部署该目录存在版权风险，请确认授权或移除 characters/ 后再发布。
-->
