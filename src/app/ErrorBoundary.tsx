import { Component, type ReactNode } from 'react'
import { CrashScreen } from './CrashScreen'

/** Last line of defence around the whole app: catches render errors that happen outside the router. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown; failed: boolean }> {
  override state = { error: null as unknown, failed: false }

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true }
  }

  override componentDidCatch(error: unknown) {
    console.error('[app] render failed', error)
  }

  override render() {
    return this.state.failed ? <CrashScreen error={this.state.error} fullPage /> : this.props.children
  }
}
