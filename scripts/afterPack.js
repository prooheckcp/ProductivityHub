// electron-builder afterPack hook.
//
// We don't have an Apple Developer certificate, so electron-builder skips
// signing (mac.identity is null). But Apple Silicon REQUIRES every arm64 app to
// carry at least an ad-hoc signature, or macOS reports it as "damaged" on any
// machine other than the one that built it. So we ad-hoc sign the packed .app
// here (runs after packing, before the DMG is assembled) with `codesign --sign -`.
//
// This makes the app runnable on other Macs (after clearing quarantine or using
// right-click → Open). It is NOT notarization — for hassle-free distribution
// you'd still need a paid Developer ID + notarization.
const { execFileSync } = require('child_process')
const path = require('path')

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)

  // Sign nested code first, then the bundle, with the ad-hoc identity ("-").
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath], {
    stdio: 'inherit'
  })
  console.log(`  • ad-hoc signed ${appPath}`)
}
