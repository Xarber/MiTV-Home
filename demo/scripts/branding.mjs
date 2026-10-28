// SPDX-License-Identifier: AGPL-3.0-only
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const source=await readFile('../assets/branding/aurea.svg','utf8');await mkdir('public/branding',{recursive:true});
await writeFile('public/branding/aurea.svg',source);
const browser=await chromium.launch({channel:process.env.CI?'chromium':'chrome',headless:true});
for(const size of [180,192,512,1024]){const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});await page.setContent(`<style>html,body{margin:0}svg{width:100vw;height:100vh}</style>${source}`);await page.screenshot({path:`public/branding/icon-${size}.png`,omitBackground:true});await page.close();}
const mask=source.replace('rx="220"','rx="0"');await writeFile('public/branding/maskable.svg',mask);
const page=await browser.newPage({viewport:{width:512,height:512}});await page.setContent(`<style>body{margin:0}svg{width:512px;height:512px}</style>${mask}`);await page.screenshot({path:'public/branding/maskable-512.png'});await browser.close();
