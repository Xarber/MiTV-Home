# SPDX-License-Identifier: AGPL-3.0-only
Pod::Spec.new do |s|
  s.name = 'AureaMicrophone'
  s.version = '1.0.0'
  s.summary = 'In-memory encrypted microphone capture for Aurea Remote'
  s.description = s.summary
  s.license = { :type => 'AGPL-3.0-only' }
  s.author = 'Aurea contributors'
  s.homepage = 'https://github.com/Xarber/MiTV-Home'
  s.source = { :git => 'https://github.com/Xarber/MiTV-Home.git' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'Security', 'CryptoKit'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
