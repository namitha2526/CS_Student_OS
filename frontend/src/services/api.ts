import axios from 'axios'

const rawBase = import.meta.env.VITE_API_URL as string | undefined
export const API_BASE = rawBase?.replace(/\/$/, '') ?? ''

export const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('csos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.detail
    if (typeof msg === 'string') {
      err.message = msg
    } else if (Array.isArray(msg)) {
      err.message = msg.map((m: { msg?: string }) => m?.msg).filter(Boolean).join(', ')
    }
    return Promise.reject(err)
  },
)
