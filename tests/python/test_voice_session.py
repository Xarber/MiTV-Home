# SPDX-License-Identifier: AGPL-3.0-only
"""Real encryption interoperability and hostile voice packets; synthetic PCM only."""
import base64,json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'app/src/main/python'))
try:
    from voice_session import VoiceSession
    from cryptography.hazmat.primitives import hashes,serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    CRYPTO=True
except ImportError:CRYPTO=False

@unittest.skipUnless(CRYPTO,'host cryptography is unavailable; real crypto runs in dependency CI')
class VoiceChecks(unittest.TestCase):
    def setUp(self):
        self.now=0;self.voice=VoiceSession('a'*64,clock=lambda:self.now);self.key=b'k'*32
        self.public=self.voice.public();self.sequence=0
    def tearDown(self):self.voice.close()
    def packet(self,sequence=0,audio=b'\x01\x00'*4096,nonce=None,owner='a'*64):
        nonce=nonce or sequence.to_bytes(12,'big')
        public=serialization.load_der_public_key(base64.b64decode(self.public['publicKey']))
        wrap=public.encrypt(self.key,padding.OAEP(mgf=padding.MGF1(hashes.SHA256()),algorithm=hashes.SHA256(),label=None))
        return {'owner':owner,'id':self.voice.id,'sequence':sequence,'nonce':base64.b64encode(nonce).decode(),'wrappedKey':base64.b64encode(wrap).decode(),'ciphertext':base64.b64encode(AESGCM(self.key).encrypt(nonce,audio,f'{self.voice.id}:{sequence}'.encode())).decode()}
    def test_rsa_oaep_sha256_aes_gcm_roundtrip_and_cleanup(self):
        self.assertEqual(self.voice.accept(self.packet()),b'\x01\x00'*4096)
        self.assertIsNone(self.voice.private)
        self.assertEqual(self.voice.accept(self.packet(1)),b'\x01\x00'*4096)
        self.voice.close();self.assertIsNone(self.voice.key);self.assertFalse(self.voice.nonces)
    def test_owner_isolation_replay_and_nonce_reuse(self):
        with self.assertRaises(ValueError):self.voice.accept(self.packet(owner='b'*64))
        original=self.packet();self.voice.accept(original)
        with self.assertRaises(ValueError):self.voice.accept(original)
        with self.assertRaises(ValueError):self.voice.accept(self.packet(1,nonce=b'\x00'*12))
    def test_tampered_ciphertext_rejected_without_advancing(self):
        packet=self.packet();packet['ciphertext']=base64.b64encode(b'x'*8208).decode()
        with self.assertRaises(Exception):self.voice.accept(packet)
        self.assertEqual(self.voice.sequence,0);self.assertIsNone(self.voice.key)
    def test_idle_absolute_deadline_and_pcm_bounds(self):
        self.now=7
        with self.assertRaises(ValueError):self.voice.accept(self.packet())
        self.now=36;self.voice.last=35
        with self.assertRaises(ValueError):self.voice.accept(self.packet())
        self.now=0;self.voice.last=0
        for audio in [b'',b'x',b'\x00'*8194]:
            with self.assertRaises(Exception):self.voice.accept(self.packet(audio=audio))
    def test_public_key_formats_identify_same_key(self):
        spki=serialization.load_der_public_key(base64.b64decode(self.public['publicKey']))
        pkcs=serialization.load_der_public_key(base64.b64decode(self.public['publicKeyPKCS1']))
        self.assertEqual(spki.public_numbers(),pkcs.public_numbers())
