[![English](https://img.shields.io/badge/README-English-1f6feb)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-1f6feb)](./README.zh-CN.md)
[![Français](https://img.shields.io/badge/README-Fran%C3%A7ais-1f6feb)](./README.fr.md)
[![Español](https://img.shields.io/badge/README-Espa%C3%B1ol-1f6feb)](./README.es.md)
[![日本語](https://img.shields.io/badge/README-%E6%97%A5%E6%9C%AC%E8%AA%9E-1f6feb)](./README.ja.md)
[![한국어](https://img.shields.io/badge/README-%ED%95%9C%EA%B5%AD%EC%96%B4-1f6feb)](./README.ko.md)

# Agent CLIs

Agent CLIs は、複数のローカル Agent CLI セッションを管理するための
Windows デスクトップマネージャーです。左側のサイドバーでプロジェクトと
セッションを整理し、メイン領域には現在アクティブなセッションの対話型
ターミナルを表示します。

## 機能

- Electron + React + TypeScript によるデスクトップアプリ
- まずプロジェクトを作成し、必要になったらセッションを追加
- サイドバーからセッションの作成、切り替え、名前変更、終了が可能
- セッションごとに専用の `xterm.js` ターミナル画面を提供
- Electron メインプロセスで `node-pty` による PTY 管理を実施
- セッション状態を `%APPDATA%` に保存し、再起動時に復元
- Windows では `pwsh.exe` を優先し、なければ `powershell.exe` にフォールバック

## スクリプト

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run dist
```

## ビルド出力

- アプリのビルド成果物:
  - `dist/`
  - `dist-electron/`
- Windows インストーラー:
  - `release/Agent CLIs-0.1.0-Setup.exe`

## Windows パッケージングに関する注意

- 現在のパッケージ設定は `npmRebuild: false` を使用しており、
  `node-pty` に含まれる Windows 向けの事前ビルド済みバイナリを利用するため、
  `npm run dist` は Visual Studio Build Tools なしでも実行できます。
- ネイティブモジュールを手動で再ビルドする必要がある場合は、次を実行してください。

```bash
npm run rebuild
```

- `npm run rebuild` には Visual Studio Build Tools が必要です。
  ない場合、MSVC ツールチェーンが見つからず `node-gyp` が失敗します。
