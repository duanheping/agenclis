[![English](https://img.shields.io/badge/README-English-1f6feb)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-1f6feb)](./README.zh-CN.md)
[![Français](https://img.shields.io/badge/README-Fran%C3%A7ais-1f6feb)](./README.fr.md)
[![Español](https://img.shields.io/badge/README-Espa%C3%B1ol-1f6feb)](./README.es.md)
[![日本語](https://img.shields.io/badge/README-%E6%97%A5%E6%9C%AC%E8%AA%9E-1f6feb)](./README.ja.md)
[![한국어](https://img.shields.io/badge/README-%ED%95%9C%EA%B5%AD%EC%96%B4-1f6feb)](./README.ko.md)

# Agent CLIs

Agent CLIs 是一个用于管理多个本地 Agent CLI 会话的 Windows 桌面应用。
左侧边栏用于组织项目和会话，右侧区域显示当前活动会话的交互式终端。

## 功能

- 基于 Electron + React + TypeScript 构建
- 可以先创建项目，再按需添加会话
- 左侧边栏支持新建、切换、重命名和关闭会话
- 每个会话都有独立的 `xterm.js` 终端界面
- Electron 主进程通过 `node-pty` 管理各个会话的 PTY
- 会话状态会持久化到 `%APPDATA%`，并在应用重启后恢复
- Windows 下优先使用 `pwsh.exe`，不存在时回退到 `powershell.exe`

## 常用命令

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run dist
```

## 构建输出

- 应用构建产物：
  - `dist/`
  - `dist-electron/`
- Windows 安装包：
  - `release/Agent CLIs-0.1.0-Setup.exe`

## Windows 打包说明

- 当前打包配置使用 `npmRebuild: false`，直接依赖 `node-pty` 自带的
  Windows 预编译二进制，因此 `npm run dist` 不要求预先安装
  Visual Studio Build Tools。
- 如果你需要手动重建原生模块，请运行：

```bash
npm run rebuild
```

- `npm run rebuild` 需要本机安装 Visual Studio Build Tools，否则
  `node-gyp` 会因为缺少 MSVC 工具链而失败。
