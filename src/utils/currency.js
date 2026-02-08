export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return num.toLocaleString('id-ID')
}

export function formatRupiah(value) {
  const formatted = formatNumber(value)
  return formatted ? `Rp ${formatted}` : ''
}

export function parseNumber(input) {
  if (!input) return 0
  const cleaned = String(input).replace(/[^\d]/g, '')
  return cleaned ? Number(cleaned) : 0
}
