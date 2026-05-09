// ─── Configuração de links afiliados ───────────────────────────────────────
// Substitua os valores abaixo pelas suas IDs reais de cada programa:
//   • Mercado Livre Afiliados: https://afiliados.mercadolivre.com.br
//   • Amazon Associados BR:    https://associados.amazon.com.br
//   • Lomadee (Panini Store):  https://www.lomadee.com

const ML_TOOL_ID     = 'SEU_ML_TOOL_ID'         // ex: 123456
const ML_CAMPAIGN    = 'figurinhas-copa-2026'
const AMAZON_TAG     = 'seu-tag-22'              // ex: meublog-22
const PANINI_COUPON  = ''                        // cupom de desconto (opcional)

// ──────────────────────────────────────────────────────────────────────────

function mlSearchUrl(query: string): string {
  const q = encodeURIComponent(query)
  return (
    `https://www.mercadolivre.com.br/jm/search?q=${q}` +
    `&matt_tool=${ML_TOOL_ID}&matt_campaign=${ML_CAMPAIGN}&matt_source=figurinhas`
  )
}

function amazonSearchUrl(query: string): string {
  const q = encodeURIComponent(query)
  return `https://www.amazon.com.br/s?k=${q}&tag=${AMAZON_TAG}`
}

// Link para buscar uma figurinha específica pelo nome do jogador
export function stickerBuyUrl(playerName: string): string {
  const query = `figurinha panini copa 2026 ${playerName}`
  return mlSearchUrl(query)
}

// Link para buscar pacotes/envelopes avulsos
export function pacotesBuyUrl(): string {
  return mlSearchUrl('envelope pacote figurinha panini copa do mundo 2026')
}

// Link para comprar o álbum completo
export function albumBuyUrl(): string {
  return mlSearchUrl('álbum panini copa do mundo 2026')
}

// Link Panini Store oficial
export function paniniStoreUrl(): string {
  return 'https://www.panini.com.br/shp_bra_ptb/stickers/copa-do-mundo-2026.html'
}

// Link Amazon para pacotes
export function pacotesAmazonUrl(): string {
  return amazonSearchUrl('figurinha panini copa 2026 envelope')
}
