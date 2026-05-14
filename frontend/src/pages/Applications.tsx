import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { JobApplication } from '../types/models'
import { cn } from '../lib/cn'

const STATUSES = ['wishlist', 'applied', 'oa', 'interview', 'rejected', 'offer'] as const

export function Applications() {
  const [rows, setRows] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await api.get<JobApplication[]>('/applications')
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

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: {
      company: '',
      role: '',
      location: '',
      salary: '',
      status: 'wishlist',
      job_link: '',
      resume_version: '',
      notes: '',
    },
  })

  const onCreate = handleSubmit(async (values) => {
    try {
      await api.post('/applications', values)
      toast.success('Tracked')
      reset()
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    }
  })

  const grouped = useMemo(() => {
    const m: Record<string, JobApplication[]> = {}
    for (const s of STATUSES) m[s] = []
    for (const r of rows) {
      const k = STATUSES.includes(r.status as (typeof STATUSES)[number]) ? r.status : 'wishlist'
      m[k].push(r)
    }
    return m
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
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Placements</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Application CRM</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Pipeline stages, resume versions, follow-ups, and analytics-ready structure.</p>
      </div>

      <Card>
        <CardTitle>Add application</CardTitle>
        <form className="mt-4 grid gap-3 lg:grid-cols-6" onSubmit={onCreate}>
          <Input className="lg:col-span-2" placeholder="Company" {...register('company', { required: true })} />
          <Input className="lg:col-span-2" placeholder="Role" {...register('role', { required: true })} />
          <Input placeholder="Location" {...register('location')} />
          <select className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm" {...register('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input placeholder="Salary / stipend" {...register('salary')} />
          <Input placeholder="Job link" {...register('job_link')} />
          <Input placeholder="Resume version" {...register('resume_version')} />
          <Input className="lg:col-span-3" placeholder="Notes" {...register('notes')} />
          <Button type="submit" className="lg:col-span-1" disabled={formState.isSubmitting}>
            Save
          </Button>
        </form>
      </Card>

      <div className="grid gap-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <Card key={s} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold capitalize text-white">{s}</div>
              <Badge>{grouped[s].length}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {grouped[s].map((a) => (
                <div key={a.id} className={cn('rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10')}>
                  <div className="text-sm font-medium text-zinc-100">{a.company}</div>
                  <div className="mt-1 text-xs text-zinc-500">{a.role}</div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={async () => {
                        try {
                          await api.delete(`/applications/${a.id}`)
                          toast.success('Removed')
                          await load()
                        } catch (e: unknown) {
                          toast.error(e instanceof Error ? e.message : 'Delete failed')
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {grouped[s].length === 0 ? <div className="text-xs text-zinc-600">Empty</div> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
