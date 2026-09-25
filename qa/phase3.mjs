// Phase 3 QA: hold Shift + ArrowRight for 3 s. Sora runs right and down the first
// flight, draining stamina at the run rate (18/s) without getting tired.
// page.evaluate(..., undefined, false) runs in the page main world (see qa/dbg.mjs).
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(800);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Shift');
  await page.waitForTimeout(3000);
  await page.keyboard.up('Shift');
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: 'shots/phase-3.png' });
  return page.evaluate(() => {
    const s = window.__dbg.player();
    return { mode: s.mode, x: Math.round(s.x), y: Math.round(s.y), stamina: Math.round(s.stamina), tired: s.tired, running: s.running, facing: s.facing };
  }, undefined, false);
}
