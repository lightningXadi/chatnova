function Block({ className }: { className: string }) {
  return <div className={['animate-pulse rounded-md bg-white/8', className].join(' ')} />
}

export function MessageRowSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-1.5">
      <div className="h-9 w-9 rounded-xl bg-white/8" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Block className="h-3 w-28" />
          <Block className="h-3 w-16" />
        </div>
        <div className="mt-2 space-y-2">
          <Block className="h-3 w-[86%]" />
          <Block className="h-3 w-[72%]" />
        </div>
      </div>
    </div>
  )
}

