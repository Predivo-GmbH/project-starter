import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isChunkLoadError, reloadOnceForChunk, reportCrash } from '@/lib/crash-report'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * App-level error boundary. Mount it once, wrapping the whole app in main.tsx:
 *   <ErrorBoundary><App /></ErrorBoundary>
 *
 * Stale-chunk-after-deploy errors auto-recover (reload once per chunk) instead of
 * dead-ending on the fallback UI — see standards/deploy-standard.md §5a.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Stale chunk after a deploy: reload once per chunk so the new build loads
    // transparently (multi-deploy days produce several distinct stale chunks).
    if (isChunkLoadError(error) && reloadOnceForChunk(error)) {
      return
    }
    reportCrash('error-boundary', error, info?.componentStack ?? '')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm opacity-70">
            An unexpected error occurred. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-black px-4 text-sm font-medium text-white"
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
