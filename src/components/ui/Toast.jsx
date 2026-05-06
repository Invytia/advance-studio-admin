import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function Toast({ toast, onRemove }) {
  const styles = {
    success: {
      container: 'bg-studio-gray border-green-500/40 text-green-300',
      icon: '✓',
      iconBg: 'bg-green-500/20 text-green-400',
    },
    error: {
      container: 'bg-studio-gray border-red-500/40 text-red-300',
      icon: '✕',
      iconBg: 'bg-red-500/20 text-red-400',
    },
    warning: {
      container: 'bg-studio-gray border-yellow-500/40 text-yellow-300',
      icon: '⚠',
      iconBg: 'bg-yellow-500/20 text-yellow-400',
    },
    info: {
      container: 'bg-studio-gray border-blue-500/40 text-blue-300',
      icon: 'i',
      iconBg: 'bg-blue-500/20 text-blue-400',
    },
  }

  const style = styles[toast.type] || styles.info

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[280px] max-w-sm animate-slide-up ${style.container}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${style.iconBg}`}>
        {style.icon}
      </div>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-studio-subtext hover:text-white transition-colors flex-shrink-0 opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
