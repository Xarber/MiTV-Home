// SPDX-License-Identifier: AGPL-3.0-only
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output=new URL('../../docs/assets/demo/',import.meta.url).pathname;
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:process.env.CI?'chromium':'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(process.env.DEMO_URL??'http://127.0.0.1:8765');
await page.locator('[data-nav="dock:inputs"]:focus').waitFor();
await page.waitForTimeout(5600);
await page.screenshot({path:output+'home.png'});
await page.keyboard.press('c');await page.locator('[data-nav="panel-Wallpapers"]').click();
await page.screenshot({path:output+'wallpapers.png'});
await page.keyboard.press('Escape');await page.locator('[data-nav="dock:music"]').click();
await page.waitForTimeout(330);await page.screenshot({path:output+'music.png'});
await browser.close();
console.log('Captured real interactive web demo screens.');
