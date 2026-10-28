// SPDX-License-Identifier: AGPL-3.0-only
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',fullyParallel:true,workers:2,reporter:'list',outputDir:'./playwright-results',webServer:{command:'python3 -m http.server 8765 --bind 127.0.0.1 --directory dist',port:8765,reuseExistingServer:!process.env.CI},use:{baseURL:process.env.DEMO_URL??'http://127.0.0.1:8765',channel:process.env.CI?'chromium':'chrome',viewport:{width:1440,height:900},headless:true}});
