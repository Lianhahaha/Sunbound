// Phase 4 QA: step on the board at the top landing, push twice, roll down the
// first flight under gravity, ollie, and land. Screenshots mid-roll and mid-air.
// page.evaluate(..., undefined, false) runs in the page main world (see qa/dbg.mjs).
const read = (page) =>
  page.evaluate(() => {
    const s = window.__dbg.player();
    return {
      mode: s.mode, x: Math.round(s.x), y: Math.round(s.y), speed: Math.round(s.speed),
      grounded: s.grounded, tucking: s.tucking, fallTimer: Number(s.fallTimer.toFixed(2)),
    };
  }, undefined, false);

export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(800);
  await page.keyboard.press('KeyQ');            // step on the board
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);               // two pushes onto the first flight
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(2500);              // roll down flight 1 under gravity
  const rolling = await read(page);
  await page.screenshot({ path: 'shots/phase-4-roll.png' });
  await page.keyboard.press('Space');
  await page.waitForTimeout(150);
  const air = await read(page);
  await page.screenshot({ path: 'shots/phase-4-air.png' });
  await page.waitForTimeout(1500);
  const landed = await read(page);
  return { rolling, air, landed };
}
