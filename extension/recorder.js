(() => {
  if (window.__mouseflowContentInstalled) return;
  window.__mouseflowContentInstalled = true;
  const send = (type, payload = {}) => chrome.runtime.sendMessage({type,...payload}).catch(()=>({}));
  const clean = v => String(v||"").replace(/\s+/g," ").trim();
  const privateEl = el => !el || el.matches('input[type="password"],input[type="file"],input[autocomplete*="cc-"],input[autocomplete*="one-time-code"],[data-mouseflow-private]') || !!el.closest("[data-mouseflow-private]");
  const visible = el => { if(!el?.isConnected)return false; const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity)!==0&&r.width>0&&r.height>0; };
  const roleOf = el => el.getAttribute("role") || ({BUTTON:"button",A:"link",SELECT:"combobox",TEXTAREA:"textbox",INPUT:["submit","button"].includes(el.type)?"button":["checkbox","radio"].includes(el.type)?el.type:"textbox"})[el.tagName] || "";
  const labelOf = el => clean(el.getAttribute("aria-label")||el.getAttribute("title")||el.labels?.[0]?.innerText||el.innerText||el.value||el.getAttribute("alt"));
  const selectorFor = el => {
    if(el.id)return "#"+CSS.escape(el.id);
    for(const a of ["data-testid","data-test","name","aria-label","title"]){const v=el.getAttribute(a);if(!v)continue;const q=el.tagName.toLowerCase()+"["+a+"="+JSON.stringify(v)+"]";try{if(document.querySelectorAll(q).length===1)return q;}catch{}}
    return el.tagName.toLowerCase();
  };
  const describe = el => {
    const r=el.getBoundingClientRect();
    return {selector:selectorFor(el),tag:el.tagName.toLowerCase(),role:roleOf(el),text:clean(el.innerText||el.value).slice(0,180),label:labelOf(el).slice(0,180),ariaLabel:clean(el.getAttribute("aria-label")),title:clean(el.getAttribute("title")),name:clean(el.getAttribute("name")),placeholder:clean(el.getAttribute("placeholder")),href:el instanceof HTMLAnchorElement?el.href:"",testId:clean(el.getAttribute("data-testid")||el.getAttribute("data-test")),parentText:clean(el.parentElement?.innerText).slice(0,250),grandText:clean(el.parentElement?.parentElement?.innerText).slice(0,400),x:(r.left+r.width/2)/Math.max(1,innerWidth),y:(r.top+r.height/2)/Math.max(1,innerHeight)};
  };
  const record=(action,el,extra={})=>{
    if(privateEl(el))return;
    const step={action,url:location.href,at:Date.now(),...describe(el),...extra};
    if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement){if(["checkbox","radio"].includes(el.type))step.checked=el.checked;else step.value=String(el.value).slice(0,2000);}
    send("RECORD_STEP",{step});
  };

  const host=document.createElement("div");host.id="mouseflow-ai-overlay";host.style.cssText="all:initial;position:fixed;z-index:2147483647;top:16px;right:16px;width:280px;max-width:calc(100vw - 32px);";document.documentElement.appendChild(host);
  const shadow=host.attachShadow({mode:"open"});
  shadow.innerHTML='<style>*{box-sizing:border-box}.panel{font:13px/1.45 Inter,system-ui,sans-serif;color:#eef3ff;background:#101827;border:1px solid #394966;border-radius:14px;box-shadow:0 12px 38px #0008;padding:12px}.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}.brand{font-weight:800;font-size:13px}.state{font-size:10px;color:#9fb0cb}.count{font-size:11px;color:#aab8ce;margin:0 0 10px}.buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px}button{border:1px solid #425371;border-radius:8px;padding:9px 7px;background:#1b2940;color:#f4f7ff;font:700 11px system-ui;cursor:pointer}button.primary{background:#6257e9;border-color:#8178ff}button.play{background:#087d68;border-color:#0eaa8b}button.stop{background:#642d3b;border-color:#a34b61}button:disabled{opacity:.4;cursor:not-allowed}.error{color:#ffbd8a;font-size:10px;margin-top:8px;overflow-wrap:anywhere}.min{background:none;border:0;padding:0 4px;font-size:18px;color:#c8d3e5}.panel.collapsed .body{display:none}</style><section class="panel" aria-label="MouseFlow AI controls"><div class="top"><span class="brand">◉ MouseFlow AI</span><span><span class="state" id="state">Ready</span> <button class="min" id="min">−</button></span></div><div class="body"><p class="count" id="count">0 actions · 0 loops</p><div class="buttons"><button class="primary" id="record">● Record</button><button id="finish" disabled>Finish</button><button class="play" id="repeat" disabled>▶ Repeat</button><button class="stop" id="stop" disabled>■ Stop</button></div><div class="error" id="error" role="status"></div></div></section>';
  const $=id=>shadow.getElementById(id),panel=shadow.querySelector(".panel");
  $("min").onclick=()=>panel.classList.toggle("collapsed");
  const refresh=async()=>{try{const s=await send("GET_STATE");$("state").textContent=s.mode==="recording"?"Recording":s.mode==="replaying"?"Repeating":s.mode==="error"?"Error":"Ready";$("count").textContent=s.steps.length+" actions · "+s.iterations+" loops";$("record").disabled=["recording","replaying"].includes(s.mode);$("finish").disabled=s.mode!=="recording";$("repeat").disabled=!s.steps.length||["recording","replaying"].includes(s.mode);$("stop").disabled=s.mode!=="replaying";$("error").textContent=s.lastError||"";}catch{}};
  $("record").onclick=async()=>{const r=await send("RECORD_START");if(!r.ok)$("error").textContent=r.error||"Could not start recording.";refresh();};
  $("finish").onclick=async()=>{await send("RECORD_STOP");refresh();};
  $("repeat").onclick=async()=>{const r=await send("LOOP_START",{delayMs:1000,stopOnError:true});if(!r.ok)$("error").textContent=r.error||"Could not start replay.";refresh();};
  $("stop").onclick=async()=>{await send("LOOP_STOP");refresh();};
  chrome.runtime.onMessage.addListener(m=>{if(m.type==="MF_STATE")refresh();});
  const fromOverlay=e=>e.composedPath().includes(host);
  document.addEventListener("click",e=>{if(fromOverlay(e))return;const t=e.target instanceof Element?e.target:e.target?.parentElement;const el=t?.closest('button,a,[role="button"],input[type="button"],input[type="submit"],summary,[data-testid]');if(el)record("click",el);},true);
  document.addEventListener("change",e=>{if(fromOverlay(e))return;const el=e.target;if(el instanceof HTMLSelectElement||el instanceof HTMLInputElement&&["checkbox","radio"].includes(el.type))record("input",el);},true);
  document.addEventListener("input",e=>{if(fromOverlay(e))return;const el=e.target;if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)||privateEl(el))return;if(el instanceof HTMLInputElement&&!["text","search","email","url","tel","number"].includes(el.type))return;clearTimeout(el.__mfTimer);el.__mfTimer=setTimeout(()=>record("input",el),450);},true);
  document.addEventListener("scroll",e=>{if(fromOverlay(e)||e.target!==document)return;send("RECORD_STEP",{step:{action:"scroll",x:scrollX,y:scrollY,url:location.href,at:Date.now()}});},true);

  const hintsFor=step=>{
    const id=String(step.selector||"").replace(/^#/,"").toLowerCase();
    const h={text:clean(step.text||step.label),context:clean((step.parentText||"")+" "+(step.grandText||""))};
    if(!h.text&&id.includes("add-to-cart"))h.text="add to cart";
    if(!h.context&&id.includes("sauce-labs"))h.context=id.replace(/^add-to-cart-/,"").replace(/-/g," ");
    return h;
  };
  const score=(el,step,h)=>{
    if(!visible(el)||privateEl(el))return -1;
    let n=0;const text=clean(el.innerText||el.value).toLowerCase(),label=labelOf(el).toLowerCase(),attr=k=>clean(el.getAttribute(k)).toLowerCase();
    if(step.tag&&el.tagName.toLowerCase()===step.tag)n+=2;
    if(step.role&&roleOf(el)===step.role)n+=4;
    const want=h.text.toLowerCase();
    if(want&&text===want)n+=18;else if(want&&text.includes(want))n+=11;
    if(want&&label===want)n+=16;
    for(const [key,weight] of [["ariaLabel",12],["title",8],["name",8],["placeholder",8],["testId",12]])if(step[key]&&attr(key==="testId"?"data-testid":key==="ariaLabel"?"aria-label":key)===String(step[key]).toLowerCase())n+=weight;
    if(step.href&&el instanceof HTMLAnchorElement&&el.href===step.href)n+=10;
    const ctx=(clean(el.parentElement?.innerText)+" "+clean(el.parentElement?.parentElement?.innerText)).toLowerCase();
    const tokens=h.context.toLowerCase().split(" ").filter(x=>x.length>2);let matches=0;for(const t of tokens)if(ctx.includes(t))matches++;
    n+=Math.min(10,matches*2);
    if(Number.isFinite(step.x)&&Number.isFinite(step.y)){const r=el.getBoundingClientRect(),x=(r.left+r.width/2)/Math.max(1,innerWidth),y=(r.top+r.height/2)/Math.max(1,innerHeight);n+=Math.max(0,5-Math.hypot(x-step.x,y-step.y)*10);}
    return n;
  };
  const resolve=step=>{
    const h=hintsFor(step);let exact=null;try{if(step.selector)exact=document.querySelector(step.selector);}catch{}
    if(exact&&visible(exact)&&!privateEl(exact)&&(!h.text||score(exact,step,h)>=10))return exact;
    const selectors=['button','a','[role="button"]','input[type="button"]','input[type="submit"]','input[type="text"]','textarea','select','[aria-label]','[title]','[data-testid]','[data-test]'];
    const all=new Set();for(const q of selectors)document.querySelectorAll(q).forEach(el=>all.add(el));
    const ranked=[...all].map(el=>({el,s:score(el,step,h)})).filter(x=>x.s>=7).sort((a,b)=>b.s-a.s);
    if(ranked.length&&(ranked.length===1||ranked[0].s-ranked[1].s>=2||ranked[0].s>=18))return ranked[0].el;
    if(ranked.length&&ranked[0].s>=13)return ranked[0].el;
    if(Number.isFinite(step.x)&&Number.isFinite(step.y)){const el=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,step.x*innerWidth)),Math.max(0,Math.min(innerHeight-1,step.y*innerHeight)))?.closest('button,a,[role="button"],input,textarea,select,[tabindex]');if(el&&visible(el)&&!privateEl(el))return el;}
    return null;
  };
  const waitForTarget=async step=>{const start=Date.now();while(Date.now()-start<12000){const el=resolve(step);if(el)return el;await new Promise(r=>setTimeout(r,250));}if(Number.isFinite(step.x)&&Number.isFinite(step.y)){const x=Math.max(2,Math.min(innerWidth-2,step.x*innerWidth)),y=Math.max(2,Math.min(innerHeight-2,step.y*innerHeight));await movePointer(x,y,750);const under=document.elementFromPoint(x,y)?.closest("button,a,[role=button],input,textarea,select,[tabindex]");if(under&&visible(under)&&!privateEl(under))return under;}const h=hintsFor(step);throw new Error("Target not found. The pointer moved to the last recorded position, but no safe clickable element was there"+(h.text?": "+h.text:"")+".");};

  // Animated in-page pointer; browser security does not permit moving the OS cursor from a content script.
  let cursor;
  const movePointer=async(x,y,duration=500)=>{
    if(!cursor){cursor=document.createElement("div");cursor.style.cssText="all:initial;position:fixed;z-index:2147483646;left:0;top:0;width:17px;height:17px;border:2px solid white;border-radius:50% 50% 50% 2px;background:#6257e9;box-shadow:0 2px 8px #0008;pointer-events:none;transform:translate(-50%,-50%);opacity:0;";document.documentElement.appendChild(cursor);}
    const sx=Number(cursor.dataset.x||innerWidth*.15),sy=Number(cursor.dataset.y||innerHeight*.2),start=performance.now();cursor.style.opacity="1";
    await new Promise(done=>{const frame=now=>{const t=Math.min(1,(now-start)/duration),e=t*t*(3-2*t),px=sx+(x-sx)*e,py=sy+(y-sy)*e;cursor.style.left=px+"px";cursor.style.top=py+"px";cursor.dataset.x=px;cursor.dataset.y=py;if(t<1)requestAnimationFrame(frame);else done();};requestAnimationFrame(frame);});
  };
  const humanClick=async el=>{
    el.scrollIntoView({block:"center",inline:"center",behavior:"smooth"});await new Promise(r=>setTimeout(r,250));
    const b=el.getBoundingClientRect(),x=b.left+b.width*.5,y=b.top+b.height*.5;await movePointer(x,y,500);
    el.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,clientX:x,clientY:y,pointerType:"mouse"}));
    el.dispatchEvent(new MouseEvent("mouseover",{bubbles:true,clientX:x,clientY:y}));
    el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,clientX:x,clientY:y,button:0,pointerType:"mouse"}));
    await new Promise(r=>setTimeout(r,80));el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,clientX:x,clientY:y,button:0,pointerType:"mouse"}));el.click();
  };
  const setValue=(el,value)=>{const p=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(p,"value")?.set;if(setter)setter.call(el,value);else el.value=value;};
  const execute=async(step,index)=>{
    try{
      if(step.action==="scroll"){window.scrollTo({left:step.x||0,top:step.y||0,behavior:"smooth"});await new Promise(r=>setTimeout(r,350));}
      else{const el=await waitForTarget(step);if(step.action==="click")await humanClick(el);else if(step.action==="input"){const r=el.getBoundingClientRect();await movePointer(r.left+8,r.top+8,250);el.scrollIntoView({block:"center",behavior:"smooth"});if(el instanceof HTMLInputElement&&["checkbox","radio"].includes(el.type))el.checked=Boolean(step.checked);else setValue(el,step.value??"");el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}}
      await send("REPLAY_RESULT",{stepIndex:index,ok:true});
    }catch(error){await send("REPLAY_RESULT",{stepIndex:index,ok:false,error:error instanceof Error?error.message:String(error)});}
  };
  chrome.runtime.onMessage.addListener(m=>{if(m.type==="MF_EXECUTE_STEP")execute(m.step,m.stepIndex);});
  refresh();
})();