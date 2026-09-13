# GTA_SZ（深城纪 / ShenChengJi）反编译与代码分析报告

- **源仓库**：https://github.com/linranff/GTA_SZ
- **项目自称**：GTA-6 深圳 mini 青春 Lite 版 / `shenchengji-open-roads`
- **版本**：0.2.0（最近提交 2026-09-10，25 次提交）
- **分析日期**：2026-09-13
- **分析结论摘要**：这是一个**完全开源、未混淆、可直接读取 TypeScript 源码**的 Babylon.js 浏览器开放世界项目，**并不需要传统意义上的"反编译"**——源码、资源清单与构建脚本全部可用。真正的工作量在于**资源路径适配与 378MB 级静态资源的托管**。

---

## 一、技术栈与工程形态

| 维度 | 结论 |
|------|------|
| 渲染引擎 | Babylon.js 8.x（`@babylonjs/core` + `@babylonjs/loaders`） |
| 构建工具 | Vite 7 + TypeScript 5.9（`tsc --noEmit` 做类型门禁） |
| 模块形态 | 原生 ESM + `import.meta.env`，无框架（无 React/Vue） |
| 坐标原点 | WGS84 `[114.025, 22.536]`，经度差 ×102850、纬度差 ×111320，水平/垂直统一缩放 0.60 |
| 美术管线 | Blender + `scripts/*.py` → GLB（Y-up）→ 网页加载；烘焙动画、meshopt 压缩 |
| 测试 | Node 内置 test runner，`node --experimental-transform-types`，**218 个用例全通过** |
| 源码规模 | `src/` 约 **10,538 行 TypeScript**，103 个模块文件 |
| 资源规模 | `public/` 约 **378 MB**，3,493 个文件 |

### 1.1 源码模块结构（`src/`）

```
src/
├── main.ts                  (24.7 KB) 入口引导：boot() → 世界 → UI → 生活系统 → 生涯系统
├── city-world.ts            (70.7 KB) 世界总装配（最大文件，加载流水线核心）
├── city-map.ts              (42.7 KB) 城市地图面板与路线交互
├── city-facade-diversity.ts (39.3 KB) 立面多样性着色器
├── city-rain-puddles.ts     (33.9 KB) 雨后积水与反射
├── city-autopilot.ts        (26.9 KB) 自动驾驶
├── city-career.ts           (26.1 KB) 生涯/职业玩法
├── city-cinematic.ts        (24.1 KB) 电影级后处理
├── city-meadow.ts           (21.6 KB) 草地流式瓦片
├── city-architecture-materials.ts (18.3 KB) 建筑材质与窗光
├── city-landscape.ts        (16.9 KB) 植被与景观
├── city-local-lighting.ts   (16.7 KB) 局部光源
├── ...（其余按子系统拆分，单文件职责清晰）
```

---

## 二、游戏逻辑梳理

### 2.1 启动链路（`main.ts` → `boot()`）

```
boot()
 ├─ new DrivingWorld(canvas) → await world.init(progress)   ← 城市全量装配
 ├─ fetch /city/navigation.json → new RoadGraph(...)         ← 路网寻路图
 ├─ world.startTraffic(graph)                                ← 车流
 ├─ fetch /city/life-sites.json → 注入生活驿站地标
 ├─ initUI() → initLife()                                    ← HUD + 顺路单系统
 ├─ await cityMap.ready                                      ← 地图就绪
 ├─ createCareerExperience(...)                              ← 生涯玩法
 └─ 挂载 window.__SHENCHENGJI_CITY__ 调试/测试接口
```

`world.init()` 内部是一条**严格串行**的资源加载流水线（`city-world.ts`），依次为：
地图数据 → 路名 → 地标详情 → 山脊 → 公园缓坡 → 跨水桥梁 → 地形/道路 → 海岸线 → 建筑 → 精细立面流式 → 地标 → 地标增量 → 招牌 → 咖啡馆 → 车 → 景观植被 → 街道家具 → 路人 → 灯光 → 电影级外观 → 积水 → 飞机 → 坦克。

### 2.2 玩法系统

