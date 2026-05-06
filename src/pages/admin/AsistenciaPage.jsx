import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDateTime, getClassesAlert } from '../../utils/helpers'
import { PageHeader, Alert, Spinner } from '../../components/ui'
import { format } from 'date-fns'

export default function AsistenciaPage() {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [recentAttendance, setRecentAttendance] = useState([])
  const [scanError, setScanError] = useState('')
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const nowTime = format(new Date(), 'HH:mm')

  useEffect(() => {
    loadTodayAttendance()
    return () => stopScanner()
  }, [])

  async function loadTodayAttendance() {
    const { data } = await supabase
      .from('attendance')
      .select('*, socio:socios(name, classes_total, classes_used)')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(20)
    setRecentAttendance(data || [])
  }

  async function startScanner() {
    setScanResult(null)
    setScanError('')
    setScanning(true)

    // Dynamically import to avoid SSR issues
    const { Html5QrcodeScanner } = await import('html5-qrcode')

    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.clear() } catch {}
    }

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
      rememberLastUsedCamera: true,
    }, false)

    html5QrCodeRef.current = scanner

    scanner.render(
      async (decodedText) => {
        await handleQRScan(decodedText)
        scanner.clear()
        setScanning(false)
      },
      (err) => {}
    )
  }

  async function stopScanner() {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.clear() } catch {}
    }
    setScanning(false)
  }

  async function handleQRScan(qrCode) {
    setLoading(true)
    setScanError('')
    try {
      // Find socio by QR code
      const { data: socio, error } = await supabase
        .from('socios')
        .select('*')
        .eq('qr_code', qrCode)
        .single()

      if (error || !socio) {
        setScanError('QR no reconocido. El socio no existe en el sistema.')
        return
      }

      // Check if already scanned today
      const { data: existingAtt } = await supabase
        .from('attendance')
        .select('id')
        .eq('socio_id', socio.id)
        .eq('date', today)
        .limit(1)

      if (existingAtt?.length > 0) {
        setScanResult({ ...socio, alreadyCheckedIn: true })
        return
      }

      // Check classes
      if (socio.classes_used >= socio.classes_total) {
        setScanResult({ ...socio, noClasses: true })
        return
      }

      // Register attendance
      const { error: attError } = await supabase.from('attendance').insert([{
        socio_id: socio.id,
        date: today,
        time: nowTime,
        class_name: 'Clase General',
      }])

      if (attError) throw attError

      // Deduct 1 class
      const newUsed = (socio.classes_used || 0) + 1
      const newStatus = newUsed >= socio.classes_total ? 'agotado' : socio.status
      await supabase.from('socios').update({
        classes_used: newUsed,
        status: newStatus,
      }).eq('id', socio.id)

      setScanResult({ ...socio, classes_used: newUsed, success: true })
      loadTodayAttendance()
    } catch (err) {
      setScanError('Error al procesar el QR: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleManualEntry(socioId) {
    if (!socioId) return
    await handleQRScan(null)
    // For manual, we look up by ID
    setLoading(true)
    try {
      const { data: socio } = await supabase.from('socios').select('*').eq('id', socioId).single()
      if (socio) await handleQRScan(socio.qr_code)
    } finally {
      setLoading(false)
    }
  }

  const remaining = scanResult ? (scanResult.classes_total - scanResult.classes_used) : 0
  const alert = getClassesAlert(remaining)

  return (
    <div className="p-8">
      <PageHeader
        title="ASISTENCIA"
        subtitle={`Hoy: ${format(new Date(), 'EEEE dd/MM/yyyy')}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Escáner QR</h3>

          {!scanning && !scanResult && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                className="w-24 h-24 rounded-2xl bg-studio-dark border-2 border-dashed border-studio-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                onClick={startScanner}
              >
                <svg className="w-12 h-12 text-studio-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </div>
              <button onClick={startScanner} className="btn-primary flex items-center gap-2">
                📷 Iniciar Escáner
              </button>
            </div>
          )}

          {scanning && (
            <div>
              <div id="qr-reader" ref={scannerRef} className="w-full rounded-xl overflow-hidden" />
              <button onClick={stopScanner} className="btn-ghost w-full mt-3">Cancelar</button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 gap-3">
              <Spinner /> <span className="text-studio-subtext">Procesando...</span>
            </div>
          )}

          {/* Scan result */}
          {scanResult && !loading && (
            <div className={`rounded-xl border p-4 ${
              scanResult.success ? 'bg-green-900/20 border-green-900/50' :
              scanResult.alreadyCheckedIn ? 'bg-yellow-900/20 border-yellow-900/50' :
              'bg-red-900/20 border-red-900/50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
                  {scanResult.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-white">{scanResult.name}</p>
                  <p className="text-xs text-studio-subtext">{scanResult.email}</p>
                </div>
                {scanResult.success && <span className="ml-auto text-2xl">✅</span>}
                {scanResult.alreadyCheckedIn && <span className="ml-auto text-2xl">⚠️</span>}
                {scanResult.noClasses && <span className="ml-auto text-2xl">🚫</span>}
              </div>

              {scanResult.success && (
                <>
                  <p className="text-green-400 font-semibold text-sm mb-1">✓ Asistencia registrada — {nowTime}</p>
                  <p className="text-studio-subtext text-xs">Clases restantes: {remaining}</p>
                  {alert === 'warning' && <Alert type="warning" className="mt-2">Solo le quedan {remaining} clase(s). ¡Sugiere renovar!</Alert>}
                  {alert === 'danger' && <Alert type="danger" className="mt-2">¡Clases agotadas! Es el último acceso.</Alert>}
                </>
              )}
              {scanResult.alreadyCheckedIn && (
                <p className="text-yellow-400 text-sm">Ya registró asistencia hoy.</p>
              )}
              {scanResult.noClasses && (
                <Alert type="danger" className="mt-1">Sin clases disponibles. Debe renovar membresía.</Alert>
              )}

              <button
                onClick={() => { setScanResult(null); setScanError('') }}
                className="btn-primary w-full mt-3 text-sm"
              >
                Escanear otro
              </button>
            </div>
          )}

          {scanError && !loading && (
            <div>
              <Alert type="danger">{scanError}</Alert>
              <button onClick={() => setScanError('')} className="btn-ghost w-full mt-3 text-sm">Intentar de nuevo</button>
            </div>
          )}
        </div>

        {/* Recent attendance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Asistencia de Hoy</h3>
            <span className="text-primary font-mono font-semibold text-sm">{recentAttendance.length}</span>
          </div>

          {recentAttendance.length === 0 ? (
            <p className="text-studio-subtext text-sm text-center py-8">Sin asistencias registradas hoy</p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {recentAttendance.map((att) => {
                const rem = (att.socio?.classes_total || 0) - (att.socio?.classes_used || 0)
                return (
                  <div key={att.id} className="flex items-center justify-between py-2.5 border-b border-studio-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                        {att.socio?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{att.socio?.name}</p>
                        <p className="text-studio-subtext text-xs">{att.class_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-mono text-sm">{att.time}</p>
                      <p className={`text-xs ${rem <= 0 ? 'text-red-400' : rem <= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {rem} restantes
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
