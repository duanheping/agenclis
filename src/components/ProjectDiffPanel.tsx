import type {
  ProjectGitFileChange,
  ProjectGitOverview,
} from '../shared/projectTools'

interface ProjectDiffSelection {
  path: string
  staged: boolean
}

interface ProjectDiffPanelProps {
  overview: ProjectGitOverview | null
  loading: boolean
  errorMessage: string | null
  selectedFile: ProjectDiffSelection | null
  diffContent: string | null
  diffLoading: boolean
  diffErrorMessage: string | null
  onRefresh: () => void
  onSelectFile: (file: ProjectGitFileChange) => void
}

const DIFF_METADATA_PREFIXES = [
  'diff --git',
  'index ',
  '--- ',
  '+++ ',
  'rename from ',
  'rename to ',
  'copy from ',
  'copy to ',
  'similarity index ',
  'dissimilarity index ',
  'new file mode ',
  'deleted file mode ',
  'old mode ',
  'new mode ',
  'Binary files ',
  '\\ ',
] as const

function getProjectLabel(projectPath: string | null): string {
  if (!projectPath) {
    return 'Project'
  }

  const normalizedPath = projectPath.trim().replace(/[\\/]+$/u, '')
  const pathParts = normalizedPath.split(/[\\/]/u).filter(Boolean)
  return pathParts.at(-1) ?? normalizedPath
}

function formatChangeStatus(status: ProjectGitFileChange['status']): string {
  switch (status) {
    case 'added':
      return 'Added'
    case 'modified':
      return 'Modified'
    case 'deleted':
      return 'Deleted'
    case 'renamed':
      return 'Renamed'
    case 'copied':
      return 'Copied'
    case 'untracked':
      return 'Untracked'
    case 'typechange':
      return 'Type'
    case 'conflicted':
      return 'Conflict'
  }
}

function getDiffLineClassName(line: string): string {
  if (line.startsWith('@@')) {
    return 'project-diff-panel__code-line project-diff-panel__code-line--hunk'
  }

  if (DIFF_METADATA_PREFIXES.some((prefix) => line.startsWith(prefix))) {
    return 'project-diff-panel__code-line project-diff-panel__code-line--meta'
  }

  if (line.startsWith('+')) {
    return 'project-diff-panel__code-line project-diff-panel__code-line--added'
  }

  if (line.startsWith('-')) {
    return 'project-diff-panel__code-line project-diff-panel__code-line--removed'
  }

  return 'project-diff-panel__code-line'
}

export function ProjectDiffPanel({
  overview,
  loading,
  errorMessage,
  selectedFile,
  diffContent,
  diffLoading,
  diffErrorMessage,
  onRefresh,
  onSelectFile,
}: ProjectDiffPanelProps) {
  const repoLabel = getProjectLabel(overview?.repoRoot ?? overview?.projectPath ?? null)
  const totalFiles =
    (overview?.unstagedFiles.length ?? 0) + (overview?.stagedFiles.length ?? 0)
  const changedFiles = overview
    ? [...overview.unstagedFiles, ...overview.stagedFiles]
    : []

  return (
    <aside className="project-diff-panel">
      <header className="project-diff-panel__header">
        <div>
          <p className="project-diff-panel__eyebrow">Changes</p>
          <h2>{repoLabel}</h2>
          <p className="project-diff-panel__branch">
            {overview?.branch ? `Branch ${overview.branch}` : 'Git working tree'}
          </p>
        </div>

        <button
          type="button"
          className="ghost-button project-diff-panel__refresh"
          onClick={onRefresh}
        >
          Refresh
        </button>
      </header>

      <div className="project-diff-panel__body">
        {errorMessage ? (
          <p className="project-diff-panel__error">{errorMessage}</p>
        ) : null}

        {loading && !overview ? (
          <div className="project-diff-panel__state">
            <p>Loading project changes…</p>
          </div>
        ) : null}

        {!loading && overview && !overview.isGitRepository ? (
          <div className="project-diff-panel__state">
            <p>This project is not inside a Git repository.</p>
          </div>
        ) : null}

        {!loading &&
        overview &&
        overview.isGitRepository &&
        totalFiles === 0 &&
        !errorMessage ? (
          <div className="project-diff-panel__state">
            <p>No local changes.</p>
          </div>
        ) : null}

        {overview?.isGitRepository && totalFiles > 0 ? (
          <>
            <div className="project-diff-panel__changes">
              <div className="project-diff-panel__file-list">
                {changedFiles.map((file) => {
                  const isActive =
                    selectedFile?.path === file.path &&
                    selectedFile.staged === file.staged

                  return (
                    <button
                      key={`${file.staged ? 'staged' : 'unstaged'}:${file.path}`}
                      type="button"
                      className={`project-diff-panel__file${isActive ? ' is-active' : ''}`}
                      onClick={() => onSelectFile(file)}
                    >
                      <span className="project-diff-panel__file-main">
                        <span className="project-diff-panel__file-path">{file.path}</span>
                        <span
                          className={`project-diff-panel__status-badge is-${file.status}`}
                        >
                          {formatChangeStatus(file.status)}
                        </span>
                      </span>
                      <span className="project-diff-panel__file-meta">
                        <span className="project-diff-panel__file-lines is-added">
                          +{file.additions}
                        </span>
                        <span className="project-diff-panel__file-lines is-removed">
                          -{file.deletions}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <section className="project-diff-panel__preview">
              <header className="project-diff-panel__preview-header">
                <div>
                  <h3>{selectedFile ? selectedFile.path : 'Select a file'}</h3>
                  <p>
                    {selectedFile ? 'Patch preview' : 'Choose a file to inspect the patch.'}
                  </p>
                </div>
              </header>

              {diffErrorMessage ? (
                <p className="project-diff-panel__error">{diffErrorMessage}</p>
              ) : null}

              {selectedFile ? (
                diffLoading ? (
                  <div className="project-diff-panel__preview-state">
                    <p>Loading diff…</p>
                  </div>
                ) : (
                  <pre className="project-diff-panel__code">
                    {diffContent?.trim()
                      ? diffContent.split(/\r?\n/u).map((line, index) => (
                          <span
                            key={`${index}:${line}`}
                            className={getDiffLineClassName(line)}
                          >
                            {line || ' '}
                          </span>
                        ))
                      : 'No diff output is available for this file yet.'}
                  </pre>
                )
              ) : (
                <div className="project-diff-panel__preview-state">
                  <p>Select a changed file to load its patch.</p>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </aside>
  )
}
