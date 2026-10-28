// SPDX-License-Identifier: AGPL-3.0-only
/** UI stays absent until an install/update action is actually available. */
if('serviceWorker' in navigator&&globalThis.isSecureContext){
 const root=document.createElement('div');root.id='aurea-pwa';root.setAttribute('aria-live','polite');Object.assign(root.style,{position:'fixed',bottom:'16px',left:'16px',zIndex:'10000',maxWidth:'min(360px,calc(100vw - 32px))',font:'14px system-ui',color:'white'});document.body.append(root);
 function button(label:string,action:()=>void){const button=document.createElement('button');button.textContent=label;Object.assign(button.style,{border:'1px solid #ffffff30',borderRadius:'18px',padding:'10px 16px',background:'#10131ff5',color:'white',cursor:'pointer',font:'inherit',marginRight:'7px'});button.onclick=action;return button;}
 let installing=false;
 window.addEventListener('beforeinstallprompt',((event:Event)=>{event.preventDefault();const prompt=event as Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};const install=button('Install Aurea',()=>{void prompt.prompt().then(()=>prompt.userChoice).then(result=>{if(result.outcome==='accepted')install.remove();});});root.append(install);}) as EventListener);
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(installing)location.reload();});
 void navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(registration=>{
  const show=async(worker?:ServiceWorker)=>{const waiting=registration.waiting??worker;if(!waiting||!navigator.serviceWorker.controller)return;root.replaceChildren();const panel=document.createElement('section');panel.setAttribute('aria-label','Application update');Object.assign(panel.style,{padding:'18px',borderRadius:'22px',background:'#0d111bf5',border:'1px solid #ffffff22'});const title=document.createElement('strong');title.textContent='Aurea update available';panel.append(title);
   try{const response=await fetch('/release.json',{cache:'no-store'});const release=await response.json();if(typeof release.version==='string')title.textContent='Aurea '+release.version+' is ready';for(const item of (release.highlights??[]).slice(0,3)){const text=document.createElement('p');text.textContent=String(item.icon)+'  '+String(item.text);panel.append(text);}const fixes=document.createElement('p');fixes.textContent='Fixes & Improvements: '+(release.fixes??[]).join(' ');panel.append(fixes);}catch{const text=document.createElement('p');text.textContent='Reload when you have finished pairing. Your saved TVs will be kept.';panel.append(text);}
   panel.append(button('Update & reload',()=>{installing=true;waiting.postMessage({type:'APPLY_UPDATE'});}),button('Later',()=>root.replaceChildren()));root.append(panel);
  };
  void show();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')void show(worker);});});
  let last=Date.now();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>300000){last=Date.now();void registration.update().catch(()=>{});}});
 }).catch(()=>{});
}
