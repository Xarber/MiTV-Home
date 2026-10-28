// SPDX-License-Identifier: AGPL-3.0-only
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='dist';
async function files(dir){const result=[];for(const name of await readdir(dir)){const path=dir+'/'+name;if((await stat(path)).isDirectory())result.push(...await files(path));else result.push(path);}return result;}
const icons=[{src:'/branding/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/branding/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/branding/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}];
for(const remote of [false,true]){const manifest={id:remote?'/aurea-remote':'/aurea-home',name:remote?'Aurea Remote':'Aurea Home',short_name:remote?'Aurea Remote':'Aurea Home',description:remote?'Your TVs, apps, inputs and music in one remote.':'A calm home for your television.',lang:'en',start_url:remote?'/?remote=1':'/',scope:'/',display:'standalone',background_color:'#0d111b',theme_color:'#0d111b',icons,screenshots:[remote?{src:'/screenshots/remote.png',sizes:'390x844',type:'image/png',form_factor:'narrow',label:'Phone remote'}:{src:'/screenshots/home.png',sizes:'1440x900',type:'image/png',form_factor:'wide',label:'Aurea Home preview'}],shortcuts:[{name:'Remote',url:'/?remote=1',icons:[icons[0]]},{name:'Home preview',url:'/',icons:[icons[0]]}]};await writeFile(root+'/'+(remote?'remote.webmanifest':'manifest.webmanifest'),JSON.stringify(manifest));}
const version=JSON.parse(await readFile('app.json','utf8')).expo.version;
const release={version,highlights:[{icon:'◉',text:'Save multiple TVs and switch between separate pairings.'},{icon:'⌘',text:'Remote, apps, inputs and music controls in one place.'}],fixes:['Offline application loading and safer reconnection.']};await writeFile(root+'/release.json',JSON.stringify(release));
let html=await readFile(root+'/index.html','utf8');html=html.replace(/<meta name="viewport"[^>]*>/,'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">');html=html.replace('</head>',`<meta name="theme-color" content="#0d111b"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="apple-touch-icon" href="/branding/icon-180.png"><link rel="manifest" id="aurea-manifest" href="/manifest.webmanifest"><script>if(new URLSearchParams(location.search).get("remote")==="1"||document.querySelector('meta[name="aurea-remote"]'))document.getElementById("aurea-manifest").href="/remote.webmanifest";</script></head>`);await writeFile(root+'/index.html',html);
const assets=(await files(root)).filter(path=>!path.endsWith('.map')&&!path.endsWith('/sw.js'));
const hash=createHash('sha256');for(const path of assets)hash.update(await readFile(path));const revision=hash.digest('hex').slice(0,16);
const precache=assets.map(path=>'/'+path.slice(root.length+1));
const sw=`// SPDX-License-Identifier: AGPL-3.0-only
const CACHE='aurea-static-${revision}',ASSETS=${JSON.stringify(precache)},PATHS=new Set(ASSETS);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('aurea-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='APPLY_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||(!PATHS.has(url.pathname)&&!(request.mode==='navigate'&&url.pathname==='/')))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/index.html')));return;}
 event.respondWith(caches.match(url.pathname).then(cached=>cached||fetch(request)));
});
`;
await writeFile(root+'/sw.js',sw);console.log('PWA export:',revision,precache.length,'static resources; no API caching.');
