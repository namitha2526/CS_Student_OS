import { addDays, format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { Habit } from '../types/models'
import { cn } from '../lib/cn'

type Completion = { id: number; habit_id: number; day: string; completed: boolean; created_at: string }

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [heatmap, setHeatmap] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await api.get<Habit[]>('/habits')
      setHabits(data)
      if (!selected && data[0]) setSelected(data[0].id)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const run = async () => {
      if (!selected) return
      try {
        const { data } = await api.get<Completion[]>(`/habits/${selected}/heatmap`, { params: { days: 120 } })
        setHeatmap(data)
      } catch {
        setHeatmap([])
      }
    }
    void run()
  }, [selected])

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: { name: '', category: 'general', color: '#6366f1' },
  })

  const onCreate = handleSubmit(async (values) => {
    try {
      await api.post('/habits', values)
      toast.success('Habit created')
      reset()
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    }
  })

  const markToday = async (habitId: number, completed: boolean) => {
    const day = format(new Date(), 'yyyy-MM-dd')
    try {
      await api.post(`/habits/${habitId}/completions`, { day, completed })
      toast.success('Updated')
      await load()
      if (selected === habitId) {
        const { data } = await api.get<Completion[]>(`/habits/${habitId}/heatmap`, { params: { days: 120 } })
        setHeatmap(data)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  }

  const weeks = useMemo(() => {
    const set = new Set(heatmap.filter((h) => h.completed).map((h) => String(h.day).slice(0, 10)))
    const end = new Date()
    const start = addDays(end, -119)
    const total = 120
    const days: Date[] = Array.from({ length: total }, (_, i) => addDays(start, i))
    const colsCount = Math.ceil(total / 7)
    const cols: Date[][] = Array.from({ length: colsCount }, (_, c) =>
      Array.from({ length: 7 }, (_, r) => days[c * 7 + r]).filter((d): d is Date => Boolean(d)),
    )
    return { cols, set }
  }, [heatmap])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Habits</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Consistency engine</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Streaks, 30-day completion rates, and a compact heatmap grid.</p>
      </div>

      <Card>
        <CardTitle>New habit</CardTitle>
        <form className="mt-4 grid gap-3 lg:grid-cols-6" onSubmit={onCreate}>
          <Input className="lg:col-span-2" placeholder="Name" {...register('name', { required: true })} />
          <Input className="lg:col-span-2" placeholder="Category" {...register('category')} />
          <Input type="color" className="h-10 w-full lg:col-span-1" {...register('color')} />
          <Button type="submit" className="lg:col-span-1" disabled={formState.isSubmitting}>
            Add
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle>Your habits</CardTitle>
          <div className="mt-4 space-y-2">
            {habits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelected(h.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ring-1',
                  selected === h.id ? 'bg-white/10 ring-white/20' : 'bg-white/[0.03] ring-white/10 hover:bg-white/5',
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{h.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    streak {h.current_streak} · 30d {h.completion_rate_30d}%
                  </div>
                </div>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: h.color }} />
              </button>
            ))}
            {habits.length === 0 ? <div className="text-sm text-zinc-500">No habits yet.</div> : null}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Heatmap</CardTitle>
              <CardDescription className="mt-2">Last ~17 weeks (7 rows × 17 columns)</CardDescription>
            </div>
            {selected ? (
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={() => markToday(selected, true)}>
                  Mark today ✓
                </Button>
                <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={() => markToday(selected, false)}>
                  Clear today
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="inline-flex gap-1">
              {weeks.cols.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-1">
                  {col.map((d) => {
                    const key = format(d, 'yyyy-MM-dd')
                    const on = weeks.set.has(key)
                    return (
                      <div
                        key={key}
                        title={key}
                        className={cn('h-3 w-3 rounded-sm ring-1 ring-white/10', on ? 'bg-emerald-400/70' : 'bg-white/5')}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
