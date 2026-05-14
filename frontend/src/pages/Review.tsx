import { format, startOfWeek } from 'date-fns'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { WeeklyReview } from '../types/models'

export function Review() {
  const [rows, setRows] = useState<WeeklyReview[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await api.get<WeeklyReview[]>('/reviews')
      setRows(data)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      wins: '',
      losses: '',
      reflection: '',
      goals_completion_rate: 0,
    },
  })

  const onSave = handleSubmit(async (values) => {
    try {
      await api.post('/reviews', {
        ...values,
        week_start: weekStart,
        goals_completion_rate: Number(values.goals_completion_rate || 0),
      })
      toast.success('Weekly review saved')
      reset({ ...values })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  })

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
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Review</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Weekly reflection</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Wins, losses, and completion rate — AI summaries are stubbed server-side for now.</p>
      </div>

      <Card>
        <CardTitle>This week</CardTitle>
        <CardDescription className="mt-2">Week start (Monday): {weekStart}</CardDescription>
        <form className="mt-4 space-y-3" onSubmit={onSave}>
          <label className="text-xs text-zinc-400">Wins</label>
          <textarea className="min-h-[90px] w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('wins')} />
          <label className="text-xs text-zinc-400">Losses / misses</label>
          <textarea className="min-h-[90px] w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('losses')} />
          <label className="text-xs text-zinc-400">Reflection</label>
          <textarea className="min-h-[120px] w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('reflection')} />
          <label className="text-xs text-zinc-400">Goals completion rate (0-100)</label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full max-w-xs rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm"
            {...register('goals_completion_rate', { valueAsNumber: true })}
          />
          <Button type="submit" disabled={formState.isSubmitting}>
            Save review
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>History</CardTitle>
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white">Week of {r.week_start}</div>
              <div className="mt-2 text-xs text-zinc-500">Goals completion: {r.goals_completion_rate}%</div>
              {r.auto_summary ? <div className="mt-3 text-sm text-zinc-300">{r.auto_summary}</div> : null}
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-zinc-500">No reviews yet.</div> : null}
        </div>
      </Card>
    </div>
  )
}
