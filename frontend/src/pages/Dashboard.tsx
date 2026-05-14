import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '../components/ui/Skeleton'
import { DEFAULT_DASHBOARD_ORDER, type DashboardWidgetId } from '../constants/dashboard'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import type { DashboardSummary } from '../types/models'
import {
  ApplicationsWidget,
  ConsistencyWidget,
  DeadlinesWidget,
  DsaOverviewWidget,
  FocusWidget,
  ProjectsWidget,
  QuoteWidget,
  SkillGrowthWidget,
  StreakWidget,
  StudyHoursWidget,
  TodayTasksWidget,
  WelcomeWidget,
} from './dashboard/widgets'

const LS_KEY = 'csos_dashboard_order'

function normalizeOrder(raw: unknown): DashboardWidgetId[] {
  const allowed = new Set<string>([...DEFAULT_DASHBOARD_ORDER])
  const arr = Array.isArray(raw) ? raw.map(String) : []
  const filtered = arr.filter((id) => allowed.has(id)) as DashboardWidgetId[]
  for (const id of DEFAULT_DASHBOARD_ORDER) {
    if (!filtered.includes(id)) filtered.push(id)
  }
  return filtered
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-lg bg-black/30 p-2 text-zinc-300 ring-1 ring-white/10 hover:bg-black/40"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  )
}

export function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<DashboardWidgetId[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) return normalizeOrder(JSON.parse(raw))
    } catch {
      // ignore
    }
    return [...DEFAULT_DASHBOARD_ORDER]
  })

  useEffect(() => {
    const prefsOrder = user?.preferences && (user.preferences as { dashboard_order?: string[] }).dashboard_order
    if (prefsOrder?.length) {
      setOrder(normalizeOrder(prefsOrder))
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap prefs once per user

  useEffect(() => {
    const run = async () => {
      try {
        const { data: d } = await api.get<DashboardSummary>('/analytics/dashboard')
        setData(d)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(order))
  }, [order])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id as DashboardWidgetId)
    const newIndex = order.indexOf(over.id as DashboardWidgetId)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(order, oldIndex, newIndex)
    setOrder(next)
    try {
      await api.patch('/users/me/preferences', { dashboard_order: next })
      await refreshUser()
    } catch {
      toast.error('Could not persist dashboard order (saved locally)')
    }
  }

  const widgets = useMemo(() => {
    if (!data || !user) return null
    const map: Record<DashboardWidgetId, ReactNode> = {
      welcome: <WelcomeWidget name={user.username} />,
      quote: <QuoteWidget text={data.quote} />,
      tasks: <TodayTasksWidget tasks={data.today_tasks} />,
      dsa: <DsaOverviewWidget data={data} />,
      consistency: <ConsistencyWidget points={data.weekly_consistency} />,
      projects: <ProjectsWidget projects={data.active_projects} />,
      deadlines: <DeadlinesWidget items={data.upcoming_deadlines} />,
      apps: <ApplicationsWidget stats={data.applications_by_status} />,
      streak: <StreakWidget days={data.productivity_streak_days} />,
      focus: <FocusWidget />,
      study: <StudyHoursWidget hours={data.study_hours_week} />,
      skills: <SkillGrowthWidget />,
    }
    return map
  }, [data, user])

  if (loading || !widgets) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44 lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Dashboard</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Command center</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Drag cards to reorder. Order syncs to your profile when the API is reachable, and stays cached in localStorage
          for offline tweaks.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4 lg:grid-cols-2">
            {order.map((id) => (
              <SortableCard key={id} id={id}>
                {widgets[id]}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
