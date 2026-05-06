import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { PAYMENT_STATUSES, MEMBER_STATUSES } from '../../utils/constants'
import { PageHeader, StatusBadge, Spinner } from '../../components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [todayClasses, setTodayClasses] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const now = new Date()
      const monthStart = startOfMonth(now).toISOString()
      const monthEnd = endOfMonth(now).toISOString()
      const today = format(now, 'yyyy-MM-dd')
      const todayDay = now.getDate()

      // Parallel queries
      const [sociosRes, paymentsRes, pendingRes, scheduleRes, attendanceRes] = await Promise.all([
        supabase.from('socios').select('id, status'),
        supabase.from('payments').select('amount, status').gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('payments').select('id').eq('status', 'pending'),
        supabase.from('schedule').select('*, instructor:instructor_name, room').eq('day_of_week', now.getDay()),
        supabase.from('attendance').select('*, socio:socios(name)').eq('date', today).order('created_at', { ascending: false }).limit(10),
      ])

      const socios = sociosRes.data || []
      const payments = paymentsRes.data || []

      const monthlyRevenue = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      const overdueCount = socios.filter(s => s.status === 'agotado').length

      setStats({
        totalActive: socios.filter(s => s.status === 'active').length,
        totalSocios: socios.length,
        monthlyRevenue,
        pendingPayments: pendingRes.data?.length || 0,
        overdueUsers: overdueCount,
        todayAttendance: attendanceRes.data?.length || 0,
      })

      setTodayClasses(scheduleRes.data || [])
      setRecentAttendance(attendanceRes.data || [])
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Socios Activos',
      value: stats?.totalActive || 0,
      sub: `de ${stats?.totalSocios || 0} total`,
      icon: '👥',
      color: 'text-green-400',
    },
    {
      label: 'Ingresos del Mes',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      sub: format(new Date(), 'MMMM yyyy', { locale: es }),
      icon: '💰',
      color: 'text-primary',
    },
    {
      label: 'Pagos Pendientes',
      value: stats?.pendingPayments || 0,
      sub: 'sin cobrar',
      icon: '⏳',
      color: 'text-yellow-400',
      alert: stats?.pendingPayments > 0,
    },
    {
      label: 'Usuarios Vencidos',
      value: stats?.overdueUsers || 0,
      sub: 'clases agotadas',
      icon: '⚠️',
      color: 'text-red-400',
      alert: stats?.overdueUsers > 0,
    },
    {
      label: 'Clases Hoy',
      value: todayClasses.length,
      sub: 'programadas',
      icon: '📅',
      color: 'text-blue-400',
    },
    {
      label: 'Asistencias Hoy',
      value: stats?.todayAttendance || 0,
      sub: 'registradas',
      icon: '✅',
      color: 'text-purple-400',
    },
  ]

  return (
    <div className="p-8">
      <PageHeader
        title="DASHBOARD"
        subtitle={`Hoy es ${format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}`}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`stat-card ${card.alert ? 'border-red-900/50 alert-pulse' : ''}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-studio-subtext uppercase tracking-wider font-semibold">{card.label}</p>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`font-display text-4xl ${card.color} leading-none`}>{card.value}</p>
            <p className="text-studio-subtext text-xs">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's classes */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-primary">▸</span> Clases de Hoy
          </h3>
          {todayClasses.length === 0 ? (
            <p className="text-studio-subtext text-sm py-6 text-center">No hay clases programadas hoy</p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-studio-dark rounded-lg border border-studio-border">
                  <div>
                    <p className="font-semibold text-white text-sm">{cls.class_name}</p>
                    <p className="text-studio-subtext text-xs">{cls.instructor} · {cls.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-mono text-sm font-semibold">{cls.start_time}</p>
                    <p className="text-studio-subtext text-xs">{cls.duration_min} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attendance */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-primary">▸</span> Asistencia Reciente
          </h3>
          {recentAttendance.length === 0 ? (
            <p className="text-studio-subtext text-sm py-6 text-center">Sin asistencias hoy</p>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((att) => (
                <div key={att.id} className="flex items-center justify-between py-2 border-b border-studio-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                      {att.socio?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{att.socio?.name || 'Desconocido'}</p>
                      <p className="text-studio-subtext text-xs">{att.class_name}</p>
                    </div>
                  </div>
                  <p className="text-studio-subtext text-xs font-mono">{att.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
