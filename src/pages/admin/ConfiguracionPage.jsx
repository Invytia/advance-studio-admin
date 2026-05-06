import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MEMBERSHIPS } from '../../utils/constants'
import { validatePassword } from '../../utils/constants'
import { formatCurrency } from '../../utils/helpers'
import { PageHeader, Modal, Alert } from '../../components/ui'
import { useAuth } from '../../contexts/AuthContext'

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('staff')
  const [staffList, setStaffList] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const { profile } = useAuth()

  useEffect(() => { loadStaff() }, [])

  async function loadStaff() {
    const { data } = await supabase.from('profiles').select('*').in('role', ['admin', 'staff']).order('created_at')
    setStaffList(data || [])
  }

  const tabs = [
    { id: 'staff', label: 'Usuarios Staff' },
    { id: 'memberships', label: 'Membresías' },
    { id: 'system', label: 'Sistema' },
  ]

  return (
    <div className="p-8">
      <PageHeader title="CONFIGURACIÓN" subtitle="Administración del sistema" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-studio-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id ? 'text-white' : 'text-studio-subtext hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Staff tab */}
      {activeTab === 'staff' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-studio-subtext text-sm">{staffList.length} usuarios con acceso admin</p>
            {profile?.role === 'admin' && (
              <button onClick={() => setModalOpen(true)} className="btn-primary text-sm flex items-center gap-2">
                <span>+</span> Agregar usuario
              </button>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-studio-border bg-studio-dark">
                  <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Usuario</th>
                  <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Rol</th>
                  <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(user => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                          {user.name?.[0] || user.email?.[0]}
                        </div>
                        <p className="text-white font-medium text-sm">{user.name || '—'}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge border ${
                        user.role === 'admin'
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-blue-400/10 border-blue-400/20 text-blue-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="table-cell text-studio-subtext text-sm">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Memberships tab */}
      {activeTab === 'memberships' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MEMBERSHIPS.map(mem => (
            <div key={mem.id} className="card hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white">{mem.name}</h3>
                <div className="w-3 h-3 rounded-full mt-1" style={{ background: mem.color }} />
              </div>
              <p className="font-display text-4xl text-primary">{formatCurrency(mem.price)}</p>
              <p className="text-studio-subtext text-sm mt-1">{mem.classes} clase{mem.classes !== 1 ? 's' : ''} incluida{mem.classes !== 1 ? 's' : ''}</p>
              <div className="mt-3 pt-3 border-t border-studio-border">
                <p className="text-xs text-studio-subtext">${(mem.price / mem.classes).toFixed(0)} por clase</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System tab */}
      {activeTab === 'system' && (
        <div className="space-y-4 max-w-lg">
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Configuración de Pagos</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-studio-border">
                <span className="text-studio-subtext text-sm">Día límite de pago</span>
                <span className="text-white font-mono font-semibold">Día 5</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-studio-border">
                <span className="text-studio-subtext text-sm">Recargo por retraso</span>
                <span className="text-primary font-mono font-semibold">10%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-studio-subtext text-sm">Moneda</span>
                <span className="text-white font-mono font-semibold">MXN</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-3">Salones</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-2 border-b border-studio-border">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-white text-sm">Salón Chico</span>
              </div>
              <div className="flex items-center gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-white text-sm">Salón Grande</span>
              </div>
            </div>
          </div>

          <div className="card border-yellow-900/30">
            <h3 className="font-semibold text-white mb-2">Automatizaciones</h3>
            <p className="text-studio-subtext text-xs mb-3">
              El sistema verifica diariamente los pagos vencidos después del día 5 del mes y aplica automáticamente el recargo del 10%.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs">Automatización activa</span>
            </div>
          </div>
        </div>
      )}

      <CreateStaffModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={loadStaff} />
    </div>
  )
}

function CreateStaffModal({ isOpen, onClose, onSave }) {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) { setForm({ name: '', email: '', password: '', role: 'staff' }); setError('') }
  }, [isOpen])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const pwErrors = validatePassword(form.password)
    if (pwErrors.length > 0) { setError('Contraseña inválida: ' + pwErrors.join(', ')); return }

    setLoading(true)
    try {
      await signUp(form.email, form.password, { name: form.name, role: form.role })
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear usuario Staff">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label>Nombre</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre completo" required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
          <p className="text-studio-subtext text-xs mt-1">Mínimo 8 caracteres, 1 mayúscula, 1 número</p>
        </div>
        <div className="form-group">
          <label>Rol</label>
          <select value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <Alert type="danger">{error}</Alert>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
