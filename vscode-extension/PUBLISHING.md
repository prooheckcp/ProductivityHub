# Publishing this extension

## Just for yourself? Skip publishing entirely

Since this is meant to feed your own Shiba Track app, you don't need the
Marketplace at all — build the package and install it directly:

```bash
cd vscode-extension
npm install
npm run package        # runs vsce package → shiba-track-coding-tracker-<version>.vsix
```

Then in VS Code: **Extensions panel → `···` menu → Install from VSIX...** and
pick the `.vsix` file. Done — no publisher account, no login, nothing public.
Re-run these two commands and reinstall the `.vsix` whenever you change the
extension.

The rest of this file covers actually publishing it to the public VS Code
Marketplace, if you ever want to.

## 1. Create a publisher

1. Go to https://marketplace.visualstudio.com/manage and sign in with a
   Microsoft account.
2. Click **Create publisher**, pick an id (this becomes the `publisher` field
   in `package.json` — lowercase, no spaces, e.g. `prooheckcp`).
3. `package.json` already has `"publisher": "VascoSoares"` set — make sure
   that matches the publisher id you created exactly (case-sensitive).

## 2. Get a Personal Access Token (PAT)

The Marketplace is built on Azure DevOps, so publishing needs an Azure DevOps
PAT, not your Microsoft password:

1. Go to https://dev.azure.com, sign in with the **same** Microsoft account.
2. Create an organization if you don't have one yet (any name works, it's
   unrelated to the extension).
3. Click your profile icon (top right) → **Personal access tokens** → **New
   Token**.
4. Set **Organization** to "All accessible organizations", and under
   **Scopes** pick **Custom defined** → check **Marketplace → Manage**.
5. Copy the generated token now — Azure DevOps only shows it once.

## 3. Install the publishing CLI and log in

```bash
npm install -g @vscode/vsce   # or just use `npx vsce ...` without installing globally
vsce login VascoSoares
```

Paste the PAT when prompted. This only needs to be done once per machine (the
token is cached).

## 4. Package and test locally first

```bash
cd vscode-extension
npm install
npm run compile
npx vsce package
```

This produces `shiba-track-coding-tracker-<version>.vsix`. Install it via
**Install from VSIX...** in VS Code and actually try it before publishing —
once published, a broken version is visible to anyone who searches.

## 5. Publish

```bash
npx vsce publish
```

This publishes exactly the version currently in `package.json`. To bump the
version and publish in one step instead:

```bash
npx vsce publish patch   # 0.1.0 -> 0.1.1
npx vsce publish minor   # 0.1.0 -> 0.2.0
npx vsce publish major   # 0.1.0 -> 1.0.0
```

It can take a few minutes to show up on the Marketplace after publishing.

## 6. Updating later

Bump the version (either by hand in `package.json` or via `vsce publish
patch/minor/major` as above) and publish again — there's no separate
"update" command, publishing a new version replaces the listing's current
version.

## Notes

- **Icon**: already set (`icon.png`, copied from the main app's icon).
  Marketplace requires at least 128x128; this one is 512x512, which is fine
  but on the large side for a VS Code extension icon — feel free to swap in a
  smaller/dedicated icon later.
- **README.md**: becomes the Marketplace listing page verbatim. Keep it
  accurate — it's the first (only) thing people see before installing.
- **LICENSE**: not included yet. Add a `LICENSE` file before publishing
  publicly if you want the listing to show a license (currently `vsce
  package` just warns about this, it doesn't block packaging).
- **repository field**: `package.json` doesn't have one yet, so `vsce`
  warns about it. Add a `"repository"` field pointing at wherever this code
  lives on GitHub/GitLab if you want the Marketplace listing to link back to
  the source and correctly resolve any relative links in the README.
- Unpublishing or transferring ownership is done from the same
  https://marketplace.visualstudio.com/manage page as step 1.
