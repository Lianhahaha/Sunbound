// Phase 5 QA: animation picked from state, 12 fps locomotion, idle look-around at 4 s,
// sitting at 10 s, and the rig on the board. Screenshots: sit, walk, roll.
// page.evaluate(..., undefined, false) runs in the page main world (see qa/dbg.mjs).
const anim = (page) =>
  page.evaluate(() => {
    const p = window.__dbg.scene().player;
    return { anim: p.currentAnim, msPerFrame: Math.round(p.sprite.anims.msPerFrame * 10) / 10, idle: Number(p.sim.idleTime.toFixed(1)) };
  }, undefined, false);

export default async function run(page) {
  await page.waitForSelector('canvas');
  // The game may have idled while the page finished loading; any input resets idle time.
  await page.keyboard.down('Shift');
  await page.waitForTimeout(100);
  await page.keyboard.up('Shift');
  await page.waitForTimeout(1000);
  const idle = await anim(page);
  await page.waitForTimeout(4200);              // idle time passes 4 s
  const look = await anim(page);
  await page.waitForTimeout(6000);              // idle time passes 10 s
  const sit = await anim(page);
  await page.screenshot({ path: 'shots/phase-5-sit.png' });

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(900);
  const walk = await anim(page);
  await page.screenshot({ path: 'shots/phase-5-walk.png' });
  await page.keyboard.up('ArrowRight');

  await page.keyboard.press('KeyQ');            // board on (latched press)
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1800);              // rolling down flight 1
  const roll = await anim(page);
  await page.screenshot({ path: 'shots/phase-5-roll.png' });
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const ollie = await anim(page);
  return { idle, look, sit, walk, roll, ollie };
}
