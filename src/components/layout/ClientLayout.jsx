import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ClientLayout() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login')
      else if (profile && profile.role !== 'socio') navigate('/admin')
    }
  }, [user, profile, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'socio') return null

  return <Outlet />
}
