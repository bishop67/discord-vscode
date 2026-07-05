# What's Different From the Original iCrawl Extension

This is a personal fork of [iCrawl/discord-vscode](https://github.com/iCrawl/discord-vscode)
("Discord Presence"). It keeps 100% of the original functionality — every
programming language icon, git integration, idle detection, all existing
settings — and adds a personal branding/customization layer on top.

## Identity

| | Original | This fork |
|---|---|---|
| Publisher | `icrawl` | `bishop-local` |
| Extension name | `discord-vscode` | `discord-vscode-custom` |
| Display name | "Discord Presence" | "Discord Presence (Custom)" |
| Extensions-panel icon | Blue circular puppy logo | Custom pixel-art artwork |
| Discord Client ID | iCrawl's shared application (`383226320970055681`) | A separate, personally-owned Discord Application |

**Why the identity had to change:** VS Code merges in the real Marketplace
listing's cached icon, install count, and star rating for any extension
whose publisher+name matches an existing published one — even when a
completely different `.vsix` is installed locally. Renaming both fields
was necessary just to get the custom icon to actually display, and as a
side effect this build is now unambiguously a separate thing from the
original, never confusable with it.

**Why the Client ID had to change:** Discord Rich Presence images are
looked up from Discord's servers by application, not shipped inside the
extension. Showing custom images (instead of the original VS Code/language
icons) requires owning the Discord Application they're uploaded to.

## New feature: rotating status images

The original extension shows one fixed image per situation — always the
same "vscode" logo badge, always the same "idle-vscode" image when idle.

This fork adds a rotation system (`pickRotatingImageKey()` in `util.ts`):
each situation now has a **pool of images**, and one is picked at random
every time the status updates:

- **Idling** (no file open): random pick from a 3-image pool
- **Editing a file**: language icon (unchanged) + a random pick from a
  3-image "active" pool, shown together
- **Debugging**: random pick from its own 3-image pool

This is entirely new code — nothing like it exists in the original project.

## Preserved from the original (unchanged)

- All ~200 programming language icons and the logic that picks between them
- Git repository button/link detection
- Idle timeout detection
- The "Swap Big And Small Image" setting (which image is the large card vs.
  the small corner badge) — the original already had this; this fork just
  makes sure the rotating images respect it too
- All existing user-facing settings (details text, lower details text,
  timestamps, etc.)

## Fixed: a pre-existing bug in the original

The original repo's `REPLACE_KEYS` enum has one member (`CurrentErrors`)
appended out of alphabetical order, which trips their own
`typescript-sort-keys/string-enum` lint rule. This means the original
repo's own CI is red at the commit this fork is based on. This fork fixes
the ordering — purely a lint fix, no behavior change, but it means this
fork's CI passes where the original's currently doesn't.

## New: automated build & release pipeline

The original project has no automated `.vsix` distribution outside the
official Marketplace listing. This fork adds
`.github/workflows/build-vsix.yml`, which automatically rebuilds and
publishes the `.vsix` to a standing "latest" GitHub Release on every push
to `main` — so anyone can grab a current build without needing Marketplace
publishing or building it by hand.

## Summary

| Category                                      | Status                                    |
|-----------------------------------------------|-------------------------------------------|
| Core Rich Presence functionality              | Unchanged                                 |
| Language icon detection                       | Unchanged                                 |
| Visual identity (icon, images, app ownership) | Fully customized                          |
| Status image behavior                         | New: random rotation per situation        |
| CI health                                     | Improved (pre-existing bug fixed)         |
| Distribution                                  | New: automated GitHub Release pipeline    |


4. Add a small notice at the very top of your README.md (right after the # Discord Presence title), so people see it's a fork:
markdown> **This is a personal customized fork** by [@bishop076](https://github.com/bishop076), based on
> the original [iCrawl/discord-vscode](https://github.com/iCrawl/discord-vscode).
> It keeps all original functionality and adds custom status images, a
> rotating-image system, and its own Discord Application.
>
> - [What's different from the original, and what's improved](docs/CUSTOMIZATIONS.md)
> - [How the .vsix is built](docs/BUILDING.md)
> - [Latest release / download](../../releases)
5. Commit and push
git add docs README.md
git commit -m "Add fork documentation"
git push