#!/usr/bin/env python3
"""Smoke-test a native host's Chrome length-prefixed stdio protocol."""
import json
import struct
import subprocess
import sys
from pathlib import Path

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify-host.py PATH_TO_HOST")
    host = Path(sys.argv[1]).resolve()
    request = json.dumps({"command": "status"}, separators=(",", ":")).encode("utf-8")
    frame = struct.pack("<I", len(request)) + request
    try:
        result = subprocess.run(
            [sys.executable, str(host)],
            input=frame,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=8,
            check=False,
        )
    except Exception as exc:
        print("Could not launch native host:", exc)
        return 1
    if result.returncode != 0:
        print("Native host exited with code", result.returncode)
        if result.stderr:
            print(result.stderr.decode("utf-8", errors="replace")[-2000:])
        return 1
    if len(result.stdout) < 4:
        print("Native host returned no valid Native Messaging frame.")
        return 1
    size = struct.unpack("<I", result.stdout[:4])[0]
    payload = result.stdout[4:4 + size]
    if len(payload) != size or len(result.stdout) != size + 4:
        print("Native host returned a malformed or extra-output frame.")
        return 1
    try:
        response = json.loads(payload.decode("utf-8"))
    except Exception as exc:
        print("Native host returned invalid JSON:", exc)
        return 1
    if response.get("ok") is not True or response.get("connected") is not True:
        print("Native host status response was unexpected:", response)
        return 1
    print("PASS: native host launch and Chrome stdio framing are valid.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
