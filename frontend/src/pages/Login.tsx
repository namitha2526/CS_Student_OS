import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

type Form = { username: string; password: string }

export function Login() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }
  const { register, handleSubmit, formState } = useForm<Form>({ defaultValues: { username: '', password: '' } })

  if (user) return <Navigate to={loc.state?.from || '/'} replace />

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.username, values.password)
      toast.success('Welcome back')
      nav(loc.state?.from || '/', { replace: true })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    }
  })

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full p-8">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">CS Student OS</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-400">JWT-secured local workspace. Try demo / Password123!</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Username</label>
            <Input autoComplete="username" {...register('username', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Password</label>
            <Input type="password" autoComplete="current-password" {...register('password', { required: true })} />
          </div>
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Signing in…' : 'Continue'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          New here?{' '}
          <Link className="text-indigo-300 hover:text-indigo-200" to="/register">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  )
}
