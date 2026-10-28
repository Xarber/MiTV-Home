# SPDX-License-Identifier: AGPL-3.0-only
"""Real SRP proof exchange with the same pinned libraries as the Android APK."""
import binascii
import hashlib
import importlib.util
import unittest

AVAILABLE = importlib.util.find_spec('pyatv') is not None

@unittest.skipUnless(AVAILABLE, 'Run in the pinned protocol dependency environment')
class SrpCompatibilityChecks(unittest.TestCase):
    def exchange(self, client_pin):
        from pyatv.auth.hap_srp import SRPAuthHandler
        from srptools import SRPContext, SRPServerSession, constants
        arguments = dict(prime=constants.PRIME_3072, generator=constants.PRIME_3072_GEN,
                         hash_func=hashlib.sha512, bits_salt=128)
        username, verifier, salt = SRPContext('Pair-Setup', '1234', **arguments).get_user_data_triplet()
        server = SRPServerSession(SRPContext(username, **arguments), password_verifier=verifier)
        client = SRPAuthHandler()
        client.initialize()
        client.step1(client_pin)
        public, proof = client.step2(binascii.unhexlify(server.public), binascii.unhexlify(salt))
        server.process(public.hex(), salt)
        return client, server, proof

    def test_real_hap_exchange_and_encrypted_setup_payload(self):
        client, server, proof = self.exchange('1234')
        self.assertTrue(server.verify_proof(proof.hex()))
        self.assertEqual(client.shared_key, server.key)
        # Exercise cryptography 50's signing/HKDF/AEAD boundary too.
        self.assertGreater(len(client.step3(name='Protocol test')), 32)

    def test_wrong_pin_does_not_authenticate(self):
        _, server, proof = self.exchange('4321')
        self.assertFalse(server.verify_proof(proof.hex()))
