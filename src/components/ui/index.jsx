// Modal
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${sizes[size]} w-full animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <h2 className="font-semibold text-white text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-studio-subtext hover:text-white transition-colors p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Alert
export function Alert({ type = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-blue-400/10 border-blue-400/20 text-blue-300',
    warning: 'bg-yellow-400/10 border-yellow-400/20 text-yellow-300',
    danger: 'bg-red-400/10 border-red-400/20 text-red-300 alert-pulse',
    success: 'bg-green-400/10 border-green-400/20 text-green-300',
  }

  return (
    <div className={`border rounded-lg px-4 py-3 text-sm flex items-start gap-2.5 ${styles[type]} ${className}`}>
      <AlertIcon type={type} />
      <span>{children}</span>
    </div>
  )
}

function AlertIcon({ type }) {
  if (type === 'warning' || type === 'danger') {
    return (
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
    </svg>
  )
}

// Status badge
export function StatusBadge({ status, map }) {
  const config = map[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-400/10' }
  return (
    <span className={`status-badge border ${config.bg} ${config.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}

// Page header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">{title}</h1>
        {subtitle && <p className="text-studio-subtext mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Loading spinner
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={`border-2 border-primary border-t-transparent rounded-full animate-spin ${sizes[size]}`} />
  )
}

// Empty state
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-studio-muted rounded-2xl flex items-center justify-center mb-4 text-studio-subtext">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-studio-subtext text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// Confirm dialog
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay">
      <div className="bg-studio-gray border border-studio-border rounded-2xl p-6 max-w-sm w-full animate-slide-up">
        <h3 className="font-semibold text-white text-lg mb-2">{title}</h3>
        <p className="text-studio-subtext text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Search input
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-studio-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4"
        style={{ paddingLeft: '2.5rem' }}
      />
    </div>
  )
}
