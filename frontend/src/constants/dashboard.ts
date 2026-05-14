export const DEFAULT_DASHBOARD_ORDER = [
  'welcome',
  'quote',
  'tasks',
  'dsa',
  'consistency',
  'projects',
  'deadlines',
  'apps',
  'streak',
  'focus',
  'study',
  'skills',
] as const

export type DashboardWidgetId = (typeof DEFAULT_DASHBOARD_ORDER)[number]
