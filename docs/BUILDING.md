# How the .vsix Is Created

A `.vsix` file is the actual installable package format for VS Code
extensions. It's technically a zip archive internally, but it's built and
named as `.vsix` from the start — nothing gets "converted" from one format
to another. Here's the real pipeline, start to finish.

## The source code (what you edit)

Everything you actually write or change lives in:

- `src/*.ts` — the TypeScript source (activity.ts, constants.ts, util.ts, etc.)
- `assets/icon.png` — the Extensions-panel icon
- `assets/icons/*.png` — reference copies of the Discord Rich Presence images
- `package.json` — the extension's manifest: name, publisher, version, icon
  path, settings it exposes, VS Code API version it targets, etc.

None of these files are directly installable on their own. TypeScript can't
run in VS Code as-is, and a folder of loose files isn't a package.

## Step 1 — Bundle the code
dist/extension.cjs

This is the file VS Code actually executes at runtime. Nothing about
packaging happens yet — this step only prepares the runnable code.

## Step 2 — Package it into a .vsix
npx vsce package --no-dependencies

`vsce` ("**V**isual **S**tudio Code **E**xtensions" tool) is Microsoft's
official packaging CLI. This is the command that actually produces the
`.vsix`. It does roughly this:

1. Reads `package.json` to determine the extension's identity — its
   `name`, `publisher`, `version`, `displayName`, `icon` path, and so on.
   The output filename (`discord-vscode-custom-5.9.6.vsix`) comes directly
   from `name` + `version` in this file.
2. Decides which files to include by reading `.vscodeignore` — this file
   lists what to *exclude* (e.g. `node_modules`, `src`, `assets/icons`,
   config files that only matter for development, not runtime).
3. Gathers everything left over: `dist/extension.cjs`, `assets/icon.png`,
   `LICENSE.txt`, `readme.md`, and the manifest.
4. Zips it all into one archive and writes it out as the `.vsix` file.

You can literally unzip a `.vsix` with any archive tool and see this
structure inside:
discord-vscode-custom-5.9.6.vsix

├── [Content_Types].xml       (internal zip metadata)
├── extension.vsixmanifest    (identity info VS Code reads on install)
└── extension/
├── package.json
├── LICENSE.txt
├── readme.md
├── assets/
│   └── icon.png
└── dist/
└── extension.cjs

## Step 3 — Install it
code --install-extension discord-vscode-custom-5.9.6.vsix

`code` is VS Code's command-line launcher. The `--install-extension` flag
tells it "the next argument is a package to install," not a folder/file to
open. VS Code unzips the `.vsix` internally and copies its contents into
its own extensions directory.

## Why the version number matters

VS Code treats a `.vsix` reinstall with an **identical** version number
(from `package.json`) as a no-op — it assumes nothing changed and silently
keeps whatever was already installed. This is why every rebuild in this
project bumped the version (`5.9.2` → `5.9.3` → ... → `5.9.6`): it forces
VS Code to actually recognize and load the new build.

## The automated version (GitHub Actions)

`.github/workflows/build-vsix.yml` runs this exact same two-command
pipeline (`node esbuild.mjs` then `npx vsce package`) automatically on
every push to `main`, then uploads the resulting `.vsix` to a GitHub
Release — so there's always a current, downloadable build without anyone
needing to run these commands by hand.