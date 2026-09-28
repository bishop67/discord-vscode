# Discord Presence

## Features

- Shows what you are editing in VSCode
- Support for over 200+ of the most popular languages
- Enable/Disable Rich Presence for individual workspaces (enabled by default)
- Custom string support
- Stable or Insiders build detection
- Debug mode detection
- Easily manually reconnect to Discord

## Use your own Discord app

Want your own name and images on the card?

1. Create an application at [discord.com/developers/applications](https://discord.com/developers/applications). Its name is what shows after "Playing".
2. Optionally upload images under **Rich Presence → Art Assets**, named after the ones they replace: `idle-vscode`, `vscode`, `debugging`, or a language icon like `ts` or `js` (names are in `src/data/languages.json`). Anything you don't upload keeps the default image.
3. Copy the **Application ID** into the `discord.clientId` setting.

## Build

```
pnpm install
node esbuild.mjs
pnpm exec vsce package --no-dependencies
code --install-extension discord-vscode-custom-<version>.vsix
```

## Troubleshooting

**Windows:** Do not run your VSCode or Discord as admin, there is no reason to and it just further complicates everything down the line.

**Linux:** Discord versions installed using `flatpak` or `snap` need modifications in order to support IPC. In order to avoid this (and as Discord itself suggests) you should download it from [discord.com](https://discord.com/download)

References:  
https://github.com/flathub/com.discordapp.Discord/issues/29  
https://github.com/iCrawl/discord-vscode/issues/77#issuecomment-435622205  
https://github.com/iCrawl/discord-vscode/issues/85#issuecomment-417895483

## Contributing

1. [Fork the repository](https://github.com/iCrawl/discord-vscode/fork)!
2. Clone your fork: `git clone https://github.com/your-username/discord-vscode.git`
3. Create your feature branch: `git checkout -b my-new-feature`
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request :D

## Author

**Discord Presence** © [iCrawl](https://github.com/iCrawl).  
Authored and maintained by iCrawl.

> GitHub [@iCrawl](https://github.com/iCrawl)
