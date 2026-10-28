# SPDX-License-Identifier: AGPL-3.0-only
"""App-local pyatv adapter. All protocol I/O stays on one asyncio loop.

Only pair_finish returns credentials, for immediate Android Keystore storage.
Public snapshots never contain addresses, credentials, PINs or protocol logs.
"""
import asyncio
import base64
import concurrent.futures
import json
import logging
import os
import threading
import time
from receiver_discovery import eligible_apple_tv
from playback_errors import classify_failure
from playback_diagnostics import Recorder,configure_http_logging

os.environ.setdefault("CRYPTOGRAPHY_OPENSSL_NO_LEGACY", "1")
# Protocol debug messages can contain credentials and personal metadata.
logging.disable(logging.CRITICAL)


class Client:
    def __init__(self):
        self.recorder = None
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._run, name="AppleTVProtocol", daemon=True)
        self.devices = {}
        self.pairing = None
        self.selected = None
        self.device = None
        self.monitor = None
        self.artwork_key = None
        self.snapshot = {"status": "disconnected", "playing": False}
        self.thread.start()

    def _run(self):
        asyncio.set_event_loop(self.loop)
        self.loop.set_exception_handler(self._unhandled_error)
        self.loop.run_forever()

    def configure_diagnostics(self,directory,version,commit):
        if self.recorder is not None:return
        sink=None
        try:
            from java import jclass
            android_log=jclass("android.util.Log")
            sink=lambda line:android_log.i("MiTVPairing",line)
        except Exception:pass
        try:
            self.recorder=Recorder(directory,version,commit,sink)
            configure_http_logging(self.recorder)
        except Exception:self.recorder=None

    def _unhandled_error(self,loop,context):
        if self.recorder:self.recorder.write("failure","state",error="connection_failed",exception=context.get("exception"))

    def host_failure(self,operation,code,exception_type):
        if self.recorder:self.recorder.write("failure",operation,error=code,host_exception=exception_type)

    def request(self, operation, payload="{}"):
        """Called from Android's worker, never the UI thread. Errors are redacted."""
        started=time.monotonic()
        if self.recorder and operation!="state":self.recorder.write("start",operation)
        future = asyncio.run_coroutine_threadsafe(self._dispatch(operation, json.loads(payload)), self.loop)
        try:
            result=future.result(timeout=35)
            if self.recorder and operation!="state":self.recorder.write("failure" if "error" in result else "success",operation,error=result.get("error"),elapsed_ms=int((time.monotonic()-started)*1000))
            return json.dumps(result,allow_nan=False)
        except concurrent.futures.TimeoutError:
            future.cancel()
            error=TimeoutError()
            if self.recorder:self.recorder.write("failure",operation,error="timeout",exception=error,elapsed_ms=int((time.monotonic()-started)*1000))
            return json.dumps(classify_failure(operation,error))
        except Exception as error:
            result=classify_failure(operation,error)
            if self.recorder:self.recorder.write("failure",operation,error=result.get("error"),http_status=result.get("http_status"),exception=error,elapsed_ms=int((time.monotonic()-started)*1000))
            return json.dumps(result)

    async def _dispatch(self, operation, data):
        import pyatv
        from pyatv.const import Protocol
        if operation == "scan":
            await self._cancel_pairing()
            found = await pyatv.scan(self.loop, timeout=5, protocol=Protocol.AirPlay)
            # AirPlay speakers and this launcher's own receiver are not Apple TVs.
            found = [item for item in found if self._eligible(item, data)]
            self.devices = {str(index): item for index, item in enumerate(found)}
            return {"devices": [{"id": key, "name": item.name} for key, item in self.devices.items()]}
        if operation == "pair_begin":
            await self._disconnect()
            self.selected = self.devices[data["id"]]
            self.pairing = await pyatv.pair(self.selected, Protocol.AirPlay, self.loop, name="MiTV Home")
            await self.pairing.begin()
            return {"status": "pin_required", "name": self.selected.name}
        if operation == "pair_finish":
            pin = data.get("pin", "")
            if not self.pairing or len(pin) != 4 or not pin.isascii() or not pin.isdigit():
                return {"error": "invalid_pin"}
            try:
                self.pairing.pin(int(pin))
                await self.pairing.finish()
                if not self.pairing.has_paired:
                    return {"error": "pairing_failed"}
                return {"credentials": self.pairing.service.credentials,
                        "identifier": self.selected.identifier, "name": self.selected.name}
            finally:
                await self._cancel_pairing()
        if operation == "cancel_pairing":
            await self._cancel_pairing()
            return {"status": "disconnected"}
        if operation == "connect":
            await self._disconnect()
            found = await pyatv.scan(self.loop, timeout=5, identifier=data["identifier"], protocol=Protocol.AirPlay)
            found = [item for item in found if self._eligible(item, data)]
            if not found:
                return {"error": "device_unavailable"}
            config = found[0]
            if not config.set_credentials(Protocol.AirPlay, data["credentials"]):
                return {"error": "pairing_required"}
            self.device = await pyatv.connect(config, self.loop, protocol=Protocol.AirPlay)
            self.snapshot = {"status": "connected", "name": config.name, "playing": False}
            self.monitor = self.loop.create_task(self._observe())
            return dict(self.snapshot)
        if operation == "state":
            return dict(self.snapshot)
        if operation == "shutdown":
            await self._disconnect()
            self.loop.call_later(.1, self.loop.stop)
            return {"status": "closed"}
        if operation == "disconnect":
            await self._disconnect()
            return dict(self.snapshot)
        if operation == "command":
            if self.device is None:
                return {"error": "disconnected"}
            action = data.get("action")
            from pyatv.const import FeatureName, FeatureState
            mapping = {"play_pause": (FeatureName.PlayPause, self.device.remote_control.play_pause),
                       "next": (FeatureName.Next, self.device.remote_control.next),
                       "previous": (FeatureName.Previous, self.device.remote_control.previous)}
            if action == "volume":
                if not self.device.features.in_state(FeatureState.Available, FeatureName.SetVolume):
                    return {"error": "unsupported"}
                value = data.get("value")
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 100:
                    return {"error": "invalid_volume"}
                await self.device.audio.set_volume(value)
            elif action in mapping:
                feature, command = mapping[action]
                if not self.device.features.in_state(FeatureState.Available, feature):
                    return {"error": "unsupported"}
                await command()
            else:
                return {"error": "unsupported"}
            return {"status": "sent"}
        return {"error": "unsupported"}

    @staticmethod
    def _eligible(item, data):
        from pyatv.const import Protocol
        service = item.get_service(Protocol.AirPlay)
        return service is not None and eligible_apple_tv(item.device_info.model_str, item.address,
            service.properties, data.get("excluded_addresses", []))

    async def _cancel_pairing(self):
        if self.pairing:
            pairing, self.pairing = self.pairing, None
            await pairing.close()

    async def _disconnect(self):
        if self.monitor:
            task, self.monitor = self.monitor, None
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        if self.device:
            device, self.device = self.device, None
            tasks = device.close()
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
        await self._cancel_pairing()
        self.artwork_key = None
        self.snapshot = {"status": "disconnected", "playing": False}

    async def _observe(self):
        from pyatv.const import DeviceState, FeatureName, FeatureState
        try:
            while self.device:
                playing = await asyncio.wait_for(self.device.metadata.playing(), 8)
                state = {"status": "connected", "name": self.snapshot.get("name", ""),
                         "playing": playing.device_state == DeviceState.Playing,
                         "active": playing.device_state in (DeviceState.Playing, DeviceState.Paused),
                         "title": playing.title or "", "artist": playing.artist or playing.album or "",
                         "position": playing.position, "duration": playing.total_time,
                         "observed_at": time.time(), "waveform": "animation",
                         "controls": {key: self.device.features.in_state(FeatureState.Available, feature)
                                      for key, feature in [("play_pause", FeatureName.PlayPause), ("next", FeatureName.Next),
                                                           ("previous", FeatureName.Previous), ("volume", FeatureName.SetVolume)]}}
                if state["controls"]["volume"]:
                    try:
                        state["volume"] = self.device.audio.volume
                    except Exception:
                        state["controls"]["volume"] = False
                key = playing.hash or (playing.title, playing.artist, playing.album)
                if key != self.artwork_key:
                    self.artwork_key = key
                    try:
                        art = await asyncio.wait_for(self.device.metadata.artwork(width=256, height=256), 6)
                        state["artwork"] = base64.b64encode(art.bytes).decode("ascii") if art and len(art.bytes) <= 512_000 else None
                    except Exception:
                        state["artwork"] = None
                else:
                    state["artwork"] = self.snapshot.get("artwork")
                self.snapshot = state
                await asyncio.sleep(2)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            if self.recorder:self.recorder.write("failure","state",error="connection_failed",exception=error)
            # Remove stale playback immediately; the Android owner reconnects with backoff.
            self.snapshot = {"status": "disconnected", "playing": False, "error": "connection_lost"}
