import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card, CardDescription, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export function Settings() {
  const { user, refreshUser, logout } = useAuth()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const prefs = useMemo(() => (user?.preferences ?? {}) as Record<string, unknown>, [user])

  const profile = useForm({ defaultValues: { username: user?.username ?? '', email: user?.email ?? '' } })
  const password = useForm({ defaultValues: { current_password: '', new_password: '' } })

  const onProfile = profile.handleSubmit(async (values) => {
    try {
      await api.patch('/users/me/profile', values)
      toast.success('Profile updated')
      await refreshUser()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  })

  const onPassword = password.handleSubmit(async (values) => {
    try {
      await api.post('/users/me/password', values)
      toast.success('Password updated')
      password.reset()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  })

  const exportJson = async () => {
    try {
      setBusy(true)
      const { data } = await api.get('/settings/data/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cs-student-os-export-${user?.username ?? 'user'}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  const importJson = async (file: File | null) => {
    if (!file) return
    try {
      setBusy(true)
      const text = await file.text()
      const data = JSON.parse(text) as Record<string, unknown>
      await api.post('/settings/data/import', { data })
      toast.success('Import complete (replaced existing module data)')
      await refreshUser()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Settings</div>
        <h1 className="mt-2 text-2xl font-semibold text-white">Control center</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">Profile, security, theme preferences, and JSON backup/restore.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Profile</CardTitle>
          <CardDescription className="mt-2">Username + email</CardDescription>
          <form className="mt-4 space-y-3" onSubmit={onProfile}>
            <Input placeholder="Username" {...profile.register('username', { required: true })} />
            <Input type="email" placeholder="Email" {...profile.register('email', { required: true })} />
            <Button type="submit" disabled={profile.formState.isSubmitting}>
              Save
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Security</CardTitle>
          <CardDescription className="mt-2">Change password</CardDescription>
          <form className="mt-4 space-y-3" onSubmit={onPassword}>
            <Input type="password" placeholder="Current password" {...password.register('current_password', { required: true })} />
            <Input type="password" placeholder="New password (8+)" {...password.register('new_password', { required: true, minLength: 8 })} />
            <Button type="submit" variant="subtle" disabled={password.formState.isSubmitting}>
              Update password
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardTitle>Theme + notifications</CardTitle>
        <CardDescription className="mt-2">Stored in your user preferences JSON (local-first).</CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              try {
                await api.patch('/users/me/preferences', { theme: 'dark' })
                await refreshUser()
                toast.success('Theme set to dark')
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : 'Failed')
              }
            }}
          >
            Force dark
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              try {
                await api.patch('/users/me/preferences', {
                  notifications: { email: false, browser: true },
                })
                await refreshUser()
                toast.success('Notification prefs updated (browser placeholder)')
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : 'Failed')
              }
            }}
          >
            Toggle browser notifications (placeholder)
          </Button>
        </div>
        <pre className="mt-4 max-h-56 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300 ring-1 ring-white/10">
          {JSON.stringify(prefs, null, 2)}
        </pre>
      </Card>

      <Card>
        <CardTitle>Backup / restore</CardTitle>
        <CardDescription className="mt-2">
          Export downloads a JSON snapshot. Import replaces module data for your account (see API docs).
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void exportJson()} disabled={busy}>
            Export JSON
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
            Import JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => void importJson(e.target.files?.[0] ?? null)} />
        </div>
      </Card>

      <Card>
        <CardTitle>Session</CardTitle>
        <Button type="button" variant="danger" onClick={logout}>
          Log out everywhere (local token)
        </Button>
      </Card>
    </div>
  )
}
