const formatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function fmt(n: unknown): string {
  const num = Number(n)
  if (isNaN(num)) return '0.00'
  return formatter.format(num)
}
