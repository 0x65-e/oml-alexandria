# OML Alexandria Extension

[![Release](https://img.shields.io/github/v/release/0x65-e/oml-alexandria?label=release)](https://github.com/0x65-e/oml-alexandria/releases/latest)

A proof-of-concept extension to support [OML](https://opencaesar.github.io/oml) in VSCode-based IDEs. Unlike [OML Luxor](https://github.com/opencaesar/oml-luxor/), this is designed from the ground up to support web-based IDEs by running the language server through the extension instead of requiring a separate executable.

## Getting Started

Install [nvm](https://github.com/creationix/nvm#install-script):

```shell
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash
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
yarn install
yarn run build
yarn run package
```

This will build the `oml-alexandria-<version>.vsix` extension file.

## Install in VSCode

You can install the vsix file manually through the Extensions tab. If a previous version of the extension is already installed, uninstall it first.

## Install in Gitpod.io

Launch your repo with [gitoid.io](https://www.gitpod.io/), then open the Extension area to drag and drop the vsix file to install it. If a previous version of the extension is already installed, uninstall it first.

## OML Version

| Alexandria | OML |
|------------|-----|
| 0.0.1      | 1.4.0 |
