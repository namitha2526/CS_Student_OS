import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import Markdown from 'react-markdown'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { LearningResource } from '../types/models'

const TYPES = ['youtube', 'article', 'pdf', 'documentation', 'course'] as const

export function Learn() {
  const [rows, setRows] = useState<LearningResource[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<LearningResource | null>(null)

  const load = async () => {
    try {
      const { data } = await api.get<LearningResource[]>('/resources', { params: { q: q || undefined } })
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

  const filtered = useMemo(() => {
    if (!q) return rows
    const s = q.toLowerCase()
    return rows.filter((r) => r.title.toLowerCase().includes(s) || (r.notes ?? '').toLowerCase().includes(s))
  }, [rows, q])

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      title: '',
      url: '',
      resource_type: 'article',
      category: 'General',
      notes: '',
      bookmarked: true,
    },
  })

  const onCreate = handleSubmit(async (values) => {
    try {
      await api.post('/resources', { ...values, bookmarked: Boolean(values.bookmarked) })
      toast.success('Saved')
      reset()
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
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
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Learning</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Learning hub</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Markdown notes, categorized resources, and quick bookmarking.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle>Add resource</CardTitle>
          <form className="mt-4 space-y-3" onSubmit={onCreate}>
            <Input placeholder="Title" {...register('title', { required: true })} />
            <Input placeholder="URL" {...register('url')} />
            <select className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('resource_type')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Input placeholder="Category" {...register('category')} />
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" {...register('bookmarked')} />
              Bookmarked
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-400/60"
              placeholder="Markdown notes…"
              {...register('notes')}
            />
            <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
              Save
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Library</CardTitle>
              <CardDescription className="mt-2">Client-side search across title + notes</CardDescription>
            </div>
            <Input className="lg:w-72" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(r)}
                className="rounded-2xl bg-white/[0.03] p-4 text-left ring-1 ring-white/10 hover:bg-white/[0.05]"
              >
                <div className="text-sm font-semibold text-white">{r.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {r.resource_type} · {r.category}
                </div>
                {r.url ? (
                  <div className="mt-2 truncate text-xs text-indigo-300">{r.url}</div>
                ) : null}
              </button>
            ))}
            {filtered.length === 0 ? <div className="text-sm text-zinc-500">No resources.</div> : null}
          </div>
        </Card>
      </div>

      {active ? (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{active.title}</CardTitle>
              <CardDescription className="mt-2">{active.url}</CardDescription>
            </div>
            <Button type="button" variant="ghost" onClick={() => setActive(null)}>
              Close
            </Button>
          </div>
          <div className="mt-4 max-w-none space-y-3 text-sm leading-relaxed text-zinc-200 [&_a]:text-indigo-300 [&_code]:rounded-md [&_code]:bg-black/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
            <Markdown>{active.notes || '_No notes yet._'}</Markdown>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
