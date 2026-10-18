import { Component } from "react";
import { supabase } from "../lib/supabaseClient";

// A short technical note when a screen crashes, so problems in the beta
// reach Cassidy without a tester having to describe them. Never includes
// what the Seeker wrote: only the error message, stack and path. The
// database keeps at most 20 per person per hour (client_errors_throttle).
let reported = 0;
export function reportError(error, extra = {}) {
  if (reported >= 10) return; // per page load, on top of the server's limit
  reported += 1;
  supabase.auth.getSession().then(({ data }) => {
    const userId = data.session?.user?.id;
    if (!userId) return;
    return supabase.from("client_errors").insert({
      user_id: userId,
      message: String(error?.message || error || "Unknown error").slice(0, 500),
      stack: String(extra.componentStack || error?.stack || "").slice(0, 4000) || null,
      path: window.location.pathname.slice(0, 200),
      user_agent: navigator.userAgent.slice(0, 300)
    });
  }).catch(() => { /* reporting must never cause a second failure */ });
}

// Wraps the app so a crash shows a calm way back instead of a blank screen.
// Keyed by path in App, so moving to another screen starts fresh.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error);
    reportError(error, { componentStack: info?.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-dvh you-sky flex justify-center items-center font-sans px-6">
        <div className="max-w-[380px] w-full rounded-card bg-surface1 shadow-card p-6 text-center">
          <div className="font-serif text-h2 text-textPrimary mb-2">This screen tripped over itself</div>
          <p className="text-bodySm text-textSecondary mb-5">
            Nothing you've saved is lost. We've been sent a short note about what went wrong, so we can fix it.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => this.setState({ failed: false })}
              className="min-h-[44px] rounded-sm bg-forestAccent text-onAccent font-medium"
            >
              Try again
            </button>
            <a href="/" className="min-h-[44px] flex items-center justify-center rounded-sm border border-borderC text-textPrimary text-bodySm">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
