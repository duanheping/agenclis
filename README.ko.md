[![English](https://img.shields.io/badge/README-English-1f6feb)](./README.md)
[![简体中文](https://img.shields.io/badge/README-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-1f6feb)](./README.zh-CN.md)
[![Français](https://img.shields.io/badge/README-Fran%C3%A7ais-1f6feb)](./README.fr.md)
[![Español](https://img.shields.io/badge/README-Espa%C3%B1ol-1f6feb)](./README.es.md)
[![日本語](https://img.shields.io/badge/README-%E6%97%A5%E6%9C%AC%E8%AA%9E-1f6feb)](./README.ja.md)
[![한국어](https://img.shields.io/badge/README-%ED%95%9C%EA%B5%AD%EC%96%B4-1f6feb)](./README.ko.md)

# Agent CLIs

Agent CLIs는 여러 로컬 Agent CLI 세션을 관리하기 위한 Windows 데스크톱
매니저입니다. 왼쪽 사이드바에서 프로젝트와 세션을 정리하고, 메인 영역에는
현재 활성 세션의 대화형 터미널이 표시됩니다.

## 기능

- Electron + React + TypeScript 기반 데스크톱 애플리케이션
- 먼저 프로젝트를 만들고 필요할 때 세션을 추가
- 사이드바에서 세션 생성, 전환, 이름 변경, 종료 지원
- 각 세션마다 전용 `xterm.js` 터미널 화면 제공
- Electron 메인 프로세스에서 `node-pty` PTY 관리 수행
- 세션 상태를 `%APPDATA%`에 저장하고 재시작 시 복원
- Windows에서는 `pwsh.exe`를 우선 사용하고 없으면 `powershell.exe`로 대체

## 스크립트

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
npm run dist
```

## 빌드 출력

- 앱 빌드 산출물:
  - `dist/`
  - `dist-electron/`
- Windows 설치 프로그램:
  - `release/Agent CLIs-0.1.0-Setup.exe`

## Windows 패키징 참고 사항

- 현재 패키징 설정은 `npmRebuild: false`를 사용하며 `node-pty`에 포함된
  Windows 사전 빌드 바이너리에 의존하므로 Visual Studio Build Tools 없이도
  `npm run dist`를 실행할 수 있습니다.
- 네이티브 모듈을 수동으로 다시 빌드해야 한다면 다음을 실행하세요.

```bash
npm run rebuild
```

- `npm run rebuild`에는 Visual Studio Build Tools가 필요합니다.
  그렇지 않으면 MSVC 툴체인을 찾지 못해 `node-gyp`가 실패합니다.
