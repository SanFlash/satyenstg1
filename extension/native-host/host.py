#!/usr/bin/env python3
# Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved.
"""Permission-gated SatyTracker78 Native Messaging host."""
import json
import os
import msvcrt
import struct
import sys
import time
from pathlib import Path

armed_until = 0
APP_DIR = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "SatyTracker78"
LOG_FILE = APP_DIR / "native-host.log"

def log(message):
    try:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as stream:
            stream.write(time.strftime("%Y-%m-%d %H:%M:%S ") + str(message)[:500] + "\n")
    except Exception:
        pass

def read_exact(size):
    chunks = bytearray()
    while len(chunks) < size:
        part = sys.stdin.buffer.read(size - len(chunks))
        if not part:
            return None if not chunks else (_ for _ in ()).throw(EOFError("Incomplete Native Messaging frame"))
        chunks.extend(part)
    return bytes(chunks)

def read():
    header = read_exact(4)
    if header is None:
        return None
    size = struct.unpack("<I", header)[0]
    if size > 1024 * 1024:
        raise ValueError("Message too large")
    payload = read_exact(size)
    if payload is None:
        raise EOFError("Missing message payload")
    return json.loads(payload.decode("utf-8"))

def write(value):
    payload = json.dumps(value, separators=(",", ":")).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(payload)) + payload)
    sys.stdout.buffer.flush()

def consent():
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        allowed = messagebox.askyesno(
            "SatyTracker78 desktop control",
            "Allow visible mouse and keyboard input for up to 5 minutes?\n\n"
            "Only explicit actions will run. Stop or closing Chrome revokes permission. "
            "Do not approve on sensitive screens.",
            icon="warning",
        )
        root.destroy()
        return allowed
    except Exception as exc:
        log("Consent dialog unavailable: " + repr(exc))
        return False

def handle(message):
    global armed_until
    command = message.get("command")
    if command == "status":
        return {"ok": True, "connected": True, "armed": time.time() < armed_until}
    if command == "stop":
        armed_until = 0
        return {"ok": True, "armed": False}
    if command == "arm":
        armed_until = 0
        if not consent():
            return {"ok": False, "armed": False, "error": "Permission dialog was cancelled or unavailable. Check native-host.log."}
        try:
            import pynput  # noqa: F401
        except Exception as exc:
            log("pynput import failed: " + repr(exc))
            return {"ok": False, "armed": False, "error": "Desktop input dependency is missing. Run the repair installer."}
        armed_until = time.time() + 300
        return {"ok": True, "armed": True, "expiresIn": 300}
    if command != "action":
        return {"ok": False, "error": "Unsupported command"}
    if time.time() >= armed_until:
        armed_until = 0
        return {"ok": False, "armed": False, "error": "Permission expired. Enable desktop helper again."}
    try:
        from pynput.mouse import Controller as MouseController, Button
        from pynput.keyboard import Controller as KeyboardController, Key
        action = message.get("action", {})
        kind = action.get("type")
        mouse, keyboard = MouseController(), KeyboardController()
        if kind == "move":
            x, y = action.get("x"), action.get("y")
            if type(x) is not int or type(y) is not int or not (0 <= x <= 10000 and 0 <= y <= 10000):
                raise ValueError("Invalid screen coordinates")
            mouse.position = (x, y)
        elif kind == "click":
            mouse.click(Button.left, 1)
        elif kind == "type":
            value = action.get("text")
            if not isinstance(value, str) or len(value) > 500:
                raise ValueError("Text must be 500 characters or fewer")
            keyboard.type(value)
        elif kind == "press":
            allowed = {
                "enter": Key.enter, "tab": Key.tab, "esc": Key.esc, "space": Key.space,
                "backspace": Key.backspace, "delete": Key.delete, "up": Key.up,
                "down": Key.down, "left": Key.left, "right": Key.right,
            }
            key_name = str(action.get("key", "")).lower()
            if key_name not in allowed:
                raise ValueError("Key is not allowlisted")
            keyboard.press(allowed[key_name])
            keyboard.release(allowed[key_name])
        elif kind == "scroll":
            dx, dy = action.get("dx", 0), action.get("dy", 0)
            if type(dx) is not int or type(dy) is not int or abs(dx) > 20 or abs(dy) > 20:
                raise ValueError("Invalid scroll delta")
            mouse.scroll(dx, dy)
        else:
            raise ValueError("Unsupported desktop action")
        return {"ok": True, "armed": True}
    except Exception as exc:
        log("Action failed: " + repr(exc))
        return {"ok": False, "error": str(exc)[:250]}

def main():
    global armed_until
    # Native Messaging requires raw 32-bit length-prefixed frames on Windows.
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
    log("Native host started; Python=" + sys.executable + "; argv=" + repr(sys.argv[1:]))
    try:
        while True:
            message = read()
            if message is None:
                break
            try:
                write(handle(message))
            except Exception as exc:
                log("Message handling failed: " + repr(exc))
                write({"ok": False, "error": "Native host could not process the request. Check native-host.log."})
    except Exception as exc:
        log("Fatal host error: " + repr(exc))
        raise
    finally:
        armed_until = 0
        log("Native host stopped; permission revoked")

if __name__ == "__main__":
    main()
