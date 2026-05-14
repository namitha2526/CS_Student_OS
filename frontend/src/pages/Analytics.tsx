import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'

export function Analytics() {
  const [tasks, setTasks] = useState<{ label: string; completed: number }[]>([])
  const [focus, setFocus] = useState<{ label: string; minutes: number }[]>([])
  const [dsa, setDsa] = useState<{ topic: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const [t, f, d] = await Promise.all([
          api.get('/analytics/trends/tasks'),
          api.get('/analytics/trends/focus'),
          api.get('/analytics/trends/dsa-topics'),
        ])
        setTasks(t.data as { label: string; completed: number }[])
        setFocus(f.data as { label: string; minutes: number }[])
        setDsa(d.data as { topic: string; count: number }[])
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load analytics')
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

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Analytics</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Insights</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Cross-module trends for tasks, focus minutes, and DSA topic mix.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Task completions (7d)</CardTitle>
          <CardDescription className="mt-2">Based on completed_at timestamps</CardDescription>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasks}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0b0b10', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="completed" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Focus minutes (7d)</CardTitle>
          <CardDescription className="mt-2">Summed Pomodoro focus sessions</CardDescription>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focus}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0b0b10', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="minutes" fill="#22d3ee" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>DSA topic mix</CardTitle>
        <CardDescription className="mt-2">Counts across your tracked problems</CardDescription>
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dsa} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
              <YAxis type="category" dataKey="topic" stroke="#a1a1aa" fontSize={12} width={110} />
              <Tooltip contentStyle={{ background: '#0b0b10', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
