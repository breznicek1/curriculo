import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations'

function normalizeBRPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return '55' + digits
  return digits
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { owner_id, sticker_id, message, method } = parsed.data

  if (owner_id === user.id) {
    return NextResponse.json({ error: 'Você não pode contatar a si mesmo.' }, { status: 400 })
  }

  // Check monthly contact limit for free users
  const FREE_LIMIT = 5
  const { data: myProfile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  if (!myProfile?.is_pro) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .schema('figurinhas')
      .from('contact_requests')
      .select('*', { count: 'exact', head: true })
      .eq('requester_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= FREE_LIMIT) {
      return NextResponse.json(
        { error: 'limit_reached', upgrade_url: '/upgrade' },
        { status: 402 }
      )
    }
  }

  // Lookup owner profile (phone/email are sensitive — kept server-side only)
  const { data: owner, error: ownerError } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('phone, contact_by_whatsapp, contact_by_email')
    .eq('id', owner_id)
    .single()

  if (ownerError || !owner) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  if (method === 'whatsapp' && !owner.contact_by_whatsapp) {
    return NextResponse.json({ error: 'Este usuário não aceita contato via WhatsApp.' }, { status: 400 })
  }
  if (method === 'email' && !owner.contact_by_email) {
    return NextResponse.json({ error: 'Este usuário não aceita contato via e-mail.' }, { status: 400 })
  }

  // Log the contact request
  await supabase.schema('figurinhas').from('contact_requests').insert({
    requester_id: user.id,
    owner_id,
    sticker_id,
    message: message || null,
    method,
    status: 'pending',
  })

  if (method === 'whatsapp') {
    const phone = normalizeBRPhone(owner.phone)
    const text = message
      ? encodeURIComponent(
          `Olá! Vi no Troca Figurinhas Copa 2026 que você tem a figurinha que preciso. ${message}`
        )
      : encodeURIComponent('Olá! Vi no Troca Figurinhas Copa 2026 que você tem uma figurinha que preciso. Podemos trocar?')

    // URL is generated server-side and returned — phone number not exposed in the app UI
    const url = `https://wa.me/${phone}?text=${text}`

    await supabase
      .schema('figurinhas')
      .from('contact_requests')
      .update({ status: 'sent' })
      .eq('requester_id', user.id)
      .eq('owner_id', owner_id)
      .eq('sticker_id', sticker_id)

    return NextResponse.json({ ok: true, method: 'whatsapp', url })
  }

  // Email method: recorded as pending (email delivery requires external service)
  return NextResponse.json({ ok: true, method: 'email' })
}
