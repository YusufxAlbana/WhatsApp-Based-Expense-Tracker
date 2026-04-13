// Utility data and functions for the Weberganize app
// NO MOCK DATA — all transaction data comes from Google Sheets

export const CATEGORIES = [
  { key: 'makanan', label: 'Makanan', color: '#f97316', icon: '🍔' },
  { key: 'transportasi', label: 'Transportasi', color: '#3b82f6', icon: '🚗' },
  { key: 'hiburan', label: 'Hiburan', color: '#ec4899', icon: '🎮' },
  { key: 'belanja', label: 'Belanja', color: '#a855f7', icon: '🛍️' },
  { key: 'kesehatan', label: 'Kesehatan', color: '#10b981', icon: '💊' },
  { key: 'tagihan', label: 'Tagihan', color: '#eab308', icon: '📄' },
  { key: 'pendidikan', label: 'Pendidikan', color: '#06b6d4', icon: '📚' },
  { key: 'kebutuhan', label: 'Kebutuhan', color: '#8b5cf6', icon: '🏠' },
  { key: 'lainnya', label: 'Lainnya', color: '#6b7280', icon: '📦' },
]

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatShortRupiah(amount) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}jt`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}rb`
  return amount.toString()
}

export function getRelativeTime(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

/**
 * Generate daily trend data from real expenses
 * Groups expenses by date and sums amounts
 */
export function getDailyTrendData(expenses) {
  if (!expenses || expenses.length === 0) return []

  const dailyMap = {}
  expenses.forEach(e => {
    const dateStr = e.tanggal || e.created_at
    if (!dateStr) return
    const date = new Date(dateStr)
    const key = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    if (!dailyMap[key]) dailyMap[key] = 0
    dailyMap[key] += Number(e.amount)
  })

  return Object.entries(dailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .slice(-10) // Show last 10 days
}

/**
 * Compute budget progress from real expenses
 * Calculates spend per category and applies a default budget limit
 */
export function getBudgetFromExpenses(expenses) {
  if (!expenses || expenses.length === 0) return []

  const DEFAULT_LIMITS = {
    'Makanan': 500000,
    'Transportasi': 300000,
    'Hiburan': 200000,
    'Tagihan': 800000,
    'Belanja': 400000,
    'Kesehatan': 200000,
    'Pendidikan': 300000,
    'Kebutuhan': 500000,
    'Lainnya': 200000,
  }

  const spendMap = {}
  expenses.forEach(e => {
    const catName = e.category || 'Lainnya'
    if (!spendMap[catName]) spendMap[catName] = 0
    spendMap[catName] += Number(e.amount)
  })

  return Object.entries(spendMap).map(([category, spent]) => {
    const cat = CATEGORIES.find(c =>
      c.label.toLowerCase() === category.toLowerCase() ||
      c.key === category.toLowerCase()
    )
    return {
      category,
      spent,
      limit: DEFAULT_LIMITS[category] || 300000,
      color: cat?.color || '#6b7280',
      icon: cat?.icon || '📦',
    }
  }).sort((a, b) => b.spent - a.spent)
}
