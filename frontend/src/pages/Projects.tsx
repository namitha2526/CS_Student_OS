import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Code2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { Project } from '../types/models'

export function Projects() {
  const [rows, setRows] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await api.get<Project[]>('/projects')
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
      project_name: '',
      description: '',
      github_link: '',
      deployment_link: '',
      tech_stack: 'React,FastAPI,SQLite',
      progress: 0,
      status: 'idea',
      deadline: '',
      notes: '',
    },
  })

  const onCreate = handleSubmit(async (values) => {
    try {
      const tech_stack = values.tech_stack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await api.post('/projects', {
        ...values,
        tech_stack,
        progress: Number(values.progress || 0),
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        attachments_meta: [],
      })
      toast.success('Project added')
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
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Projects</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Build portfolio</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Milestones, deployment links, tech stack tags, and file metadata placeholders.</p>
      </div>

      <Card>
        <CardTitle>New project</CardTitle>
        <form className="mt-4 grid gap-3 lg:grid-cols-6" onSubmit={onCreate}>
          <Input className="lg:col-span-2" placeholder="Name" {...register('project_name', { required: true })} />
          <select className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm lg:col-span-2" {...register('status')}>
            {['idea', 'active', 'paused', 'shipped'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input type="number" min={0} max={100} placeholder="Progress %" {...register('progress', { valueAsNumber: true })} />
          <Input type="datetime-local" {...register('deadline')} />
          <Input className="lg:col-span-3" placeholder="GitHub" {...register('github_link')} />
          <Input className="lg:col-span-3" placeholder="Deployment" {...register('deployment_link')} />
          <Input className="lg:col-span-3" placeholder="Tech stack (comma separated)" {...register('tech_stack')} />
          <Input className="lg:col-span-3" placeholder="Description" {...register('description')} />
          <Input className="lg:col-span-6" placeholder="Notes" {...register('notes')} />
          <Button type="submit" disabled={formState.isSubmitting}>
            Save
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{p.project_name}</CardTitle>
                <CardDescription className="mt-2">{p.description || '—'}</CardDescription>
              </div>
              <div className="text-right text-sm font-semibold text-emerald-300">{p.progress}%</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(p.tech_stack ?? []).map((t) => (
                <span key={String(t)} className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-200 ring-1 ring-white/10">
                  {String(t)}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.github_link ? (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-100 ring-1 ring-white/10 hover:bg-white/10"
                  href={p.github_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Code2 className="h-4 w-4" />
                  GitHub
                </a>
              ) : null}
              {p.deployment_link ? (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-100 ring-1 ring-white/10 hover:bg-white/10"
                  href={p.deployment_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live
                </a>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="ml-auto px-3 py-2 text-xs"
                onClick={async () => {
                  try {
                    await api.delete(`/projects/${p.id}`)
                    toast.success('Deleted')
                    await load()
                  } catch (e: unknown) {
                    toast.error(e instanceof Error ? e.message : 'Delete failed')
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
