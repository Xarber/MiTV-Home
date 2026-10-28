// SPDX-License-Identifier: AGPL-3.0-only
import {test,expect} from '@playwright/test';
const focus=(page:import('@playwright/test').Page,id:string)=>page.locator(`[data-nav="${id}"]`);
test.beforeEach(async({page})=>{await page.goto('/');await expect(focus(page,'dock:inputs')).toBeFocused();});
test('dock edges clamp and navigation has three landing points',async({page})=>{
 await page.keyboard.press('ArrowLeft');await expect(focus(page,'dock:inputs')).toBeFocused();
 for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');
 await expect(focus(page,'dock:all')).toBeFocused();await page.keyboard.press('ArrowRight');await expect(focus(page,'dock:all')).toBeFocused();
 await page.keyboard.press('Enter');await expect(focus(page,'tab-all')).toBeFocused();
 await page.keyboard.press('Escape');await expect(focus(page,'dock:all')).toBeFocused();
 await focus(page,'dock:inputs').click();await expect(focus(page,'input:hdmi1')).toBeFocused();
 await page.getByTestId('inputs-more-hint').click();await expect(focus(page,'tab-all')).toBeFocused();
});
test('music controls auto-collapse on focus departure and preserve the black activity',async({page})=>{
 await focus(page,'dock:music').click();await expect(focus(page,'music-1')).toBeFocused();
 await expect(focus(page,'panel-close')).toHaveCount(0);
 await expect(page.getByText('Between the tides',{exact:true}).last()).toBeVisible();
 await focus(page,'music-1').click();await expect(focus(page,'music-1')).toHaveAttribute('aria-label','Play');
 await focus(page,'header-wifi').focus();await page.waitForTimeout(340);await expect(page.locator('#demo-dialog')).toHaveCount(0);
 const color=await focus(page,'activity-music').evaluate(element=>getComputedStyle(element).backgroundColor);
 expect(color).toBe('rgba(0, 0, 0, 0.9)');
 await focus(page,'activity-music').focus();await page.waitForTimeout(210);
 expect(await focus(page,'activity-music').evaluate(element=>getComputedStyle(element).backgroundColor)).toBe(color);
 await focus(page,'activity-music').click();await expect(focus(page,'music-1')).toBeFocused();await page.keyboard.press('Escape');
 await expect(focus(page,'activity-music')).toBeFocused();
});
test('wallpapers persist, language and tab blur remain stable',async({page})=>{
 await page.keyboard.press('c');await focus(page,'panel-Wallpapers').click();await focus(page,'wallpaper-dune').click();await focus(page,'panel-Animated wallpapers').click();
 await page.reload();await expect(focus(page,'dock:inputs')).toBeFocused();
 const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('aurea.demo.preferences.v1')!));expect(prefs.wallpaper).toBe('dune');expect(prefs.motion).toBe(true);
 await page.keyboard.press('c');await focus(page,'panel-Language').click();await expect(page.getByText('Centro di controllo',{exact:true})).toBeVisible();
 await page.keyboard.press('Escape');await focus(page,'dock:all').click();await focus(page,'tab-system').click();await expect(focus(page,'app:settings')).toBeVisible();await expect(focus(page,'app:music')).toHaveCount(0);
});
test('input shortcut can be pinned and removed; remote and music coexist',async({page})=>{
 await page.keyboard.press('m');await focus(page,'panel-Pin to dock').click();await page.locator('[data-group="modal"]').filter({hasText:'6 · All apps'}).click();
 await expect(focus(page,'dock:inputs')).toBeVisible();
 await page.keyboard.press('c');await focus(page,'panel-Remote').click();await focus(page,'panel-Connect remote').click();await page.keyboard.press('Escape');
 await focus(page,'dock:music').click();await page.keyboard.press('Escape');await expect(focus(page,'activity-remote')).toBeVisible();await expect(focus(page,'activity-music')).toBeVisible();
 await focus(page,'activity-remote').click();await page.keyboard.press('Escape');await expect(focus(page,'activity-music')).toBeVisible();
});
test('compact screen and reduced motion render without errors',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:740,height:520});await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await focus(page,'dock:music').click();await expect(focus(page,'music-1')).toBeVisible();
 const box=await page.locator('#demo-dialog').boundingBox();expect(box!.width).toBeLessThanOrEqual(740);await page.keyboard.press('Escape');expect(errors).toEqual([]);
});
test('long Enter opens app options and scrolling keeps modal focus visible',async({page})=>{
 await page.keyboard.down('Enter');await page.waitForTimeout(650);await page.keyboard.up('Enter');await expect(focus(page,'panel-Pin to dock')).toBeVisible();await page.keyboard.press('Escape');
 await page.setViewportSize({width:740,height:520});await page.keyboard.press('c');
 await focus(page,'panel-close').focus();for(let i=0;i<10;i++)await page.keyboard.press('ArrowDown');
 const focused=page.locator('[data-group="modal"]:focus');await expect(focused).toHaveCount(1);await expect.poll(async()=>{const box=await focused.boundingBox();return !!box&&box.y>=0&&box.y+box.height<=520;}).toBe(true);
});
test('portrait viewport keeps all six dock targets inside the screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(focus(page,'dock:inputs')).toBeFocused();
 for(const id of ['inputs','cinema','music','video','airplay','all']){const box=await focus(page,`dock:${id}`).boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);}
 await focus(page,'dock:music').click();const panel=await page.locator('#demo-panel-content').boundingBox();expect(panel!.x+panel!.width).toBeLessThanOrEqual(390);expect(panel!.y+panel!.height).toBeLessThanOrEqual(844);
});
test('activities slide in both directions and panels grow from their own bubbles',async({page})=>{
 await page.keyboard.press('c');await page.waitForTimeout(320);
 const settings=await page.locator('#demo-panel-content').boundingBox();expect(settings!.x).toBeGreaterThan(900);expect(settings!.y).toBeLessThan(40);
 await page.keyboard.press('Escape');await page.waitForTimeout(310);
 await focus(page,'dock:music').click();await page.waitForTimeout(320);
 const music=await page.locator('#demo-panel-content').boundingBox();expect(music!.x).toBeLessThan(65);expect(music!.y).toBeLessThan(50);expect(music!.width).toBeLessThanOrEqual(480);
 await page.keyboard.press('Escape');await page.waitForTimeout(310);
 await focus(page,'header-settings').focus();await page.waitForTimeout(210);
 const collapsed=(await focus(page,'activity-music').boundingBox())!.width;
 await focus(page,'activity-music').focus();await page.waitForTimeout(90);
 const halfway=(await focus(page,'activity-music').boundingBox())!.width;
 await page.waitForTimeout(160);const expanded=(await focus(page,'activity-music').boundingBox())!.width;
 expect(halfway).toBeGreaterThan(collapsed+10);expect(expanded).toBeGreaterThan(collapsed+100);
 await focus(page,'header-settings').focus();await page.waitForTimeout(230);expect((await focus(page,'activity-music').boundingBox())!.width).toBeLessThan(collapsed+3);
});

