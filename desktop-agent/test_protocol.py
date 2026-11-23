import json, struct, subprocess, sys
exe = sys.argv[1]
proc = subprocess.Popen([exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
def send(value):
    payload = json.dumps(value).encode()
    proc.stdin.write(struct.pack("<I", len(payload)) + payload)
    proc.stdin.flush()
def receive():
    header = proc.stdout.read(4)
    if len(header) != 4:
        raise AssertionError("Native host did not return a complete frame")
    size = struct.unpack("<I", header)[0]
    payload = proc.stdout.read(size)
    if len(payload) != size:
        raise AssertionError("Native host returned a truncated frame")
    return json.loads(payload)
send({"command":"status"})
status = receive()
assert status.get("ok") is True and status.get("connected") is True, status
send({"command":"stop"})
stopped = receive()
assert stopped.get("ok") is True and stopped.get("armed") is False, stopped
proc.stdin.close()
assert proc.wait(timeout=10) == 0
print("Windows Native Messaging protocol smoke test passed.")
