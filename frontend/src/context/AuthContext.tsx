import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import type { User } from '../types/models'

type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<User>('/users/me')
    setUser(data)
  }, [])

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('csos_token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        await refreshUser()
      } catch {
        localStorage.removeItem('csos_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    void boot()
  }, [refreshUser])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { username, password })
    localStorage.setItem('csos_token', data.access_token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password })
    localStorage.setItem('csos_token', data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('csos_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
