# OML Alexandria Extension for Visual Studio Code

[![Release](https://img.shields.io/github/v/release/0x65-e/oml-alexandria?label=release&logo=github&style=flat-square)](https://github.com/0x65-e/oml-alexandria/releases/latest)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/pteam-ptolemy.oml-alexandria?logo=visualstudiocode&color=informational&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=pteam-ptolemy.oml-alexandria)
[![License](https://img.shields.io/github/license/0x65-e/oml-alexandria?logo=apache&style=flat-square)](https://www.apache.org/licenses/LICENSE-2.0.html)
[![Build Status](https://img.shields.io/github/actions/workflow/status/0x65-e/oml-alexandria/linter.yml?branch=main&logo=github&style=flat-square)](https://github.com/0x65-e/oml-alexandria/actions/workflows/linter.yml)

A proof-of-concept extension to support [OML](https://opencaesar.github.io/oml) in [VSCode](https://code.visualstudio.com/)-compatible IDEs. Unlike [OML Luxor](https://github.com/opencaesar/oml-luxor/), this extension is designed from the ground up to support web-based IDEs by running the language server through the extension instead of requiring a separate executable.

## Getting Started

Install [nvm](https://github.com/creationix/nvm#install-script):

```shell
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

Install `npm` and `node`:

```shell
  nvm install latest
  nvm use latest
```

Install `yarn`:
```shell
  npm install -g yarn
```

Install `vsce` if you plan on packaging the extension:
```shell
  npm install -g @vscode/vsce
```

## Clone the repository

```shell
  git clone --recurse-submodules https://github.com/0x65-e/oml-alexandria.git
  cd oml-alexandria
```

## Build

```shell
  npm install
  npm run build
```

This will build the development extension for debugging.

If you'd like to build the production packaged extension, run:
```shell
  vsce package --no-yarn
```

This will build the `oml-alexandria-<version>.vsix` extension file.

You can clean up the build artifacts using ```npm run clean```.

## Install in VSCode

You can install the vsix file by searching for "OML Luxor" in the Extensions Marketplace or manually through the Extensions tab. If a previous version of the extension is already installed, uninstall it first.

## Install in Gitpod or GitHub Codespaces

Launch your repo with [gitpod.io](https://www.gitpod.io/) or [GitHub Codespaces](https://github.com/features/codespaces), then open the Extension area to drag and drop the vsix file to install it. If a previous version of the extension is already installed, uninstall it first.

## Support for [vscode.dev](https://vscode.dev)

OML Alexandria is not a web extension, and is not compatible with [vscode.dev](https://vscode.dev) (which includes [github.dev](https://github.dev) and any other VS Code for the Web instance).

## OML Version

| Alexandria | OML |
|------------|-----|
| 0.0.2      | 1.4.1 |
| 0.0.1      | 1.4.0 |

## License

See [LICENSE](./LICENSE).
