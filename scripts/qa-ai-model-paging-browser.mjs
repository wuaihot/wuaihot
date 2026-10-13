// Headless Chromium: exercise 430-record rankings without mounting 430 DOM rows.
// The model API is stubbed at the browser protocol boundary. No production mutation.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const port=19680+Math.floor(Math.random()*16),profile=await mkdtemp(join(tmpdir(),'wuaihot-paging-'));
const browser=spawn(process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',
  '--disable-extensions','--no-proxy-server','--remote-allow-origins=*',
  '--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const nap=ms=>new Promise(r=>setTimeout(r,ms)),pending=new Map(),requests=[];
let socket,seq=0;
try{
 let tab;
 for(let i=0;i<100&&!tab;i++){try{tab=(await(await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);}catch{}if(!tab)await nap(140);}
 assert.ok(tab,'Chromium started');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const v=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(v.exceptionDetails)throw Error(v.exceptionDetails.text);return v.result.value;};
 const rows=(key,start,count)=>Array.from({length:count},(_,i)=>({model:key+' Model '+(i+start),rank:i+start+1,score:Math.max(0,100-(i+start)*.1),url:'https://example.com/'+key+'/'+(i+start)}));
 const keys=['livebench','coding','reasoning','analysis','aa','arena'];
 socket.addEventListener('message',event=>{
  const payload=JSON.parse(event.data);
  if(payload.method==='Fetch.requestPaused'){
   const {requestId,request}=payload.params,url=new URL(request.url),view=url.searchParams.get('view'),key=url.searchParams.get('type')||'consensus';
   requests.push({view,key,url:request.url});
   let body;
   if(view==='summary')body={code:200,boards:keys.map(k=>({key:k,label:k,status:'ok',version:'2026-10-01',url:'https://example.com',total:430,items:rows(k,0,12)})),consensus:rows('consensus',0,12),consensusTotal:430,checkedAt:'2026-10-11T00:00:00Z'};
   else if(view==='page'){const offset=Number(url.searchParams.get('offset')),limit=Number(url.searchParams.get('limit'));body={code:200,type:key,offset,limit,items:rows(key,offset,limit),total:430,hasMore:offset+limit<430};}
   else body={code:400,message:'Unexpected full-array request'};
   void send('Fetch.fulfillRequest',{requestId,responseCode:body.code,responseHeaders:[{name:'content-type',value:'application/json'},{name:'access-control-allow-origin',value:'*'}],body:Buffer.from(JSON.stringify(body)).toString('base64')}).catch(()=>{});
  }
  if(payload.id){const item=pending.get(payload.id);if(!item)return;pending.delete(payload.id);payload.error?item.reject(Error(payload.error.message)):item.resolve(payload.result);}
 });
 await send('Page.enable');await send('Runtime.enable');
 await send('Fetch.enable',{patterns:[{urlPattern:'*api/ai-model-board*',requestStage:'Request'}]});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:4173/topic/ai?panel=models'});
 let mounted=false;for(let i=0;i<130;i++){mounted=await evaluate("document.querySelectorAll('.model-board-card li:not(.model-load-more)').length>=40");if(mounted)break;await nap(120);}
 assert.ok(mounted,'4 model cards rendered the initial batch');
 const initial=await evaluate(`(()=>{
  const cards=[...document.querySelectorAll('.model-board-card')];
  return {keys:cards.map(x=>x.dataset.modelBoard),rows:cards.map(c=>c.querySelectorAll('ol>li:not(.model-load-more)').length),
    logos:cards.map(c=>c.querySelector('img.hover-menu-select__logo')?.getAttribute('src')),
    menuLogos:document.querySelectorAll('.hover-menu-select__option img.hover-menu-select__logo').length,
    border:getComputedStyle(document.querySelector('.topic-overview.is-model-workspace')).borderTopWidth,
    background:getComputedStyle(document.querySelector('.topic-overview.is-model-workspace')).backgroundColor,
    navFont:getComputedStyle(document.querySelector('.ai-panel-switch button')).fontSize,
    source:document.querySelector('.model-board-card[data-model-board="livebench"] .n-scrollbar-container')?.scrollHeight};
 })()`);
 assert.equal(initial.keys.length,4);
 assert.deepEqual(initial.rows,[12,12,12,12],'only 48 items rendered, not 4x430');
 assert.equal(initial.menuLogos,0,'155 menu logos should not be mounted while closed');
 assert.ok(initial.logos.every(Boolean),'headings use platform image URLs');
 assert.equal(initial.border,'0px','outer board container is borderless');
 assert.ok(parseFloat(initial.navFont)>=13,'tabs legible');
 assert.equal(requests.filter(r=>r.view==='summary').length,1,'one bounded bootstrap API');
 assert.equal(requests.filter(r=>r.view==='page').length,0,'no pages fetched before user scroll');
 const scroll=await evaluate(`(()=>{
  const box=document.querySelector('.model-board-card[data-model-board="livebench"] .n-scrollbar-container');
  if(!box)return null;
  const info={clientHeight:box.clientHeight,scrollHeight:box.scrollHeight};
  box.scrollTop=box.scrollHeight;box.dispatchEvent(new Event('scroll',{bubbles:true}));return info;
 })()`);
 assert.ok(scroll?.scrollHeight>scroll.clientHeight,'first board has scroll overflow');
 let more=false;for(let i=0;i<70;i++){more=await evaluate("document.querySelector('.model-board-card[data-model-board=livebench] ol').querySelectorAll('li:not(.model-load-more)').length>=28");if(more)break;await nap(120);}
 assert.equal(more,true,'near-bottom scroll requests and renders 16 additional rows');
 const after=await evaluate("[...document.querySelectorAll('.model-board-card')].map(c=>c.querySelectorAll('ol>li:not(.model-load-more)').length)");
 assert.deepEqual(after,[28,12,12,12],'scrolling one lane does not load the other three');
 assert.equal(requests.filter(r=>r.view==='page'&&r.key==='livebench').length,1,'only the scrolled board made a page request');
 const pageUrl=new URL(requests.find(r=>r.view==='page').url);
 assert.equal(pageUrl.searchParams.get('offset'),'12');assert.equal(pageUrl.searchParams.get('limit'),'16');
 console.log('AI_MODEL_BROWSER_PAGING_OK '+JSON.stringify({initial,scroll,after,requests:requests.map(({view,key})=>({view,key}))}));
}finally{
 for(const value of pending.values())value.reject(Error('Browser stopped'));
 socket?.close();browser.kill('SIGTERM');await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:300});
}
