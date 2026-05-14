import { cn } from '../../lib/cn'
import type { HTMLAttributes } from 'react'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg bg-white/5 px-2 py-0.5 text-xs font-medium text-zinc-200 ring-1 ring-white/10',
        className,
      )}
      {...props}
    />
  )
}
