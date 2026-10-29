// SPDX-License-Identifier: AGPL-3.0-only
// Local demonstration only. Never forwards commands to ADB, native TV services or real playback.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {randomBytes,randomInt,randomUUID,timingSafeEqual} from 'node:crypto';
import {networkInterfaces} from 'node:os';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const keys=new Set(['up','down','left','right','ok','back','home','menu','control','playpause','volumeup','volumedown','next','previous']);
const same=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.css':'text/css'};
const loopback=address=>address==='::1'||address==='127.0.0.1'||address==='::ffff:127.0.0.1';
export function createDemoServer({root=resolve('dist'),pinFactory=()=>String(randomInt(0,1000000)).padStart(6,'0')}={}){
 const id=randomUUID(),ownerKey=randomBytes(24).toString('hex'),sessions=new Map();let stream,ownerId,latest,observed=0,pin='',pinOrigin='',deadline=0,attempts=0,windowStart=0;
 const addressList=()=>Object.values(networkInterfaces()).flat().filter(value=>value&&value.family==='IPv4'&&!value.internal).map(value=>value.address);
 const preferredAddress=()=>Object.entries(networkInterfaces()).flatMap(([name,rows])=>(rows??[]).filter(value=>value.family==='IPv4'&&!value.internal).map(value=>({name,address:value.address}))).sort((a,b)=>Number(/^(en\d|eth|wl|wi-fi|ethernet)/i.test(b.name))-Number(/^(en\d|eth|wl|wi-fi|ethernet)/i.test(a.name)))[0]?.address??'127.0.0.1';
 const live=()=>stream&&!stream.destroyed&&Date.now()-observed<15000;
 const notify=event=>{if(stream&&!stream.destroyed)stream.write(JSON.stringify(event)+'\n');};
 const owner=req=>loopback(req.socket.remoteAddress)&&same(req.headers['x-aurea-demo-owner'],ownerKey);
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  try{
   const host=req.headers.host??'',url=new URL(req.url,'http://'+host),port=server.address().port;
   if(!['localhost','127.0.0.1',...addressList()].includes(url.hostname)||Number(url.port)!==port)return send(res,403,{error:'invalid_host'});
   const origin=req.headers.origin??'native';
   if(origin!=='native'){
    let parsed;try{parsed=new URL(origin);}catch{return send(res,403,{error:'invalid_origin'});}
    if(parsed.origin!==origin||!['http:','https:'].includes(parsed.protocol))return send(res,403,{error:'invalid_origin'});
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
   }
   if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
   if(req.method==='GET'&&url.pathname==='/__demo/health')return send(res,200,{demo:true,name:'Aurea Web Demo',id,owner:!!live()});
   if(req.method==='GET'){
    const path=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
    if(!path.startsWith(root+'/'))return send(res,403,{error:'invalid_path'});
    let bytes;try{bytes=await readFile(path);}catch{return send(res,404,{error:'not_found'});}
    if(url.pathname==='/'||url.pathname==='/index.html'){
     let tags=url.searchParams.get('remote')==='1'?'<meta name="aurea-remote" content="1">':url.pathname==='/'&&loopback(req.socket.remoteAddress)&&(origin==='native'||origin===url.origin)?`<meta name="aurea-demo-owner" content="${ownerKey}">`:'';
     bytes=Buffer.from(bytes.toString().replace('<head>','<head>'+tags));
    }
    res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});res.end(bytes);return;
   }
   if(req.method!=='POST')return send(res,405,{error:'unsupported'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>180000)return send(res,413,{error:'invalid_request'});}
   let data;try{data=JSON.parse(body||'{}');}catch{return send(res,400,{error:'invalid_request'});}
   if(!data||typeof data!=='object'||Array.isArray(data))return send(res,400,{error:'invalid_request'});
   if(url.pathname.startsWith('/__demo/')){
    if(!owner(req))return send(res,403,{error:'owner_required'});
    if(url.pathname==='/__demo/events'){
     if(typeof data.clientId!=='string'||data.clientId.length>64)return send(res,400,{error:'invalid_request'});
     if(stream&&!stream.destroyed&&ownerId!==data.clientId)return send(res,409,{error:'owner_busy'});
     stream?.end();ownerId=data.clientId;stream=res;res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','Connection':'keep-alive'});notify({type:'ready'});
     res.on('close',()=>{if(stream===res)stream=undefined;});return;
    }
    if(url.pathname==='/__demo/state'){
     if(data.clientId!==ownerId)return send(res,409,{error:'owner_busy'});
     if(!data.state||!Array.isArray(data.catalog?.apps)||!Array.isArray(data.catalog?.inputs)||data.catalog.apps.length>256||data.catalog.inputs.length>65)return send(res,400,{error:'invalid_request'});
     latest=data;observed=Date.now();return send(res,200,{connected:[...sessions.values()].some(value=>Date.now()-value.seen<15000),url:`http://${preferredAddress()}:${port}/?remote=1`});
    }
    return send(res,404,{error:'not_found'});
   }
   if(url.pathname==='/hello')return send(res,200,{schema:1,id,provenance:'simulated'});
   if(!live())return send(res,409,{error:'demo_not_open'});
   if(url.pathname==='/pair/start'){
    if(Date.now()-windowStart>60000){windowStart=Date.now();attempts=0;}
    if(attempts>=5)return send(res,429,{error:'too_many_attempts'});
    if(pinOrigin!==origin||Date.now()>deadline){pin=pinFactory();pinOrigin=origin;deadline=Date.now()+300000;}
    notify({type:'pair-request',pin});return send(res,200,{pairing:'pending'});
   }
   if(url.pathname==='/pair'){
    if(origin!==pinOrigin||Date.now()>deadline||attempts>=5||!same(data.pin,pin)){attempts++;return send(res,403,{error:'invalid_pin'});}
    const token=randomBytes(24).toString('base64url');sessions.set(token,{origin,seen:Date.now()});pin='';deadline=0;notify({type:'paired'});return send(res,200,{id,token});
   }
   const session=sessions.get(data.token);if(!session||session.origin!==origin)return send(res,401,{error:'auth_required'});session.seen=Date.now();
   if(url.pathname==='/api/state')return send(res,200,{schema:1,id,name:'Aurea Web Demo',observedAt:Date.now(),homeActive:true,provenance:'simulated',systemRemote:{paired:false,ready:false,status:'not_applicable'},music:latest.state.music,wallpaper:latest.state.wallpaper});
   if(url.pathname==='/api/catalog')return send(res,200,latest.catalog);
   if(url.pathname==='/api/key'){if(!keys.has(data.command))return send(res,400,{error:'unsupported'});notify({type:'key',command:data.command});return send(res,200,{accepted:true});}
   if(url.pathname==='/api/launch'){if(![...latest.catalog.apps,...latest.catalog.inputs].some(value=>value.id===data.id))return send(res,400,{error:'unknown_target'});notify({type:'launch',id:data.id});return send(res,200,{accepted:true});}
   if(url.pathname==='/api/media'){if(!['play_pause','next','previous','volume'].includes(data.action)||data.source!=='demo'||data.action==='volume'&&(!Number.isFinite(data.value)||data.value<0||data.value>100))return send(res,400,{error:'unsupported'});notify({type:'media',action:data.action,value:data.value});return send(res,200,{accepted:true});}
   if(url.pathname==='/api/presence'){if(data.disconnect===true)session.seen=0;return send(res,200,{ok:true});}
   if(url.pathname==='/api/revoke'){sessions.delete(data.token);return send(res,200,{ok:true});}
   return send(res,404,{error:url.pathname.includes('/system/')?'not_supported_demo':'unavailable'});
  }catch{if(!res.headersSent)send(res,400,{error:'invalid_request'});else res.end();}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 server.on('close',()=>stream?.end());
 return {server,close:()=>{stream?.end();server.closeAllConnections();return new Promise(resolveClose=>server.close(resolveClose));}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const position=process.argv.indexOf('--port'),port=position>=0?Number(process.argv[position+1]):8768;if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Choose a port between 1024 and 65535');
 const {server,close}=createDemoServer();let advertisement;
 server.listen(port,'0.0.0.0',()=>{
  console.log(`Aurea Web Demo: http://127.0.0.1:${port}/ (open on this computer to receive phone commands)`);
  if(!process.argv.includes('--no-mdns')){
   const command=process.platform==='darwin'?'dns-sd':'avahi-publish-service';
   const args=process.platform==='darwin'?['-R','Aurea Web Demo','_aurea-remote._tcp','local',String(port),'role=demo']:['Aurea Web Demo','_aurea-remote._tcp',String(port),'role=demo'];
   advertisement=spawn(command,args,{stdio:'ignore'});advertisement.on('error',()=>console.log('Bonjour unavailable; use the address shown in the demo Remote panel.'));
  }
 });
 const stop=()=>{advertisement?.kill();void close().then(()=>process.exit());};process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
