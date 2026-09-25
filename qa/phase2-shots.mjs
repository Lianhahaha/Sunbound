// Phase 2 visual check: screenshot at spawn, then after 5 s of walking right
// (probe on the second flight), to judge camera follow and parallax.
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/phase-2.png' });
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(5000);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/phase-2-descent.png' });
  return page.evaluate(() => JSON.stringify(window.__dbg.summary()), undefined, false);
}
