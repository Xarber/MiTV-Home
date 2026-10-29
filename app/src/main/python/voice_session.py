# SPDX-License-Identifier: AGPL-3.0-only
"""Ephemeral encrypted microphone session. No audio, keys or payloads are persisted/logged."""
import base64
import secrets
import time
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def decode(value, maximum):
    if not isinstance(value,str) or len(value)>maximum*2:raise ValueError('invalid_voice_packet')
    raw=base64.b64decode(value,validate=True)
    if len(raw)>maximum:raise ValueError('invalid_voice_packet')
    return raw

class VoiceSession:
    def __init__(self,owner,clock=time.monotonic):
        if not isinstance(owner,str) or len(owner)!=64:raise ValueError('invalid_voice_owner')
        self.owner=owner;self.id=secrets.token_hex(16);self.clock=clock;self.started=clock();self.last=self.started
        self.private=rsa.generate_private_key(public_exponent=65537,key_size=2048)
        self.key=None;self.sequence=0;self.total=0;self.nonces=set();self.stream=None
    def public(self):
        key=self.private.public_key()
        return {'id':self.id,'publicKey':base64.b64encode(key.public_bytes(serialization.Encoding.DER,serialization.PublicFormat.SubjectPublicKeyInfo)).decode(),
                'publicKeyPKCS1':base64.b64encode(key.public_bytes(serialization.Encoding.DER,serialization.PublicFormat.PKCS1)).decode(),
                'sampleRate':8000,'channels':1,'sampleBits':16,'maximumMs':30000}
    def authorized(self,data):
        return data.get('owner')==self.owner and data.get('id')==self.id
    def expired(self):return self.clock()-self.last>6 or self.clock()-self.started>35
    def accept(self,data):
        if not self.authorized(data) or self.expired():raise ValueError('voice_session_expired')
        sequence=data.get('sequence')
        if isinstance(sequence,bool) or not isinstance(sequence,int) or sequence!=self.sequence:raise ValueError('voice_sequence')
        nonce=decode(data.get('nonce'),12)
        if len(nonce)!=12 or nonce in self.nonces:raise ValueError('voice_sequence')
        key=self.key
        if key is None:
            key=self.private.decrypt(decode(data.get('wrappedKey'),256),padding.OAEP(mgf=padding.MGF1(hashes.SHA256()),algorithm=hashes.SHA256(),label=None))
            if len(key)!=32:raise ValueError('invalid_voice_packet')
        audio=AESGCM(key).decrypt(nonce,decode(data.get('ciphertext'),8208),f'{self.id}:{sequence}'.encode())
        if not audio or len(audio)>8192 or len(audio)%2 or self.total+len(audio)>488192:raise ValueError('invalid_voice_packet')
        self.key=key;self.private=None;self.nonces.add(nonce);self.sequence+=1;self.total+=len(audio);self.last=self.clock()
        return audio
    def close(self):
        if self.stream:
            try:self.stream.end()
            except Exception:pass
        self.stream=None;self.key=None;self.private=None;self.nonces.clear()
