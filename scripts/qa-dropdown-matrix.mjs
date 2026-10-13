// Isolated Chromium 5-locale × 2-theme × 3-viewport dropdown geometry regression.
// Requires local Vite preview; no third-party data or production cookies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = process.env.WUAIHOT_QA_ORIGIN || 'http://127.0.0.1:4173';
const chrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const locales = [
  { path: '', html: 'zh-CN' },
  { path: '/en', html: 'en' },
  { path: '/zh-tw', html: 'zh-TW' },
  { path: '/ja', html: 'ja' },
  { path: '/ko', html: 'ko' },
].filter(locale=>!process.env.WUAIHOT_QA_LOCALE || locale.html===process.env.WUAIHOT_QA_LOCALE);
const sizes = [{ width: 1440, height: 900 },{ width: 768, height: 1024 },{ width: 390, height: 844 }];
const themes = ['light','dark'];
const rgb = color => {
  const values=color.match(/[0-9]*\.?[0-9]+/g)?.map(Number);
  if(!values||values.length<3)throw Error('Unrecognized computed color: '+color);
  return color.startsWith('color(srgb')?values.slice(0,3).map(x=>x*255):values.slice(0,3);
};
const luminance = color => rgb(color).map(v=>{
  const n=v/255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;
}).reduce((sum,v,index)=>sum+[0.2126,0.7152,0.0722][index]*v,0);
const contrast = (a,b) => {
  const l1=luminance(a),l2=luminance(b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
};
const port = 19590 + Math.floor(Math.random() * 40);
const profile = await mkdtemp(join(tmpdir(), 'wuaihot-dropdown-matrix-'));
const browser = spawn(chrome, [
  '--headless=new','--no-first-run','--no-default-browser-check',
  '--disable-background-networking','--disable-extensions',
  '--disable-dev-shm-usage','--no-proxy-server','--remote-allow-origins=*',
  '--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank',
],{stdio:'ignore'});
const nap = ms => new Promise(resolve=>setTimeout(resolve,ms));
const until = async(get,tries=100) => {
  for(let i=0;i<tries;i++){try{const result=await get();if(result)return result;}catch{}await nap(125);}
  throw Error('Timed out waiting for Chromium or Vue view');
};
let ws,seq=0;
const pending = new Map(),results=[];
try {
  const page=await until(async()=>{
    const res=await fetch('http://127.0.0.1:'+port+'/json/list');
    if(!res.ok)return null;
    return (await res.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
  });
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(!data.id)return;
    const item=pending.get(data.id);if(!item)return;
    pending.delete(data.id);
    data.error?item.reject(Error(JSON.stringify(data.error))):item.resolve(data.result);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(response.exceptionDetails)throw Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const viewport=async({width,height})=>{
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
    await send('Emulation.setTouchEmulationEnabled',{enabled:width<=390,maxTouchPoints:1});
  };
  await send('Page.enable');await send('Runtime.enable');
  await viewport(sizes[0]);

  for(const locale of locales){
    await send('Page.navigate',{url:origin+locale.path+'/topic/ai'});
    await until(()=>evaluate(`document.documentElement.lang===${JSON.stringify(locale.html)} && Boolean(document.querySelector('.ai-page-settings-trigger')) && Boolean(document.querySelector('.quick-settings__trigger'))`));
    for(const theme of themes){
      await evaluate(`(()=>{
        document.querySelector('.quick-settings__trigger').click();
        return Boolean(document.querySelector('.quick-settings__appearance'));
      })()`);
      await until(()=>evaluate("document.querySelectorAll('.quick-settings__appearance button').length===3"));
      const selectedTheme=await evaluate(`(()=>{
        const buttons=[...document.querySelectorAll('.quick-settings__appearance button')];
        const button=buttons[${theme==='light'?0:1}];button.click();
        return button.textContent.trim();
      })()`);
      await nap(140);
      const active=await evaluate(`document.querySelectorAll('.quick-settings__appearance button')[${theme==='light'?0:1}]?.getAttribute('aria-pressed')`);
      assert.equal(active,'true',locale.html+' '+theme+' theme selection must stick');
      await evaluate("document.querySelector('.quick-settings__trigger').click()");
      await nap(90);

      for(const size of sizes){
        await viewport(size);await nap(250);
        await evaluate("document.querySelector('.ai-page-settings-trigger').click()");
        await until(()=>evaluate("Boolean(document.querySelector('.ai-page-language-select select'))"));
        // Naive UI animates the entire modal from scale(.5); reading bounding
        // boxes before the enter transition settles produces false small widths.
        await until(()=>evaluate("(()=>{const panel=document.querySelector('.ai-page-settings');return !!panel && panel.offsetWidth>0 && Math.abs(panel.getBoundingClientRect().width/panel.offsetWidth-1)<.02})()"));
        await nap(50);
        const reading=await evaluate(`(async()=>{
          const shell=document.querySelector('.ai-page-language-select');
          const select=shell?.querySelector('select'),icon=shell?.querySelector('svg');
          if(!shell||!select||!icon)return null;
          select.scrollIntoView({block:'center',inline:'nearest'});
          await new Promise(resolve=>setTimeout(resolve,70));
          const a=select.getBoundingClientRect(),b=icon.getBoundingClientRect();
          const px=(b.left+b.right)/2,py=(b.top+b.bottom)/2;
          const cs=getComputedStyle(select),caption=shell.closest('label');
          const panel=document.querySelector('.ai-page-settings');
          const lanes=[...document.querySelectorAll('.ai-board-lane')];
          const laneStats=lanes.map(lane=>{
            const btn=lane.querySelector('.hover-menu-select'),caret=btn?.querySelector('svg');
            if(!btn||!caret)return null;
            const r=btn.getBoundingClientRect(),c=caret.getBoundingClientRect(),card=lane.getBoundingClientRect();
            return {center:Math.abs((r.top+r.bottom-c.top-c.bottom)/2),within:c.right<=card.right+1};
          }).filter(Boolean);
          return {
            lang:document.documentElement.lang,selected:select.value,
            options:select.options.length,aria:select.getAttribute('aria-label'),
            center:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),
            hit:document.elementFromPoint(px,py)===select,
            appearance:cs.appearance,overflow:cs.textOverflow,
            safeWidth:a.width-parseFloat(cs.paddingRight),fieldWidth:a.width,
            labelDirection:getComputedStyle(caption).flexDirection,shellWidth:shell.getBoundingClientRect().width,
            panelWidth:panel.getBoundingClientRect().width,panelLayoutWidth:panel.offsetWidth,
            transform:getComputedStyle(panel).transform,
            viewport:a.left>=0&&a.right<=innerWidth&&a.top>=0&&a.bottom<=innerHeight,
            labelOverflow:caption.scrollWidth>caption.clientWidth+1,
            modalOverflow:panel.scrollWidth>panel.clientWidth+1,
            bg:cs.backgroundColor,fg:cs.color,caret:getComputedStyle(icon).color,
            lanes:laneStats,
          };
        })()`);
        const caseName=locale.html+'/'+theme+'/'+size.width;
        assert.ok(reading,caseName+': page language select renders');
        assert.equal(reading.lang,locale.html,caseName+': correct lang');
        assert.equal(reading.options,2,caseName+': native options preserved');
        assert.ok(reading.aria?.length>0,caseName+': native select has accessible name');
        assert.ok(reading.center<=1,caseName+': arrow centered');
        assert.equal(reading.hit,true,caseName+': decorative arrow leaves select as pointer target');
        assert.equal(reading.appearance,'none',caseName+': browser-native caret suppressed');
        const textContrast=contrast(reading.fg,reading.bg);
        const arrowContrast=contrast(reading.caret,reading.bg);
        assert.ok(textContrast>=4.5,caseName+': native selected text requires WCAG AA contrast (found '+textContrast.toFixed(2)+')');
        assert.ok(arrowContrast>=3,caseName+': decorative state affordance requires 3:1 contrast (found '+arrowContrast.toFixed(2)+')');
        assert.equal(reading.overflow,'ellipsis',caseName+': long values are safely truncated');
        if(reading.safeWidth<(size.width<=390?200:140)) console.log('DROPDOWN_MATRIX_NARROW_DEBUG '+JSON.stringify({caseName,reading}));
        assert.ok(reading.safeWidth>=(size.width<=390?200:140),caseName+': selected text retains practical readable space, including narrow mobile screens');
        assert.equal(reading.viewport,true,caseName+': field stays inside viewport');
        assert.equal(reading.labelOverflow,false,caseName+': settings language label must not overflow');
        assert.equal(reading.modalOverflow,false,caseName+': modal must not horizontally overflow');
        for(const lane of reading.lanes){
          assert.ok(lane.center<=1,caseName+': board caret centered');
          assert.equal(lane.within,true,caseName+': board caret within its card');
        }
        results.push({locale:locale.html,theme,width:size.width,
          center:reading.center,safeWidth:Math.round(reading.safeWidth),
          textContrast:Number(textContrast.toFixed(2)),arrowContrast:Number(arrowContrast.toFixed(2)),
          bg:reading.bg,fg:reading.fg,lanes:reading.lanes.length});
        await evaluate("document.querySelector('.ai-settings-popup-heading button').click()");
        await nap(420);
      }
      // Ensure actual colors change when users select dark mode.
      const opposite=results.find(x=>x.locale===locale.html&&x.width===1440&&x.theme!==theme);
      const current=results.find(x=>x.locale===locale.html&&x.width===1440&&x.theme===theme);
      if(opposite&&current){
        assert.notEqual(current.bg,opposite.bg,locale.html+': select background must differ in dark and light themes');
        assert.notEqual(current.fg,opposite.fg,locale.html+': select text color must differ in dark and light themes');
      }
      console.log('DROPDOWN_MATRIX_LOCALE_OK '+locale.html+' '+theme+' ('+selectedTheme+')');
    }
  }
  console.log('DROPDOWN_MATRIX_OK '+JSON.stringify({total:results.length,
    locales:locales.map(x=>x.html),themes,viewports:sizes.map(x=>x.width),
    minimumSafeTextSpace:Math.min(...results.map(x=>x.safeWidth)),
    minimumTextContrast:Math.min(...results.map(x=>x.textContrast)),
    minimumArrowContrast:Math.min(...results.map(x=>x.arrowContrast)),
    maximumArrowCenterDelta:Math.max(...results.map(x=>x.center))}));
}finally{
  for(const p of pending.values())p.reject(Error('Browser closing'));
  if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
  browser.kill('SIGTERM');
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:300});
}
