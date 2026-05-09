import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

const PRICES = {
  pro:   990,   // R$9,90
  boost: 290,   // R$2,90
}

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { type, sticker_id } = body ?? {}

  if (!['pro', 'boost'].includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
  }
  if (type === 'boost' && !sticker_id) {
    return NextResponse.json({ error: 'sticker_id obrigatório para boost.' }, { status: 400 })
  }

  // Validate sticker belongs to user (for boost)
  if (type === 'boost') {
    const { data } = await supabase
      .schema('figurinhas')
      .from('user_stickers')
      .select('id')
      .eq('user_id', user.id)
      .eq('sticker_id', sticker_id)
      .single()
    if (!data) return NextResponse.json({ error: 'Figurinha não encontrada.' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const title = type === 'pro'
    ? 'Troca Figurinhas Pro — contatos ilimitados'
    : 'Impulsionar figurinha por 7 dias'

  const preference = new Preference(mp)
  const result = await preference.create({
    body: {
      items: [{
        id: type === 'pro' ? 'pro-monthly' : `boost-${sticker_id}`,
        title,
        quantity: 1,
        unit_price: PRICES[type as 'pro' | 'boost'] / 100,
        currency_id: 'BRL',
      }],
      payer: { email: user.email },
      metadata: {
        user_id: user.id,
        type,
        sticker_id: sticker_id ?? null,
      },
      back_urls: {
        success: `${baseUrl}/upgrade?status=success&type=${type}`,
        failure: `${baseUrl}/upgrade?status=failure`,
        pending: `${baseUrl}/upgrade?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
    },
  })

  // Record pending payment for audit
  await supabase.schema('figurinhas').from('payments').insert({
    user_id: user.id,
    mp_preference_id: result.id,
    type,
    sticker_id: sticker_id ?? null,
    amount_cents: PRICES[type as 'pro' | 'boost'],
    status: 'pending',
  })

  return NextResponse.json({ init_point: result.init_point })
}
