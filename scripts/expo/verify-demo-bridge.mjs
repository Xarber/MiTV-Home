// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {createDemoServer} from '../demo-remote-server.mjs';
const service=createDemoServer();await new Promise(done=>service.server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${service.server.address().port}`;
const browser=await chromium.launch({channel:process.env.CI?'chromium':'chrome',headless:true});
const nav=(page,id)=>page.locator(`[data-nav="${id}"]`);
try{
 const owner=await browser.newPage(),phone=await browser.newPage({viewport:{width:390,height:844}});
 await owner.goto(base);await nav(owner,'dock:inputs').waitFor();
 await owner.waitForFunction(async()=>!!(await(await fetch('/__demo/health')).json()).owner);
 await phone.goto(base+'/?remote=1');await phone.getByTestId('phone-pin').waitFor();
 const pin=await owner.getByText(/Pairing code\s+\d{6}/).innerText();
 await phone.getByTestId('phone-pin').fill(pin.match(/\d{6}/)[0]);await nav(phone,'phone-pair').click();await nav(phone,'phone-paired-done').click();
 await nav(phone,'phone-tab-apps').click();await phone.getByRole('button',{name:'Music',exact:true}).click();
 await nav(owner,'activity-music').waitFor();await nav(phone,'phone-activity-music').waitFor();
 await nav(phone,'phone-tab-remote').click();await nav(phone,'phone-home').click();await nav(owner,'dock:inputs').waitFor({state:'visible'});
 await nav(phone,'phone-control').click();await nav(owner,'panel-Network').waitFor();await owner.keyboard.press('Escape');
 await owner.keyboard.press('c');await nav(owner,'panel-Wallpapers').click();await nav(owner,'wallpaper-dune').click();
 await phone.waitForFunction(()=>getComputedStyle(document.querySelector('[data-testid="wallpaper-background"]')).backgroundColor==='rgb(44, 32, 34)');
 await phone.setViewportSize({width:1440,height:900});
 const wallpaper=phone.getByTestId('wallpaper-background');assert.equal(await wallpaper.count(),1);const bounds=await wallpaper.boundingBox();assert.equal(Math.round(bounds.width),1440);assert.equal(Math.round(bounds.height),900);
 await owner.reload();await nav(owner,'dock:inputs').waitFor();await owner.waitForFunction(async()=>!!(await(await fetch('/__demo/health')).json()).owner);
 await nav(phone,'phone-home').click();await nav(phone,'phone-control').click();await nav(owner,'panel-Network').waitFor();
 console.log('PASS: two-browser PIN pairing, demo app launch, activity, Home/Control Center, shared wallpaper, full desktop backdrop and owner reconnection');
}finally{await browser.close();await service.close();}
