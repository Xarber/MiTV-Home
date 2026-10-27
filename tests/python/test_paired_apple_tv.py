# SPDX-License-Identifier: AGPL-3.0-only
"""Protocol boundary checks; fake services, no pairing or external traffic."""
import asyncio
import importlib.util
import pathlib
import sys
import types
import unittest
from unittest.mock import AsyncMock, patch

path = pathlib.Path(__file__).resolve().parents[2] / "app/src/main/python/paired_apple_tv.py"
spec = importlib.util.spec_from_file_location("paired_apple_tv", path)
module = importlib.util.module_from_spec(spec)
sys.path.insert(0,str(path.parent))
spec.loader.exec_module(module)


class AdapterChecks(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.client = module.Client.__new__(module.Client)
        self.client.loop = asyncio.get_running_loop()
        self.client.devices = {}
        self.client.pairing = self.client.device = self.client.monitor = None
        self.client.artwork_key = None
        self.client.snapshot = {"status": "disconnected", "playing": False}
        const = types.ModuleType("pyatv.const")
        const.Protocol = types.SimpleNamespace(AirPlay=1)
        const.FeatureName = types.SimpleNamespace(PlayPause=1, Next=2, Previous=3, SetVolume=4)
        const.FeatureState = types.SimpleNamespace(Available=1)
        const.DeviceState = types.SimpleNamespace(Playing=1, Paused=2)
        self.patch = patch.dict(sys.modules, {"pyatv": types.ModuleType("pyatv"), "pyatv.const": const})
        self.patch.start()

    async def asyncTearDown(self):
        self.patch.stop()

    async def test_pairing_stops_previous_observation_before_starting_new_session(self):
        closed = []
        self.client.device = types.SimpleNamespace(close=lambda: closed.append(True) or set())
        self.client.devices = {"chosen": types.SimpleNamespace(name="Selected TV")}
        pairing = types.SimpleNamespace(begin=AsyncMock(), close=AsyncMock())
        sys.modules["pyatv"].pair = AsyncMock(return_value=pairing)
        result = await self.client._dispatch("pair_begin", {"id": "chosen"})
        self.assertEqual(closed, [True])
        self.assertIsNone(self.client.device)
        self.assertIs(self.client.pairing, pairing)
        pairing.begin.assert_awaited_once()
        self.assertEqual(result, {"status": "pin_required", "name": "Selected TV"})

    async def test_invalid_pin_never_calls_pairing(self):
        self.client.pairing = types.SimpleNamespace(pin=AsyncMock())
        for pin in ["", "123", "12345", "１２３４", "x234"]:
            self.assertEqual((await self.client._dispatch("pair_finish", {"pin": pin}))["error"], "invalid_pin")
        self.client.pairing.pin.assert_not_called()

    async def test_state_does_not_return_credentials(self):
        self.client.selected = types.SimpleNamespace(credentials="secret")
        result = await self.client._dispatch("state", {})
        self.assertEqual(result, {"status": "disconnected", "playing": False})

    async def test_controls_require_feature_support(self):
        command = AsyncMock()
        self.client.device = types.SimpleNamespace(features=types.SimpleNamespace(in_state=lambda *args: False),
            remote_control=types.SimpleNamespace(play_pause=command, next=command, previous=command))
        for action in ["next", "previous", "play_pause", "volume", "arbitrary"]:
            self.assertEqual((await self.client._dispatch("command", {"action": action, "value": 50}))["error"], "unsupported")
        command.assert_not_called()

    async def test_volume_rejects_out_of_bounds_nan_and_boolean(self):
        set_volume = AsyncMock()
        self.client.device = types.SimpleNamespace(features=types.SimpleNamespace(in_state=lambda *args: True),
            remote_control=types.SimpleNamespace(play_pause=AsyncMock(), next=AsyncMock(), previous=AsyncMock()),
            audio=types.SimpleNamespace(set_volume=set_volume))
        for value in [-1, 101, float("nan"), True, "50"]:
            self.assertEqual((await self.client._dispatch("command", {"action": "volume", "value": value}))["error"], "invalid_volume")
        set_volume.assert_not_called()
        await self.client._dispatch("command", {"action": "volume", "value": 20})
        set_volume.assert_awaited_once_with(20)

    async def test_failed_observation_clears_stale_playback(self):
        self.client.snapshot = {"status": "connected", "playing": True, "title": "Old", "artwork": "old"}
        self.client.device = types.SimpleNamespace(metadata=types.SimpleNamespace(playing=AsyncMock(side_effect=ConnectionError())))
        await self.client._observe()
        self.assertEqual(self.client.snapshot, {"status": "disconnected", "playing": False, "error": "connection_lost"})

if __name__ == "__main__":
    unittest.main()
