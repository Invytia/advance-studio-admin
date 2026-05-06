import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MEMBERSHIPS, PAYMENT_STATUSES, MEMBER_STATUSES } from '../../utils/constants'
import { formatCurrency, formatDate, formatDateTime, isOverdue, calculateSurcharge, generateQRDataURL, downloadQR, getClassesAlert } from '../../utils/helpers'
import { Alert, StatusBadge, Spinner } from '../../components/ui'
import { format, setDate } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClientPortal() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [socio, setSocio] = useState(null)
  const [payments, setPayments] = useState([])
  const [attendance, setAttendance] = useState([])
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumen')
  const overdueNow = isOverdue()

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (profile && profile.role !== 'socio') { navigate('/admin'); return }
    if (profile) loadData()
  }, [user, profile])

  async function loadData() {
    const [socioRes, paymentsRes, attRes] = await Promise.all([
      supabase.from('socios').select('*').eq('email', profile.email).single(),
      supabase.from('payments').select('*').eq('socio_id', profile.id).order('created_at', { ascending: false }).limit(12),
      supabase.from('attendance').select('*').eq('socio_id', profile.id).order('date', { ascending: false }).limit(30),
    ])

    if (socioRes.data) {
      setSocio(socioRes.data)
      const url = await generateQRDataURL(socioRes.data.qr_code || socioRes.data.id)
      setQrUrl(url)
    }
    setPayments(paymentsRes.data || [])
    setAttendance(attRes.data || [])
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!socio) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-studio-subtext mb-4">Tu cuenta no está vinculada a ningún socio.</p>
          <p className="text-studio-subtext text-sm">Contacta al administrador del estudio.</p>
          <button onClick={handleSignOut} className="btn-ghost mt-4">Cerrar sesión</button>
        </div>
      </div>
    )
  }

  const remaining = (socio.classes_total || 0) - (socio.classes_used || 0)
  const classAlert = getClassesAlert(remaining)
  const pct = socio.classes_total > 0 ? ((socio.classes_used / socio.classes_total) * 100) : 0
  const mem = MEMBERSHIPS.find(m => m.id === socio.membership_type)
  const latestPayment = payments[0]
  const deadline = setDate(new Date(), 5)
  const surcharge = latestPayment && overdueNow && latestPayment.status === 'pending'
    ? calculateSurcharge(latestPayment.original_amount || latestPayment.amount) : 0

  const tabs = [
    { id: 'resumen', label: 'Mi Membresía' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'asistencia', label: 'Historial' },
    { id: 'qr', label: 'Mi QR' },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-studio-border px-4 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <p className="font-display text-lg text-white leading-none tracking-wide">ADVANCE</p>
            <p className="text-[10px] text-studio-subtext tracking-widest">Mi Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{profile?.name || socio.name}</p>
            <p className="text-studio-subtext text-xs">{mem?.name}</p>
          </div>
          <button onClick={handleSignOut} className="btn-ghost text-xs py-2 px-3">Salir</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 pb-12">
        {/* Alerts */}
        {classAlert === 'danger' && (
          <Alert type="danger" className="mb-4">
            🚨 ¡Tus clases se han agotado! Renueva tu membresía para seguir entrenando.
          </Alert>
        )}
        {classAlert === 'warning' && (
          <Alert type="warning" className="mb-4">
            ⚠️ Solo te quedan {remaining} clase(s). ¡Renueva pronto para no perder tu ritmo!
          </Alert>
        )}
        {overdueNow && latestPayment?.status === 'pending' && (
          <Alert type="danger" className="mb-4">
            ⏰ Tu pago venció el día 5. Se aplicó un recargo del 10%.
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-studio-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-white' : 'text-studio-subtext hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>

        {/* Resumen tab */}
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            {/* Membership card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #111 0%, #1a0000 100%)', border: '1px solid rgba(255,47,47,0.2)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-studio-subtext text-xs uppercase tracking-wider">Membresía activa</p>
                  <h2 className="font-display text-3xl text-white mt-1">{mem?.name || socio.membership_type}</h2>
                </div>
                <StatusBadge status={socio.status} map={MEMBER_STATUSES} />
              </div>

              {/* Classes progress */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs text-studio-subtext uppercase tracking-wider">Clases usadas</p>
                  <p className="font-mono font-semibold text-white">{socio.classes_used}/{socio.classes_total}</p>
                </div>
                <div className="h-2 bg-studio-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-display text-primary">{remaining}</p>
                  <p className="text-studio-subtext text-xs">clases restantes</p>
                </div>
                {mem && (
                  <div className="text-right">
                    <p className="text-studio-subtext text-xs uppercase tracking-wider">Precio</p>
                    <p className="font-display text-2xl text-white">{formatCurrency(mem.price)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment status */}
            {latestPayment && (
              <div className="card">
                <h3 className="font-semibold text-white mb-3">Estado de Pago</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-studio-subtext text-sm">Estado</span>
                    <StatusBadge status={latestPayment.status} map={PAYMENT_STATUSES} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-studio-subtext text-sm">Monto</span>
                    <span className="font-semibold text-white">{formatCurrency(latestPayment.amount)}</span>
                  </div>
                  {surcharge > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 text-sm">Recargo (10%)</span>
                      <span className="text-red-400 font-semibold">+{formatCurrency(surcharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-studio-border">
                    <span className="text-studio-subtext text-sm">Fecha límite</span>
                    <span className="font-mono text-white text-sm">
                      Día 5 · {format(deadline, 'MMMM', { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments tab */}
        {activeTab === 'pagos' && (
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-studio-subtext text-center py-8">Sin historial de pagos</p>
            ) : payments.map(p => (
              <div key={p.id} className="card py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{formatCurrency(p.amount)}</p>
                    <p className="text-studio-subtext text-xs mt-0.5">{formatDate(p.created_at)}</p>
                  </div>
                  <StatusBadge status={p.status} map={PAYMENT_STATUSES} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attendance tab */}
        {activeTab === 'asistencia' && (
          <div className="space-y-2">
            {attendance.length === 0 ? (
              <p className="text-studio-subtext text-center py-8">Sin asistencias registradas</p>
            ) : attendance.map(att => (
              <div key={att.id} className="flex items-center justify-between py-3 border-b border-studio-border">
                <div>
                  <p className="text-white text-sm font-medium">{att.class_name}</p>
                  <p className="text-studio-subtext text-xs">{formatDate(att.date)}</p>
                </div>
                <p className="text-primary font-mono text-sm">{att.time}</p>
              </div>
            ))}
          </div>
        )}

        {/* QR tab */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-studio-subtext text-sm text-center">Muestra este código al entrar al estudio</p>
            <div className="bg-white p-5 rounded-2xl shadow-2xl">
              {qrUrl && <img src={qrUrl} alt="Mi QR" className="w-60 h-60" />}
            </div>
            <p className="text-studio-subtext text-xs font-mono">{socio.qr_code}</p>
            <button
              onClick={() => downloadQR(qrUrl, socio.name)}
              className="btn-primary flex items-center gap-2"
            >
              ⬇ Descargar QR
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
