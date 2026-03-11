import { createRequire } from 'node:module'
import os from 'node:os'

import Store from 'electron-store'

import {
  buildRuntime,
  deriveProjectTitle,
  deriveSessionTitle,
  resolveProjectRoot,
  resolveSessionCwd,
  type CreateSessionInput,
  type ListSessionsResponse,
  type ProjectConfig,
  type SessionCloseResult,
  type SessionConfig,
  type SessionDataEvent,
  type SessionExitMeta,
  type SessionRuntime,
  type SessionRuntimeEvent,
  type SessionSnapshot,
} from '../src/shared/session'
import { buildShellArgs, resolveShellCommand } from './windowsShell'

type IPty = import('node-pty').IPty

type StoredSessionConfig = Omit<SessionConfig, 'projectId'> & {
  projectId?: string
}

const require = createRequire(import.meta.url)
const nodePty = require('node-pty') as typeof import('node-pty')

interface PersistedSessionState {
  projects: ProjectConfig[]
  sessions: StoredSessionConfig[]
  activeSessionId: string | null
}

interface SessionManagerEvents {
  onData: (event: SessionDataEvent) => void
  onRuntime: (event: SessionRuntimeEvent) => void
  onExit: (event: SessionExitMeta) => void
}

export class SessionManager {
  private readonly store = new Store<PersistedSessionState>({
    name: 'agenclis-sessions',
    defaults: {
      projects: [],
      sessions: [],
      activeSessionId: null,
    },
  })

  private readonly projects = new Map<string, ProjectConfig>()
  private readonly configs = new Map<string, SessionConfig>()
  private readonly runtimes = new Map<string, SessionRuntime>()
  private readonly terminals = new Map<string, IPty>()
  private readonly suppressedExit = new Set<string>()
  private readonly events: SessionManagerEvents

  private activeSessionId: string | null
  private restored = false

  constructor(events: SessionManagerEvents) {
    this.events = events
    const persisted = this.store.store
    this.activeSessionId = persisted.activeSessionId

    for (const project of persisted.projects ?? []) {
      this.projects.set(project.id, project)
    }

    let shouldPersist = false

    for (const config of persisted.sessions ?? []) {
      const hydratedConfig = this.hydrateSessionConfig(config)
      this.configs.set(hydratedConfig.id, hydratedConfig)
      this.runtimes.set(hydratedConfig.id, buildRuntime(hydratedConfig.id))

      if (config.projectId !== hydratedConfig.projectId) {
        shouldPersist = true
      }
    }

    const beforePrune = this.projects.size
    this.pruneEmptyProjects()
    if (beforePrune !== this.projects.size) {
      shouldPersist = true
    }

    if (this.activeSessionId && !this.configs.has(this.activeSessionId)) {
      this.activeSessionId = this.getOrderedConfigs()[0]?.id ?? null
      shouldPersist = true
    }

    if (shouldPersist) {
      this.persist()
    }
  }

  listSessions(): ListSessionsResponse {
    return {
      projects: this.getOrderedProjects().map((project) => ({
        config: project,
        sessions: this.getOrderedConfigs(project.id).map((config) =>
          this.snapshotFor(config.id),
        ),
      })),
      activeSessionId: this.activeSessionId,
    }
  }

  async restoreSessions(): Promise<ListSessionsResponse> {
    if (!this.restored) {
      this.restored = true
      for (const config of this.getOrderedConfigs()) {
        await this.startSession(config)
      }
    }

    return this.listSessions()
  }

  async createSession(input: CreateSessionInput): Promise<SessionSnapshot> {
    const now = new Date().toISOString()
    const project = this.resolveProjectForCreate(input)
    const id = crypto.randomUUID()
    const shell = resolveShellCommand()
    const cwd = resolveSessionCwd(input.cwd, project.rootPath)

    const config: SessionConfig = {
      id,
      projectId: project.id,
      title: deriveSessionTitle(input.title, input.startupCommand, cwd),
      startupCommand: input.startupCommand.trim(),
      cwd,
      shell,
      createdAt: now,
      updatedAt: now,
    }

    this.configs.set(id, config)
    this.runtimes.set(id, buildRuntime(id))
    this.touchProject(project.id, now)
    this.activeSessionId = id
    this.persist()

    await this.startSession(config)
    return this.snapshotFor(id)
  }

  renameSession(id: string, title: string): SessionSnapshot {
    const config = this.requireConfig(id)
    const nextTitle = deriveSessionTitle(title, config.startupCommand, config.cwd)
    const nextConfig: SessionConfig = {
      ...config,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
    }

    this.configs.set(id, nextConfig)
    this.persist()
    return this.snapshotFor(id)
  }

  activateSession(id: string): void {
    const config = this.requireConfig(id)
    this.activeSessionId = id
    this.touchProject(config.projectId)
    this.touchRuntime(id)
    this.persist()
  }

