export const MEMBERSHIPS = [
  { id: 'basico', name: 'Básico', classes: 8, price: 888, color: '#888888' },
  { id: 'premium', name: 'Premium', classes: 16, price: 1099, color: '#ff9900' },
  { id: 'all_access', name: 'All Access', classes: 30, price: 1300, color: '#ff2f2f' },
  { id: 'clase_suelta_1h', name: 'Clase Suelta 1hr', classes: 1, price: 120, color: '#4444ff' },
  { id: 'clase_suelta_2h', name: 'Clase Suelta 2hr', classes: 2, price: 200, color: '#4444ff' },
]

export const MEMBERSHIP_MAP = Object.fromEntries(MEMBERSHIPS.map(m => [m.id, m]))

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Efectivo' },
  { id: 'transfer', name: 'Transferencia' },
  { id: 'card', name: 'Tarjeta' },
]

export const PAYMENT_STATUSES = {
  paid: { label: 'Pagado', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  overdue: { label: 'Vencido', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
}

export const MEMBER_STATUSES = {
  active: { label: 'Activo', color: 'text-green-400', bg: 'bg-green-400/10' },
  inactive: { label: 'Inactivo', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  agotado: { label: 'Clases Agotadas', color: 'text-red-400', bg: 'bg-red-400/10' },
}

export const ROOMS = [
  { id: 'salon_chico', name: 'Salón Chico' },
  { id: 'salon_grande', name: 'Salón Grande' },
]

export const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const PAYMENT_DEADLINE_DAY = 5
export const SURCHARGE_PERCENTAGE = 10

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: /[A-Z]/,
  requireNumber: /[0-9]/,
}

export function validatePassword(password) {
  const errors = []
  if (password.length < 8) errors.push('Mínimo 8 caracteres')
  if (!PASSWORD_RULES.requireUppercase.test(password)) errors.push('Al menos 1 mayúscula')
  if (!PASSWORD_RULES.requireNumber.test(password)) errors.push('Al menos 1 número')
  return errors
}
