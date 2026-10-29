// SPDX-License-Identifier: AGPL-3.0-only
import {test,expect} from '@playwright/test';
import {generateKeyPairSync,privateDecrypt,constants,createDecipheriv} from 'node:crypto';
test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('secure browser microphone sends encrypted ordered PCM and releases capture on stop',async({page,context})=>{
 await context.grantPermissions(['microphone']);
 const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const id='11111111-1111-1111-1111-111111111111',voiceId='a'.repeat(32);let chunks=0,ended=0,key:Buffer|undefined;const sizes:number[]=[];
 await page.route('**/hello',route=>route.fulfill({json:{id}}));
 await page.route('**/pair/start',route=>route.fulfill({json:{pairing:'pending'}}));
 await page.route('**/pair',route=>route.fulfill({json:{id,token:'b'.repeat(32)}}));
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/voice/start'){await route.fulfill({json:{id:voiceId,publicKey:publicKey.export({type:'spki',format:'der'}).toString('base64'),publicKeyPKCS1:publicKey.export({type:'pkcs1',format:'der'}).toString('base64'),sampleRate:8000,channels:1,sampleBits:16,maximumMs:30000}});return;}
  if(path==='/api/voice/chunk'){
   const packet=route.request().postDataJSON();expect(packet.sequence).toBe(chunks++);
   key??=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(packet.wrappedKey,'base64'));
   const encrypted=Buffer.from(packet.ciphertext,'base64'),cipher=createDecipheriv('aes-256-gcm',key,Buffer.from(packet.nonce,'base64'));
   cipher.setAAD(Buffer.from(voiceId+':'+packet.sequence));cipher.setAuthTag(encrypted.subarray(-16));
   const pcm=Buffer.concat([cipher.update(encrypted.subarray(0,-16)),cipher.final()]);sizes.push(pcm.length);pcm.fill(0);
   await route.fulfill({json:{accepted:true}});return;
  }
  if(path==='/api/voice/end'){ended++;await route.fulfill({json:{accepted:true}});return;}
  await route.fulfill({json:path==='/api/state'?{schema:1,id,name:'Voice test',observedAt:Date.now(),homeActive:true,systemRemote:{paired:true,ready:true,status:'ready'},music:{active:false}}:{apps:[],inputs:[]}});
 });
 await page.goto('/?remote=1');await page.getByTestId('phone-address').fill(new URL(page.url()).host);
 await page.locator('[data-nav="phone-connect"]').click();await page.getByTestId('phone-pin').fill('123456');await page.locator('[data-nav="phone-pair"]').click();await page.locator('[data-nav="phone-paired-done"]').click();
 await page.locator('[data-nav="phone-tv-controls"]').click();
 const button=page.locator('[data-nav="phone-tv-microphone"]');await button.click();await expect(button).toContainText('Listening');
 await expect.poll(()=>chunks,{timeout:10000}).toBeGreaterThan(0);await button.click();await expect(button).toContainText('Phone microphone');await expect.poll(()=>ended).toBe(1);
 expect(sizes.every(length=>length>0&&length<=8192&&length%2===0)).toBe(true);key?.fill(0);
});
