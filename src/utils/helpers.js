import { format, isAfter, setDate, startOfMonth, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { PAYMENT_DEADLINE_DAY, SURCHARGE_PERCENTAGE } from './constants'

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatTime(date) {
  if (!date) return '—'
  return format(new Date(date), 'HH:mm', { locale: es })
}

export function getPaymentDeadline() {
  const now = new Date()
  const deadline = setDate(now, PAYMENT_DEADLINE_DAY)
  if (isAfter(now, deadline)) {
    return setDate(addMonths(now, 1), PAYMENT_DEADLINE_DAY)
  }
  return deadline
}

export function isOverdue() {
  const now = new Date()
  const deadline = setDate(now, PAYMENT_DEADLINE_DAY)
  return isAfter(now, deadline)
}

export function calculateSurcharge(amount) {
  return Math.round(amount * (SURCHARGE_PERCENTAGE / 100))
}

export function getClassesAlert(remaining) {
  if (remaining <= 0) return 'danger'
  if (remaining <= 2) return 'warning'
  return null
}

export function generateMemberId() {
  return 'ADV-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function generateQRDataURL(text) {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })
}

export function downloadQR(dataUrl, name) {
  const link = document.createElement('a')
  link.download = `qr-${name.replace(/\s+/g, '-').toLowerCase()}.png`
  link.href = dataUrl
  link.click()
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
