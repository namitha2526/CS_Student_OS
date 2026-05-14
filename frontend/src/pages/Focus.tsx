import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { api } from '../services/api'

type Mode = 'focus' | 'short_break' | 'long_break'

const DUR: Record<Mode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
}

export function Focus() {
  const [mode, setMode] = useState<Mode>('focus')
  const [secondsLeft, setSecondsLeft] = useState(DUR.focus)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const completionGuard = useRef(false)

  const label = useMemo(() => {
    if (mode === 'focus') return 'Focus'
    if (mode === 'short_break') return 'Short break'
    return 'Long break'
  }, [mode])

  useEffect(() => {
    if (!running) return
    completionGuard.current = false
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [running])

  useEffect(() => {
    if (!running) return
    if (secondsLeft !== 0) return
    if (completionGuard.current) return
    completionGuard.current = true
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = null
    setRunning(false)

    const loggedMode = mode === 'focus' ? 'focus' : mode === 'short_break' ? 'short_break' : 'long_break'
    void (async () => {
      try {
        await api.post('/pomodoro/sessions', { mode: loggedMode, duration_seconds: DUR[mode] })
        if (mode === 'focus') setSessions((c) => c + 1)
        toast.success(mode === 'focus' ? 'Focus session logged' : 'Break logged')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to log session')
      } finally {
        setSecondsLeft(DUR[mode])
      }
    })()
  }, [secondsLeft, running, mode])

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  const switchMode = (m: Mode) => {
    setRunning(false)
    setMode(m)
    setSecondsLeft(DUR[m])
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Focus</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Pomodoro studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Local-first timer with auto session logging. Background sounds are a planned extension hook.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col items-center py-10">
            <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</div>
            <div className="mt-6 text-7xl font-semibold tracking-tight text-white sm:text-8xl">{mmss}</div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => setRunning((r) => !r)}>
                {running ? 'Pause' : 'Start'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSecondsLeft(DUR[mode])}>
                Reset
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="subtle" onClick={() => switchMode('focus')}>
                Focus
              </Button>
              <Button type="button" variant="subtle" onClick={() => switchMode('short_break')}>
                Short break
              </Button>
              <Button type="button" variant="subtle" onClick={() => switchMode('long_break')}>
                Long break
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Session stats</CardTitle>
          <CardDescription className="mt-2">Completed focus sessions this sitting: {sessions}</CardDescription>
          <div className="mt-4 rounded-xl bg-white/[0.03] p-4 text-sm text-zinc-300 ring-1 ring-white/10">
            When a phase completes, the app POSTs{' '}
            <span className="font-mono text-xs text-zinc-400">/api/pomodoro/sessions</span> using the configured duration for that mode.
          </div>
        </Card>
      </div>
    </div>
  )
}
