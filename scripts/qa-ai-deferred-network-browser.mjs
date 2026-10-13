import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const port=19711,profile=await mkdtemp(join(tmpdir(),'ai-reading-auto-'));
const browser=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--disable-extensions','--disable-background-networking','--no-proxy-server','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const wait=n=>new Promise(r=>setTimeout(r,n));
let ws,seq=0;
const pending=new Map(),paths=[];
try{
  let page;
  for(let i=0;i<100&&!page;i++){
    try{page=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(p=>p.type==='page'&&p.webSocketDebuggerUrl)}catch{}
    if(!page)await wait(140);
  }
  assert.ok(page,'headless Chrome is reachable');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  ws.addEventListener('message',e=>{
    const v=JSON.parse(e.data);
    if(v.method==='Network.requestWillBeSent'){
      try{const u=new URL(v.params.request.url);if(u.pathname.includes('/api/'))paths.push(u.pathname)}catch{}
    }
    if(v.id){
      const x=pending.get(v.id);
      if(!x)return;
      pending.delete(v.id);
      v.error?x.reject(Error(v.error.message)):x.resolve(v.result);
    }
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
  const evalJs=async expression=>{
    const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:4173/topic/ai?panel=models'});
  for(let i=0;i<120;i++){
    if(await evalJs("document.querySelectorAll('.model-board-card').length===4&&Boolean(document.querySelector('.topic-reader .ai-workspace'))"))break;
    await wait(140);
  }
  assert.equal(await evalJs("document.querySelectorAll('.model-board-card').length"),4);
  assert.equal(await evalJs("document.querySelectorAll('.ai-reader-deferred').length"),0,'no manual loading panel');
  assert.equal(await evalJs("document.querySelectorAll('.topic-reader .ai-workspace > .ai-navigation,.topic-reader .ai-workspace > .ai-main,.topic-reader .ai-workspace > .ai-settings').length"),3,'original three-column reader structure present');
  assert.equal(await evalJs("document.querySelector('.ai-topic').classList.contains('is-wide')"),true,'desktop should enable three-column reading layout');

  // Reader is automatically prefetched when scrolled into view; no click or user confirmation.
  await evalJs("document.querySelector('.topic-reader').scrollIntoView({block:'start',behavior:'instant'})");
  let requested=false;
  for(let i=0;i<80&&!requested;i++){
    requested=paths.some(x=>/ai-topic|sina-ai|ai-discovery|ai-tools/.test(x));
    if(!requested)await wait(140);
  }
  assert.ok(requested,'reading requests should start automatically when reader enters the viewport');

  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await wait(500);
  assert.equal(await evalJs("document.querySelectorAll('.topic-reader .ai-workspace > .ai-settings').length"),0,'mobile uses settings dialog, not squeezed desktop sidebar');
  assert.equal(await evalJs("Boolean(document.querySelector('.topic-reader .ai-navigation'))"),true,'mobile reader category navigation is retained');
  console.log('AI_READING_AUTO_NETWORK_OK '+JSON.stringify({models:4,requestCount:paths.length,paths:[...new Set(paths)]}));
}finally{
  ws?.close();browser.kill('SIGTERM');
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});
}
