# SPDX-License-Identifier: AGPL-3.0-only
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/"app/src/main/python"))
from receiver_discovery import eligible_apple_tv, LEGACY_UXPLAY_PI

class DiscoveryChecks(unittest.TestCase):
    def test_self_address_is_excluded_even_with_real_looking_model(self):
        self.assertFalse(eligible_apple_tv("Apple TV 4K","192.0.2.10",{},["192.0.2.10"]))
    def test_marked_physical_and_preview_receivers_are_excluded(self):
        for marker in ["receiver-v1","preview-v1"]:
            self.assertFalse(eligible_apple_tv("Apple TV 4K","192.0.2.11",{"mitvhome":marker},[]))
    def test_older_simulated_receiver_uses_known_shared_fingerprint(self):
        self.assertFalse(eligible_apple_tv("Apple TV 3","192.0.2.11",{"model":"AppleTV3,2","pi":LEGACY_UXPLAY_PI},[]))
    def test_actual_old_and_new_apple_tvs_are_not_banned_by_model(self):
        for model in ["AppleTV3,2","AppleTV14,1","Apple TV 4K"]:
            self.assertTrue(eligible_apple_tv(model,"192.0.2.20",{"model":model,"pi":"real-device-identity"},["192.0.2.10"]))
    def test_name_is_not_used_so_duplicates_remain_discoverable(self):
        self.assertTrue(eligible_apple_tv("Apple TV 4K","192.0.2.20",{},[]))
        self.assertFalse(eligible_apple_tv("HomePod","192.0.2.21",{},[]))
    def test_invalid_addresses_do_not_create_false_matches(self):
        self.assertFalse(eligible_apple_tv("AppleTV14,1","invalid",{},[]))
        self.assertTrue(eligible_apple_tv("AppleTV14,1","192.0.2.20",{},["invalid"]))
