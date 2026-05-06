import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import SplashScreen from './components/SplashScreen'
import LoginPage from './pages/LoginPage'
import AdminLayout from './components/layout/AdminLayout'
import ClientLayout from './components/layout/ClientLayout'
import DashboardPage from './pages/admin/DashboardPage'
import SociosPage from './pages/admin/SociosPage'
import PagosPage from './pages/admin/PagosPage'
import AsistenciaPage from './pages/admin/AsistenciaPage'
import CalendarioPage from './pages/admin/CalendarioPage'
import ConfiguracionPage from './pages/admin/ConfiguracionPage'
import ClientPortal from './pages/client/ClientPortal'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashComplete = useCallback(() => setSplashDone(true), [])

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      {splashDone && (
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Admin / Staff */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="socios" element={<SociosPage />} />
                  <Route path="pagos" element={<PagosPage />} />
                  <Route path="asistencia" element={<AsistenciaPage />} />
                  <Route path="calendario" element={<CalendarioPage />} />
                  <Route path="configuracion" element={<ConfiguracionPage />} />
                </Route>

                {/* Client portal */}
                <Route path="/cliente" element={<ClientLayout />}>
                  <Route index element={<ClientPortal />} />
                </Route>

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      )}
    </>
  )
}