  async restartSession(id: string): Promise<SessionSnapshot> {
    const config = this.requireConfig(id)
    await this.startSession(config)
    return this.snapshotFor(id)
  }

  closeSession(id: string): SessionCloseResult {
    const orderedIds = this.getOrderedConfigs().map((config) => config.id)
    const closingIndex = orderedIds.indexOf(id)
    if (closingIndex === -1) {
      throw new Error(`Unknown session: ${id}`)
    }

    const closingProjectId = this.requireConfig(id).projectId

    this.stopSession(id, true)
    this.configs.delete(id)
    this.runtimes.delete(id)

    if (this.activeSessionId === id) {
      this.activeSessionId =
        orderedIds[closingIndex + 1] ??
        orderedIds[closingIndex - 1] ??
        null
    }

    if (!this.hasSessions(closingProjectId)) {
      this.projects.delete(closingProjectId)
    }

    this.persist()
    return {
      closedSessionId: id,
      activeSessionId: this.activeSessionId,
    }
  }

  writeToSession(id: string, data: string): void {
    this.touchRuntime(id)
    this.terminals.get(id)?.write(data)
  }

  resizeSession(id: string, cols: number, rows: number): void {
    const terminal = this.terminals.get(id)
    if (!terminal || cols < 2 || rows < 1) {
      return
    }

    terminal.resize(Math.floor(cols), Math.floor(rows))
  }

  dispose(): void {
    for (const id of Array.from(this.terminals.keys())) {
      this.stopSession(id, true)
    }
  }

  private async startSession(config: SessionConfig): Promise<void> {
    this.stopSession(config.id, true)
    this.setRuntime(config.id, {
      status: 'starting',
      pid: undefined,
      exitCode: undefined,
    })

    try {
      const shell = resolveShellCommand(config.shell)
      if (shell !== config.shell) {
        this.configs.set(config.id, {
          ...config,
          shell,
          updatedAt: new Date().toISOString(),
        })
        this.persist()
      }

      const terminal = nodePty.spawn(shell, buildShellArgs(), {
        name: 'xterm-color',
        cols: 120,
        rows: 36,
        cwd: config.cwd,
        useConpty: true,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
      })

      this.terminals.set(config.id, terminal)
      this.setRuntime(config.id, {
        status: 'running',
        pid: terminal.pid,
        exitCode: undefined,
      })

      terminal.onData((chunk) => {
        this.events.onData({
          sessionId: config.id,
          chunk,
        })
      })

      terminal.onExit(({ exitCode }) => {
        this.terminals.delete(config.id)

        if (this.suppressedExit.delete(config.id)) {
          return
        }

        const status = exitCode === 0 ? 'exited' : 'error'
        this.setRuntime(config.id, {
          status,
          pid: undefined,
          exitCode,
        })
        this.events.onExit({
          sessionId: config.id,
          exitCode,
        })
      })

      setTimeout(() => {
        terminal.write(`${config.startupCommand}\r`)
      }, 60)
    } catch (error) {
      this.setRuntime(config.id, {
        status: 'error',
        pid: undefined,
        exitCode: -1,
      })

      this.events.onData({
        sessionId: config.id,
        chunk: `\r\n[agenclis] Failed to start session: ${this.getErrorMessage(error)}\r\n`,
      })
      this.events.onExit({
        sessionId: config.id,
        exitCode: -1,
      })
    }
  }

  private stopSession(id: string, suppressExit: boolean): void {
    const terminal = this.terminals.get(id)
    if (!terminal) {
      return
    }

    if (suppressExit) {
      this.suppressedExit.add(id)
    }

    this.terminals.delete(id)
    try {
      terminal.kill()
    } catch {
      this.suppressedExit.delete(id)
    }
  }

  private hydrateSessionConfig(config: StoredSessionConfig): SessionConfig {
    const cwd = resolveSessionCwd(config.cwd, os.homedir())
    const project = this.resolveProjectForHydration(config.projectId, cwd, config)

    return {
      ...config,
      projectId: project.id,
      title: deriveSessionTitle(config.title, config.startupCommand, cwd),
      cwd,
      shell: resolveShellCommand(config.shell),
    }
  }

  private resolveProjectForCreate(input: CreateSessionInput): ProjectConfig {
    if (input.projectId) {
      return this.requireProject(input.projectId)
    }

    const fallbackRootPath = input.cwd?.trim() || os.homedir()
    const rootPath = resolveProjectRoot(input.projectRootPath, fallbackRootPath)
    const existingProject = this.findProjectByRootPath(rootPath)
    if (existingProject) {
      return existingProject
    }

    const now = new Date().toISOString()
    const project: ProjectConfig = {
      id: crypto.randomUUID(),
      title: deriveProjectTitle(input.projectTitle, rootPath),
      rootPath,
      createdAt: now,
      updatedAt: now,
    }

    this.projects.set(project.id, project)
    return project
  }

