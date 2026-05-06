import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,47,47,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 text-center animate-fade-in">
        <p className="font-display text-[12rem] text-primary leading-none opacity-10 select-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          404
        </p>
        <div className="relative">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-5xl text-white tracking-wide mb-2">PÁGINA NO ENCONTRADA</h1>
          <p className="text-studio-subtext text-sm mb-8">La ruta que buscas no existe en el sistema.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="btn-ghost">
              ← Regresar
            </button>
            <button onClick={() => navigate('/admin')} className="btn-primary">
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
