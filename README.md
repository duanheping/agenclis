[![English](https://img.shields.io/badge/README-English-1f6feb)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-1f6feb)](./README.zh-CN.md)
[![Français](https://img.shields.io/badge/README-Fran%C3%A7ais-1f6feb)](./README.fr.md)
[![Español](https://img.shields.io/badge/README-Espa%C3%B1ol-1f6feb)](./README.es.md)
[![日本語](https://img.shields.io/badge/README-%E6%97%A5%E6%9C%AC%E8%AA%9E-1f6feb)](./README.ja.md)
[![한국어](https://img.shields.io/badge/README-%ED%95%9C%EA%B5%AD%EC%96%B4-1f6feb)](./README.ko.md)

# Agent CLIs

Agent CLIs is a Windows desktop manager for multiple local Agent CLI sessions.
The left sidebar organizes projects and sessions, while the main area shows the
interactive terminal for the currently active session.

## Features

- Electron + React + TypeScript desktop application
- Create projects first, then add sessions when needed
- Sidebar flows for creating, switching, renaming, and closing sessions
- Dedicated `xterm.js` terminal surface for each session
- `node-pty` PTY management in the Electron main process
- Session state persisted under `%APPDATA%` and restored on relaunch
- Prefers `pwsh.exe` on Windows and falls back to `powershell.exe`

## Scripts

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run dist
```

## Build Output

- App bundles:
  - `dist/`
  - `dist-electron/`
- Windows installer:
  - `release/Agent CLIs-0.1.0-Setup.exe`

## Windows Packaging Notes

- The current packaging config uses `npmRebuild: false` and relies on the
  prebuilt Windows binaries bundled with `node-pty`, so `npm run dist` can run
  without Visual Studio Build Tools.
- If you need to rebuild native modules manually, run:

```bash
npm run rebuild
```

- `npm run rebuild` requires Visual Studio Build Tools. Otherwise `node-gyp`
  will fail because the MSVC toolchain is unavailable.
