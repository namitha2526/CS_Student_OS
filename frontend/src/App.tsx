import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { Analytics } from './pages/Analytics'
import { Applications } from './pages/Applications'
import { Dashboard } from './pages/Dashboard'
import { DSA } from './pages/DSA'
import { Focus } from './pages/Focus'
import { Habits } from './pages/Habits'
import { Labs } from './pages/Labs'
import { Learn } from './pages/Learn'
import { Login } from './pages/Login'
import { Projects } from './pages/Projects'
import { Register } from './pages/Register'
import { Review } from './pages/Review'
import { Settings } from './pages/Settings'
import { Tasks } from './pages/Tasks'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/dsa" element={<DSA />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/review" element={<Review />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/labs" element={<Labs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
