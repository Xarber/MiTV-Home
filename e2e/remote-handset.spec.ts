// SPDX-License-Identifier: AGPL-3.0-only
import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
async function mockTV(page:Page){
 let home=true;const keys:string[]=[];const id='11111111-1111-1111-1111-111111111111';
 await page.route('**/hello',route=>route.fulfill({json:{id}}));await page.route('**/pair/start',route=>route.fulfill({json:{pairing:'pending'}}));await page.route('**/pair',route=>route.fulfill({json:{id,token:'b'.repeat(32)}}));
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;if(path==='/api/key')keys.push(route.request().postDataJSON().command);return route.fulfill({json:path==='/api/state'?{schema:1,id,name:'Test television',observedAt:Date.now(),homeActive:home,wallpaper:{id:'classic',motion:false,musicTint:false},systemRemote:{paired:true,ready:true,status:'ready'},music:{active:false}}:path==='/api/catalog'?{apps:[],inputs:[]}:{accepted:true}});});
 await page.goto('/?remote=1');await page.getByTestId('phone-address').fill(new URL(page.url()).host);await page.locator('[data-nav="phone-connect"]').click();await page.getByTestId('phone-pin').fill('123456');await page.locator('[data-nav="phone-pair"]').click();await page.locator('[data-nav="phone-paired-done"]').click();
 return {keys,home:(value:boolean)=>{home=value;}};
}
test('remote automatically follows Home and permits explicit overrides',async({page})=>{
 await page.setViewportSize({width:390,height:844});const tv=await mockTV(page);await expect(page.getByTestId('home-remote')).toBeVisible();const bar=(await page.getByTestId('compact-volume').boundingBox())!;expect(bar.width).toBeGreaterThan(bar.height);tv.home(false);await expect(page.getByTestId('full-remote')).toBeVisible();await page.locator('[data-nav="phone-settings"]').click();await page.locator('[data-nav="phone-auto-remote"]').click();await page.locator('[data-nav="phone-panel-close"]').click();await expect(page.getByTestId('home-remote')).toBeVisible();tv.home(true);await page.locator('[data-nav="phone-settings"]').click();await page.locator('[data-nav="phone-complete-remote"]').click();await page.locator('[data-nav="phone-panel-close"]').click();await expect(page.getByTestId('full-remote')).toBeVisible();await page.locator('[data-nav="phone-settings"]').click();await page.locator('[data-nav="phone-auto-remote"]').click();await page.locator('[data-nav="phone-panel-close"]').click();await expect(page.getByTestId('home-remote')).toBeVisible();
});
test('touchpad taps select once and swipes navigate without another select',async({page})=>{
 const tv=await mockTV(page);await page.locator('[data-nav="phone-settings"]').click();await page.locator('[data-nav="phone-touchpad"]').click();await page.locator('[data-nav="phone-panel-close"]').click();const pad=page.getByTestId('phone-touchpad');await pad.click();await expect.poll(()=>tv.keys.filter(key=>key==='ok').length).toBe(1);const box=(await pad.boundingBox())!;await page.mouse.move(box.x+60,box.y+100);await page.mouse.down();await page.mouse.move(box.x+180,box.y+100,{steps:8});await page.mouse.up();await expect.poll(()=>tv.keys.filter(key=>key==='right').length).toBeGreaterThan(0);expect(tv.keys.filter(key=>key==='ok').length).toBe(1);
});
test('remote and launcher preview preserve the TV Classic wallpaper',async({page},testInfo)=>{
 await mockTV(page);await expect(page.getByTestId('classic-wallpaper')).toHaveCSS('opacity','1');await page.locator('[data-nav="phone-settings"]').click();const version=page.locator('[data-nav="phone-version"]');for(let i=0;i<3;i++)await version.click();await page.locator('[data-nav="phone-launcher-preview"]').click();await expect(page.getByTestId('classic-wallpaper')).toHaveCSS('opacity','1');await expect(page.getByTestId('classic-wallpaper').locator('img')).toBeVisible();await page.screenshot({path:testInfo.outputPath('classic-preview.png')});
});

test('complete handset fits a phone viewport and wheel gestures stay inside the pad',async({page})=>{
 await page.setViewportSize({width:390,height:844});const tv=await mockTV(page);tv.home(false);await expect(page.getByTestId('full-remote')).toBeVisible();
 await expect(page.locator('[data-nav^="phone-view-"]')).toHaveCount(0);await expect(page.locator('[data-nav^="phone-mode-"]')).toHaveCount(0);
 const card=(await page.getByTestId('full-remote').boundingBox())!,tabs=(await page.locator('[data-nav="phone-tab-remote"]').boundingBox())!;
 expect(card.y+card.height).toBeLessThanOrEqual(tabs.y);const volume=(await page.getByTestId('volume-rocker').boundingBox())!,channel=(await page.getByTestId('channel-rocker').boundingBox())!;expect(Math.abs(volume.height-channel.height)).toBeLessThan(1);
 await page.locator('[data-nav="phone-settings"]').click();await page.locator('[data-nav="phone-touchpad"]').click();await page.locator('[data-nav="phone-panel-close"]').click();
 const pad=page.getByTestId('phone-touchpad');await pad.hover();const before=await page.getByTestId('phone-handset-scroll').evaluate(el=>el.scrollTop);await page.mouse.wheel(0,140);await expect.poll(()=>tv.keys.filter(k=>k==='down').length).toBeGreaterThan(0);expect(await page.getByTestId('phone-handset-scroll').evaluate(el=>el.scrollTop)).toBe(before);
});

test('touch gestures navigate without scrolling a short phone viewport',async({browser})=>{
 const context=await browser.newContext({viewport:{width:375,height:667},hasTouch:true,isMobile:true});
 try{
  const page=await context.newPage(),tv=await mockTV(page);await page.locator('[data-nav="phone-settings"]').click();await page.locator('[data-nav="phone-touchpad"]').click();await page.locator('[data-nav="phone-panel-close"]').click();
  const pad=page.getByTestId('phone-touchpad'),box=(await pad.boundingBox())!,session=await context.newCDPSession(page),x=box.x+box.width/2,y=box.y+box.height/3;
  const scroll=page.getByTestId('phone-handset-scroll'),before=await scroll.evaluate(el=>el.scrollTop);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let delta=15;delta<=75;delta+=15)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+delta}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>tv.keys.filter(k=>k==='down').length).toBeGreaterThan(0);expect(tv.keys.filter(k=>k==='ok')).toHaveLength(0);expect(await scroll.evaluate(el=>el.scrollTop)).toBe(before);
 }finally{await context.close();}
});
