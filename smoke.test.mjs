import { chromium } from 'playwright-core';
const errors = [];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto('http://127.0.0.1:4180/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/shot-menu.png' });
console.log('menu title:', await page.title());

// Begin the expedition
await page.getByText('Begin the Expedition').click();
await page.waitForTimeout(1800);
await page.screenshot({ path: '/tmp/shot-game.png' });

// click the veil to engage pointer lock
const veil = page.getByText('CLICK TO CONTINUE');
if (await veil.count()) { await veil.click(); await page.waitForTimeout(700); }
console.log('pointer lock element:', await page.evaluate(() => !!document.pointerLockElement));

// walk forward toward the pedestal
await page.keyboard.down('KeyW');
await page.waitForTimeout(1600);
await page.keyboard.up('KeyW');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/shot-room.png' });

// try to interact
await page.keyboard.press('KeyE');
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/shot-interact.png' });
const modalVisible = await page.locator('text=PUZZLE 01').count();
console.log('puzzle modal open:', modalVisible > 0);

console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
