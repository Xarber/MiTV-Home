// SPDX-License-Identifier: AGPL-3.0-only
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDemoServer} from '../../scripts/demo-remote-server.mjs';
test('demo bridge isolates ownership, pairs with a requested PIN and routes only approved commands',async t=>{
 const root=await mkdtemp(join(tmpdir(),'aurea-bridge-fixture-'));await writeFile(join(root,'index.html'),'<html><head></head><body>Demo fixture</body></html>');
 const service=createDemoServer({root,pinFactory:()=> '123456'});await new Promise(resolve=>service.server.listen(0,'127.0.0.1',resolve));
 const address='http://127.0.0.1:'+service.server.address().port,abort=new AbortController();t.after(async()=>{abort.abort();await service.close();await rm(root,{recursive:true,force:true});});
 const html=await(await fetch(address)).text(),key=/name="aurea-demo-owner" content="([a-f0-9]+)"/.exec(html)?.[1];assert.ok(key);assert.ok(!(await(await fetch(address+'/index.html')).text()).includes('aurea-demo-owner'));
 const foreign=await(await fetch(address,{headers:{Origin:'https://example.invalid'}})).text();assert.ok(!foreign.includes('aurea-demo-owner'));
 const post=(path,data,owner=false)=>fetch(address+path,{method:'POST',headers:{'Content-Type':'application/json',...(owner?{'x-aurea-demo-owner':key}:{})},body:JSON.stringify(data),signal:abort.signal});
 assert.equal((await post('/__demo/state',{})).status,403);assert.equal((await post('/pair/start',{})).status,409);
 const events=await post('/__demo/events',{clientId:'fixture-owner'},true);assert.equal(events.status,200);
 await post('/__demo/state',{clientId:'fixture-owner',state:{wallpaper:{id:'dune',motion:true},music:{active:false}},catalog:{apps:[{id:'app:music',name:'Music',kind:'app'}],inputs:[]}},true);
 assert.equal((await post('/pair/start',{})).status,200);assert.equal((await post('/pair',{pin:'000000'})).status,403);
 const paired=await(await post('/pair',{pin:'123456'})).json();assert.match(paired.token,/^[A-Za-z0-9_-]{32}$/);
 const state=await(await post('/api/state',{token:paired.token})).json();assert.equal(state.provenance,'simulated');assert.equal(state.wallpaper.id,'dune');assert.equal(state.systemRemote.paired,false);
 assert.equal((await post('/api/key',{token:paired.token,command:'arbitrary-system-command'})).status,400);
 assert.equal((await post('/api/launch',{token:paired.token,id:'real-tv-app'})).status,400);
 assert.equal((await post('/api/launch',{token:paired.token,id:'app:music'})).status,200);
 const reader=events.body.getReader();let received='';while(!received.includes('"type":"launch"')){const result=await reader.read();if(result.done)break;received+=new TextDecoder().decode(result.value);}assert.ok(received.includes('"id":"app:music"'));
 await reader.cancel();
});
