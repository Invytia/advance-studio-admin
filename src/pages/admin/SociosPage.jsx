import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MEMBERSHIPS, MEMBER_STATUSES } from '../../utils/constants'
import { formatDate, generateQRDataURL, downloadQR, getClassesAlert } from '../../utils/helpers'
import {
  PageHeader, Modal, Alert, StatusBadge, ConfirmDialog, SearchInput, Spinner, EmptyState
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [qrModal, setQrModal] = useState(null)
  const [editingSocio, setEditingSocio] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const { toast } = useToast()

  useEffect(() => { loadSocios() }, [])

  async function loadSocios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setSocios(data || [])
    setLoading(false)
  }

  async function openQR(socio) {
    setQrModal(socio)
    const url = await generateQRDataURL(socio.qr_code || socio.id)
    setQrUrl(url)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('socios').delete().eq('id', id)
    if (error) { toast('Error al eliminar el socio', 'error'); return }
    toast('Socio eliminado correctamente', 'success')
    loadSocios()
  }

  const filtered = socios.filter(s => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    active: socios.filter(s => s.status === 'active').length,
    inactive: socios.filter(s => s.status === 'inactive').length,
    agotado: socios.filter(s => s.status === 'agotado').length,
  }

  const classesRemaining = (s) => (s.classes_total || 0) - (s.classes_used || 0)

  return (
    <div className="p-8">
      <PageHeader
        title="SOCIOS"
        subtitle={`${socios.length} miembros registrados`}
        action={
          <button
            onClick={() => { setEditingSocio(null); setModalOpen(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Nuevo Socio
          </button>
        }
      />

      {/* Quick stats / filters */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Activos', value: counts.active, color: 'text-green-400', status: 'active' },
          { label: 'Inactivos', value: counts.inactive, color: 'text-gray-400', status: 'inactive' },
          { label: 'Sin clases', value: counts.agotado, color: 'text-red-400', status: 'agotado' },
        ].map(item => (
          <button
            key={item.status}
            onClick={() => setFilterStatus(filterStatus === item.status ? 'all' : item.status)}
            className={`stat-card text-left transition-all ${filterStatus === item.status ? 'border-primary/50 bg-primary/5' : ''}`}
          >
            <p className="text-xs text-studio-subtext uppercase tracking-wider">{item.label}</p>
            <p className={`font-display text-3xl ${item.color}`}>{item.value}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, email, teléfono..." />
        </div>
        {filterStatus !== 'all' && (
          <button onClick={() => setFilterStatus('all')} className="btn-ghost text-sm flex items-center gap-1.5">
            ✕ Quitar filtro
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-studio-border bg-studio-dark">
                {['Socio', 'Membresía', 'Clases', 'Estado', 'Alta', 'Acciones'].map(h => (
                  <th
                    key={h}
                    className={`table-cell text-xs text-studio-subtext uppercase tracking-wider font-semibold ${h === 'Acciones' ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <div className="flex justify-center"><Spinner size="lg" /></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12">
                  <EmptyState
                    icon={
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    }
                    title={search ? 'Sin resultados' : 'No hay socios aún'}
                    description={
                      search
                        ? `No se encontraron socios para "${search}"`
                        : 'Agrega el primer socio usando el botón de arriba.'
                    }
                    action={search ? (
                      <button onClick={() => setSearch('')} className="btn-ghost text-sm">Limpiar búsqueda</button>
                    ) : null}
                  />
                </td></tr>
              ) : filtered.map((socio) => {
                const remaining = classesRemaining(socio)
                const alert = getClassesAlert(remaining)
                const mem = MEMBERSHIPS.find(m => m.id === socio.membership_type)
                const pct = socio.classes_total > 0 ? (socio.classes_used / socio.classes_total) * 100 : 0

                return (
                  <tr key={socio.id} className="table-row group">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                          {socio.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{socio.name}</p>
                          <p className="text-studio-subtext text-xs">{socio.email}</p>
                          {socio.phone && <p className="text-studio-subtext text-xs">{socio.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-white font-medium">{mem?.name || socio.membership_type}</p>
                      {mem && <p className="text-xs text-studio-subtext">${mem.price} MXN</p>}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1.5 min-w-[110px]">
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-sm font-bold ${
                            remaining <= 0 ? 'text-red-400' : remaining <= 2 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {remaining} restantes
                          </span>
                          {alert && <span className="text-sm ml-1">{alert === 'danger' ? '🚨' : '⚠️'}</span>}
                        </div>
                        <div className="h-1.5 bg-studio-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-studio-subtext">{socio.classes_used}/{socio.classes_total} usadas</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={socio.status} map={MEMBER_STATUSES} />
                    </td>
                    <td className="table-cell text-studio-subtext text-sm">{formatDate(socio.created_at)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openQR(socio)} className="p-1.5 text-studio-subtext hover:text-primary rounded hover:bg-primary/10 transition-colors" title="Ver QR"><QRIcon /></button>
                        <button onClick={() => { setEditingSocio(socio); setModalOpen(true) }} className="p-1.5 text-studio-subtext hover:text-white rounded hover:bg-studio-muted transition-colors" title="Editar"><EditIcon /></button>
                        <button onClick={() => setDeleteConfirm(socio.id)} className="p-1.5 text-studio-subtext hover:text-red-400 rounded hover:bg-red-900/20 transition-colors" title="Eliminar"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-studio-border bg-studio-dark">
            <p className="text-studio-subtext text-xs">
              Mostrando {filtered.length} de {socios.length} socios
              {filterStatus !== 'all' && ` · Filtro: ${MEMBER_STATUSES[filterStatus]?.label}`}
            </p>
          </div>
        )}
      </div>

      {/* Modales */}
      <SocioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        socio={editingSocio}
        onSave={() => {
          loadSocios()
          toast(editingSocio ? 'Socio actualizado correctamente' : 'Socio creado correctamente', 'success')
        }}
      />

      <Modal isOpen={!!qrModal} onClose={() => { setQrModal(null); setQrUrl('') }} title="Código QR del Socio">
        {qrModal && (
          <div className="flex flex-col items-center gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-xl">
              {qrUrl
                ? <img src={qrUrl} alt="QR Code" className="w-56 h-56" />
                : <div className="w-56 h-56 flex items-center justify-center"><Spinner /></div>
              }
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-lg">{qrModal.name}</p>
              <p className="text-studio-subtext text-xs font-mono mt-1">{qrModal.qr_code}</p>
              <p className="text-studio-subtext text-xs mt-1">
                {MEMBERSHIPS.find(m => m.id === qrModal.membership_type)?.name}
                {' · '}
                {(qrModal.classes_total - qrModal.classes_used)} clases restantes
              </p>
            </div>
            <button
              onClick={() => { downloadQR(qrUrl, qrModal.name); toast('QR descargado', 'success') }}
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={!qrUrl}
            >
              ⬇ Descargar QR
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Eliminar Socio"
        message="¿Estás seguro? Se eliminará el socio junto con su historial de asistencias y pagos asociados."
        confirmLabel="Sí, eliminar"
        danger
      />
    </div>
  )
}

/* ── Modal de creación / edición ── */
function SocioModal({ isOpen, onClose, socio, onSave }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    membership_type: 'basico', status: 'active', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(socio ? {
      name: socio.name || '',
      email: socio.email || '',
      phone: socio.phone || '',
      membership_type: socio.membership_type || 'basico',
      status: socio.status || 'active',
      notes: socio.notes || '',
    } : { name: '', email: '', phone: '', membership_type: 'basico', status: 'active', notes: '' })
    setError('')
  }, [socio, isOpen])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const mem = MEMBERSHIPS.find(m => m.id === form.membership_type)
      const classes_total = mem?.classes || 0
      const classes_used = socio?.classes_used || 0
      const status = classes_used >= classes_total ? 'agotado' : form.status

      if (socio) {
        const { error } = await supabase
          .from('socios')
          .update({ ...form, classes_total, status })
          .eq('id', socio.id)
        if (error) throw error
      } else {
        const qr_code = 'ADV-' + crypto.randomUUID().substring(0, 8).toUpperCase()
        const { error } = await supabase
          .from('socios')
          .insert([{ ...form, classes_total, classes_used: 0, status, qr_code }])
        if (error) throw error
      }
      onSave()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedMem = MEMBERSHIPS.find(m => m.id === form.membership_type)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={socio ? 'Editar Socio' : 'Nuevo Socio'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label>Nombre completo *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Juan Pérez"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="juan@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="55 1234 5678"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Membresía</label>
          <select
            value={form.membership_type}
            onChange={e => set('membership_type', e.target.value)}
          >
            {MEMBERSHIPS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.classes} clases — ${m.price} MXN
              </option>
            ))}
          </select>
          {selectedMem && (
            <p className="text-xs text-studio-subtext mt-1.5">
              💰 ${selectedMem.price} MXN · {selectedMem.classes} clase{selectedMem.classes !== 1 ? 's' : ''} · ${Math.round(selectedMem.price / selectedMem.classes)}/clase
            </p>
          )}
        </div>

        {socio && (
          <div className="form-group">
            <label>Estado</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="agotado">Clases Agotadas</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Notas internas</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            placeholder="Notas opcionales..."
          />
        </div>

        {error && <Alert type="danger">{error}</Alert>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Guardando...' : socio ? 'Actualizar' : 'Crear Socio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* Icons */
const QRIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <path strokeLinecap="round" d="M14 14h1m4 0h2m-2 4h2m-6 0h1m0-4v4"/>
  </svg>
)
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
)
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <polyline points="3 6 5 6 21 6"/>
    <path strokeLinecap="round" d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