test('keyboard hints disappear after loading and playback has no demo labels',async({page})=>{
 await expect(page.getByText('AUREA HOME · WEB PREVIEW',{exact:true})).toBeVisible();
 await page.waitForTimeout(5600);await expect(page.getByText('AUREA HOME · WEB PREVIEW',{exact:true})).toHaveCount(0);
 await focus(page,'dock:music').click();await expect(page.getByText('Simulated playback',{exact:true})).toHaveCount(0);
 await expect(focus(page,'panel-close')).toHaveCount(0);
});
test('wallpaper previews keep their own gradients and motion actually advances',async({page})=>{
 await page.keyboard.press('c');await focus(page,'panel-Wallpapers').click();
 const preview=focus(page,'wallpaper-silk');
 const before=await preview.locator('stop').evaluateAll(stops=>stops.map(stop=>stop.getAttribute('stop-color')));
 const ids=await page.locator('linearGradient[id^="wallpaper-"]').evaluateAll(elements=>elements.map(element=>element.id));
 expect(new Set(ids).size).toBe(ids.length);
 await focus(page,'wallpaper-dune').click();
 expect(await preview.locator('stop').evaluateAll(stops=>stops.map(stop=>stop.getAttribute('stop-color')))).toEqual(before);
 await focus(page,'panel-Animated wallpapers').click();await page.keyboard.press('Escape');await page.waitForTimeout(350);
 const initial=await page.locator('#wallpaper-motion').evaluate(element=>getComputedStyle(element).transform);
 await page.waitForTimeout(2400);
 const later=await page.locator('#wallpaper-motion').evaluate(element=>getComputedStyle(element).transform);
 expect(later).not.toBe(initial);
});
test('scroll indicators and downward hints never enter keyboard focus',async({page})=>{
 await expect(page.locator('[data-nav^="page-dot"]')).toHaveCount(0);
 await expect(page.locator('[data-nav="home-more"]')).toHaveCount(0);
 await expect(page.locator('[data-nav="inputs-more"]')).toHaveCount(0);
 await page.keyboard.press('ArrowDown');await expect(focus(page,'input:hdmi1')).toBeFocused();
 await page.keyboard.press('ArrowDown');await expect(focus(page,'tab-all')).toBeFocused();
});
test('mobile source scrolling stays within its navigation stop',async({page})=>{
 await page.setViewportSize({width:390,height:600});await page.keyboard.press('ArrowDown');await expect(focus(page,'input:hdmi1')).toBeFocused();
 const input=await focus(page,'input:hdmi1').boundingBox();expect(input!.width).toBeLessThan(200);
 await page.locator('#inputs-scroll').dispatchEvent('wheel',{deltaY:150,bubbles:true});
 await expect(page.locator('#launcher-page-1')).toHaveAttribute('aria-hidden','false');await expect(page.locator('#launcher-page-2')).toHaveAttribute('aria-hidden','true');
});
