import unittest
import math
from audio_manager import (
    spotify_linear_to_perceptual,
    spotify_perceptual_to_linear,
    is_spotify_name,
    is_spotify_pid,
    set_app_volume,
    get_audio_state
)


class TestSpotifyVolumeCurve(unittest.TestCase):
    def test_spotify_perceptual_to_linear(self):
        # 0% slider -> 0% linear
        self.assertAlmostEqual(spotify_perceptual_to_linear(0), 0.0, places=2)
        # 100% slider -> 100% linear
        self.assertAlmostEqual(spotify_perceptual_to_linear(100), 100.0, places=2)
        # 50% slider -> 12.5% linear (0.5^3 * 100)
        self.assertAlmostEqual(spotify_perceptual_to_linear(50), 12.5, places=2)
        # 80% slider -> 51.2% linear (0.8^3 * 100)
        self.assertAlmostEqual(spotify_perceptual_to_linear(80), 51.2, places=2)
        # 25% slider -> ~1.56% linear
        self.assertAlmostEqual(spotify_perceptual_to_linear(25), 1.5625, places=2)

    def test_spotify_linear_to_perceptual(self):
        # 0% linear -> 0% slider
        self.assertEqual(spotify_linear_to_perceptual(0), 0)
        # 100% linear -> 100% slider
        self.assertEqual(spotify_linear_to_perceptual(100), 100)
        # 12.5% linear -> 50% slider
        self.assertEqual(spotify_linear_to_perceptual(12.5), 50)
        # 51.2% linear -> 80% slider
        self.assertEqual(spotify_linear_to_perceptual(51.2), 80)
        # 13% linear (typical rounded 12.5%) -> 51% slider
        self.assertIn(spotify_linear_to_perceptual(13), (50, 51))

    def test_roundtrip_precision(self):
        # Ensure roundtrip error is at most 1 percentage point across 0..100
        for s in range(0, 101):
            lin = spotify_perceptual_to_linear(s)
            perc = spotify_linear_to_perceptual(lin)
            self.assertLessEqual(abs(perc - s), 1, f"Failed at slider={s}: lin={lin}, perc={perc}")

    def test_spotify_naming_detection(self):
        self.assertTrue(is_spotify_name("Spotify.exe"))
        self.assertTrue(is_spotify_name("spotify"))
        self.assertTrue(is_spotify_name("Spotify", "Queen - Bohemian Rhapsody"))
        self.assertTrue(is_spotify_name(None, "Spotify Premium"))
        self.assertFalse(is_spotify_name("chrome.exe", "YouTube - Google Chrome"))
        self.assertFalse(is_spotify_name("discord.exe", "Discord"))

    def test_fastapi_endpoints(self):
        from fastapi.testclient import TestClient
        from server import app
        import audio_manager

        client = TestClient(app)

        # Mock cached state in audio_manager
        mock_state = {
            "master": {"volume": 70, "muted": False},
            "mic": {"volume": 100, "muted": False, "available": True},
            "sessions": [
                {
                    "pid": 99999,
                    "name": "Spotify",
                    "displayName": "Spotify Free",
                    "volume": 50,
                    "rawVolume": 0.125,
                    "isSpotify": True,
                    "muted": False,
                },
                {
                    "pid": 88888,
                    "name": "chrome",
                    "displayName": "YouTube",
                    "volume": 60,
                    "muted": False,
                }
            ]
        }
        audio_manager._cached_state = mock_state
        audio_manager._cache_time = 9999999999.0

        # Status check
        res = client.get("/api/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        spotify_session = next((s for s in data["sessions"] if s["pid"] == 99999), None)
        self.assertIsNotNone(spotify_session)
        self.assertTrue(spotify_session["isSpotify"])
        self.assertEqual(spotify_session["volume"], 50)

        # Update app volume for Spotify
        res2 = client.post("/api/app", json={"pid": 99999, "volume": 80})
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        spotify_session2 = next((s for s in data2["sessions"] if s["pid"] == 99999), None)
        self.assertIsNotNone(spotify_session2)
        self.assertEqual(spotify_session2["volume"], 80)
        # rawVolume should be around 0.512 (80% slider -> 0.8^3 = 0.512)
        self.assertAlmostEqual(spotify_session2["rawVolume"], 0.512, places=3)


if __name__ == "__main__":
    unittest.main()