| 系统 | 模块 | 说明 |
|------|------|------|
| 驾驶 | `driving.ts` / `city-autopilot.ts` | WASD 操控、自动驾驶寻路、接管 |
| 徒步 | `city-walk.ts` / `city-rider.ts` | F 上下车，走路/跑步，第三人称角色 |
| 无人机观景 | `city-observer*.ts` | G 切换，长按地点收藏/移动 |
| 飞机 | `city-flight*.ts` | B 切换，含导弹与爆炸 |
| 坦克 | `city-tank*.ts` | 可驾驶，含炮弹模拟 |
| 顺路单 | `main.ts` + `city-life.ts` | 3 条剧情订单，接人/送达，停车按 E |
| 生涯/职业 | `city-career.ts` | 储蓄目标 ¥1,800，升级系统 |
| 城市生活 | `city-bamboo-cafe.ts` | 月白女仆咖啡馆可进入，3 名员工有对话与骨骼动画 |
| 地图 | `city-map.ts` | 地标筛选、自动路线、手动路线、照片模式 |
| 环境 | `city-daylight.ts` / `city-sunset-environment.ts` / `city-night-sky.ts` | L 键切换 日落/夜色/晴日 |

### 2.3 坐标系与地形

- 原点 `[114.025, 22.536]`，投影：`x = (lon-114.025)*102850`，`z = (lat-22.536)*111320`，统一缩放 0.60。
- 地形由 `terrain-detail.json`（莲花山高度场）+ `ground-relief` + `mountain-relief` 叠加，运行时通过 `groundHeight(x,z)` 查询。
- 早期 EPSG:32649 研究坐标与游戏坐标**不可混用**（`AGENTS.md` 明确警告）。

---

## 三、资源结构

```
public/                                    378 MB / 3,493 files
├── city/          329 MB   ← 城市主体
│   ├── buildings.glb          48 MB   3,310,538 三角面 / 882 mesh
│   ├── facades.glb            29 MB   3,651,432 三角面
│   ├── street-surfaces.json   35 MB   （最大的单文件）
│   ├── roads.glb              17 MB
│   ├── terrain.glb / landmarks.glb / landmark-detail.glb
│   ├── car.glb / traffic-car.glb / floatplane.glb / palm.glb / tree.glb ...
│   ├── environment/*.hdr      4K HDR 环境贴图（3 张，共 52 MB）
│   ├── textures/              建筑/招牌/路面贴图
│   ├── facade-tiles/          精细立面流式瓦片
│   ├── grassland-v2/meadow/   草地流式瓦片（3 KiB/片）
│   ├── landmark-detail.json / building-signs.json / navigation.json
│   ├── pedestrian-paths.json / lamps.json / trees.json / life-sites.json
│   └── meshopt_decoder.js     ★ WASM 解码器，**内嵌 base64，无外部 CDN 依赖**
├── assets/         26 MB   陈业/林夏角色、房间、街道、自行车
├── characters/     24 MB   kuki.glb(12MB) / yelan.glb(13MB) 运行版角色
└── licenses/       40 KB   许可证与归属
```

### 3.1 数据来源与许可证

- 地图数据：**OpenStreetMap**（`data/ATTRIBUTION.md`）
- 地形：**Copernicus** 30m DSM（明确标注"插值不提高实测分辨率"）
- 角色：**miHoYo 模型**，经 MMD 改造（`characters/CREDITS.txt`，manifest 标注 `publicReleaseAuthorization: not verified`）
- 环境贴图：Poly Haven（Kloofendal / Belfast / Rustig）
- 咖啡馆与地标：原创 Blender 建模

---

## 四、依赖关系分析

### 4.1 运行期外部依赖：**零**

全量扫描 `src/`、`index.html`、`trailer.html` 后确认，运行时唯一的外部 URL 是：
- `http://www.w3.org/2000/svg` —— SVG 命名空间常量（非网络请求）
- `https://www.openstreetmap.org/` —— 地图数据归属署名（元数据）

**无任何 CDN、无外部字体、无远程 API。** meshopt WASM 解码器以 base64 内嵌在 `meshes_decoder.js` 中。这对 GitHub Pages 部署是决定性利好——**完全可离线自持**。

### 4.2 构建期依赖

```
dependencies:    @babylonjs/core ^8.0.0, @babylonjs/loaders ^8.0.0
devDependencies: vite ^7.0.0, typescript ^5.9.0, playwright ^1.55.0,
                 @gltf-transform/{core,extensions,functions} ^4.5.0, meshoptimizer ^1.2.0
```

### 4.3 模块依赖特征

- **星型拓扑**：`city-world.ts` 是绝对中心，向下 import 几乎全部子系统；子系统之间横向耦合很少。
- **类型集中**：`city-types.ts`（744 B）被 40+ 模块引用，是共享类型契约。
- **动态 import**：`city-life-hub.ts`、`city-career-experience.ts` 使用 `await import()` 做按需加载，天然形成代码分割。
- **资源与代码解耦**：所有资源通过 HTTP 路径字符串引用，不经过打包器 —— 这正是路径适配的着力点。

---

## 五、GitHub Pages 部署的关键障碍

### 5.1 障碍 A：硬编码的根绝对路径（★ 核心问题）

