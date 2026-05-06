import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSurchargeAutomation } from '../../hooks/useSurchargeAutomation'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  useSurchargeAutomation()

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login')
      else if (profile?.role === 'socio') navigate('/cliente')
    }
  }, [user, profile, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-studio-subtext text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || profile.role === 'socio') return null

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
