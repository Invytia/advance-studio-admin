import { useEffect, useState } from 'react'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out' | 'done'

  useEffect(() => {
    // After splash in animation (1.4s), hold briefly
    const holdTimer = setTimeout(() => setPhase('out'), 2400)
    // After out animation (0.8s), complete
    const doneTimer = setTimeout(() => {
      setPhase('done')
      onComplete()
    }, 3300)

    return () => {
      clearTimeout(holdTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.8s ease' : 'none',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,47,47,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Logo container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: '90vw',
          maxWidth: '90vw',
          animation: 'splashIn 1.4s cubic-bezier(0.23, 1, 0.32, 1) forwards',
          filter: 'drop-shadow(0 0 20px rgba(255,47,47,0.4))',
        }}
      >
        {/* SVG Logo matching the brand image */}
        <svg
          viewBox="0 0 800 600"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto' }}
        >
          {/* Subtitle */}
          <text
            x="400"
            y="80"
            textAnchor="middle"
            fill="#ff2f2f"
            fontFamily="Bebas Neue, Impact, sans-serif"
            fontSize="38"
            letterSpacing="18"
          >
            CENTRO DE DESARROLLO
          </text>
          <text
            x="400"
            y="128"
            textAnchor="middle"
            fill="#ff2f2f"
            fontFamily="Bebas Neue, Impact, sans-serif"
            fontSize="38"
            letterSpacing="18"
          >
            ARTÍSTICO Y DEPORTIVO
          </text>

          {/* ADVANCE */}
          <text
            x="400"
            y="310"
            textAnchor="middle"
            fill="#ff2f2f"
            fontFamily="Bebas Neue, Impact, sans-serif"
            fontSize="240"
            letterSpacing="-4"
          >
            ADVANCE
          </text>

          {/* STUDIO */}
          <text
            x="400"
            y="530"
            textAnchor="middle"
            fill="#ff2f2f"
            fontFamily="Bebas Neue, Impact, sans-serif"
            fontSize="240"
            letterSpacing="-4"
          >
            STUDIO
          </text>
        </svg>
      </div>
    </div>
  )
}
