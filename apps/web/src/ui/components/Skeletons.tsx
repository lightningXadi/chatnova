function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-md bg-white/8',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        'before:animate-[shimmer_1.2s_infinite]',
        className,
      ].join(' ')}
    />
  )
}

export function FullPageSkeleton() {
  return (
    <div className="h-full w-full bg-canvas-bg text-white">
      <div className="mx-auto max-w-[960px] px-6 py-10">
        <div className="flex items-center gap-4">
          <Shimmer className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <Shimmer className="h-4 w-48" />
            <div className="mt-2">
              <Shimmer className="h-3 w-72" />
            </div>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4">
          <Shimmer className="h-48" />
          <Shimmer className="h-48" />
          <Shimmer className="h-48" />
        </div>
      </div>
    </div>
  )
}

