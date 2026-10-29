// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.microphone

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.SystemClock
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyFactory
import java.security.SecureRandom
import java.security.spec.MGF1ParameterSpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import javax.crypto.spec.SecretKeySpec

/** Audio and session keys remain in memory. One capture thread owns encoding and encryption. */
class AureaMicrophoneModule : Module() {
  @Volatile private var recording = false
  private var recorder: AudioRecord? = null
  private var worker: Thread? = null
  @android.annotation.SuppressLint("MissingPermission") // Runtime permission is checked before AudioRecord creation.
  override fun definition() = ModuleDefinition {
    Name("AureaMicrophone")
    Events("chunk", "stopped")
    AsyncFunction("start") { id: String, publicKey: String, _: String ->
      synchronized(this@AureaMicrophoneModule) {
        check(worker == null) { "microphone_busy" }
        check(id.matches(Regex("[a-f0-9]{32}"))) { "invalid_voice_session" }
        val context = appContext.reactContext ?: error("microphone_unavailable")
        check(context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) { "microphone_permission_required" }
        val random = SecureRandom()
        val secret = ByteArray(32).also(random::nextBytes)
        val rsa = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(publicKey, Base64.DEFAULT)))
        val wrapper = Cipher.getInstance("RSA/ECB/OAEPPadding")
        wrapper.init(Cipher.ENCRYPT_MODE, rsa, OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT))
        val wrapped = encode(wrapper.doFinal(secret))
        val minimum = AudioRecord.getMinBufferSize(8000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        check(minimum > 0) { "microphone_format_unavailable" }
        val audio = AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, 8000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, maxOf(minimum, 16384))
        if (audio.state != AudioRecord.STATE_INITIALIZED) { audio.release(); error("microphone_unavailable") }
        try { audio.startRecording() } catch (error: Exception) { audio.release(); throw error }
        recorder = audio; recording = true
        worker = Thread({
          var sequence = 0; var failure: String? = null
          val started = SystemClock.elapsedRealtime(); val buffer = ByteArray(8192)
          fun emit(length: Int) {
            val count = length - length % 2
            if (count == 0) return
            val nonce = ByteArray(12).also(random::nextBytes)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(secret, "AES"), GCMParameterSpec(128, nonce))
            cipher.updateAAD("$id:$sequence".toByteArray(Charsets.UTF_8))
            sendEvent("chunk", mapOf("id" to id, "sequence" to sequence++, "nonce" to encode(nonce), "wrappedKey" to wrapped, "ciphertext" to encode(cipher.doFinal(buffer, 0, count))))
          }
          try {
            var count = 0
            while (recording && SystemClock.elapsedRealtime() - started < 30000) {
              val read = audio.read(buffer, count, buffer.size - count, AudioRecord.READ_BLOCKING)
              if (read <= 0) { if (recording) error("microphone_read_failed"); break }
              count += read
              if (count == buffer.size) { emit(count); buffer.fill(0); count = 0 }
            }
            emit(count)
          } catch (_: Exception) { failure = "microphone_failed" }
          finally {
            synchronized(this@AureaMicrophoneModule) {
              recording = false
              try { audio.stop() } catch (_: Exception) {}
              audio.release(); recorder = null; worker = null; secret.fill(0); buffer.fill(0)
            }
            sendEvent("stopped", mapOf("id" to id, "error" to failure))
          }
        }, "AureaVoiceCapture").also { it.start() }
      }
    }
    AsyncFunction("stop") { stopCapture() }
    OnActivityEntersBackground { stopCapture() }
    OnDestroy { stopCapture() }
  }
  private fun stopCapture() {
    synchronized(this) { recording = false; try { recorder?.stop() } catch (_: Exception) {} }
  }
  private fun encode(bytes: ByteArray) = Base64.encodeToString(bytes, Base64.NO_WRAP)
}
