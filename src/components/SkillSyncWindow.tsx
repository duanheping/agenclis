import { useEffect, useMemo, useRef, useState } from 'react'

import '../App.css'

import type {
  FullSyncDone,
  FullSyncLogEntry,
  FullSyncProgress,
  FullSyncStep,
} from '../shared/skills'

function stepIcon(status: FullSyncStep['status']): string {
  switch (status) {
    case 'done':
      return '✓'
    case 'running':
      return '⟳'
    case 'error':
      return '✗'
    case 'skipped':
      return '–'
    default:
      return '○'
  }
}

function stepStatusClass(status: FullSyncStep['status']): string {
  return `sync-step is-${status}`
}

function logLevelClass(level: FullSyncLogEntry['level']): string {
  return `sync-log is-${level}`
}

function formatLogTimestamp(timestamp: string): string {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function SkillSyncWindow() {
  const hasAgentCli = Boolean(window.agentCli)
  const [progress, setProgress] = useState<FullSyncProgress | null>(null)
  const [result, setResult] = useState<FullSyncDone | null>(null)
  const [syncRunning, setSyncRunning] = useState(false)
  const [loading, setLoading] = useState(hasAgentCli)
  const [loadError, setLoadError] = useState<string | null>(
    hasAgentCli
      ? null
      : 'Agent bridge is unavailable. The preload script did not load.',
  )
  const traceRef = useRef<HTMLOListElement | null>(null)

  useEffect(() => {
    if (!hasAgentCli) {
      return
    }

    let active = true

    const unsubscribeProgress = window.agentCli.onFullSyncProgress((event) => {
      if (!active) {
        return
      }

      setProgress(event)
      setSyncRunning(!event.done)
      if (event.done) {
        return
      }

      setResult(null)
      setLoadError(event.error ?? null)
      setLoading(false)
    })

    const unsubscribeDone = window.agentCli.onFullSyncDone((event) => {
      if (!active) {
        return
      }

      setResult(event)
      setSyncRunning(false)
      setLoadError(event.success ? null : event.summary)
      setLoading(false)
    })

    void window.agentCli
      .getFullSyncState()
      .then((state) => {
        if (!active) {
          return
        }

        setProgress(state.progress)
        setResult(state.result)
        setSyncRunning(state.running)
        setLoadError(state.result && !state.result.success ? state.result.summary : null)
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setLoadError(error instanceof Error ? error.message : 'Failed to read sync state.')
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
      unsubscribeProgress()
      unsubscribeDone()
    }
  }, [hasAgentCli])

  const traceEntries = useMemo(
    () => result?.logs ?? progress?.logs ?? [],
    [progress?.logs, result?.logs],
  )

  useEffect(() => {
    if (!traceRef.current) {
      return
    }

    traceRef.current.scrollTop = traceRef.current.scrollHeight
  }, [traceEntries])

  const steps = result?.steps ?? progress?.steps ?? []
  const running = syncRunning || (progress !== null && !progress.done && result === null)
  const completedSteps = steps.filter((step) => step.status === 'done' || step.status === 'skipped').length
  const currentStep = steps.find((step) => step.status === 'running') ?? null
  const title = result
    ? result.success
      ? 'Sync complete'
      : 'Sync failed'
    : running
      ? 'Sync in progress'
      : loading
        ? 'Preparing sync'
        : 'Waiting for sync'
  const subtitle = loadError
    ? loadError
    : result
      ? result.summary
      : currentStep?.detail ?? currentStep?.label ?? 'The sync monitor will update here as work completes.'

  return (
    <div className="sync-window">
      <div className="sync-window__background" aria-hidden="true" />
      <div className="sync-window__drag-bar" aria-hidden="true" />

      <main className="sync-window__shell">
        <section className="sync-window__card">
          <header className="sync-window__header">
            <div>
              <p className="eyebrow">Skills</p>
              <h1 className="sync-window__title">Skill Sync</h1>
              <p className="sync-window__caption">{title}</p>
            </div>

            <div className="sync-window__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => window.close()}
              >
                {running ? 'Hide' : 'Close'}
              </button>
            </div>
          </header>

          <div className="sync-window__status-bar" aria-label="Sync status summary">
            <div className="sync-window__status-pill">
              <span>Steps</span>
              <strong>
                {steps.length > 0 ? `${completedSteps}/${steps.length}` : '0/0'}
              </strong>
            </div>
            <div className="sync-window__status-pill">
              <span>Trace</span>
              <strong>{traceEntries.length}</strong>
            </div>
            <div className="sync-window__status-pill">
              <span>Current</span>
              <strong>{currentStep?.label ?? (result ? 'Finished' : 'Idle')}</strong>
            </div>
          </div>

          <p className="sync-window__summary">{subtitle}</p>

          <div className="sync-window__grid">
            <section className="sync-window__panel">
              <div className="sync-window__panel-header">
                <h2>Steps</h2>
                <p>{running ? 'Live progress' : 'Final state'}</p>
              </div>

              {steps.length === 0 && !loadError ? (
                <p className="sync-window__empty">
                  {loading
                    ? 'Loading sync state…'
                    : 'No sync is running right now. Use “Sync now” in Agent CLIs to start one.'}
                </p>
              ) : (
                <ul className="sync-dialog__steps sync-window__steps">
                  {steps.map((step) => (
                    <li key={step.id} className={stepStatusClass(step.status)}>
                      <span className="sync-step__icon">{stepIcon(step.status)}</span>
                      <div className="sync-window__step-copy">
                        <span className="sync-step__label">{step.label}</span>
                        {step.detail ? (
                          <span className="sync-step__detail sync-window__step-detail">
                            {step.detail}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="sync-window__panel">
              <div className="sync-window__panel-header">
                <h2>Trace</h2>
                <p>Live execution trace and merge verdicts</p>
              </div>

              {traceEntries.length === 0 ? (
                <p className="sync-window__empty">
                  Execution trace details will appear here as the sync runs.
                </p>
              ) : (
                <ol ref={traceRef} className="sync-window__activity" aria-live="polite">
                  {traceEntries.map((log) => (
                    <li key={log.id} className={logLevelClass(log.level)}>
                      <span className="sync-log__time">{formatLogTimestamp(log.timestamp)}</span>
                      <span className="sync-log__message">{log.message}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}
