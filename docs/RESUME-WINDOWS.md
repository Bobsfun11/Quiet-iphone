# Build Quiet for iPhone from Windows

The previous 1.0.0 source produced a verified arm64 iPhone IPA in [run 43264445242](https://github.com/Bobsfun11/Quiet-iphone/actions/runs/43264445242). That build contains the earlier integrations. Use a successful build of the revised source for the filtered YouTube website and system appearance support. [Public source repository](https://github.com/Bobsfun11/Quiet-iphone)

1. Publish the source revision to the existing public repository.
2. Open **Actions → Build iPhone IPA for Windows signing → Run workflow** and select the branch containing the revision. The workflow uses the standard `macos-26` hosted runner in the public repository.
3. Wait for the run to succeed. If compilation fails, consult the run log or the `Quiet-native-build-log` artifact.
4. Download **Quiet-unsigned-iPhone** from the successful run and extract `Quiet-unsigned.ipa` and its checksum. GitHub retains the artifact for three days.
5. Run `python scripts/verify-ipa.py path/to/Quiet-unsigned.ipa` and compare its SHA-256 with the supplied checksum.
6. Use AltStore Classic and AltServer to sign the IPA with your free Apple account. [Windows installation](WINDOWS-INSTALL.md)
7. Check the updated build on the iPhone. [Device checklist](DEVICE-CHECKLIST.md)

Use your local AltStore or AltServer dialog for Apple sign-in and the iPhone for Trust and Developer Mode prompts. The workflow builds an unsigned app and requires no Apple or Expo credentials.
