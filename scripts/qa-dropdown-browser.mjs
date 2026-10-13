// Optional real-Chromium interaction smoke test. Run against an existing Vite preview.
// CHROME_BIN can override the executable. No external dependencies or network egress.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.env.WUAIHOT_QA_URL || 'http://127.0.0.1:4173/topic/ai';
const chromeBinary = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 19470 + Math.floor(Math.random() * 40);
const profile = await mkdtemp(join(tmpdir(), 'wuaihot-hover-qa-'));
const browser = spawn(chromeBinary, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  '--disable-extensions', '--disable-dev-shm-usage', '--no-proxy-server',
  '--remote-allow-origins=*', '--remote-debugging-port=' + port,
  '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' });
let socket;
const nap = ms => new Promise(resolve => setTimeout(resolve, ms));
const until = async (get, attempts=80) => {
  for(let i=0;i<attempts;i++){try {const value=await get();if(value)return value;}catch{}await nap(125);}
  throw new Error('Timed out waiting for Chromium DevTools or UI');
};
let nextId=0;
const pending=new Map();
try {
  const targets=await until(async()=>{
    const response=await fetch('http://127.0.0.1:'+port+'/json/list');
    if(!response.ok)return null;
    const pages=await response.json();
    return pages.find(p=>p.type==='page'&&p.webSocketDebuggerUrl);
  });
  socket=new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(!data.id)return;
    const item=pending.get(data.id);if(!item)return;
    pending.delete(data.id);
    if(data.error)item.reject(new Error(JSON.stringify(data.error)));
    else item.resolve(data.result);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++nextId;pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params}));
  });
  const evalJs=async expression=>{
    const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(response.exceptionDetails)throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  const viewport=async(width,height,mobile=false)=>{
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
    await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:1});
  };
  await viewport(1440,900,false);
  await send('Page.navigate',{url:root});
  await until(()=>evalJs("Boolean(document.querySelector('.ai-board-lane .hover-menu-select'))"));
  const geometry=await evalJs(`(()=>{
    const b=document.querySelector('.ai-board-lane .hover-menu-select');
    const icon=b?.querySelector('svg');const label=b?.querySelector('.hover-menu-select__text');
    if(!icon||!label)return null;
    const a=b.getBoundingClientRect(),c=icon.getBoundingClientRect(),t=label.getBoundingClientRect();
    return {buttonCenter:(a.top+a.bottom)/2,iconCenter:(c.top+c.bottom)/2,
      labelToChevron:c.left-t.right,buttonWidth:a.width,optionsExpected:6,
      columns:getComputedStyle(document.querySelector('.ai-board-grid')).gridTemplateColumns.split(' ').length,
      canHover:matchMedia('(hover: hover) and (pointer: fine)').matches,point:{x:(a.left+a.right)/2,y:(a.top+a.bottom)/2}};
  })()`);
  assert.ok(geometry,'AI lane selector must render');
  assert.ok(Math.abs(geometry.buttonCenter-geometry.iconCenter)<=1,'SVG chevron must be geometrically vertically centered');
  assert.ok(geometry.labelToChevron>=3&&geometry.labelToChevron<=12,'chevron must be adjacent to current title');
  assert.equal(geometry.columns,4,'wide desktop still has four columns');

  const visibleDisclosures=await evalJs(`(()=>{
    return [...document.querySelectorAll('.disclosure-chevron')].filter(svg=>svg.getClientRects().length>0).map(svg=>{
      const owner=svg.closest('button,summary'),a=owner?.getBoundingClientRect(),b=svg.getBoundingClientRect();
      return {owner:owner?.tagName,delta:a?Math.abs((a.top+a.bottom-b.top-b.bottom)/2):null,
        decorative:svg.getAttribute('aria-hidden'),pointer:getComputedStyle(svg).pointerEvents};
    });
  })()`);
  if (!visibleDisclosures.length) console.log('DROPDOWN_DISCLOSURE_RUNTIME_SKIPPED: topic has no loaded evidence/summary records; static component contract remains mandatory');
  for(const item of visibleDisclosures){
    assert.ok(item.owner==='BUTTON'||item.owner==='SUMMARY','disclosure icon belongs to its native interactive owner');
    assert.ok(item.delta<=1,'disclosure arrow is geometrically centered in the trigger');
    assert.equal(item.decorative,'true','arrow has no redundant screen-reader text');
    assert.equal(item.pointer,'none','decorative arrow must not steal the trigger click');
  }

  // Native <select> keeps browser semantics; decorative grid icon must be
  // aligned without stealing the pointer target or causing hover expansion.
  const nativeFields=await evalJs(`(()=>{
    const fields=[...document.querySelectorAll('.ai-control-filter__native')];
    return fields.map(root=>{
      const select=root.querySelector('select'),icon=root.querySelector('.native-select-shell__chevron');
      const a=select?.getBoundingClientRect(),b=icon?.getBoundingClientRect();
      return {native:select?.tagName==='SELECT',icon:!!icon,appearance:getComputedStyle(select).appearance,
        arrowCenter:(b.top+b.bottom)/2,controlCenter:(a.top+a.bottom)/2,
        pointerEvents:getComputedStyle(icon).pointerEvents,paddingRight:getComputedStyle(select).paddingRight};
    });
  })()`);
  assert.ok(nativeFields.length>=1,'AI reader must contain at least one native form select');
  for(const field of nativeFields){
    assert.equal(field.native,true,'filter remains a native select');
    assert.equal(field.icon,true,'filter has a shared SVG arrow');
    assert.equal(field.appearance,'none','OS-specific caret is suppressed');
    assert.ok(Math.abs(field.arrowCenter-field.controlCenter)<=1,'native caret is vertically centered');
    assert.equal(field.pointerEvents,'none','decorative arrow does not capture clicks');
    assert.ok(Number.parseFloat(field.paddingRight)>=32,'selected text cannot overlap the caret');
  }
  const quick=await evalJs(`(async()=>{
    document.querySelector('.quick-settings__trigger')?.click();
    await new Promise(resolve=>setTimeout(resolve,120));
    const wrapper=document.querySelector('.quick-settings__locale'),select=wrapper?.querySelector('select'),svg=wrapper?.querySelector('svg');
    if(!wrapper||!select||!svg)return null;
    const a=select.getBoundingClientRect(),b=svg.getBoundingClientRect();
    return {count:select.options.length,centerDiff:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),
      pointer:document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2)===select,
      appearance:getComputedStyle(select).appearance};
  })()`);
  assert.ok(quick,'quick settings native language select renders');
  assert.ok(quick.count>=3,'locale choices remain native options');
  assert.ok(quick.centerDiff<=1,'quick settings arrow is geometrically centered');
  assert.equal(quick.pointer,true,'clicking chevron area targets the select');
  assert.equal(quick.appearance,'none','quick settings uses shared custom SVG caret');
  await evalJs("document.querySelector('.quick-settings__trigger')?.click()");
  const pageSettings=await evalJs(`(async()=>{
    document.querySelector('.ai-page-settings-trigger')?.click();
    await new Promise(resolve=>setTimeout(resolve,300));
    const shell=document.querySelector('.ai-page-language-select'),select=shell?.querySelector('select'),icon=shell?.querySelector('svg');
    if(!shell||!select||!icon)return null;
    const a=select.getBoundingClientRect(),b=icon.getBoundingClientRect(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
    return {options:select.options.length,centerDiff:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),
      hit:document.elementFromPoint(x,y)===select,appearance:getComputedStyle(select).appearance,
      value:select.value};
  })()`);
  assert.ok(pageSettings,'AI page settings select is present in the modal');
  assert.equal(pageSettings.options,2,'original/translated page language options remain');
  assert.ok(pageSettings.centerDiff<=1,'page settings arrow vertically centered');
  assert.equal(pageSettings.hit,true,'page settings arrow coordinates target native select');
  assert.equal(pageSettings.appearance,'none','browser-specific arrow is suppressed');
  const pageLanguageChange=await evalJs(`(async()=>{
    const select=document.querySelector('.ai-page-language-select select');
    const before=select.value;
    const next=before==='original'?'translated':'original';
    select.value=next;
    select.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,60));
    const after=document.querySelector('.ai-page-language-select select')?.value;
    select.value=before;
    select.dispatchEvent(new Event('change',{bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,60));
    const restored=document.querySelector('.ai-page-language-select select')?.value;
    return {before,next,after,restored};
  })()`);
  assert.equal(pageLanguageChange.after,pageLanguageChange.next,'page language v-model accepts the original native change event');
  assert.equal(pageLanguageChange.restored,pageLanguageChange.before,'page language can be restored through native change');
  await evalJs("document.querySelector('.ai-settings-popup-heading button')?.click()");
  await nap(460);

  if(geometry.canHover){
    const hoverPosition=await evalJs(`(()=>{
      const b=document.querySelector('.ai-board-lane .hover-menu-select');
      const r=b.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
      return {x,y,hit:document.elementFromPoint(x,y)?.closest('.hover-menu-select')===b,
        backdrop:!!document.querySelector('.n-modal-container .n-modal-mask')};
    })()`);
    assert.equal(hoverPosition.hit,true,'after closing page settings, the lane hover target must be unobstructed');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:hoverPosition.x,y:hoverPosition.y});
    await nap(270);
    const menu=await evalJs("(()=>{const m=document.querySelector('.hover-menu-select__menu');return {open:!!m,count:m?.querySelectorAll('[role=option]').length||0,disabled:m?.querySelectorAll('[disabled]').length||0}})()");
    assert.equal(menu.open,true,'fine mouse hover opens menu');
    assert.equal(menu.count,geometry.optionsExpected,'all six categories remain');
    assert.equal(menu.disabled,3,'already visible lanes are disabled');
  }
  // Move completely off the control and verify its hover-out grace closes it.
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1100,y:50});
  await nap(320);
  const left=await evalJs("(()=>({exists:!!document.querySelector('.hover-menu-select__menu'),expanded:document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded'),focus:document.activeElement?.className||'',hover:document.querySelector('.ai-board-lane .hover-menu-select')?.matches(':hover')}))()");
  assert.equal(left.expanded,'false','hover menu closes after mouse leaves');

  // Keyboard-only path must preserve focus and allow ArrowDown / Escape.
  await evalJs("document.querySelector('.ai-board-lane .hover-menu-select').focus()");
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await nap(120);
  const keyboard=await evalJs("(()=>({open:!!document.querySelector('.hover-menu-select__menu'),focused:document.activeElement?.getAttribute('role'),ariaExpanded:document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded')}))()");
  assert.equal(keyboard.ariaExpanded,'true','ArrowDown opens menu');
  assert.equal(keyboard.focused,'option','ArrowDown places keyboard focus on an option');
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await nap(140);
  const escape=await evalJs("(()=>({expanded:document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded'),focused:document.activeElement?.classList.contains('hover-menu-select')}))()");
  assert.equal(escape.expanded,'false','Escape closes menu');
  assert.equal(escape.focused,true,'Escape restores keyboard focus to trigger');
  // Native popup content is teleported; Tab should continue to the next
  // nearby card action rather than jump to the end of the document.
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await nap(100);
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await nap(100);
  const tabbed=await evalJs("(()=>({focus:document.activeElement?.getAttribute('aria-label'),expanded:document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded')}))()");
  assert.equal(tabbed.focus,'查看全部：热点要闻','Tab continues to next card action');
  assert.equal(tabbed.expanded,'false','Tab dismisses teleported menu');

  await viewport(390,844,true);
  await nap(520);
  const mobile=await evalJs("(()=>{const b=document.querySelector('.ai-board-lane .hover-menu-select');const a=b?.getBoundingClientRect();return {button:!!b,canHover:matchMedia('(hover: hover) and (pointer: fine)').matches,iconY:(b?.querySelector('svg')?.getBoundingClientRect().top||0),buttonY:a?.top}})()");
  assert.ok(mobile.button,'mobile selector remains rendered');
  assert.equal(mobile.canHover,false,'touch emulation must not enable fine-pointer hover');
  const mobileGeometry=await evalJs("(()=>{const b=document.querySelector('.ai-board-lane .hover-menu-select');const s=b?.querySelector('svg');const a=b?.getBoundingClientRect(),c=s?.getBoundingClientRect();return {centerY:(a.top+a.bottom)/2,iconCenterY:(c.top+c.bottom)/2,point:{x:(a.left+a.right)/2,y:(a.top+a.bottom)/2}}})()");
  assert.ok(Math.abs(mobileGeometry.centerY-mobileGeometry.iconCenterY)<=1,'mobile SVG chevron remains vertically centered');
  const hit=await evalJs("document.elementFromPoint("+mobileGeometry.point.x+","+mobileGeometry.point.y+")?.closest('.hover-menu-select') === document.querySelector('.ai-board-lane .hover-menu-select')");
  assert.equal(hit,true,'mobile trigger must not be covered by an exiting popover');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[mobileGeometry.point]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await nap(240);
  const touchExpanded=await evalJs("document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded')");
  assert.equal(touchExpanded,'true','touch tap opens menu without hover support');
  const pick=await evalJs("(()=>{const trigger=document.querySelector('.ai-board-lane .hover-menu-select');const menu=document.getElementById(trigger?.getAttribute('aria-controls'));const o=[...(menu?.querySelectorAll('.hover-menu-select__option')||[])].find(n=>!n.disabled&&n.textContent.includes('研究评测'));if(!o)return null;const r=o.getBoundingClientRect();const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;return {x,y,hit:document.elementFromPoint(x,y)?.closest('.hover-menu-select__option')===o}})()");
  assert.ok(pick,'touch dropdown contains non-duplicate research option');
  assert.equal(pick.hit,true,'touch menu option must be unobstructed and visible');
  await evalJs("window.__dropdownTouchEvents=[];for(const type of ['pointerdown','touchstart','touchend','click'])document.addEventListener(type,e=>window.__dropdownTouchEvents.push(type),true)");
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pick]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await nap(160);
  const events=await evalJs('window.__dropdownTouchEvents');
  assert.ok(events.includes('touchstart')&&events.includes('touchend'),'touch reaches the intended option');
  let chosen=await evalJs("(()=>({label:document.querySelector('.ai-board-lane .hover-menu-select__text')?.textContent,expanded:document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded')}))()");
  const synthesizedClick=chosen.label==='研究评测';
  if(!synthesizedClick){
    // CDP synthetic touches sometimes omit the browser's compatibility click.
    // Explicitly test the coarse-pointer click activation without changing app semantics.
    const fallback=await evalJs("(()=>{const b=document.querySelector('.ai-board-lane .hover-menu-select');const menu=document.getElementById(b?.getAttribute('aria-controls'));const o=[...(menu?.querySelectorAll('.hover-menu-select__option')||[])].find(n=>!n.disabled&&n.textContent.includes('研究评测'));if(!o)return 'missing';const r=o.getBoundingClientRect();if(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2)?.closest('.hover-menu-select__option')!==o)return 'covered';o.click();return 'dispatched'})()");
    assert.equal(fallback,'dispatched','the chosen option remains clickable under coarse-pointer emulation');
    await nap(160);
    chosen=await evalJs("(()=>({label:document.querySelector('.ai-board-lane .hover-menu-select__text')?.textContent,expanded:document.querySelector('.ai-board-lane .hover-menu-select')?.getAttribute('aria-expanded')}))()");
  }
  assert.equal(chosen.label,'研究评测','coarse-pointer activation updates the chosen lane');
  assert.equal(chosen.expanded,'false','selection dismisses menu');

  const responsiveNative=[];
  const responsivePageSettings=[];
  for(const width of [390,768]){
    await viewport(width,width===390?844:1024,width===390);
    await nap(520);
    const field=await evalJs(`(async()=>{
      document.querySelector('.quick-settings__trigger')?.click();
      await new Promise(resolve=>setTimeout(resolve,140));
      const shell=document.querySelector('.quick-settings__locale'),select=shell?.querySelector('select'),icon=shell?.querySelector('svg');
      if(!shell||!select||!icon)return null;
      const r=select.getBoundingClientRect(),s=icon.getBoundingClientRect(),x=(s.left+s.right)/2,y=(s.top+s.bottom)/2;
      return {centerDiff:Math.abs((r.top+r.bottom-s.top-s.bottom)/2),hit:document.elementFromPoint(x,y)===select,
        inViewport:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,
        width:r.width};
    })()`);
    assert.ok(field,'quick settings select exists at '+width+'px');
    assert.ok(field.centerDiff<=1,'quick settings caret stays centered at '+width+'px');
    assert.equal(field.hit,true,'native select owns the arrow hit target at '+width+'px');
    assert.equal(field.inViewport,true,'language selector is fully visible at '+width+'px');
    responsiveNative.push({viewport:width,...field});
    await evalJs("document.querySelector('.quick-settings__trigger')?.click()");
    await nap(170);
    const responsivePage=await evalJs(`(async()=>{
      document.querySelector('.ai-page-settings-trigger')?.click();
      await new Promise(resolve=>setTimeout(resolve,250));
      const shell=document.querySelector('.ai-page-language-select'),select=shell?.querySelector('select'),icon=shell?.querySelector('svg');
      if(!select||!icon)return null;
      select.scrollIntoView({block:'center',inline:'nearest'});
      await new Promise(resolve=>setTimeout(resolve,75));
      const a=select.getBoundingClientRect(),b=icon.getBoundingClientRect(),x=(b.left+b.right)/2,y=(b.top+b.bottom)/2;
      return {centerDiff:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),
        hit:document.elementFromPoint(x,y)===select,options:select.options.length,
        inViewport:a.left>=0&&a.right<=innerWidth&&a.top>=0&&a.bottom<=innerHeight,
        width:a.width,available:a.width-Number.parseFloat(getComputedStyle(select).paddingRight)};
    })()`);
    assert.ok(responsivePage,'AI page language select renders at '+width+'px');
    assert.equal(responsivePage.options,2,'original/translated options remain at '+width+'px');
    assert.ok(responsivePage.centerDiff<=1,'page language caret stays centered at '+width+'px');
    assert.equal(responsivePage.hit,true,'page language arrow remains native-clickable at '+width+'px');
    assert.equal(responsivePage.inViewport,true,'page language control stays in viewport at '+width+'px');
    assert.ok(responsivePage.available>=45,'page language value retains readable content space at '+width+'px');
    responsivePageSettings.push({viewport:width,...responsivePage});
    await evalJs("document.querySelector('.ai-settings-popup-heading button')?.click()");
    await nap(170);
  }

  const result={desktop:geometry,visibleDisclosureCount:visibleDisclosures.length,nativeFieldCount:nativeFields.length,quickSettings:quick,pageSettings,pageLanguageChange,responsivePageSettings,responsiveNative,
    mobile,mobileGeometry,touchSelected:chosen.label,touchClickSynthesized:synthesizedClick,keyboardEscape:true};
  console.log('DROPDOWN_BROWSER_OK '+JSON.stringify(result));
} finally {
  for(const p of pending.values())p.reject(new Error('Browser closing'));
  if(socket&&socket.readyState===WebSocket.OPEN)socket.close();
  browser.kill('SIGTERM');
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:300});
}
