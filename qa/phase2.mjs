// Phase 2 QA: hold ArrowRight for 2 s; the probe walks right and down the first flight.
// page.evaluate(..., undefined, false) runs in the page main world (see qa/dbg.mjs).
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight');
  return page.evaluate(() => window.__dbg.summary(), undefined, false);
}
