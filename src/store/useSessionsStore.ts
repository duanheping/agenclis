import { create } from 'zustand'

import type {
  ListSessionsResponse,
  ProjectSnapshot,
  SessionRuntime,
} from '../shared/session'

interface SessionState {
  projects: ProjectSnapshot[]
  activeSessionId: string | null
  hydrated: boolean
  setInitialData: (payload: ListSessionsResponse) => void
  setActiveSession: (sessionId: string | null) => void
  updateRuntime: (runtime: SessionRuntime) => void
}

export const useSessionsStore = create<SessionState>((set) => ({
  projects: [],
  activeSessionId: null,
  hydrated: false,
  setInitialData: (payload) => {
    set({
      projects: payload.projects,
      activeSessionId: payload.activeSessionId,
      hydrated: true,
    })
  },
  setActiveSession: (sessionId) => {
    set({
      activeSessionId: sessionId,
    })
  },
  updateRuntime: (runtime) => {
    set((state) => ({
      projects: state.projects.map((project) => ({
        ...project,
        sessions: project.sessions.map((session) =>
          session.config.id === runtime.sessionId
            ? {
                ...session,
                runtime,
              }
            : session,
        ),
      })),
    }))
  },
}))
