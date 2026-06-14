import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Stores from './pages/Stores'
import StoreDetail from './pages/StoreDetail'
import StoreForm from './pages/StoreForm'
import Visits from './pages/Visits'
import VisitForm from './pages/VisitForm'
import Agenda from './pages/Agenda'
import AgendaForm from './pages/AgendaForm'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import LoadingScreen from './components/ui/LoadingScreen'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="stores" element={<Stores />} />
        <Route path="stores/new" element={<StoreForm />} />
        <Route path="stores/:id" element={<StoreDetail />} />
        <Route path="stores/:id/edit" element={<StoreForm />} />
        <Route path="visits" element={<Visits />} />
        <Route path="visits/new" element={<VisitForm />} />
        <Route path="visits/:id" element={<VisitForm />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="agenda/new" element={<AgendaForm />} />
        <Route path="agenda/:id/edit" element={<AgendaForm />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}