// SPDX-License-Identifier: AGPL-3.0-only
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
let revision=1;const root=resolve('dist');
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+'/')){res.writeHead(404).end();return;}let bytes=await readFile(file);if(path==='/sw.js')bytes=Buffer.concat([bytes,Buffer.from(`\n// test deployment ${revision}\n`)]);res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.css':'text/css'})[extname(path)]??(path==='/'?'text/html':'application/octet-stream'));res.setHeader('Cache-Control','no-store');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:process.env.CI?'chromium':'chrome',headless:true});
try{const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/?remote=1&preview=1`);await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.locator('[data-nav="phone-home"]').waitFor();
 const manifest=await page.evaluate(async()=>{const link=document.querySelector('link[rel="manifest"]');return (await fetch(link.href)).json();});assert.equal(manifest.id,'/aurea-remote');assert.equal(manifest.display,'standalone');assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
 revision=2;await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});await page.getByRole('button',{name:'Update & reload'}).waitFor();
 assert.equal(await page.evaluate(()=>document.querySelectorAll('[data-nav="phone-home"]').length),1);
 const navigation=page.waitForNavigation();await page.getByRole('button',{name:'Update & reload'}).click();await navigation;await page.locator('[data-nav="phone-home"]').waitFor();console.log('PASS: remote manifest, waiting update prompt, explicit reload and restored app shell');
}finally{await browser.close();server.close();}
