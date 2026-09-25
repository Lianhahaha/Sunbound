// Evaluate one expression in the page's MAIN world and print the result.
//
// Why: the browser-automation skill drives Chrome through patchright, which
// runs page.evaluate and the --eval flag in an isolated world. DOM queries
// work there, but page globals such as window.__game and window.__dbg do not
// exist. Passing `false` as the third argument of page.evaluate selects the
// main world.
//
// Usage (bash):
//   DBG_EXPR="window.__dbg.summary()" node "<skills>/browser-automation/browser.mjs" http://localhost:5180/ --script ./qa/dbg.mjs
// Optional: DBG_WAIT=<ms> to wait longer before evaluating (default 800).
export default async function run(page) {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(Number(process.env.DBG_WAIT ?? 800));
  const expr = process.env.DBG_EXPR ?? "window.__dbg ? window.__dbg.summary() : 'no __dbg yet'";
  return page.evaluate((source) => (0, eval)(source), expr, false);
}
