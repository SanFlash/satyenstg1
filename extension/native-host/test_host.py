import importlib.util,pathlib,unittest
p=pathlib.Path(__file__).with_name("host.py")
s=importlib.util.spec_from_file_location("native_host",p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_unknown_command(self):self.assertFalse(m.handle({"command":"shell"})["ok"])
 def test_actions_require_consent(self):self.assertFalse(m.handle({"command":"action","action":{"type":"click"}})["ok"])
 def test_stop_revokes(self):
  m.armed_until=9999999999;self.assertFalse(m.handle({"command":"stop"})["armed"])
 def test_invalid_coordinates(self):
  m.armed_until=9999999999;self.assertFalse(m.handle({"command":"action","action":{"type":"move","x":"1","y":2}})["ok"])
 def test_key_allowlist(self):
  m.armed_until=9999999999;self.assertFalse(m.handle({"command":"action","action":{"type":"press","key":"f12"}})["ok"])
if __name__=="__main__":unittest.main()
