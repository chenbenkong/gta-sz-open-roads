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

## 画质与流畅度

游戏会在运行中**自动调节画质档位**：每秒采样帧时间，若持续低于 40 FPS 就下调
一档，若持续高于 80 FPS 则回升，因此不会出现「又糊又卡」的两头不讨好。

**渲染分辨率永不低于画布尺寸。** 所有档位的硬件缩放级别都钳制在 `(0, 1]`，
`低` 档还会主动牺牲特效，而绝不牺牲清晰度。若你仍觉得画面偏糊，请在地址后
追加参数手动指定档位：

| 地址参数 | 效果 |
|----------|------|
| `?quality=high` | 4× MSAA + SSAO + Bloom + 颗粒 + 镜头色散，2048 阴影图（默认起点） |
| `?quality=balanced` | 2× MSAA + SSAO + Bloom，1024 阴影图，关闭色散 |
| `?quality=low` | FXAA + 阴影，关闭 SSAO/Bloom/颗粒，渲染分辨率保持原生 |
| `?quality=auto` | 交回自动调节 |

追加 `?profile` 可打开画质面板，实时查看当前档位、渲染分辨率与缩放系数，
并可用按钮手动锁定档位。

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

**分辨率钳制（画面模糊的修复）。** `engine.setHardwareScalingLevel(v)` 中
`v > 1` 表示「以低于画布的分辨率渲染再放大」，即**模糊因子**。原实现写的是：

```ts
// 修复前：任何大于 1080p 的窗口都会糊
const ratio = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1920*1080/(innerWidth*innerHeight)));
this.engine.setHardwareScalingLevel(1 / ratio);
```

在 2560×1440 下 `ratio ≈ 0.75`，于是 `1/ratio ≈ 1.33` —— 全城以 75% 分辨率
渲染再拉大，这正是"糊"的来源。修复后所有档位的级别都落在 `(0, 1]`，
`high` 档在 HiDPI 屏上还会超采样。

`scripts/check-resolution-math.mjs` 对 7 种视口 × 3 种 DPR × 3 档画质做断言，
确保任何组合都不会把渲染分辨率压到画布之下。

**后处理链顺序（主视口变成纯色的修复）。** Babylon 的
`DefaultRenderingPipeline` 只要**任何一个属性**被写入，就会重建整条后处理链，
并把 `city-optics` 的各个 pass 重新追加到相机上。而 `SSAO2RenderingPipeline`
的 `SSAOOriginalSceneColor`（一个 `PassPostProcess`）**必须第一个**拿到 scene
target，否则「场景颜色 → 屏幕」这一步永远走不完，视口只剩 clearColor 经
imageProcessing 后的结果 —— 表现出来就是一片纯色，并且**颜色随 MSAA 档位变化**
（4× 出绿、2× 出黑、FXAA 出噪点），极具误导性。

触发点是构造函数末尾无条件执行 `setQuality('high')`：那时 `createCinematicLook`
尚未运行，`applyQuality` 在管线还没进入作者态时改写了 `samples` / `fxaaEnabled` /
`bloomEnabled`，链被重排且再也修不回来。

修复（`src/city-world.ts`）：

- `applyQuality` 增加硬守卫 `if (!this.cinematic) return;` —— cinematic 就绪前
  **只记录档位，绝不触碰管线**；
- MSAA/FXAA 改走既有的 `applyAntiAliasing` 路径（它会用
  `_forceBlockMaterialDirtyMechanism` 抑制 Babylon 的材质 dirty 风暴，并自行
  `prepare()`），其余质量项在同一抑制块里批量写入，最后统一 `syncPostChain()` 修序；
- 构造函数只解析 `?quality=` 参数，真正的落档移到 `createCinematicLook` 之后；
- `autoTune` 增加就绪守卫，加载期间不可能调档。

`scripts/check-frame-content.mjs` 是这一项的回归闸门：它**只看像素**，截取 3D 视口
中一块避开全部 HUD 的区域，统计颜色数 / 单色占比 / 亮度标准差 / 水平梯度 / 全黑占比，
逐档（high / balanced / low / auto）以及行驶中各验证一次，任一不达标即失败。
纯色画面从此无法通过验证。

**界面字体过细。** 原字体栈以 `'PingFang SC'`（仅 macOS 提供）打头，Windows 上
回退到 `system-ui`（微软雅黑）的 400 字重；全站 31 处 10–13px 小字在这个组合下
横画极细、整体发灰。现改为跨平台字体栈
（`HarmonyOS Sans SC` / `MiSans` / `Microsoft YaHei UI` / `Microsoft YaHei` /
`Source Han Sans SC` / `Segoe UI`），并给界面小字统一加 `-webkit-text-stroke`
细描边与 500 字重 —— **字号与布局均未改动**，只提亮笔画。

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
