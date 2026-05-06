import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PAYMENT_STATUSES, PAYMENT_METHODS, MEMBERSHIPS } from '../../utils/constants'
import { formatCurrency, formatDate, isOverdue, calculateSurcharge } from '../../utils/helpers'
import { PageHeader, Modal, Alert, StatusBadge, SearchInput, Spinner } from '../../components/ui'
import { format } from 'date-fns'

export default function PagosPage() {
  const [payments, setPayments] = useState([])
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const overdueNow = isOverdue()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [paymentsRes, sociosRes] = await Promise.all([
      supabase.from('payments').select('*, socio:socios(name, membership_type)').order('created_at', { ascending: false }),
      supabase.from('socios').select('id, name, membership_type').eq('status', 'active'),
    ])
    setPayments(paymentsRes.data || [])
    setSocios(sociosRes.data || [])
    setLoading(false)
  }

  async function applyOverdueSurcharges() {
    if (!overdueNow) return
    const pending = payments.filter(p => p.status === 'pending')
    for (const p of pending) {
      const surcharge = calculateSurcharge(p.original_amount || p.amount)
      await supabase.from('payments').update({
        status: 'overdue',
        amount: (p.original_amount || p.amount) + surcharge,
        surcharge_applied: true,
      }).eq('id', p.id)
    }
    loadData()
  }

  async function markPaid(paymentId) {
    await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', paymentId)
    loadData()
  }

  const filtered = payments.filter(p => {
    const matchSearch = p.socio?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-8">
      <PageHeader
        title="PAGOS"
        subtitle="Gestión de cobros y membresías"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <span className="text-lg leading-none">+</span> Registrar Pago
          </button>
        }
      />

      {/* Deadline alert */}
      {overdueNow && (
        <Alert type="danger" className="mb-6">
          ⚠️ Ya pasó el día 5 — Se aplicó recargo del 10% a pagos pendientes.
          <button onClick={applyOverdueSurcharges} className="ml-2 underline text-red-200">Aplicar recargos ahora</button>
        </Alert>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-studio-subtext uppercase tracking-wider">Cobrado</p>
          <p className="font-display text-3xl text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-studio-subtext uppercase tracking-wider">Pendiente</p>
          <p className="font-display text-3xl text-yellow-400">{formatCurrency(totalPending)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-studio-subtext uppercase tracking-wider">Día límite</p>
          <p className="font-display text-3xl text-white">05/{format(new Date(), 'MM')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar socio..." />
        </div>
        <div className="flex gap-2">
          {['all', 'paid', 'pending', 'overdue'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                filterStatus === s ? 'bg-primary text-white' : 'bg-studio-gray text-studio-subtext hover:text-white'
              }`}
            >
              {s === 'all' ? 'Todos' : PAYMENT_STATUSES[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-studio-border bg-studio-dark">
                <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Socio</th>
                <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Membresía</th>
                <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Monto</th>
                <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Método</th>
                <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Estado</th>
                <th className="table-cell text-left text-xs text-studio-subtext uppercase tracking-wider">Fecha</th>
                <th className="table-cell text-right text-xs text-studio-subtext uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Spinner /></td></tr>
              ) : filtered.map(payment => {
                const mem = MEMBERSHIPS.find(m => m.id === payment.socio?.membership_type)
                return (
                  <tr key={payment.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-semibold text-white text-sm">{payment.socio?.name}</p>
                    </td>
                    <td className="table-cell text-studio-subtext text-sm">{mem?.name || '—'}</td>
                    <td className="table-cell">
                      <div>
                        <span className="font-semibold text-white">{formatCurrency(payment.amount)}</span>
                        {payment.surcharge_applied && (
                          <span className="ml-1 text-xs text-red-400">(+10%)</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-studio-subtext text-sm capitalize">
                      {PAYMENT_METHODS.find(m => m.id === payment.method)?.name || payment.method}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={payment.status} map={PAYMENT_STATUSES} />
                    </td>
                    <td className="table-cell text-studio-subtext text-sm">{formatDate(payment.created_at)}</td>
                    <td className="table-cell text-right">
                      {payment.status !== 'paid' && (
                        <button
                          onClick={() => markPaid(payment.id)}
                          className="text-xs bg-green-900/30 text-green-400 border border-green-900/50 px-3 py-1.5 rounded-lg hover:bg-green-900/50 transition-colors"
                        >
                          ✓ Marcar pagado
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        socios={socios}
        onSave={loadData}
      />
    </div>
  )
}

function PaymentModal({ isOpen, onClose, socios, onSave }) {
  const [form, setForm] = useState({ socio_id: '', amount: '', method: 'cash', status: 'pending', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm({ socio_id: '', amount: '', method: 'cash', status: 'pending', notes: '' })
      setError('')
    }
  }, [isOpen])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSocioChange(id) {
    const socio = socios.find(s => s.id === id)
    if (socio) {
      const mem = MEMBERSHIPS.find(m => m.id === socio.membership_type)
      set('socio_id', id)
      if (mem) setForm(f => ({ ...f, socio_id: id, amount: mem.price.toString() }))
      else set('socio_id', id)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const over = isOverdue()
      const base = parseFloat(form.amount)
      const finalAmount = over && form.status === 'pending' ? base + calculateSurcharge(base) : base

      const { error } = await supabase.from('payments').insert([{
        ...form,
        amount: finalAmount,
        original_amount: base,
        surcharge_applied: over && form.status === 'pending',
      }])
      if (error) throw error
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const overdue = isOverdue()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pago">
      <form onSubmit={handleSubmit} className="space-y-4">
        {overdue && (
          <Alert type="warning">Ya pasó el día 5. Se aplicará recargo del 10% a pagos pendientes.</Alert>
        )}

        <div className="form-group">
          <label>Socio</label>
          <select value={form.socio_id} onChange={e => handleSocioChange(e.target.value)} required>
            <option value="">Seleccionar socio...</option>
            {socios.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Monto (MXN)</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min="0" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Método</label>
            <select value={form.method} onChange={e => set('method', e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Notas (opcional)</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Notas adicionales..." />
        </div>

        {error && <Alert type="danger">{error}</Alert>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Guardando...' : 'Registrar Pago'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
