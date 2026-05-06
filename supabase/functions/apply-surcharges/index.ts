// supabase/functions/apply-surcharges/index.ts
// Deploy with: supabase functions deploy apply-surcharges
// Schedule with pg_cron: SELECT cron.schedule('daily-surcharges', '0 9 * * *', 'SELECT apply_monthly_surcharges()');

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const now = new Date()
    const currentDay = now.getDate()

    // Only apply surcharges after day 5 of the month
    if (currentDay <= 5) {
      return new Response(
        JSON.stringify({ message: 'Not yet day 5 — no surcharges applied', day: currentDay }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // Fetch all pending payments from this month not yet surcharged
    const { data: pendingPayments, error: fetchError } = await supabaseClient
      .from('payments')
      .select('id, amount, original_amount, socio_id')
      .eq('status', 'pending')
      .eq('surcharge_applied', false)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    if (fetchError) throw fetchError

    if (!pendingPayments || pendingPayments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending payments to process', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updated = 0
    const errors = []

    for (const payment of pendingPayments) {
      const base = payment.original_amount ?? payment.amount
      const withSurcharge = Math.round(base * 1.10 * 100) / 100

      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: 'overdue',
          amount: withSurcharge,
          original_amount: base,
          surcharge_applied: true,
          updated_at: now.toISOString(),
        })
        .eq('id', payment.id)

      if (updateError) {
        errors.push({ id: payment.id, error: updateError.message })
      } else {
        updated++
      }
    }

    console.log(`[apply-surcharges] Processed ${updated} payments on ${now.toISOString()}`)

    return new Response(
      JSON.stringify({
        message: `Surcharges applied successfully`,
        updated,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[apply-surcharges] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
