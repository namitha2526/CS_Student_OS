import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

type Form = { username: string; email: string; password: string }

export function Register() {
  const { register: regUser, user } = useAuth()
  const { register, handleSubmit, formState } = useForm<Form>({
    defaultValues: { username: '', email: '', password: '' },
  })

  if (user) return <Navigate to="/" replace />

  const onSubmit = handleSubmit(async (values) => {
    try {
      await regUser(values.username, values.email, values.password)
      toast.success('Account created')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Registration failed')
    }
  })

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full p-8">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300/90">CS Student OS</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Create account</h1>
          <p className="mt-2 text-sm text-zinc-400">Everything stays local-first with SQLite + offline-friendly UX.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Username</label>
            <Input autoComplete="username" {...register('username', { required: true, minLength: 2 })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <Input type="email" autoComplete="email" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Password (8+ chars)</label>
            <Input type="password" autoComplete="new-password" {...register('password', { required: true, minLength: 8 })} />
          </div>
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link className="text-indigo-300 hover:text-indigo-200" to="/login">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
