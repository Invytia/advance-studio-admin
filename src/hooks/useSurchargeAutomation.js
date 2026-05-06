import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { isOverdue } from '../utils/helpers'

const STORAGE_KEY = 'advance_surcharge_last_run'

/**
 * Runs surcharge automation once per day (client-side fallback).
 * For production, also set up a Supabase Edge Function with pg_cron.
 */
export function useSurchargeAutomation() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const today = new Date().toISOString().slice(0, 10)
    const lastRun = localStorage.getItem(STORAGE_KEY)

    if (lastRun === today) return
    if (!isOverdue()) return

    runSurchargeCheck().then(() => {
      localStorage.setItem(STORAGE_KEY, today)
    })
  }, [])
}

async function runSurchargeCheck() {
  try {
    // Get all pending payments from current month that haven't had surcharge applied
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { data: pendingPayments, error } = await supabase
      .from('payments')
      .select('id, amount, original_amount')
      .eq('status', 'pending')
      .eq('surcharge_applied', false)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    if (error || !pendingPayments?.length) return

    // Apply 10% surcharge to each
    for (const payment of pendingPayments) {
      const base = payment.original_amount || payment.amount
      const withSurcharge = parseFloat((base * 1.10).toFixed(2))

      await supabase.from('payments').update({
        status: 'overdue',
        amount: withSurcharge,
        original_amount: base,
        surcharge_applied: true,
        updated_at: new Date().toISOString(),
      }).eq('id', payment.id)
    }

    console.log(`[Advance Studio] Applied surcharge to ${pendingPayments.length} payment(s)`)
  } catch (err) {
    console.error('[Advance Studio] Surcharge automation error:', err)
  }
}
