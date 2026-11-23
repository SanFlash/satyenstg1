/* Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved. Project: MouseFlow AI. */
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

  document.addEventListener("click",e=>{const t=e.target instanceof Element?e.target:e.target?.parentElement;const el=t?.closest('button,a,[role="button"],input[type="button"],input[type="submit"],summary,[data-testid]');if(el)record("click",el);},true);
  document.addEventListener("change",e=>{const el=e.target;if(el instanceof HTMLSelectElement||el instanceof HTMLInputElement&&["checkbox","radio"].includes(el.type))record("input",el);},true);
  document.addEventListener("input",e=>{const el=e.target;if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)||privateEl(el))return;if(el instanceof HTMLInputElement&&!["text","search","email","url","tel","number"].includes(el.type))return;clearTimeout(el.__mfTimer);el.__mfTimer=setTimeout(()=>record("input",el),450);},true);
  // Capture one settled scroll position instead of flooding the flow with every scroll frame.
  let scrollCaptureTimer = 0;
  document.addEventListener("scroll",e=>{
    if(e.target!==document)return;
    clearTimeout(scrollCaptureTimer);
    scrollCaptureTimer=setTimeout(()=>{
      send("RECORD_STEP",{step:{action:"scroll",x:scrollX,y:scrollY,url:location.href,at:Date.now()}});
    },180);
  },true);

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
  const waitForTarget=async step=>{const start=Date.now();while(Date.now()-start<12000){const el=resolve(step);if(el)return el;await new Promise(r=>setTimeout(r,250));}if(Number.isFinite(step.x)&&Number.isFinite(step.y)){const x=Math.max(2,Math.min(innerWidth-2,step.x*innerWidth)),y=Math.max(2,Math.min(innerHeight-2,step.y*innerHeight));const under=document.elementFromPoint(x,y)?.closest("button,a,[role=button],input,textarea,select,[tabindex]");if(under&&visible(under)&&!privateEl(under))return under;}const h=hintsFor(step);throw new Error("Target not found. The pointer moved to the last recorded position, but no safe clickable element was there"+(h.text?": "+h.text:"")+".");};

  // A lightweight page-only cursor gives visible human-style motion without a control panel or debugger attachment.
  const cursor = document.createElement("div");
  cursor.setAttribute("aria-hidden", "true");
  cursor.style.cssText = "position:fixed;left:0;top:0;width:25px;height:32px;z-index:2147483647;pointer-events:none;opacity:0;transform:translate3d(-80px,-80px,0);transition:opacity .12s ease;filter:drop-shadow(0 2px 3px rgba(0,0,0,.42));";
  cursor.innerHTML = '<svg viewBox="0 0 28 36" width="25" height="32" xmlns="http://www.w3.org/2000/svg"><path d="M2 1.5 2.5 28l7-6.2 5.1 11.1 5-2.3-5.2-10.8 9.8-.7L2 1.5Z" fill="#fff" stroke="#151923" stroke-width="2" stroke-linejoin="round"/></svg>';
  (document.documentElement || document).appendChild(cursor);
  let cursorX = Math.max(24, innerWidth * .18), cursorY = Math.max(32, innerHeight * .22), cursorVisible = false, lastHover = null, moveSequence = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  // Use a short, eased scroll animation so replay moves quickly without jumping.
  const fastScrollTo = async (left, top, duration = 260) => {
    const startX = window.scrollX, startY = window.scrollY;
    const maxX = Math.max(0, document.documentElement.scrollWidth - innerWidth);
    const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const endX = Math.max(0, Math.min(maxX, left)), endY = Math.max(0, Math.min(maxY, top));
    const distance = Math.hypot(endX - startX, endY - startY);
    if (distance < 1) return;
    const ms = Math.min(340, Math.max(150, duration));
    await new Promise(resolve => {
      const started = performance.now();
      const frame = now => {
        const t = Math.min(1, (now - started) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        window.scrollTo({ left: startX + (endX - startX) * eased, top: startY + (endY - startY) * eased, behavior: "instant" });
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  };
  const waitForScrollSettled = async (target = null, maxWait = 500) => {
    const started = performance.now();
    let previous = null, stableFrames = 0;
    while (performance.now() - started < maxWait) {
      await new Promise(requestAnimationFrame);
      const rect = target?.isConnected ? target.getBoundingClientRect() : null;
      const current = [window.scrollX, window.scrollY, rect?.top ?? 0, rect?.left ?? 0];
      if (previous && current.every((value,index) => Math.abs(value-previous[index]) < 0.5)) stableFrames++;
      else stableFrames = 0;
      previous = current;
      if (stableFrames >= 3) break;
    }
  };
  const hitTarget = (x,y) => {const hit=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,x)),Math.max(0,Math.min(innerHeight-1,y)));return hit instanceof Element && !cursor.contains(hit) ? hit : null;};
  const dispatchMouse = (el,type,x,y) => {if(!el?.isConnected)return;const common={bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y,screenX:x+window.screenX,screenY:y+window.screenY,view:window};if(type.startsWith("pointer"))el.dispatchEvent(new PointerEvent(type,{...common,pointerId:1,pointerType:"mouse",isPrimary:true,button:-1,buttons:0}));else el.dispatchEvent(new MouseEvent(type,{...common,button:0,buttons:0}));};
  const updateHover = (x,y) => {const next=hitTarget(x,y);if(next!==lastHover){if(lastHover){dispatchMouse(lastHover,"pointerout",x,y);dispatchMouse(lastHover,"mouseout",x,y);}if(next){dispatchMouse(next,"pointerover",x,y);dispatchMouse(next,"mouseover",x,y);}lastHover=next;}if(next){dispatchMouse(next,"pointermove",x,y);dispatchMouse(next,"mousemove",x,y);}};
  const moveCursor = async (x,y,duration) => {
    const seq=++moveSequence;
    x=Math.max(2,Math.min(innerWidth-28,x));y=Math.max(2,Math.min(innerHeight-36,y));
    cursor.style.opacity="1";
    if(!cursorVisible){cursor.style.transform=`translate3d(${cursorX}px,${cursorY}px,0)`;cursorVisible=true;await sleep(100);}
    const sx=cursorX,sy=cursorY,dx=x-sx,dy=y-sy,distance=Math.hypot(dx,dy);
    const ms=duration??Math.max(360,Math.min(1050,300+distance*.58));
    const nx=distance?(-dy/distance):0,ny=distance?(dx/distance):0;
    const curve=(Math.min(44,Math.max(7,distance*.075)))*(Math.random()>.5?1:-1);
    const c1x=sx+dx*.28+nx*curve,c1y=sy+dy*.28+ny*curve;
    const c2x=sx+dx*.72+nx*curve*.42,c2y=sy+dy*.72+ny*curve*.42;
    await new Promise(resolve=>{const started=performance.now();let frameNo=0;const frame=now=>{if(seq!==moveSequence){resolve();return;}const t=Math.min(1,(now-started)/ms),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,u=1-e;
      let px=u*u*u*sx+3*u*u*e*c1x+3*u*e*e*c2x+e*e*e*x;
      let py=u*u*u*sy+3*u*u*e*c1y+3*u*e*e*c2y+e*e*e*y;
      cursor.style.transform=`translate3d(${px}px,${py}px,0)`;
      if(++frameNo%2===0||t===1)updateHover(px+2,py+2);
      if(t<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
    if(seq!==moveSequence)return;
    cursorX=x;cursorY=y;updateHover(x+2,y+2);
  };
  const clickFeedback = () => {
    const ring=document.createElement("div");
    ring.style.cssText=`position:fixed;left:0;top:0;width:18px;height:18px;border:2px solid #6558f5;border-radius:50%;pointer-events:none;z-index:2147483646;transform:translate3d(${cursorX+3}px,${cursorY+3}px,0) scale(.45);opacity:.9;transition:transform .28s ease,opacity .28s ease;`;
    document.documentElement.appendChild(ring);requestAnimationFrame(()=>{ring.style.transform=`translate3d(${cursorX+3}px,${cursorY+3}px,0) scale(1.8)`;ring.style.opacity="0";});setTimeout(()=>ring.remove(),320);
  };
  const moveToElement = async el => {const r=el.getBoundingClientRect();await fastScrollTo(window.scrollX+r.left+r.width*.5-innerWidth*.5,window.scrollY+r.top+r.height*.5-innerHeight*.5);await waitForScrollSettled(el);const next=el.getBoundingClientRect();await moveCursor(next.left+next.width*.5,next.top+next.height*.5);await sleep(140);};
  // Synthetic page-level events avoid Chrome's debugger notification.
  // They are not trusted hardware input and cannot move the OS cursor.
  const humanClick=async el=>{
    await moveToElement(el);
    const b=el.getBoundingClientRect(),x=b.left+b.width*.5,y=b.top+b.height*.5;
    updateHover(x,y);
    clickFeedback();
    el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,clientX:x,clientY:y,button:0,pointerType:"mouse"}));
    el.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,clientX:x,clientY:y,button:0}));
    cursor.querySelector("svg").style.transform="scale(.91)";
    await sleep(95+Math.random()*45);
    cursor.querySelector("svg").style.transform="scale(1)";
    el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,clientX:x,clientY:y,button:0,pointerType:"mouse"}));
    el.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,clientX:x,clientY:y,button:0}));
    el.click();
  };
  const setValue=(el,value)=>{const p=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(p,"value")?.set;if(setter)setter.call(el,value);else el.value=value;};
  const execute=async(step,index)=>{
    try{
      if(step.action==="scroll"){await fastScrollTo(step.x||0,step.y||0);await waitForScrollSettled();}
      else{const el=await waitForTarget(step);if(step.action==="click")await humanClick(el);else if(step.action==="input"){await moveToElement(el);el.focus({preventScroll:true});if(el instanceof HTMLInputElement&&["checkbox","radio"].includes(el.type))el.checked=Boolean(step.checked);else setValue(el,step.value??"");el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}}
      await send("REPLAY_RESULT",{stepIndex:index,ok:true});
    }catch(error){await send("REPLAY_RESULT",{stepIndex:index,ok:false,error:error instanceof Error?error.message:String(error)});}
  };
  chrome.runtime.onMessage.addListener(m=>{if(m.type==="MF_EXECUTE_STEP")execute(m.step,m.stepIndex);});
})();
