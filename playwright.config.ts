// SPDX-License-Identifier: AGPL-3.0-only
import {defineConfig} from '@playwright/test';
const port=Number(process.env.DEMO_PORT??8765);
export default defineConfig({testDir:'./e2e',fullyParallel:true,workers:2,reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}]],outputDir:'./playwright-results',webServer:{command:`python3 -m http.server ${port} --bind 127.0.0.1 --directory dist`,port,reuseExistingServer:!process.env.CI&&!process.env.DEMO_PORT},use:{baseURL:process.env.DEMO_URL??`http://127.0.0.1:${port}`,channel:process.env.CI?'chromium':'chrome',viewport:{width:1440,height:900},headless:true,trace:'retain-on-failure'}});
