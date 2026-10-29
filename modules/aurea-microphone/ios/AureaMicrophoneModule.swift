// SPDX-License-Identifier: AGPL-3.0-only
import ExpoModulesCore
import AVFoundation
import CryptoKit
import Security

public class AureaMicrophoneModule: Module {
  private var capture: MicrophoneCapture?
  public func definition() -> ModuleDefinition {
    Name("AureaMicrophone")
    Events("chunk", "stopped")
    AsyncFunction("requestPermission") { (promise: Promise) in
      if #available(iOS 17.0, *) {
        AVAudioApplication.requestRecordPermission { promise.resolve($0) }
      } else {
        AVAudioSession.sharedInstance().requestRecordPermission { promise.resolve($0) }
      }
    }
    AsyncFunction("start") { (id: String, _: String, publicKey: String) in
      guard self.capture == nil else { throw CaptureError.busy }
      let capture = try MicrophoneCapture(id: id, publicKey: publicKey) { [weak self] event, body in
        self?.sendEvent(event, body)
      }
      self.capture = capture
      do { try capture.start() } catch { self.capture = nil; capture.stop(); throw error }
    }.runOnQueue(.main)
    AsyncFunction("stop") { self.capture?.stop(); self.capture = nil }.runOnQueue(.main)
    OnAppEntersBackground { self.capture?.stop(); self.capture = nil }
    OnDestroy { self.capture?.stop(); self.capture = nil }
  }
}
private enum CaptureError: Error { case busy, invalidSession, unavailable, encryption }
/** Engine lifetime stays on main; PCM/encryption state is confined to queue. No audio files. */
private final class MicrophoneCapture {
  private let id: String
  private let engine = AVAudioEngine()
  private let queue = DispatchQueue(label: "it.xarber.aurea.voice")
  private var key: SymmetricKey?
  private let wrappedKey: String
  private var pending = Data()
  private var sequence = 0
  private var accepting = true
  private var started = false
  private var installedTap = false
  private var watchdog: DispatchWorkItem?
  private let emit: (String, [String: Any]) -> Void
  init(id: String, publicKey: String, emit: @escaping (String, [String: Any]) -> Void) throws {
    guard id.count == 32, id.allSatisfy({ $0.isHexDigit }), let data = Data(base64Encoded: publicKey) else { throw CaptureError.invalidSession }
    let key = SymmetricKey(size: .bits256)
    let attributes: [String: Any] = [kSecAttrKeyType as String: kSecAttrKeyTypeRSA, kSecAttrKeyClass as String: kSecAttrKeyClassPublic, kSecAttrKeySizeInBits as String: 2048]
    guard let rsa = SecKeyCreateWithData(data as CFData, attributes as CFDictionary, nil),
          let encrypted = SecKeyCreateEncryptedData(rsa, .rsaEncryptionOAEPSHA256, key.withUnsafeBytes { Data($0) } as CFData, nil) else { throw CaptureError.encryption }
    self.id = id; self.key = key; self.wrappedKey = (encrypted as Data).base64EncodedString(); self.emit = emit
  }
  func start() throws {
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement)
    try session.setActive(true)
    started = true
    let input = engine.inputNode
    let source = input.outputFormat(forBus: 0)
    guard source.sampleRate > 0, source.channelCount > 0,
          let target = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 8000, channels: 1, interleaved: true),
          let converter = AVAudioConverter(from: source, to: target) else { throw CaptureError.unavailable }
    input.installTap(onBus: 0, bufferSize: 4096, format: source) { [weak self] buffer, _ in
      guard let self else { return }
      // Conversion stays on the audio tap; encryption runs on a separate serial queue.
      let capacity = AVAudioFrameCount(ceil(Double(buffer.frameLength) * 8000 / source.sampleRate) + 64)
      guard let output = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: capacity) else { return }
      var consumed = false
      var conversionError: NSError?
      let result = converter.convert(to: output, error: &conversionError) { _, status in
        if consumed { status.pointee = .noDataNow; return nil }
        consumed = true; status.pointee = .haveData; return buffer
      }
      guard result != .error, conversionError == nil, output.frameLength > 0, let samples = output.int16ChannelData else { return }
      let pcm = Data(bytes: samples[0], count: Int(output.frameLength) * 2)
      self.queue.async { [weak self] in self?.append(pcm) }
    }
    installedTap = true
    try engine.start()
    let watchdog = DispatchWorkItem { [weak self] in self?.stop() }
    self.watchdog = watchdog
    DispatchQueue.main.asyncAfter(deadline: .now() + 30, execute: watchdog)
  }
  private func append(_ pcm: Data) {
    guard accepting else { return }
    pending.append(pcm)
    while pending.count >= 8192 {
      let packet = Data(pending.prefix(8192)); pending.removeFirst(8192)
      encrypt(packet)
    }
  }
  private func encrypt(_ pcm: Data) {
    guard let key, !pcm.isEmpty else { return }
    do {
      let sealed = try AES.GCM.seal(pcm, using: key, authenticating: Data("\(id):\(sequence)".utf8))
      emit("chunk", ["id": id, "sequence": sequence, "nonce": Data(sealed.nonce).base64EncodedString(), "wrappedKey": wrappedKey, "ciphertext": (sealed.ciphertext + sealed.tag).base64EncodedString()])
      sequence += 1
    } catch {
      accepting = false
      DispatchQueue.main.async { [weak self] in self?.stop(error: "microphone_encryption_failed") }
    }
  }
  func stop(error: String? = nil) {
    watchdog?.cancel(); watchdog = nil
    if installedTap { engine.inputNode.removeTap(onBus: 0); installedTap = false }
    engine.stop()
    if started { try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation); started = false }
    queue.async { [self] in
      guard key != nil else { return }
      if accepting { encrypt(pending) }
      accepting = false; pending.resetBytes(in: 0..<pending.count); pending.removeAll(); key = nil
      var result: [String: Any] = ["id": id]
      if let error { result["error"] = error }
      emit("stopped", result)
    }
  }
}
