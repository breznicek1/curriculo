import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceClient } from '@/lib/supabase/service'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

// 7 days in ms
const BOOST_DURATION_MS = 7 * 24 * 60 * 60 * 1000
// 30 days for pro
const PRO_DURATION_MS   = 30 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  // MP sends different event shapes; handle IPN-style and webhook-style
  const paymentId = body?.data?.id ?? body?.id
  const topic     = body?.type ?? body?.topic

  if (!paymentId || !['payment', 'merchant_order'].includes(topic)) {
    return NextResponse.json({ ok: true })
  }

  // Fetch full payment details from MP
  const paymentApi = new Payment(mp)
  let payment: any
  try {
    payment = await paymentApi.get({ id: String(paymentId) })
  } catch {
    return NextResponse.json({ error: 'payment not found' }, { status: 404 })
  }

  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true, status: payment.status })
  }

  const { user_id, type, sticker_id } = payment.metadata ?? {}
  if (!user_id || !type) return NextResponse.json({ ok: true })

  const supabase = createServiceClient()
  const now = new Date()

  if (type === 'pro') {
    const proExpiresAt = new Date(now.getTime() + PRO_DURATION_MS)
    await supabase
      .schema('figurinhas')
      .from('profiles')
      .update({ is_pro: true, pro_expires_at: proExpiresAt.toISOString() })
      .eq('id', user_id)
  }

  if (type === 'boost' && sticker_id) {
    const expiresAt = new Date(now.getTime() + BOOST_DURATION_MS)
    await supabase.schema('figurinhas').from('boosts').insert({
      user_id,
      sticker_id,
      payment_id: String(paymentId),
      expires_at: expiresAt.toISOString(),
    })
  }

  // Update payment record
  await supabase
    .schema('figurinhas')
    .from('payments')
    .update({ mp_payment_id: String(paymentId), status: 'approved' })
    .eq('mp_preference_id', payment.preference_id)

  return NextResponse.json({ ok: true })
}
