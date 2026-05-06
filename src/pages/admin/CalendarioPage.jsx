import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ROOMS, DAYS_FULL, DAYS_OF_WEEK } from '../../utils/constants'
import { PageHeader, Modal, Alert, ConfirmDialog } from '../../components/ui'

const HOURS = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`)

export default function CalendarioPage() {
  const [schedule, setSchedule] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState('all')

  useEffect(() => { loadSchedule() }, [])

  async function loadSchedule() {
    const { data } = await supabase.from('schedule').select('*').order('day_of_week').order('start_time')
    setSchedule(data || [])
  }

  async function handleDelete(id) {
    await supabase.from('schedule').delete().eq('id', id)
    loadSchedule()
  }

  const filtered = schedule.filter(c => selectedRoom === 'all' || c.room === selectedRoom)

  const getClassesForDay = (dayIndex) => filtered.filter(c => c.day_of_week === dayIndex)

  return (
    <div className="p-8">
      <PageHeader
        title="CALENDARIO"
        subtitle="Horario semanal de clases"
        action={
          <button onClick={() => { setEditingClass(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
            <span className="text-lg leading-none">+</span> Nueva Clase
          </button>
        }
      />

      {/* Room filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedRoom('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedRoom === 'all' ? 'bg-primary text-white' : 'bg-studio-gray text-studio-subtext hover:text-white'}`}
        >
          Todos
        </button>
        {ROOMS.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRoom(r.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedRoom === r.id ? 'bg-primary text-white' : 'bg-studio-gray text-studio-subtext hover:text-white'}`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Weekly calendar grid */}
      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-studio-border bg-studio-dark">
          {DAYS_OF_WEEK.map((day, i) => (
            <div key={day} className="px-3 py-3 text-center border-r border-studio-border last:border-0">
              <p className="text-xs text-studio-subtext uppercase tracking-wider font-semibold">{day}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[500px]">
          {DAYS_FULL.map((day, dayIndex) => {
            const dayClasses = getClassesForDay(dayIndex + 1)
            return (
              <div
                key={day}
                className="border-r border-studio-border last:border-0 p-2 min-h-[200px] hover:bg-studio-dark/50 transition-colors"
              >
                {dayClasses.length === 0 ? (
                  <div
                    className="h-full flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => { setEditingClass({ day_of_week: dayIndex + 1 }); setModalOpen(true) }}
                  >
                    <span className="text-studio-subtext text-2xl">+</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {dayClasses.map(cls => (
                      <div
                        key={cls.id}
                        className="bg-primary/10 border border-primary/20 rounded-lg p-2 cursor-pointer hover:bg-primary/20 transition-colors group"
                        onClick={() => { setEditingClass(cls); setModalOpen(true) }}
                      >
                        <p className="text-primary font-mono text-xs font-semibold">{cls.start_time}</p>
                        <p className="text-white text-xs font-semibold mt-0.5 leading-tight">{cls.class_name}</p>
                        <p className="text-studio-subtext text-[10px] mt-0.5">{cls.instructor_name}</p>
                        <p className="text-studio-subtext text-[10px]">
                          {ROOMS.find(r => r.id === cls.room)?.name || cls.room}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(cls.id) }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-red-400 hover:text-red-300 text-[10px]"
                        >
                          eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => { setEditingClass({ day_of_week: dayIndex + 1 }); setModalOpen(true) }}
                      className="w-full text-studio-subtext hover:text-white transition-colors text-xs py-1 rounded hover:bg-studio-muted"
                    >
                      + agregar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ClassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        classData={editingClass}
        onSave={loadSchedule}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Eliminar Clase"
        message="¿Eliminar esta clase del horario?"
        confirmLabel="Eliminar"
        danger
      />
    </div>
  )
}

function ClassModal({ isOpen, onClose, classData, onSave }) {
  const [form, setForm] = useState({
    class_name: '',
    instructor_name: '',
    room: 'salon_chico',
    day_of_week: 1,
    start_time: '09:00',
    duration_min: 60,
    max_capacity: 20,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (classData) {
      setForm(f => ({
        ...f,
        ...classData,
        class_name: classData.class_name || '',
        instructor_name: classData.instructor_name || '',
        room: classData.room || 'salon_chico',
        day_of_week: classData.day_of_week || 1,
        start_time: classData.start_time || '09:00',
        duration_min: classData.duration_min || 60,
        max_capacity: classData.max_capacity || 20,
      }))
    } else {
      setForm({ class_name: '', instructor_name: '', room: 'salon_chico', day_of_week: 1, start_time: '09:00', duration_min: 60, max_capacity: 20 })
    }
    setError('')
  }, [classData, isOpen])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, day_of_week: parseInt(form.day_of_week), duration_min: parseInt(form.duration_min), max_capacity: parseInt(form.max_capacity) }
      if (classData?.id) {
        const { error } = await supabase.from('schedule').update(payload).eq('id', classData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('schedule').insert([payload])
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={classData?.id ? 'Editar Clase' : 'Nueva Clase'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label>Nombre de la clase</label>
          <input value={form.class_name} onChange={e => set('class_name', e.target.value)} placeholder="Zumba, Yoga, CrossFit..." required />
        </div>

        <div className="form-group">
          <label>Instructor</label>
          <input value={form.instructor_name} onChange={e => set('instructor_name', e.target.value)} placeholder="Nombre del instructor" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Día</label>
            <select value={form.day_of_week} onChange={e => set('day_of_week', e.target.value)}>
              {DAYS_FULL.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Salón</label>
            <select value={form.room} onChange={e => set('room', e.target.value)}>
              {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Hora inicio</label>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Duración (min)</label>
            <input type="number" value={form.duration_min} onChange={e => set('duration_min', e.target.value)} min="30" max="180" step="15" />
          </div>
        </div>

        <div className="form-group">
          <label>Capacidad máxima</label>
          <input type="number" value={form.max_capacity} onChange={e => set('max_capacity', e.target.value)} min="1" max="100" />
        </div>

        {error && <Alert type="danger">{error}</Alert>}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Guardando...' : classData?.id ? 'Actualizar' : 'Crear Clase'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
