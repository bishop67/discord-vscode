# What's Different From the Original iCrawl Extension

This is a personal fork of [iCrawl/discord-vscode](https://github.com/iCrawl/discord-vscode) ("Discord Presence"). It keeps 100% of the original functionality — every programming language icon, git integration, idle detection, all existing settings — and adds a personal branding/customization layer on top.

## Identity

|                       | Original                                           | This fork                                        |
| --------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Publisher             | `icrawl`                                           | `bishop-local`                                   |
| Extension name        | `discord-vscode`                                   | `discord-vscode-custom`                          |
| Display name          | "Discord Presence"                                 | "Discord Presence (Custom)"                      |
| Extensions-panel icon | Blue circular puppy logo                           | Custom pixel-art artwork                         |
| Discord Client ID     | iCrawl's shared application (`383226320970055681`) | A separate, personally-owned Discord Application |

**Why the identity had to change:** VS Code merges in the real Marketplace listing's cached icon, install count, and star rating for any extension whose publisher+name matches an existing published one — even when a completely different `.vsix` is installed locally. Renaming both fields was necessary just to get the custom icon to actually display, and as a side effect this build is now unambiguously a separate thing from the original.

**Why the Client ID had to change:** Discord Rich Presence images are looked up from Discord's servers by application, not shipped inside the extension. Showing custom images (instead of the original VS Code/language icons) requires owning the Discord Application they're uploaded to.

## New feature: rotating status images

The original extension shows one fixed image per situation — always the same "vscode" logo badge, always the same "idle-vscode" image when idle.

This fork adds a rotation system (`pickRotatingImageKey()` in `util.ts`): each situation now has a **pool of images**, and the pool advances one step every 30 seconds on its own timer:

- **Idling** (no file open): cycles a 3-image pool
- **Editing a file**: language icon (unchanged) + a cycling 3-image "active" pool, shown together
- **Debugging**: cycles its own 3-image pool

Rotation is driven by a shared tick rather than a random draw per status update, so every image in one update advances together, each variant gets equal screen time, and the icon keeps moving whether or not you happen to be typing. Base keys with no uploaded variants (currently `cursor` and `vscode-insiders`) stay on their single static image, because asking Discord for an asset that was never uploaded makes it render no image at all.

This is entirely new code — nothing like it exists in the original project.

## New feature: user-supplied images

The rotating pools above resolve to asset keys that live inside this fork's Discord Application, so only its owner can change them. To let anyone use their own artwork without touching the Discord Developer Portal, this fork also accepts plain image URLs, which Discord's RPC supports directly:

| Setting                            | Effect                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| `discord.customLargeImage`         | One image URL for the large card image                          |
| `discord.customSmallImage`         | One image URL for the small corner badge                        |
| `discord.customLargeImageRotation` | A list of image URLs, cycled in the large slot every 30 seconds |
| `discord.customSmallImageRotation` | A list of image URLs, cycled in the small slot every 30 seconds |

Precedence per slot is **rotation list → single custom image → built-in key**. Supplying two or more URLs is itself the opt-in to cycle them, so the rotation lists work independently of `discord.useRotatingIcon`, which only governs the bundled pools. Custom images share the same tick as the bundled ones, so everything advances in step.

URLs must be `http(s)` and end in `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, or `.avif` (query strings are fine). Entries that do not qualify are skipped rather than blanking the slot, and each bad value is reported once in the **Discord Presence** output channel — previously an unusable URL was dropped silently and looked identical to having set nothing at all.

## Preserved from the original (unchanged)

- All ~200 programming language icons and the logic that picks between them
- Git repository button/link detection
- Idle timeout detection
- The "Swap Big And Small Image" setting (which image is the large card vs. the small corner badge) — the original already had this; this fork just makes sure the rotating images respect it too
- All existing user-facing settings (details text, lower details text, timestamps, etc.)

## Fixed: a pre-existing bug in the original

The original repo's `REPLACE_KEYS` enum has one member (`CurrentErrors`) appended out of alphabetical order, which trips their own `typescript-sort-keys/string-enum` lint rule. This means the original repo's own CI is red at the commit this fork is based on. This fork fixes the ordering — purely a lint fix, no behavior change, but it means this fork's CI passes where the original's currently doesn't.

## New: automated build & release pipeline

The original project has no automated `.vsix` distribution outside the official Marketplace listing. This fork adds `.github/workflows/build-vsix.yml`, which automatically rebuilds and publishes the `.vsix` to a standing "latest" GitHub Release on every push to `main` — so anyone can grab a current build without needing Marketplace publishing or building it by hand.

## Summary

| Category                                      | Status                                 |
| --------------------------------------------- | -------------------------------------- |
| Core Rich Presence functionality              | Unchanged                              |
| Language icon detection                       | Unchanged                              |
| Visual identity (icon, images, app ownership) | Fully customized                       |
| Status image behavior                         | New: timed rotation per situation      |
| User-supplied images                          | New: single or rotating image URLs     |
| CI health                                     | Improved (pre-existing bug fixed)      |
| Distribution                                  | New: automated GitHub Release pipeline |
