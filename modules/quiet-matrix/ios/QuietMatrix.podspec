Pod::Spec.new do |s|
  s.name = 'QuietMatrix'
  s.version = '1.1.0'
  s.summary = 'Native Beeper account and Instagram inbox for Quiet'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Quiet contributors'
  s.homepage = 'https://github.com/Bobsfun11/Quiet-iphone'
  s.source = { :git => 'https://github.com/Bobsfun11/Quiet-iphone.git' }
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.static_framework = true
  s.source_files = '**/*.swift'
  s.dependency 'ExpoModulesCore'

  spm_dependency(s,
    url: 'https://github.com/matrix-org/matrix-rust-components-swift.git',
    requirement: { kind: 'exactVersion', version: '26.11.11' },
    products: ['MatrixRustSDK'])
end
