import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { DSAProblem } from '../types/models'

const TOPICS = ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Backtracking', 'Greedy', 'Heap', 'Stack', 'Queue', 'Binary Search']

export function DSA() {
  const [rows, setRows] = useState<DSAProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => {
    try {
      const { data } = await api.get<DSAProblem[]>('/dsa', { params: { q: q || undefined } })
      setRows(data)
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

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      problem_name: '',
      platform: 'LeetCode',
      topic: 'Arrays',
      difficulty: 'Medium',
      status: 'planned',
      link: '',
      notes: '',
      bookmarked: false,
    },
  })

  const onCreate = handleSubmit(async (values) => {
    try {
      await api.post('/dsa', { ...values, bookmarked: Boolean(values.bookmarked) })
      toast.success('Added')
      reset()
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    }
  })

  const pie = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.topic, (map.get(r.topic) ?? 0) + 1)
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [rows])

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
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">DSA</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Problem tracker</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Topic buckets, revision dates, bookmarks, and charts — LeetCode sync is a future integration hook.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Topic distribution</CardTitle>
          <CardDescription className="mt-2">What you are training most often</CardDescription>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {pie.map((_, idx) => (
                    <Cell key={idx} fill={['#6366f1', '#22d3ee', '#a78bfa', '#34d399', '#fb7185', '#fbbf24'][idx % 6]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0b0b10', border: '1px solid rgba(255,255,255,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Quick add</CardTitle>
          <form className="mt-4 space-y-3" onSubmit={onCreate}>
            <Input placeholder="Problem name" {...register('problem_name', { required: true })} />
            <Input placeholder="Platform" {...register('platform')} />
            <select className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('topic')}>
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('difficulty')}>
              {['Easy', 'Medium', 'Hard'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('status')}>
              {['planned', 'solving', 'solved', 'revising'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Input placeholder="Link" {...register('link')} />
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" {...register('bookmarked')} />
              Bookmark
            </label>
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              Save
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Library</CardTitle>
            <CardDescription className="mt-2">Search across name and notes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button type="button" variant="ghost" onClick={() => void load()}>
              Apply
            </Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Problem</th>
                <th className="py-2">Topic</th>
                <th className="py-2">Diff</th>
                <th className="py-2">Status</th>
                <th className="py-2">BM</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.id} className="text-zinc-200">
                  <td className="py-3 font-medium text-white">{r.problem_name}</td>
                  <td className="py-3 text-zinc-400">{r.topic}</td>
                  <td className="py-3 text-zinc-400">{r.difficulty}</td>
                  <td className="py-3 text-zinc-400">{r.status}</td>
                  <td className="py-3">{r.bookmarked ? <Badge>★</Badge> : <span className="text-zinc-600">—</span>}</td>
                  <td className="py-3 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-3 py-1 text-xs"
                      onClick={async () => {
                        try {
                          await api.delete(`/dsa/${r.id}`)
                          toast.success('Deleted')
                          await load()
                        } catch (e: unknown) {
                          toast.error(e instanceof Error ? e.message : 'Delete failed')
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <div className="py-10 text-center text-sm text-zinc-500">No problems match.</div> : null}
        </div>
      </Card>
    </div>
  )
}