源码中存在 **40+ 处**以 `/` 开头的资源路径字面量，例如：

```ts
MeshoptCompression.Configuration = {decoder: {url: '/city/meshopt_decoder.js'}};  // city-world.ts:5
await ImportMeshAsync('/city/' + name + '.glb', this.scene);                     // city-world.ts:194
await fetch('/city/city.json');                                                  // city-world.ts:196
new HDRCubeTexture('/city/environment/rooftop-night-2k.hdr', ...);               // city-cinematic.ts:187
const CHARACTER_ASSET_BASE = (configuredBase || '/characters').replace(/\/+$/, ''); // city-local-characters.ts:6
```

在 GitHub Pages 中，站点根是 `https://chenbenkong.github.io/`，项目页部署在子路径
`https://chenbenkong.github.io/gta-sz-open-roads/` 下。绝对路径 `/city/city.json` 会被解析为
`https://chenbenkong.github.io/city/city.json` —— **404，游戏在加载第一步即失败**。

**唯一已有适配点**：`city-local-characters.ts` 支持 `VITE_CHARACTER_ASSET_BASE` 环境变量覆盖，
但仅限于 `/characters`，且必须**在构建时**注入。

### 5.2 障碍 B：资源体积 vs. GitHub 限制

| 限制项 | 阈值 | 现状 | 判定 |
|--------|------|------|------|
| 单文件 ≤ 100 MB | 硬限制 | 最大 48 MB（buildings.glb） | ✅ 通过 |
| 仓库推荐 ≤ 1 GB | 软限制 | dist 约 380 MB | ✅ 通过 |
| 单次推送 ≤ 2 GB | 硬限制 | 约 380 MB | ✅ 通过 |
| Pages 站点 ≤ 1 GB | 推荐 | 约 380 MB | ✅ 通过 |
| Pages 月流量 100 GB | 软限制 | 单次全量加载约 150 MB | ⚠️ 约 600 次全量访问 |

**结论：无需 Git LFS，无需外部对象存储。** 但需要注意 Pages 流量配额，且首次加载体验较重。

### 5.3 障碍 C：无 SPA 回退需求（利好）

游戏是单页 + 无路由（不使用 History API 路由），不需要 404.html 回退技巧。

---

## 六、部署方案设计

### 6.1 首选方案：构建期路径重写 + 分支部署

1. 将 `public/` 下资源整体迁入 Vite 的 `publicDir`，由构建输出到 `dist/`。
2. 在构建前对 `src/**.ts` 做**源码级路径重写**：把字面量 `'/city` → `import.meta.env.BASE_URL + 'city`，
   或更稳妥地引入 `ASSET_BASE` 常量（由 `VITE_ASSET_BASE` 注入）。
3. 设置 Vite `base` 为 `/gta-sz-open-roads/`。
4. 把 `dist/` 内容推送到仓库 `main` 分支根目录，沿用用户既有的 `yunye-open-world` legacy Pages 模式。

### 6.2 为什么不选其他方案

- **相对路径（`./city/...`）**：不可行。`city-facade-diversity.ts:25` 有正则校验
   `/^\/city\/textures\/signage\/[a-z0-9-]+\.png$/`，改成相对路径会直接判定资源非法。
- **自定义域名**：让站点位于根路径可绕过所有问题，但需要用户自有域名与 DNS 配置。
- **GitHub Actions 构建**：可行，但仓库需保留完整源码与源码依赖，且大文件已被 gitignore 的内容
  需一并纳入 —— 会增加复杂度和失败面。

---

## 七、验收基线（本次分析实测）

| 检查项 | 结果 |
|--------|------|
| `npm install` | ✅ 43 个包，约 4 分钟 |
| `npm test` | ✅ **218 / 218 通过**，耗时 108 秒 |
| LFS 内容解析 | ✅ 无残留指针文件，274 个 LFS 对象已实体化 |
| 外部网络依赖 | ✅ 0 个 |
| 源码可读性 | ✅ 未混淆，完整 TypeScript |
| 单文件体积 | ✅ 最大 48 MB < 100 MB 限制 |

---

## 八、风险与合规提示

1. **角色资源授权**：`characters/manifest.json` 明确标注 `publicReleaseAuthorization: "not verified"`，
   模型来自 miHoYo 并经 MMD 改造。**公开部署前应确认授权边界**，这是最主要的合规风险。
2. **仅桌面端**：README 声明为 "desktop browser"，移动端未适配。
3. **Pages 流量**：单次完整加载约 150 MB，100 GB/月配额约支撑 600 次全量访问。
4. **旧版 Pages 构建器限制**：`legacy` 模式对超大仓库的上传与构建有超时风险，需实测。