  private resolveProjectForHydration(
    projectId: string | undefined,
    rootPath: string,
    config: StoredSessionConfig,
  ): ProjectConfig {
    if (projectId) {
      const project = this.projects.get(projectId)
      if (project) {
        return project
      }
    }

    const existingProject = this.findProjectByRootPath(rootPath)
    if (existingProject) {
      return existingProject
    }

    const createdAt = config.createdAt ?? new Date().toISOString()
    const project: ProjectConfig = {
      id: projectId ?? crypto.randomUUID(),
      title: deriveProjectTitle(undefined, rootPath),
      rootPath,
      createdAt,
      updatedAt: config.updatedAt ?? createdAt,
    }

    this.projects.set(project.id, project)
    return project
  }

  private requireProject(id: string): ProjectConfig {
    const project = this.projects.get(id)
    if (!project) {
      throw new Error(`Unknown project: ${id}`)
    }

    return project
  }

  private touchProject(id: string, timestamp = new Date().toISOString()): void {
    const project = this.projects.get(id)
    if (!project) {
      return
    }

    this.projects.set(id, {
      ...project,
      updatedAt: timestamp,
    })
  }

  private touchRuntime(id: string): SessionRuntime {
    return this.setRuntime(id, {})
  }

  private setRuntime(
    id: string,
    patch: Partial<Omit<SessionRuntime, 'sessionId'>>,
  ): SessionRuntime {
    const current = this.runtimes.get(id) ?? buildRuntime(id)
    const nextRuntime: SessionRuntime = {
      ...current,
      ...patch,
      sessionId: id,
      lastActiveAt: new Date().toISOString(),
    }

    this.runtimes.set(id, nextRuntime)
    this.events.onRuntime({
      sessionId: id,
      runtime: nextRuntime,
    })
    return nextRuntime
  }

  private snapshotFor(id: string): SessionSnapshot {
    return {
      config: this.requireConfig(id),
      runtime: this.runtimes.get(id) ?? buildRuntime(id),
    }
  }

  private requireConfig(id: string): SessionConfig {
    const config = this.configs.get(id)
    if (!config) {
      throw new Error(`Unknown session: ${id}`)
    }

    return config
  }

  private getOrderedProjects(): ProjectConfig[] {
    return Array.from(this.projects.values())
      .filter((project) => this.hasSessions(project.id))
      .sort((left, right) => {
        const lastRight = this.getProjectSortValue(right.id)
        const lastLeft = this.getProjectSortValue(left.id)

        return (
          lastRight.localeCompare(lastLeft) ||
          left.title.localeCompare(right.title)
        )
      })
  }

  private getOrderedConfigs(projectId?: string): SessionConfig[] {
    return Array.from(this.configs.values())
      .filter((config) => !projectId || config.projectId === projectId)
      .sort((left, right) => {
        const lastRight = this.getSessionSortValue(right.id, right.updatedAt)
        const lastLeft = this.getSessionSortValue(left.id, left.updatedAt)

        return (
          lastRight.localeCompare(lastLeft) ||
          left.title.localeCompare(right.title)
        )
      })
  }

  private getProjectSortValue(projectId: string): string {
    const mostRecentSession = this.getOrderedConfigs(projectId)[0]
    if (mostRecentSession) {
      return this.getSessionSortValue(
        mostRecentSession.id,
        mostRecentSession.updatedAt,
      )
    }

    return this.projects.get(projectId)?.updatedAt ?? ''
  }

  private getSessionSortValue(id: string, fallbackValue: string): string {
    return this.runtimes.get(id)?.lastActiveAt ?? fallbackValue
  }

  private hasSessions(projectId: string): boolean {
    return Array.from(this.configs.values()).some(
      (config) => config.projectId === projectId,
    )
  }

  private findProjectByRootPath(rootPath: string): ProjectConfig | undefined {
    const targetPath = this.normalizePath(rootPath)

    return Array.from(this.projects.values()).find(
      (project) => this.normalizePath(project.rootPath) === targetPath,
    )
  }

  private pruneEmptyProjects(): void {
    const activeProjectIds = new Set(
      Array.from(this.configs.values()).map((config) => config.projectId),
    )

    for (const projectId of Array.from(this.projects.keys())) {
      if (!activeProjectIds.has(projectId)) {
        this.projects.delete(projectId)
      }
    }
  }

  private persist(): void {
    this.pruneEmptyProjects()

    this.store.set({
      projects: Array.from(this.projects.values()),
      sessions: Array.from(this.configs.values()),
      activeSessionId: this.activeSessionId,
    })
  }

  private normalizePath(value: string): string {
    return value.trim().replace(/[\\/]+$/, '').toLowerCase()
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }

    return 'Unknown error'
  }
}
