#!/usr/bin/env python3
# Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved.
"""Permission-gated SatyTracker78 Native Messaging host. No background activity simulation."""
import json,struct,sys,time
armed_until=0
def read():
 h=sys.stdin.buffer.read(4)
 if len(h)!=4:return None
 n=struct.unpack("<I",h)[0]
 if n>1048576:raise ValueError("Message too large")
 b=sys.stdin.buffer.read(n)
 return json.loads(b.decode())
def write(x):
 b=json.dumps(x,separators=(",",":")).encode()
 sys.stdout.buffer.write(struct.pack("<I",len(b))+b);sys.stdout.buffer.flush()
def consent():
 try:
  import tkinter as tk
  from tkinter import messagebox
  r=tk.Tk();r.withdraw();r.attributes("-topmost",True)
  ok=messagebox.askyesno("SatyTracker78 desktop control","Allow visible mouse and keyboard input for up to 5 minutes? Only explicit actions will run. Press Stop or close Chrome to revoke. Do not approve on sensitive screens.",icon="warning")
  r.destroy();return ok
 except Exception:return False
def handle(m):
 global armed_until
 c=m.get("command")
 if c=="status":return {"ok":True,"armed":time.time()<armed_until}
 if c=="stop":armed_until=0;return {"ok":True,"armed":False}
 if c=="arm":
  armed_until=0
  if not consent():return {"ok":False,"armed":False,"error":"Local permission denied."}
  try: import pynput
  except Exception as e:return {"ok":False,"error":"Install pynput: "+str(e)}
  armed_until=time.time()+300;return {"ok":True,"armed":True,"expiresIn":300}
 if c!="action":return {"ok":False,"error":"Unsupported command"}
 if time.time()>=armed_until:armed_until=0;return {"ok":False,"armed":False,"error":"Permission expired. Enable again."}
 try:
  from pynput.mouse import Controller as MC,Button
  from pynput.keyboard import Controller as KC,Key
  a=m.get("action",{});t=a.get("type");mouse=MC();key=KC()
  if t=="move":
   x,y=a.get("x"),a.get("y")
   if type(x)!=int or type(y)!=int or not(0<=x<=10000 and 0<=y<=10000):raise ValueError("Invalid screen coordinates")
   mouse.position=(x,y)
  elif t=="click":mouse.click(Button.left,1)
  elif t=="type":
   s=a.get("text")
   if not isinstance(s,str) or len(s)>500:raise ValueError("Text must be <=500 characters")
   key.type(s)
  elif t=="press":
   names={"enter":Key.enter,"tab":Key.tab,"esc":Key.esc,"space":Key.space,"backspace":Key.backspace,"delete":Key.delete,"up":Key.up,"down":Key.down,"left":Key.left,"right":Key.right}
   k=str(a.get("key","")).lower()
   if k not in names:raise ValueError("Key not allowlisted")
   key.press(names[k]);key.release(names[k])
  elif t=="scroll":
   dx,dy=a.get("dx",0),a.get("dy",0)
   if type(dx)!=int or type(dy)!=int or abs(dx)>20 or abs(dy)>20:raise ValueError("Invalid scroll delta")
   mouse.scroll(dx,dy)
  else:raise ValueError("Unsupported desktop action")
  return {"ok":True,"armed":True}
 except Exception as e:return {"ok":False,"error":str(e)[:250]}
def main():
 global armed_until
 while True:
  m=read()
  if m is None:break
  try:write(handle(m))
  except Exception as e:write({"ok":False,"error":str(e)[:250]})
 armed_until=0
if __name__=="__main__":main()
