import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'

type Roadmap = Record<string, { status: string; notes: string }>

export function Labs() {
  const [data, setData] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await api.get<Roadmap>('/integrations/roadmap')
        setData(data)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load roadmap')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const entries = data ? Object.entries(data) : []

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Labs</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">AI + integrations</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          This page is intentionally roadmap-first: the backend exposes a stable placeholder contract while you iterate on
          real providers.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {entries.map(([key, val]) => (
          <Card key={key}>
            <CardTitle className="font-mono text-xs text-indigo-200">{key}</CardTitle>
            <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{val.status}</div>
            <CardDescription className="mt-3">{val.notes}</CardDescription>
          </Card>
        ))}
      </div>
    </div>
  )
}
