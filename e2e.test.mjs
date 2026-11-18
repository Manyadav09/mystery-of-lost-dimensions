import { chromium } from 'playwright-core';
const errors = [];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto('http://127.0.0.1:4182/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByText('Begin the Expedition').click();
await page.waitForTimeout(1500);
const veil = page.getByText('CLICK TO CONTINUE');
if (await veil.count()) await veil.click();
await page.waitForTimeout(300);

// teleport to the pedestal and interact
await page.evaluate(() => window.__mld.teleport(0, 1.2));
await page.waitForTimeout(400);
await page.keyboard.press('KeyE');
await page.waitForTimeout(700);
console.log('modal visible:', await page.locator('text=PUZZLE 01').count() > 0);
await page.screenshot({ path: '/tmp/e2e-modal.png' });

// brute-force the 3-pair memory match over all slot pairs
const SLOTS = 'button[class*="aspect-"]';
const n = await page.locator(SLOTS).count();
console.log('cards in grid:', n);
outer:
for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    if (await page.locator('text=THE SEAL YIELDS').count()) break outer;
    await page.locator(SLOTS).nth(i).click();
    await page.waitForTimeout(140);
    await page.locator(SLOTS).nth(j).click();
    await page.waitForTimeout(1050);
  }
}
await page.waitForTimeout(1500);
console.log('seal yielded:', await page.locator('text=THE SEAL YIELDS').count() > 0);

// wait for the door to open, teleport through, expect completion panel
await page.waitForTimeout(2600);
await page.keyboard.press('Escape'); // no-op safeguard
await page.evaluate(() => window.__mld.teleport(0, -5.4));
await page.waitForTimeout(1500);
console.log('level complete panel:', await page.locator('text=LEVEL COMPLETE').count() > 0);
await page.screenshot({ path: '/tmp/e2e-complete.png' });

const save = await page.evaluate(() => JSON.parse(localStorage.getItem('mld_save_v1') ?? '{}'));
console.log('save:', JSON.stringify({ completed: save.completedLevels, stars: save.bestStars, achievements: save.achievements, lastLevel: save.lastLevel }));
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
