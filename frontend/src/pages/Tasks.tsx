import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { CalendarDays, KanbanSquare, List } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../services/api'
import type { Task } from '../types/models'
import { cn } from '../lib/cn'

const STATUSES = ['pending', 'in_progress', 'completed', 'missed'] as const
type Status = (typeof STATUSES)[number]

type TaskForm = {
  title: string
  description?: string
  priority: string
  status: string
  deadline?: string
  category?: string
  estimated_time?: number
  recurrence?: string
}

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task-${task.id}` })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(isDragging && 'opacity-60')}>
      <Card className="cursor-grab p-4 active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{task.title}</div>
            <div className="mt-1 text-xs text-zinc-500">{task.priority}</div>
          </div>
          <Badge>{task.status.replace('_', ' ')}</Badge>
        </div>
        {task.deadline ? <div className="mt-2 text-xs text-zinc-400">{format(parseISO(task.deadline), 'MMM d')}</div> : null}
      </Card>
    </div>
  )
}

function Column({ id, title, children }: { id: Status; title: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={cn('min-h-[320px] rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/10', isOver && 'ring-indigo-400/40')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-100">{title}</div>
        <div className="text-xs text-zinc-500">{id}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export function Tasks() {
  const [tab, setTab] = useState<'list' | 'board' | 'calendar'>('list')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [month, setMonth] = useState(() => new Date())

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const load = async () => {
    try {
      const { data } = await api.get<Task[]>('/tasks')
      setTasks(data)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const { register, handleSubmit, reset, formState } = useForm<TaskForm>({
    defaultValues: { title: '', description: '', priority: 'medium', status: 'pending', category: '', recurrence: '' },
  })

  const onCreate = handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        estimated_time: values.estimated_time ? Number(values.estimated_time) : null,
        recurrence: values.recurrence || null,
        tags: [],
        completed: values.status === 'completed',
      }
      await api.post('/tasks', payload)
      toast.success('Task created')
      reset()
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
    }
  })

  const grouped = useMemo(() => {
    const map: Record<Status, Task[]> = { pending: [], in_progress: [], completed: [], missed: [] }
    for (const t of tasks) {
      const s = (STATUSES.includes(t.status as Status) ? t.status : 'pending') as Status
      map[s].push(t)
    }
    return map
  }, [tasks])

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null)
    const overId = e.over?.id
    const active = String(e.active.id)
    if (!overId || !active.startsWith('task-')) return
    const taskId = Number(active.replace('task-', ''))
    const newStatus = String(overId) as Status
    if (!STATUSES.includes(newStatus)) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus, completed: newStatus === 'completed' })
      toast.success('Updated')
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const activeTask = activeId?.startsWith('task-') ? tasks.find((t) => t.id === Number(activeId.replace('task-', ''))) : undefined

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const pad = monthStart.getDay()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Tasks</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Task OS</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">Kanban, calendar, filters, and recurring tasks — built for placement crunch windows.</p>
        </div>
        <div className="inline-flex rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
          {(
            [
              ['list', List, 'List'],
              ['board', KanbanSquare, 'Board'],
              ['calendar', CalendarDays, 'Calendar'],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
                tab === key ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardTitle>New task</CardTitle>
        <CardDescription className="mt-2">Fast capture — you can refine in-place later.</CardDescription>
        <form className="mt-4 grid gap-3 lg:grid-cols-6" onSubmit={onCreate}>
          <div className="lg:col-span-2">
            <Input placeholder="Title" {...register('title', { required: true })} />
          </div>
          <Input placeholder="Category" {...register('category')} />
          <select
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            {...register('priority')}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
          <select
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
            {...register('status')}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input type="datetime-local" {...register('deadline')} />
          <Input type="number" placeholder="Est. minutes" {...register('estimated_time', { valueAsNumber: true })} />
          <select
            className="rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 lg:col-span-2"
            {...register('recurrence')}
          >
            <option value="">no recurrence</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
          <Input className="lg:col-span-3" placeholder="Description" {...register('description')} />
          <Button type="submit" className="lg:col-span-1" disabled={formState.isSubmitting}>
            Add
          </Button>
        </form>
      </Card>

      {tab === 'list' ? (
        <Card>
          <CardTitle>All tasks</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Deadline</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={t.id} className="text-zinc-200">
                    <td className="py-3 font-medium text-white">{t.title}</td>
                    <td className="py-3 text-zinc-400">{t.priority}</td>
                    <td className="py-3 text-zinc-400">{t.status}</td>
                    <td className="py-3 text-zinc-400">{t.deadline ? format(parseISO(t.deadline), 'MMM d, HH:mm') : '—'}</td>
                    <td className="py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 py-1 text-xs"
                        onClick={async () => {
                          try {
                            await api.delete(`/tasks/${t.id}`)
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
            {tasks.length === 0 ? <div className="py-10 text-center text-sm text-zinc-500">No tasks yet.</div> : null}
          </div>
        </Card>
      ) : null}

      {tab === 'board' ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-4">
            <Column id="pending" title="Pending">
              {grouped.pending.map((t) => (
                <DraggableTask key={t.id} task={t} />
              ))}
            </Column>
            <Column id="in_progress" title="In progress">
              {grouped.in_progress.map((t) => (
                <DraggableTask key={t.id} task={t} />
              ))}
            </Column>
            <Column id="completed" title="Completed">
              {grouped.completed.map((t) => (
                <DraggableTask key={t.id} task={t} />
              ))}
            </Column>
            <Column id="missed" title="Missed">
              {grouped.missed.map((t) => (
                <DraggableTask key={t.id} task={t} />
              ))}
            </Column>
          </div>
          <DragOverlay>
            {activeTask ? (
              <Card className="p-4">
                <div className="text-sm font-medium text-white">{activeTask.title}</div>
                <div className="mt-1 text-xs text-zinc-500">{activeTask.priority}</div>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {tab === 'calendar' ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{format(month, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                Prev
              </Button>
              <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                Next
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-zinc-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
            {Array.from({ length: pad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[92px]" />
            ))}
            {monthDays.map((day) => {
              const dayTasks = tasks.filter((t) => t.deadline && isSameDay(parseISO(t.deadline), day))
              return (
                <div key={day.toISOString()} className="min-h-[92px] rounded-xl bg-white/[0.02] p-2 ring-1 ring-white/10">
                  <div className="text-xs text-zinc-400">{format(day, 'd')}</div>
                  <div className="mt-2 space-y-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="truncate rounded-lg bg-indigo-500/15 px-2 py-1 text-[11px] text-indigo-100 ring-1 ring-indigo-500/20">
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 ? <div className="text-[11px] text-zinc-500">+{dayTasks.length - 3} more</div> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
