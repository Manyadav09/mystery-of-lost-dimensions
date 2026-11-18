import { chromium } from 'playwright-core';
const errors = [];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto('http://127.0.0.1:4182/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.getByText('Begin the Expedition').click();
await page.waitForTimeout(2500);
console.log('__mld present:', await page.evaluate(() => !!window.__mld));
const veil = page.getByText('CLICK TO CONTINUE');
console.log('veil count:', await veil.count());
if (await veil.count()) { await veil.click(); }
await page.waitForTimeout(800);
console.log('locked after veil:', await page.evaluate(() => window.__mld?.locked()));

await page.evaluate(() => window.__mld.teleport(0, 1.2));
await page.waitForTimeout(600);
console.log('pos:', JSON.stringify(await page.evaluate(() => window.__mld.pos())));
await page.keyboard.press('KeyE');
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/e2e2-afterE.png' });
console.log('modal count:', await page.locator('text=PUZZLE 01').count());
console.log('errors:', errors.join(' | ') || 'none');
await browser.close();
