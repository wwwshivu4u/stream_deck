import unittest
from system_controller import (
    classify_port_security,
    get_process_names_snapshot,
    get_process_info_by_pid,
    CRITICAL_SYSTEM_PROCESSES
)


class TestPortsSecurityClassification(unittest.TestCase):
    def test_windows_core_services_classified_as_system(self):
        # SMB Port 445 on PID 4 (System) must be system, not suspicious
        sec_445 = classify_port_security(445, 4, "System", "C:\\Windows\\System32\\ntoskrnl.exe", "0.0.0.0:445")
        self.assertEqual(sec_445["level"], "system")
        self.assertIn("SYSTEM", sec_445["badge"])
        self.assertNotIn("EternalBlue", sec_445["reason"])

        # NetBIOS Port 139 on PID 4
        sec_139 = classify_port_security(139, 4, "System", "C:\\Windows\\System32\\ntoskrnl.exe", "0.0.0.0:139")
        self.assertEqual(sec_139["level"], "system")
        self.assertIn("SYSTEM", sec_139["badge"])

        # RPC Endpoint Mapper Port 135 on svchost
        sec_135 = classify_port_security(135, 1100, "svchost.exe", "C:\\Windows\\System32\\svchost.exe", "0.0.0.0:135")
        self.assertEqual(sec_135["level"], "system")
        self.assertIn("SYSTEM", sec_135["badge"])

        # WSDAPI Port 5357 on svchost
        sec_5357 = classify_port_security(5357, 1100, "svchost.exe", "C:\\Windows\\System32\\svchost.exe", "0.0.0.0:5357")
        self.assertEqual(sec_5357["level"], "system")

        # Windows Update Delivery Optimization Port 7680
        sec_7680 = classify_port_security(7680, 1100, "svchost.exe", "C:\\Windows\\System32\\svchost.exe", "0.0.0.0:7680")
        self.assertEqual(sec_7680["level"], "system")

        # Dynamic RPC Ports (49152 - 65535) on lsass.exe
        sec_rpc = classify_port_security(49665, 848, "lsass.exe", "C:\\Windows\\System32\\lsass.exe", "0.0.0.0:49665")
        self.assertEqual(sec_rpc["level"], "system")
        self.assertIn("SYSTEM", sec_rpc["badge"])

    def test_developer_tools_not_flagged_as_suspicious(self):
        # Android ADB on port 5555
        sec_adb = classify_port_security(5555, 1234, "adb.exe", "C:\\platform-tools\\adb.exe", "0.0.0.0:5555")
        self.assertNotEqual(sec_adb["level"], "suspicious")
        self.assertEqual(sec_adb["level"], "exposed")
        self.assertIn("ADB", sec_adb["reason"])

        # Localhost ADB server
        sec_adb_local = classify_port_security(5037, 1234, "adb.exe", "C:\\platform-tools\\adb.exe", "127.0.0.1:5037")
        self.assertEqual(sec_adb_local["level"], "safe")

        # Vite Dev Server
        sec_vite = classify_port_security(5173, 5678, "node.exe", "C:\\Program Files\\nodejs\\node.exe", "0.0.0.0:5173")
        self.assertEqual(sec_vite["level"], "exposed")

        # Python Volume Control Server
        sec_vol = classify_port_security(8000, 9999, "python.exe", "C:\\Python311\\python.exe", "0.0.0.0:8000")
        self.assertEqual(sec_vol["level"], "exposed")

        # Discord RPC
        sec_discord = classify_port_security(6463, 4444, "Discord.exe", "C:\\Users\\admin\\AppData\\Local\\Discord\\Discord.exe", "127.0.0.1:6463")
        self.assertEqual(sec_discord["level"], "safe")

        # Razer Chroma SDK Server on Port 1337
        sec_razer = classify_port_security(1337, 5072, "RzSDKServer.exe", "C:\\Program Files\\Razer Chroma SDK\\RzSDKServer.exe", "127.0.0.1:1337")
        self.assertEqual(sec_razer["level"], "safe")
        self.assertTrue("RAZER" in sec_razer["badge"] or "3RD-PARTY" in sec_razer["badge"])
        self.assertIn("Razer", sec_razer["reason"])

        # Strapi / Node development server on Port 1337
        sec_strapi = classify_port_security(1337, 6000, "node.exe", "C:\\Program Files\\nodejs\\node.exe", "127.0.0.1:1337")
        self.assertEqual(sec_strapi["level"], "safe")

    def test_genuine_threats_flagged_as_suspicious(self):
        # Metasploit port 4444
        sec_meta = classify_port_security(4444, 7777, "payload.exe", "C:\\temp\\payload.exe", "0.0.0.0:4444")
        self.assertEqual(sec_meta["level"], "suspicious")

        # Back Orifice port 31337
        sec_bo = classify_port_security(31337, 7777, "unknown.exe", "C:\\unknown.exe", "0.0.0.0:31337")
        self.assertEqual(sec_bo["level"], "suspicious")

        # Fake svchost name (svch0st.exe)
        sec_fake = classify_port_security(8888, 7777, "svch0st.exe", "C:\\svch0st.exe", "0.0.0.0:8888")
        self.assertEqual(sec_fake["level"], "suspicious")

        # svchost running outside System32
        sec_bad_path = classify_port_security(9000, 7777, "svchost.exe", "C:\\Users\\admin\\Downloads\\svchost.exe", "0.0.0.0:9000")
        self.assertEqual(sec_bad_path["level"], "suspicious")

        # Redis exposed to 0.0.0.0
        sec_redis = classify_port_security(6379, 5555, "redis-server.exe", "C:\\Redis\\redis-server.exe", "0.0.0.0:6379")
        self.assertEqual(sec_redis["level"], "suspicious")

    def test_critical_processes_protection(self):
        for proc in ("system", "csrss.exe", "lsass.exe", "services.exe", "svchost.exe"):
            self.assertIn(proc, CRITICAL_SYSTEM_PROCESSES)

    def test_fastapi_ports_fix_endpoint(self):
        from fastapi.testclient import TestClient
        from server import app

        client = TestClient(app)
        res = client.post("/api/system/ports/fix-suspicious")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        self.assertIn("fixed_count", data)


if __name__ == "__main__":
    unittest.main()
