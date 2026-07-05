# How the .vsix Is Created

A `.vsix` file is the actual installable package format for VS Code extensions. It's technically a zip archive internally, but it's built and named as `.vsix` from the start — nothing gets "converted" from one format to another. Here's the real pipeline, start to finish.

## The source code (what you actually edit)

- `src/*.ts` — the TypeScript source (`activity.ts`, `constants.ts`, `util.ts`, etc.)
- `assets/icon.png` — the Extensions-panel icon
- `assets/icons/*.png` — reference copies of the Discord Rich Presence images
- `package.json` — the extension's manifest: name, publisher, version, icon path, settings, etc.

None of these files are directly installable on their own — TypeScript can't run in VS Code as-is, and a folder of loose files isn't a package.

## Step 1 — Bundle the code

```

node esbuild.mjs

```

This reads all the `src/*.ts` files, resolves every `import`, and squashes everything into one runnable file: `dist/extension.cjs`. This is the file VS Code actually executes. Nothing about packaging happens yet — this step only prepares the code.

## Step 2 — Package it into a .vsix

```

npx vsce package --no-dependencies

```

`vsce` (Microsoft's official "Visual Studio Code Extensions" tool) is what actually makes the `.vsix`. It:

1. Reads `package.json` for the extension's identity (`name`, `publisher`, `version`, `icon`, etc.) — the output filename (e.g. `discord-vscode-custom-5.9.6.vsix`) comes straight from `name` + `version`.
2. Reads `.vscodeignore` to see what to _exclude_ (`node_modules`, `src`, dev-only config files).
3. Gathers what's left: `dist/extension.cjs`, `assets/icon.png`, `LICENSE.txt`, `readme.md`.
4. Zips it all into one archive and writes it out as the `.vsix`.

You can unzip a `.vsix` with any archive tool and see this inside:

```

discord-vscode-custom-5.9.6.vsix
├── extension.vsixmanifest    (identity info VS Code reads on install)
└── extension/
├── package.json
├── assets/icon.png
└── dist/extension.cjs

```

## Step 3 — Install it

```

code --install-extension discord-vscode-custom-5.9.6.vsix

```

`code` is VS Code's command-line launcher. `--install-extension` tells it "install this package," not "open this file." VS Code unzips it internally and copies the contents into its own extensions folder.

## Why the version number matters

VS Code treats a `.vsix` reinstall with an **identical** version number as a no-op — it assumes nothing changed and keeps whatever was already installed. That's why every rebuild here bumps `version` in `package.json` first (`5.9.2` → `5.9.6`) — otherwise VS Code silently ignores the update.

## The automated version

`.github/workflows/build-vsix.yml` runs this same two-step pipeline automatically on every push to `main`, then uploads the result to a GitHub Release — so there's always a current build available without running these commands by hand.
