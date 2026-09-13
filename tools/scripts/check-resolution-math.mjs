// 分辨率公式回归检查
// ==================
// 修复前的 `resize()` 会在任何大于 1080p 的视口上把硬件缩放级别推到 1 以上，
// 即渲染分辨率低于画布再放大 = 模糊。本脚本对修复后与修复前的公式逐视口求值，
// 断言修复后的级别恒在 (0,1]，并打印可读的渲染分辨率。
//
// 用法：node scripts/check-resolution-math.mjs
const VIEWPORTS = [[1920, 1080], [2560, 1440], [3840, 2160], [1280, 800], [1366, 768], [5120, 2880], [3440, 1440]];
const PRESETS = {
  high: {minRenderScale: .75, allowSupersample: true, allowResolutionScale: true},
  balanced: {minRenderScale: .85, allowSupersample: false, allowResolutionScale: false},
  low: {minRenderScale: 1, allowSupersample: false, allowResolutionScale: false},
};

function fixedLevel(w, h, dpr, preset) {
  const area = Math.max(1, w * h), panel = dpr;
  const ss = preset.allowSupersample ? Math.min(panel, 1.35) : 1;
  const budget = preset.allowResolutionScale ? Math.min(1, Math.sqrt(1920 * 1080 / area) / panel) : 1;
  return ss > 1 ? 1 / ss : Math.max(budget, preset.minRenderScale);
}

function legacyLevel(w, h, dpr) {
  const ratio = Math.min(dpr || 1, 1.5, Math.sqrt(1920 * 1080 / (w * h)));
  return 1 / ratio;
}

let failures = 0;
console.log('=== 修复后 ===');
for (const [w, h] of VIEWPORTS) {
  for (const dpr of [1, 1.25, 2]) {
    const parts = [];
    for (const [name, p] of Object.entries(PRESETS)) {
      const level = fixedLevel(w, h, dpr, p);
      const rw = Math.round(w / level), rh = Math.round(h / level);
      if (!(level > 0 && level <= 1.0001)) {
        console.log(`  ✗ ${w}x${h} dpr${dpr} ${name}: level ${level} > 1（仍会模糊）`);
        failures++;
      }
      parts.push(`${name}=${level.toFixed(3)} [${rw}x${rh}]`);
    }
    console.log(`  ${w}x${h} dpr${dpr}: ${parts.join('  ')}`);
  }
}

console.log('\n=== 修复前（对照，会模糊的那条路径）===');
for (const [w, h] of VIEWPORTS) {
  const level = legacyLevel(w, h, 1);
  const rw = Math.round(w / level), rh = Math.round(h / level);
  console.log(`  ${w}x${h} dpr1 -> level ${level.toFixed(3)} 渲染 ${rw}x${rh} ${level > 1 ? '❌ 低于画布' : '✓'}`);
}

console.log(`\n${failures === 0 ? '✓ 全部通过：修复后任何视口都不低于原生分辨率' : `✗ ${failures} 项不合格`}`);
process.exit(failures === 0 ? 0 : 1);
