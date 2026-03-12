[![English](https://img.shields.io/badge/README-English-1f6feb)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-1f6feb)](./README.zh-CN.md)
[![Français](https://img.shields.io/badge/README-Fran%C3%A7ais-1f6feb)](./README.fr.md)
[![Español](https://img.shields.io/badge/README-Espa%C3%B1ol-1f6feb)](./README.es.md)
[![日本語](https://img.shields.io/badge/README-%E6%97%A5%E6%9C%AC%E8%AA%9E-1f6feb)](./README.ja.md)
[![한국어](https://img.shields.io/badge/README-%ED%95%9C%EA%B5%AD%EC%96%B4-1f6feb)](./README.ko.md)

# Agent CLIs

Agent CLIs est un gestionnaire de bureau Windows pour plusieurs sessions Agent
CLI locales. La barre latérale de gauche organise les projets et les sessions,
tandis que la zone principale affiche le terminal interactif de la session
active.

## Fonctionnalités

- Application de bureau Electron + React + TypeScript
- Créer d'abord des projets, puis ajouter des sessions selon les besoins
- Flux dans la barre latérale pour créer, changer, renommer et fermer des sessions
- Surface de terminal `xterm.js` dédiée pour chaque session
- Gestion des PTY `node-pty` dans le processus principal Electron
- État des sessions persisté dans `%APPDATA%` et restauré au redémarrage
- Utilise `pwsh.exe` en priorité sous Windows et revient sur `powershell.exe`

## Scripts

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run dist
```

## Sortie de Build

- Bundles de l'application :
  - `dist/`
  - `dist-electron/`
- Installeur Windows :
  - `release/Agent CLIs-0.1.0-Setup.exe`

## Notes de Packaging Windows

- La configuration actuelle utilise `npmRebuild: false` et s'appuie sur les
  binaires Windows précompilés fournis avec `node-pty`, donc `npm run dist`
  peut être exécuté sans Visual Studio Build Tools.
- Si vous devez reconstruire les modules natifs manuellement, exécutez :

```bash
npm run rebuild
```

- `npm run rebuild` nécessite Visual Studio Build Tools. Sinon, `node-gyp`
  échouera faute de chaîne d'outils MSVC disponible.
