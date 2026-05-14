export type User = {
  id: number
  username: string
  email: string
  created_at: string
  preferences?: Record<string, unknown> | null
}

export type Task = {
  id: number
  user_id: number
  title: string
  description?: string | null
  deadline?: string | null
  priority: string
  category?: string | null
  status: string
  estimated_time?: number | null
  completed: boolean
  completed_at?: string | null
  tags?: unknown[] | null
  recurrence?: string | null
  created_at: string
}

export type DSAProblem = {
  id: number
  user_id: number
  problem_name: string
  platform: string
  topic: string
  difficulty: string
  status: string
  revision_date?: string | null
  notes?: string | null
  link?: string | null
  bookmarked: boolean
  solved_at?: string | null
  created_at: string
}

export type JobApplication = {
  id: number
  user_id: number
  company: string
  role: string
  location?: string | null
  salary?: string | null
  status: string
  applied_date?: string | null
  interview_date?: string | null
  notes?: string | null
  job_link?: string | null
  resume_version?: string | null
  follow_up_date?: string | null
  created_at: string
}

export type Project = {
  id: number
  user_id: number
  project_name: string
  description?: string | null
  github_link?: string | null
  deployment_link?: string | null
  tech_stack?: unknown[] | null
  progress: number
  status: string
  deadline?: string | null
  notes?: string | null
  attachments_meta?: unknown[] | null
  created_at: string
}

export type Habit = {
  id: number
  user_id: number
  name: string
  category: string
  color: string
  created_at: string
  current_streak: number
  completion_rate_30d: number
}

export type LearningResource = {
  id: number
  user_id: number
  title: string
  url?: string | null
  resource_type: string
  category: string
  notes?: string | null
  bookmarked: boolean
  created_at: string
}

export type WeeklyReview = {
  id: number
  user_id: number
  week_start: string
  wins?: string | null
  losses?: string | null
  reflection?: string | null
  goals_completion_rate: number
  auto_summary?: string | null
  created_at: string
}

export type DashboardSummary = {
  quote: string
  productivity_streak_days: number
  study_hours_week: number
  tasks_completed_week: number
  dsa_solved_total: number
  dsa_solved_percent: number
  applications_by_status: Record<string, number>
  upcoming_deadlines: { type: string; title: string; deadline: string | null }[]
  active_projects: { id: number; name: string; progress: number; status: string }[]
  weekly_consistency: { label: string; value: number }[]
  today_tasks: { id: number; title: string; status: string; priority: string; deadline: string | null }[]
}
