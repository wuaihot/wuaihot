// Real Chromium geometry and native-details behavior for the AI monitor's disclosures.
// Run against a local built Vite preview; isolated Chrome profile, loopback-only page.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const base=process.env.WUAIHOT_QA_URL||'http://127.0.0.1:4173/topic/ai';
const chrome=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port=19540+Math.floor(Math.random()*30),profile=await mkdtemp(join(tmpdir(),'wuaihot-disclosure-'));
const browser=spawn(chrome,['--headless=new','--no-first-run','--no-default-browser-check',
 '--disable-background-networking','--disable-extensions','--disable-dev-shm-usage',
 '--no-proxy-server','--remote-allow-origins=*','--remote-debugging-port='+port,
 '--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const nap=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async(fn,attempts=90)=>{for(let i=0;i<attempts;i++){try{const value=await fn();if(value)return value;}catch{}await nap(125);}throw Error('Chromium or monitor disclosure not ready');};
let ws,nextId=0;const pending=new Map();
try{
 const page=await until(async()=>{
  const res=await fetch('http://127.0.0.1:'+port+'/json/list');
  const list=await res.json();return list.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 });
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',e=>{const v=JSON.parse(e.data),p=pending.get(v.id);if(!p)return;pending.delete(v.id);v.error?p.reject(Error(JSON.stringify(v.error))):p.resolve(v.result);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const resize=async(width,height,mobile=false)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:1});};
 await send('Page.enable');await send('Runtime.enable');await resize(1440,900);
 await send('Page.navigate',{url:base});
 await until(()=>run("Boolean(document.querySelector('.ai-panel-switch button:nth-child(3)'))"));
 await run("document.querySelector('.ai-panel-switch button:nth-child(3)').click()");
 await until(()=>run("Boolean(document.querySelector('.radar-wall'))"));
 await nap(400);
 const measure=()=>run(`(()=>{
  const list=[...document.querySelectorAll('.radar-wall details>summary')];
  return list.map(summary=>{
    const icon=summary.querySelector('.radar-disclosure-chevron'),a=summary.getBoundingClientRect(),b=icon.getBoundingClientRect();
    const x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
    return {delta:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),
      pointer:getComputedStyle(icon).pointerEvents,marker:getComputedStyle(summary).listStyleType,
      hasNativeGlyph:/[⌄⌃]/.test(summary.textContent),hit:document.elementFromPoint(x,y)?.closest('summary')===summary,
      within:b.left>=0&&b.right<=innerWidth};
  });
 })()`);
 const desktop=await measure();
 if(!desktop.length){
  const noLead=await run("!document.querySelector('.radar-wall .lead-package')");
  assert.equal(noLead,true,'no disclosure buttons when the feed has no qualified lead');
  console.log('DISCLOSURE_BROWSER_SKIPPED_NO_LEAD: monitor loaded, but the isolated preview has no source records; source-level and build-time caret contracts still checked');
 }else{
  assert.equal(desktop.length,2,'both editorial disclosure summaries exist for a lead edition');
  for(const x of desktop){assert.ok(x.delta<=1,'summary arrow vertically centered');assert.equal(x.pointer,'none');assert.equal(x.marker,'none');assert.equal(x.hasNativeGlyph,false);assert.equal(x.hit,true);}
  const expanded=await run("(()=>{const d=document.querySelector('.radar-wall details');d.querySelector('summary').click();return d.open})()");
  assert.equal(expanded,true,'native summary click expands details');
  await nap(230);
  const rotation=await run("getComputedStyle(document.querySelector('.radar-wall details[open] .radar-disclosure-chevron')).transform");
  assert.ok(rotation.includes('-1'),'expanded icon rotates approximately 180 degrees');
  await resize(390,844,true);await nap(340);
  const mobile=await measure();
  assert.equal(mobile.length,2);
  for(const x of mobile){assert.ok(x.delta<=1,'mobile summary arrow vertically centered');assert.equal(x.hit,true);assert.ok(x.within,'mobile icon remains within viewport');}
  console.log('DISCLOSURE_BROWSER_OK '+JSON.stringify({desktop,mobile,expanded,rotation}));
 }
}finally{
 for(const p of pending.values())p.reject(Error('Browser closing'));
 if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
 browser.kill('SIGTERM');
 await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:300});
}
