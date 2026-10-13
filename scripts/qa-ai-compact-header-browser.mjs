import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin=process.env.WUAIHOT_QA_ORIGIN || 'http://127.0.0.1:4173';
const chrome=process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prefix=process.env.WUAIHOT_QA_PREFIX || '';
const profile=await mkdtemp(join(tmpdir(),'wuaihot-ai-panels-'));
const port=19665+Math.floor(Math.random()*25);
const child=spawn(chrome,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws,seq=0;const pending=new Map();
try{
  let tab;
  for(let n=0;n<120&&!tab;n++){try{const response=await fetch('http://127.0.0.1:'+port+'/json/list');tab=(await response.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);}catch{}if(!tab)await sleep(120);}
  assert.ok(tab,'test browser started');
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',event=>{const msg=JSON.parse(event.data),item=pending.get(msg.id);if(!item)return;pending.delete(msg.id);msg.error?item.reject(Error(msg.error.message)):item.resolve(msg.result);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
  await send('Page.enable');await send('Runtime.enable');
  const results=[];
  const cases=[{mode:'models',cls:'is-model-workspace',cards:'.model-board-card'},{mode:'intelligence',cls:'is-intelligence-workspace',cards:'.ai-board-lane'}];
  for(const width of [1440,1024,390]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:900,deviceScaleFactor:1,mobile:width===390});
    await send('Emulation.setTouchEmulationEnabled',{enabled:width===390,maxTouchPoints:1});
    for(const test of cases){
      const route=origin+prefix+'/topic/ai'+(test.mode==='models'?'?panel=models':'');
      await send('Page.navigate',{url:route});
      let ready=false;
      for(let i=0;i<100;i++){
        ready=await evaluate(`document.querySelector('.topic-overview.${test.cls}')!==null && document.querySelectorAll('${test.cards}').length===4`);
        if(ready)break;
        await sleep(150);
      }
      assert.ok(ready,test.mode+' '+width+': four lanes available');
      const state=await evaluate(`(()=>{
        const root=document.querySelector('.topic-overview.${test.cls}');
        const header=root.querySelector('.ai-header'),nav=root.querySelector('.ai-panel-switch'),brand=root.querySelector('.ai-brand'),title=root.querySelector('h1'),reader=document.querySelector('.topic-reader');
        const boxes=[root,header,nav,brand,title,reader].map(e=>e.getBoundingClientRect());
        const cards=[...root.querySelectorAll('${test.cards}')];
        const grid=root.querySelector('${test.mode==='models'?'.model-board-grid':'.ai-board-grid'}');
        return {head:title.textContent.trim(),font:parseFloat(getComputedStyle(title).fontSize),
          navInside:header.contains(nav),navBorder:getComputedStyle(nav).borderBottomWidth,
          navX:boxes[2].x,brandRight:boxes[3].right,
          workspaceFits:boxes[0].left>=-1&&boxes[0].right<=innerWidth+1,
          readerBelow:boxes[5].top>=boxes[0].bottom-1,
          navigationFits:boxes[2].width<=boxes[1].width+1,
          grid:getComputedStyle(grid).display,
          icons:cards.filter(c=>c.querySelector('.hover-menu-select img.hover-menu-select__logo')).length,
          desc:root.querySelector('.ai-brand p')?.textContent||'',
          cardFooters:root.querySelectorAll('.model-board-card footer,.model-board-tools,.model-caption').length,
          reset:!!root.querySelector('.ai-model-reset'),help:!!root.querySelector('.ai-model-help'),
          cardHeight:cards[0]?.getBoundingClientRect().height,
          hasScroll:grid.scrollWidth>grid.clientWidth
        };
      })()`);
      assert.equal(state.navInside,true,test.mode+' '+width+' tabs remain in banner header');
      assert.equal(state.navBorder,'0px',test.mode+' '+width+' no tab underline');
      assert.equal(state.workspaceFits,true,test.mode+' '+width+' outer workspace fits viewport');
      assert.equal(state.readerBelow,true,test.mode+' '+width+' reading is a separate lower workspace');
      assert.equal(state.navigationFits,true,test.mode+' '+width+' nav inside available header');
      assert.ok(state.font>=18&&state.font<=24,test.mode+' '+width+' compact consistent title');
      if(width===1440)assert.ok(state.navX>=state.brandRight-3,test.mode+' wide desktop tabs use right side');
      if(test.mode==='models'){
        assert.equal(state.icons,4,'model headings show source icons');
        assert.equal(state.cardFooters,0,'redundant captions, timestamp footers and bottom tool row removed');
        assert.equal(state.reset,true,'reset moved into header');
        assert.equal(state.help,true,'methodology preserved in contextual help');
        assert.ok(state.cardHeight<=302,'model card reduced to <=300px');
        if(width===390)assert.equal(state.hasScroll,true,'mobile cards remain swipeable');
      }
      results.push({mode:test.mode,width,font:state.font,cardHeight:state.cardHeight,head:state.head,navOnRight:state.navX>=state.brandRight-3});
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await send('Page.navigate',{url:origin+prefix+'/topic/ai?panel=models'});
  for(let i=0;i<100;i++){if(await evaluate("document.querySelectorAll('.model-board-card').length===4"))break;await sleep(130);}
  const menu=await evaluate(`(async()=>{
    const trigger=document.querySelector('.model-board-card .hover-menu-select');
    trigger.click();await new Promise(r=>setTimeout(r,280));
    const option=document.querySelector('.hover-menu-select__menu .hover-menu-select__option');
    return {hasIcon:!!option?.querySelector('img.hover-menu-select__logo'),hasLabel:!!option?.querySelector('.hover-menu-select__option-text'),options:document.querySelectorAll('.hover-menu-select__menu .hover-menu-select__option').length};
  })()`);
  assert.ok(menu.hasIcon&&menu.hasLabel&&menu.options>=7,'model selector popover icons and labels');
  console.log('AI_COMPACT_HEADER_BROWSER_OK '+JSON.stringify({results,menu}));
}finally{
  for(const p of pending.values())p.reject(Error('Browser closed'));
  if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
  child.kill('SIGTERM');
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:250});
}
