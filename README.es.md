[![English](https://img.shields.io/badge/README-English-1f6feb)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-1f6feb)](./README.zh-CN.md)
[![Français](https://img.shields.io/badge/README-Fran%C3%A7ais-1f6feb)](./README.fr.md)
[![Español](https://img.shields.io/badge/README-Espa%C3%B1ol-1f6feb)](./README.es.md)
[![日本語](https://img.shields.io/badge/README-%E6%97%A5%E6%9C%AC%E8%AA%9E-1f6feb)](./README.ja.md)
[![한국어](https://img.shields.io/badge/README-%ED%95%9C%EA%B5%AD%EC%96%B4-1f6feb)](./README.ko.md)

# Agent CLIs

Agent CLIs es un administrador de escritorio para Windows que gestiona varias
sesiones locales de Agent CLI. La barra lateral izquierda organiza proyectos y
sesiones, mientras que el área principal muestra el terminal interactivo de la
sesión activa.

## Funciones

- Aplicación de escritorio con Electron + React + TypeScript
- Crea primero proyectos y agrega sesiones cuando las necesites
- Flujos en la barra lateral para crear, cambiar, renombrar y cerrar sesiones
- Superficie de terminal `xterm.js` dedicada para cada sesión
- Gestión de PTY con `node-pty` en el proceso principal de Electron
- Estado de las sesiones persistido en `%APPDATA%` y restaurado al reiniciar
- Usa `pwsh.exe` primero en Windows y vuelve a `powershell.exe` si hace falta

## Scripts

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run dist
```

## Salida de Build

- Paquetes de la aplicación:
  - `dist/`
  - `dist-electron/`
- Instalador de Windows:
  - `release/Agent CLIs-0.1.0-Setup.exe`

## Notas de Empaquetado para Windows

- La configuración actual usa `npmRebuild: false` y depende de los binarios de
  Windows precompilados incluidos con `node-pty`, por lo que `npm run dist`
  puede ejecutarse sin Visual Studio Build Tools.
- Si necesitas reconstruir los módulos nativos manualmente, ejecuta:

```bash
npm run rebuild
```

- `npm run rebuild` requiere Visual Studio Build Tools. De lo contrario,
  `node-gyp` fallará porque no habrá una cadena de herramientas MSVC disponible.
