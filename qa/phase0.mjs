// Phase 0 QA: the game boots, Phaser runs the Boot scene, no errors.
// patchright (the browser driver) runs page.evaluate in an isolated world by
// default, so page globals such as window.__game are invisible there. The
// third argument `false` asks for the page's main world instead.
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(500);
  const probe = () => {
    const g = window.__game;
    return {
      hasGame: Boolean(g),
      scenes: g ? g.scene.getScenes(true).map((s) => s.scene.key) : [],
      renderer: g ? (g.renderer.type === 2 ? 'webgl' : 'canvas') : null,
      size: g ? [g.scale.width, g.scale.height] : null,
    };
  };
  let mainWorld = null;
  let mainWorldError = null;
  try {
    mainWorld = await page.evaluate(probe, undefined, false);
  } catch (err) {
    mainWorldError = String(err && err.message ? err.message : err).slice(0, 300);
  }
  const isolated = await page.evaluate(probe);
  return { mainWorld, mainWorldError, isolated };
}
