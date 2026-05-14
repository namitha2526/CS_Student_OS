import { Flame, Quote, Sparkles, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Card, CardDescription, CardTitle } from '../../components/ui/Card'
import type { DashboardSummary } from '../../types/models'

export function WelcomeWidget({ name }: { name: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-transparent to-fuchsia-500/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/80">Welcome</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Hey {name} — ship the day.</h2>
          <CardDescription className="mt-2 max-w-prose">
            Your dashboard is modular, draggable, and tuned for placement velocity: tasks, DSA, applications, and deep
            work in one surface.
          </CardDescription>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:block">
          <Sparkles className="h-6 w-6 text-fuchsia-300" />
        </div>
      </div>
    </Card>
  )
}

export function QuoteWidget({ text }: { text: string }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
          <Quote className="h-4 w-4 text-cyan-300" />
        </div>
        <div>
          <CardTitle>Daily momentum</CardTitle>
          <CardDescription className="mt-2 text-base leading-relaxed text-zinc-200">{text}</CardDescription>
        </div>
      </div>
    </Card>
  )
}

export function TodayTasksWidget({ tasks }: { tasks: DashboardSummary['today_tasks'] }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Today&apos;s tasks</CardTitle>
        <Badge>{tasks.length} active</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {tasks.length === 0 ? (
          <CardDescription>Nothing queued — add a task and come back.</CardDescription>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">
              <div className="min-w-0">
                <div className="truncate text-sm text-zinc-100">{t.title}</div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {t.priority} · {t.status.replace('_', ' ')}
                </div>
              </div>
              {t.deadline ? <div className="shrink-0 text-xs text-zinc-400">{t.deadline.slice(0, 10)}</div> : null}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export function DsaOverviewWidget({ data }: { data: DashboardSummary }) {
  return (
    <Card>
      <CardTitle>DSA progress</CardTitle>
      <CardDescription className="mt-2">Solved vs tracked problems</CardDescription>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold text-white">{data.dsa_solved_total}</div>
          <div className="text-xs text-zinc-500">problems solved</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-emerald-300">{data.dsa_solved_percent}%</div>
          <div className="text-xs text-zinc-500">of your library</div>
        </div>
      </div>
    </Card>
  )
}

export function ConsistencyWidget({ points }: { points: DashboardSummary['weekly_consistency'] }) {
  const max = Math.max(1, ...points.map((p) => p.value))
  return (
    <Card>
      <CardTitle>Weekly consistency</CardTitle>
      <CardDescription className="mt-2">Focus minutes (last 7 days)</CardDescription>
      <div className="mt-4 flex items-end gap-2">
        {points.map((p) => (
          <div key={p.label} className="flex-1">
            <div
              className="mx-auto w-full max-w-[44px] rounded-xl bg-gradient-to-t from-indigo-500/30 to-cyan-400/40 ring-1 ring-white/10"
              style={{ height: `${Math.round((p.value / max) * 120) || 6}px` }}
            />
            <div className="mt-2 text-center text-[11px] text-zinc-500">{p.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ProjectsWidget({ projects }: { projects: DashboardSummary['active_projects'] }) {
  return (
    <Card>
      <CardTitle>Active projects</CardTitle>
      <div className="mt-4 space-y-2">
        {projects.length === 0 ? (
          <CardDescription>No active projects yet.</CardDescription>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">
              <div className="min-w-0 truncate text-sm text-zinc-100">{p.name}</div>
              <div className="shrink-0 text-xs text-zinc-400">{p.progress}%</div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export function DeadlinesWidget({ items }: { items: DashboardSummary['upcoming_deadlines'] }) {
  return (
    <Card>
      <CardTitle>Upcoming deadlines</CardTitle>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <CardDescription>No deadlines on the radar.</CardDescription>
        ) : (
          items.map((d, idx) => (
            <div key={`${d.type}-${d.title}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">
              <div className="min-w-0">
                <div className="truncate text-sm text-zinc-100">{d.title}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{d.type}</div>
              </div>
              {d.deadline ? <div className="shrink-0 text-xs text-zinc-400">{d.deadline.slice(0, 10)}</div> : null}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export function ApplicationsWidget({ stats }: { stats: Record<string, number> }) {
  const entries = Object.entries(stats)
  return (
    <Card>
      <CardTitle>Internship pipeline</CardTitle>
      <CardDescription className="mt-2">Applications by stage</CardDescription>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {entries.length === 0 ? (
          <CardDescription className="col-span-2">No applications yet.</CardDescription>
        ) : (
          entries.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">
              <div className="text-xs text-zinc-500">{k}</div>
              <div className="mt-1 text-lg font-semibold text-white">{v}</div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export function StreakWidget({ days }: { days: number }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Productivity streak</CardTitle>
          <CardDescription className="mt-2">Consecutive days with logged focus sessions</CardDescription>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <Flame className="h-6 w-6 text-orange-300" />
        </div>
      </div>
      <div className="mt-4 text-4xl font-semibold text-white">{days}</div>
      <div className="text-xs text-zinc-500">day streak</div>
    </Card>
  )
}

export function FocusWidget() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Focus timer</CardTitle>
          <CardDescription className="mt-2">Jump into Pomodoro mode — sessions auto-log for analytics.</CardDescription>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <Timer className="h-6 w-6 text-indigo-300" />
        </div>
      </div>
      <Link
        to="/focus"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-white/10"
      >
        Open focus mode
      </Link>
    </Card>
  )
}

export function StudyHoursWidget({ hours }: { hours: number }) {
  return (
    <Card>
      <CardTitle>Study hours (7d)</CardTitle>
      <CardDescription className="mt-2">Estimated from completed focus sessions</CardDescription>
      <div className="mt-4 text-4xl font-semibold text-white">{hours}</div>
      <div className="text-xs text-zinc-500">hours this week</div>
    </Card>
  )
}

export function SkillGrowthWidget() {
  const skills = ['System design', 'OS internals', 'Networking', 'DB tuning', 'Frontend perf']
  return (
    <Card>
      <CardTitle>Skill growth</CardTitle>
      <CardDescription className="mt-2">A lightweight radar for what you are actively training</CardDescription>
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-200 ring-1 ring-white/10">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-zinc-500">
        Tip: tie skills to projects + learning resources for clearer progression.
      </div>
    </Card>
  )
}
