import React from 'react'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production: post to Supabase error_logs table (§6.3)
    console.error('[InstaRatiba ErrorBoundary]', error, info)
  }

  handleRetry = () => this.setState({ hasError: false, error: undefined })

  handleReport = () => {
    // Segment 9: will POST to Supabase error_logs
    alert('Error reported. Thank you!')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-ir-bg">
        <div className="bg-white rounded-xl border border-ir-error/20 shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFEBEE] flex items-center justify-center mx-auto mb-4">
            <i className="bi-exclamation-triangle-fill text-ir-error text-2xl" />
          </div>
          <h2 className="font-display font-bold text-xl text-ir-text mb-2">
            Something went wrong
          </h2>
          <p className="text-muted text-sm mb-1">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <p className="text-muted text-xs mb-6">
            Your data is safe. Please try again or report the issue.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="px-5 py-2 bg-primary text-white rounded-md font-semibold text-sm
                         hover:bg-primary-dark transition-colors duration-150"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReport}
              className="px-5 py-2 bg-ir-bg text-muted rounded-md font-semibold text-sm
                         hover:bg-accent-light hover:text-primary transition-colors duration-150"
            >
              Report Issue
            </button>
          </div>
        </div>
      </div>
    )
  }
}
