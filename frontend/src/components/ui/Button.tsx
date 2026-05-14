import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110',
  ghost: 'bg-white/5 text-zinc-100 ring-1 ring-white/10 hover:bg-white/10',
  danger: 'bg-rose-500/90 text-white hover:bg-rose-500',
  subtle: 'bg-zinc-900 text-zinc-200 ring-1 ring-white/10 hover:bg-zinc-800',
} as const

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }
>(function Button({ className, variant = 'primary', ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
})
