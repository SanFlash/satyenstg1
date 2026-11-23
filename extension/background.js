const KEY = "mouseflowExtensionState";
const initial = { mode:"idle", steps:[], stepIndex:0, iterations:0, delayMs:1000, stopOnError:true, tabId:null, lastError:"", inFlight:false, inFlightStepIndex:null, inFlightUrl:"" };
async function state(){ const d=await chrome.storage.local.get(KEY); return {...initial,...(d[KEY]||{})}; }
async function save(s){ await chrome.storage.local.set({[KEY]:s}); }
async function inject(tabId){ try { await chrome.scripting.executeScript({target:{tabId},files:["recorder.js"]}); return true; } catch(e){ const s=await state(); await save({...s,mode:"error",lastError:"Chrome blocked this page. Open a normal http/https website and reload it."}); return false; } }
async function dispatch(tabId){
 let s=await state(); if(s.mode!=="replaying"||s.tabId!==tabId||s.inFlight)return;
 const step=s.steps[s.stepIndex]; if(!step){await save({...s,mode:"error",lastError:"The flow has no replayable step."});return;}
 let tab;try{tab=await chrome.tabs.get(tabId);}catch{await save({...s,mode:"idle",lastError:"The target tab was closed."});return;}
 if(step.url&&tab.url){try{if(new URL(step.url).origin!==new URL(tab.url).origin){await save({...s,lastError:"Waiting for the recorded website to open: "+new URL(step.url).origin});return;}}catch{}}
 if(!await inject(tabId))return;
 s=await state();if(s.mode!=="replaying"||s.inFlight)return;
 s.inFlight=true;s.inFlightStepIndex=s.stepIndex;s.inFlightUrl=tab.url||"";await save(s);
 try{await chrome.tabs.sendMessage(tabId,{type:"MF_EXECUTE_STEP",stepIndex:s.stepIndex});}
 catch(e){s=await state();await save({...s,mode:"error",inFlight:false,lastError:"The page did not respond. Reload the page and record the flow again."});}
}
async function advance(result){
 let s=await state();if(s.mode!=="replaying"||!s.inFlight||result.stepIndex!==s.inFlightStepIndex)return;
 s.inFlight=false;s.inFlightStepIndex=null;s.inFlightUrl="";
 if(!result.ok&&s.stopOnError){s.mode="error";s.lastError=result.error||"A replay action failed.";await save(s);return;}
 s.stepIndex++;if(s.stepIndex>=s.steps.length){s.stepIndex=0;s.iterations++;}
 await save(s);setTimeout(()=>dispatch(s.tabId),s.stepIndex===0?s.delayMs:350);
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 (async()=>{
  let s=await state();const senderTab=sender.tab?.id;
  if(m.type==="GET_STATE"){reply(s);return;}
  if(m.type==="SHOW_OVERLAY"){const id=m.tabId??senderTab;if(id==null){reply({ok:false,error:"Open a normal website tab first."});return;}const ok=await inject(id);if(ok){s=await state();if(s.mode==="idle"){s.tabId=id;await save(s);}}reply({ok});return;}
  if(m.type==="RECORD_START"){const id=m.tabId??senderTab;if(id==null){reply({ok:false,error:"Open a normal website tab first."});return;}s={...initial,mode:"recording",tabId:id};await save(s);const ok=await inject(id);reply({ok});return;}
  if(m.type==="RECORD_STEP"&&s.mode==="recording"&&s.tabId===senderTab){if(s.steps.length<1500){s.steps.push(m.step);await save(s);}reply({ok:true,count:s.steps.length});return;}
  if(m.type==="RECORD_STOP"){s.mode="idle";await save(s);reply({ok:true,steps:s.steps});return;}
  if(m.type==="LOOP_START"){const id=m.tabId??senderTab;if(!s.steps.length){reply({ok:false,error:"Record at least one action first."});return;}s={...s,mode:"replaying",stepIndex:0,iterations:0,delayMs:Math.max(0,Math.min(30000,Number(m.delayMs)||0)),stopOnError:m.stopOnError!==false,tabId:id,inFlight:false,inFlightStepIndex:null,lastError:""};await save(s);await dispatch(id);reply({ok:true});return;}
  if(m.type==="REPLAY_RESULT"){await advance(m);reply({ok:true});return;}
  if(m.type==="LOOP_STOP"){s.mode="idle";s.inFlight=false;s.inFlightStepIndex=null;await save(s);reply({ok:true});return;}
  reply({ok:false,error:"Unsupported command"});
 })().catch(e=>reply({ok:false,error:String(e)}));return true;
});
chrome.tabs.onUpdated.addListener(async(id,change,tab)=>{
 if(change.status!=="complete")return;let s=await state();if(s.tabId!==id)return;
 await inject(id);s=await state();
 if(s.mode==="replaying"&&s.inFlight&&tab.url&&s.inFlightUrl&&tab.url!==s.inFlightUrl){
  s.inFlight=false;s.inFlightStepIndex=null;s.inFlightUrl="";s.stepIndex++;if(s.stepIndex>=s.steps.length){s.stepIndex=0;s.iterations++;}await save(s);setTimeout(()=>dispatch(id),s.stepIndex===0?s.delayMs:350);
 }else if(s.mode==="replaying"&&!s.inFlight){await dispatch(id);}
});
chrome.tabs.onRemoved.addListener(async id=>{const s=await state();if(s.tabId===id)await save({...s,mode:"idle",inFlight:false,lastError:"Target tab was closed."});});
