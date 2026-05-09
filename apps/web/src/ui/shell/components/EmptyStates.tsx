export function ChannelEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-[480px] text-center">
        <WelcomeArt />
        <h3 className="mt-4 text-base font-semibold text-white">Start the conversation</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-canvas-muted">
          Messages are delivered in real time and synced across all your devices instantly.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-canvas-border bg-canvas-elevated px-3 py-2 text-xs text-canvas-muted">
          <kbd className="rounded border border-canvas-border bg-canvas-surface px-1.5 py-0.5 font-mono text-[10px] text-white">Shift</kbd>
          <span>+</span>
          <kbd className="rounded border border-canvas-border bg-canvas-surface px-1.5 py-0.5 font-mono text-[10px] text-white">↵</kbd>
          <span className="ml-0.5">for a new line</span>
        </div>
      </div>
    </div>
  )
}

function WelcomeArt() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-canvas-border bg-canvas-elevated shadow-card">
      <svg width="34" height="34" viewBox="0 0 74 74" fill="none" aria-hidden="true">
        <rect x="9" y="14" width="56" height="38" rx="10" stroke="rgba(244,243,255,0.4)" strokeWidth="2" />
        <path
          d="M23 28h28M23 37h18"
          stroke="rgba(99,102,241,0.95)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M27 52l-7 10c-.5.7 0 1.7.9 1.7h32.2c.9 0 1.4-1 .9-1.7l-7-10"
          stroke="rgba(244,243,255,0.25)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
