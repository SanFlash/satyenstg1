// Copyright (c) 2026 Satyendra Kumar Namdeo. All rights reserved.
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text;

namespace SatyTracker78.Agent;

internal static class Program
{
    private static readonly object Gate = new();
    private static DateTimeOffset ArmedUntil = DateTimeOffset.MinValue;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    [STAThread]
    private static int Main()
    {
        try
        {
            while (true)
            {
                var request = ReadFrame();
                if (request is null) break;
                using (request)
                {
                    object response;
                    try { response = Handle(request); }
                    catch (Exception ex) { Log("Request failed: " + ex); response = new { ok = false, error = "Request failed. See native-host.log." }; }
                    WriteFrame(response);
                }
            }
            return 0;
        }
        catch (Exception ex) { Log("Fatal host error: " + ex); return 2; }
        finally { lock (Gate) ArmedUntil = DateTimeOffset.MinValue; }
    }
    private static JsonDocument? ReadFrame()
    {
        Span<byte> header = stackalloc byte[4];
        if (!ReadExact(header)) return null;
        var length = BitConverter.ToUInt32(header);
        if (length > 1_048_576) throw new InvalidDataException("Native message exceeds 1 MiB.");
        var payload = new byte[length];
        if (!ReadExact(payload)) throw new EndOfStreamException("Incomplete native message.");
        return JsonDocument.Parse(payload);
    }
    private static bool ReadExact(Span<byte> buffer)
    {
        var offset = 0;
        while (offset < buffer.Length) { var read = Console.OpenStandardInput().Read(buffer[offset..]); if (read == 0) return offset == 0 ? false : throw new EndOfStreamException(); offset += read; }
        return true;
    }
    private static void WriteFrame(object value)
    {
        var payload = JsonSerializer.SerializeToUtf8Bytes(value);
        var output = Console.OpenStandardOutput();
        output.Write(BitConverter.GetBytes((uint)payload.Length)); output.Write(payload); output.Flush();
    }
    private static object Handle(JsonDocument doc)
    {
        var root = doc.RootElement;
        var command = root.TryGetProperty("command", out var c) ? c.GetString() : "";
        if (command == "status") return new { ok = true, connected = true, armed = IsArmed() };
        if (command == "stop") { lock (Gate) ArmedUntil = DateTimeOffset.MinValue; return new { ok = true, armed = false }; }
        if (command == "arm")
        {
            lock (Gate) ArmedUntil = DateTimeOffset.MinValue;
            var answer = MessageBox.Show("Allow SatyTracker78 to perform visible mouse and keyboard actions for up to five minutes?\n\nOnly actions you explicitly initiate will run. Stop or closing Chrome revokes permission. Do not approve on sensitive screens.", "SatyTracker78 desktop permission", MessageBoxButtons.YesNo, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);
            if (answer != DialogResult.Yes) return new { ok = false, armed = false, error = "Local desktop permission was declined." };
            lock (Gate) ArmedUntil = DateTimeOffset.UtcNow.AddMinutes(5);
            return new { ok = true, armed = true, expiresIn = 300 };
        }
        if (command != "action") return new { ok = false, error = "Unsupported command." };
        if (!IsArmed()) return new { ok = false, armed = false, error = "Permission expired. Enable desktop control again." };
        if (!root.TryGetProperty("action", out var action)) return new { ok = false, error = "Missing action." };
        try { Execute(action); return new { ok = true, armed = true }; }
        catch (Exception ex) { Log("Action rejected: " + ex.Message); return new { ok = false, error = ex.Message }; }
    }
    private static bool IsArmed() { lock (Gate) { if (DateTimeOffset.UtcNow < ArmedUntil) return true; ArmedUntil = DateTimeOffset.MinValue; return false; } }
    private static void Execute(JsonElement action)
    {
        var type = action.TryGetProperty("type", out var t) ? t.GetString() : "";
        switch (type)
        {
            case "move":
                var x = RequiredInt(action, "x", 0, 10000); var y = RequiredInt(action, "y", 0, 10000);
                var bounds = SystemInformation.VirtualScreen;
                var absX = Math.Clamp((int)Math.Round((double)(x - bounds.Left) * 65535 / Math.Max(1, bounds.Width - 1)), 0, 65535);
                var absY = Math.Clamp((int)Math.Round((double)(y - bounds.Top) * 65535 / Math.Max(1, bounds.Height - 1)), 0, 65535);
                Send(new Input { type = 0, U = new Union { mi = new MouseInput { dx = absX, dy = absY, flags = 0x8000 | 0x4000 } } }); break;
            case "click":
                SendMouse(0x0002); SendMouse(0x0004); break;
            case "scroll":
                var dy = RequiredInt(action, "dy", -20, 20); if (dy != 0) Send(new Input { type = 0, U = new Union { mi = new MouseInput { mouseData = unchecked((uint)(dy * 120)), flags = 0x0800 } } }); break;
            case "type":
                var text = action.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                if (text.Length > 500) throw new ArgumentException("Text is limited to 500 characters.");
                foreach (var ch in text) { KeyUnicode(ch, false); KeyUnicode(ch, true); } break;
            case "press":
                var key = action.TryGetProperty("key", out var k) ? k.GetString()?.ToLowerInvariant() : "";
                var vk = key switch { "enter" => 0x0D, "tab" => 0x09, "esc" => 0x1B, "space" => 0x20, "backspace" => 0x08, "delete" => 0x2E, "up" => 0x26, "down" => 0x28, "left" => 0x25, "right" => 0x27, _ => 0 };
                if (vk == 0) throw new ArgumentException("Key is not allowlisted.");
                SendKey((ushort)vk, false); SendKey((ushort)vk, true); break;
            default: throw new ArgumentException("Unsupported desktop action.");
        }
    }
    private static int RequiredInt(JsonElement e, string name, int min, int max) { if (!e.TryGetProperty(name, out var v) || !v.TryGetInt32(out var n) || n < min || n > max) throw new ArgumentException("Invalid " + name + "."); return n; }
    private static void SendMouse(uint flags) => Send(new Input { type = 0, U = new Union { mi = new MouseInput { flags = flags } } });
    private static void KeyUnicode(char ch, bool up) => Send(new Input { type = 1, U = new Union { ki = new KeyboardInput { scan = ch, flags = 0x0004 | (up ? 0x0002u : 0u) } } });
    private static void SendKey(ushort vk, bool up) => Send(new Input { type = 1, U = new Union { ki = new KeyboardInput { vk = vk, flags = up ? 0x0002u : 0u } } });
    private static void Send(Input input) { if (SendInput(1, new[] { input }, Marshal.SizeOf<Input>()) != 1) throw new InvalidOperationException("Windows rejected the input action."); }
    [StructLayout(LayoutKind.Sequential)] private struct Input { public uint type; public Union U; }
    [StructLayout(LayoutKind.Explicit)] private struct Union { [FieldOffset(0)] public MouseInput mi; [FieldOffset(0)] public KeyboardInput ki; }
    [StructLayout(LayoutKind.Sequential)] private struct MouseInput { public int dx, dy; public uint mouseData, flags, time; public nint extra; }
    [StructLayout(LayoutKind.Sequential)] private struct KeyboardInput { public ushort vk, scan; public uint flags, time; public nint extra; }
    [DllImport("user32.dll", SetLastError = true)] private static extern uint SendInput(uint count, Input[] inputs, int size);
    private static void Log(string message) { try { var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SatyTracker78"); Directory.CreateDirectory(dir); File.AppendAllText(Path.Combine(dir, "native-host.log"), DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss ") + message.Replace(Environment.NewLine, " ") + Environment.NewLine); } catch { } }
}
