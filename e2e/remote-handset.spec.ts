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
 await page.setViewportSize({width:390,height:844});const tv=await mockTV(page);await expect(page.getByTestId('home-remote')).toBeVisible();tv.home(false);await expect(page.getByTestId('full-remote')).toBeVisible();await page.locator('[data-nav="phone-view-home"]').click();await expect(page.getByTestId('home-remote')).toBeVisible();tv.home(true);await page.locator('[data-nav="phone-view-full"]').click();await expect(page.getByTestId('full-remote')).toBeVisible();await page.locator('[data-nav="phone-view-auto"]').click();await expect(page.getByTestId('home-remote')).toBeVisible();
});
test('touchpad taps select once and swipes navigate without another select',async({page})=>{
 const tv=await mockTV(page);await page.locator('[data-nav="phone-mode-touchpad"]').click();const pad=page.getByTestId('phone-touchpad');await pad.click();await expect.poll(()=>tv.keys.filter(key=>key==='ok').length).toBe(1);const box=(await pad.boundingBox())!;await page.mouse.move(box.x+60,box.y+100);await page.mouse.down();await page.mouse.move(box.x+180,box.y+100,{steps:8});await page.mouse.up();await expect.poll(()=>tv.keys.filter(key=>key==='right').length).toBeGreaterThan(0);expect(tv.keys.filter(key=>key==='ok').length).toBe(1);
});
test('remote and launcher preview preserve the TV Classic wallpaper',async({page})=>{
 await mockTV(page);await expect(page.getByTestId('classic-wallpaper')).toHaveCSS('opacity','1');await page.locator('[data-nav="phone-settings"]').click();const version=page.locator('[data-nav="phone-version"]');for(let i=0;i<3;i++)await version.click();await page.locator('[data-nav="phone-launcher-preview"]').click();await expect(page.getByTestId('classic-wallpaper')).toHaveCSS('opacity','1');await expect(page.getByTestId('classic-wallpaper').locator('img')).toBeVisible();await page.screenshot({path:'/private/tmp/aurea-classic-preview-2.0.7.png'});
});
