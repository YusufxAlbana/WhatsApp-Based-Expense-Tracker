// Mock data for demo/prototype UI

export const CATEGORIES = [
  { key: 'makanan', label: 'Makanan', color: '#f97316', icon: '🍔' },
  { key: 'transportasi', label: 'Transportasi', color: '#3b82f6', icon: '🚗' },
  { key: 'hiburan', label: 'Hiburan', color: '#ec4899', icon: '🎮' },
  { key: 'belanja', label: 'Belanja', color: '#a855f7', icon: '🛍️' },
  { key: 'kesehatan', label: 'Kesehatan', color: '#10b981', icon: '💊' },
  { key: 'tagihan', label: 'Tagihan', color: '#eab308', icon: '📄' },
  { key: 'pendidikan', label: 'Pendidikan', color: '#06b6d4', icon: '📚' },
  { key: 'lainnya', label: 'Lainnya', color: '#6b7280', icon: '📦' },
]

export const MOCK_EXPENSES = [
  { id: 1, item: 'Nasi Padang', amount: 20000, category: 'makanan', created_at: '2026-04-10T12:30:00' },
  { id: 2, item: 'Bensin Motor', amount: 35000, category: 'transportasi', created_at: '2026-04-10T08:15:00' },
  { id: 3, item: 'Kopi Susu', amount: 25000, category: 'makanan', created_at: '2026-04-09T14:00:00' },
  { id: 4, item: 'Nonton Bioskop', amount: 50000, category: 'hiburan', created_at: '2026-04-09T19:30:00' },
  { id: 5, item: 'Listrik Bulan Ini', amount: 350000, category: 'tagihan', created_at: '2026-04-08T10:00:00' },
  { id: 6, item: 'Buku Pemrograman', amount: 120000, category: 'pendidikan', created_at: '2026-04-08T15:45:00' },
  { id: 7, item: 'Mie Ayam', amount: 15000, category: 'makanan', created_at: '2026-04-07T12:00:00' },
  { id: 8, item: 'Grab ke Kampus', amount: 18000, category: 'transportasi', created_at: '2026-04-07T07:30:00' },
  { id: 9, item: 'Paracetamol', amount: 12000, category: 'kesehatan', created_at: '2026-04-06T20:00:00' },
  { id: 10, item: 'Kaos Distro', amount: 85000, category: 'belanja', created_at: '2026-04-06T16:00:00' },
  { id: 11, item: 'Ayam Geprek', amount: 18000, category: 'makanan', created_at: '2026-04-05T12:30:00' },
  { id: 12, item: 'Spotify Premium', amount: 54990, category: 'hiburan', created_at: '2026-04-05T00:00:00' },
  { id: 13, item: 'Gojek Pulang', amount: 22000, category: 'transportasi', created_at: '2026-04-04T17:00:00' },
  { id: 14, item: 'Indomie 2 Bungkus', amount: 8000, category: 'makanan', created_at: '2026-04-04T21:00:00' },
  { id: 15, item: 'WiFi Bulanan', amount: 250000, category: 'tagihan', created_at: '2026-04-03T09:00:00' },
  { id: 16, item: 'Bakso Malang', amount: 22000, category: 'makanan', created_at: '2026-04-03T12:30:00' },
  { id: 17, item: 'Parkir Motor', amount: 3000, category: 'transportasi', created_at: '2026-04-02T10:00:00' },
  { id: 18, item: 'Netflix', amount: 54000, category: 'hiburan', created_at: '2026-04-01T00:00:00' },
  { id: 19, item: 'Beli Pulsa', amount: 50000, category: 'tagihan', created_at: '2026-04-01T14:00:00' },
  { id: 20, item: 'Es Teh Manis', amount: 5000, category: 'makanan', created_at: '2026-04-01T15:30:00' },
]

export const DAILY_DATA = [
  { date: '1 Apr', amount: 109000 },
  { date: '2 Apr', amount: 3000 },
  { date: '3 Apr', amount: 272000 },
  { date: '4 Apr', amount: 30000 },
  { date: '5 Apr', amount: 72990 },
  { date: '6 Apr', amount: 97000 },
  { date: '7 Apr', amount: 33000 },
  { date: '8 Apr', amount: 470000 },
  { date: '9 Apr', amount: 75000 },
  { date: '10 Apr', amount: 55000 },
]

export const WEEKLY_DATA = [
  { week: 'Minggu 1', amount: 486990 },
  { week: 'Minggu 2', amount: 730000 },
]

export function getCategoryData(expenses) {
  const map = {}
  expenses.forEach(e => {
    if (!map[e.category]) map[e.category] = 0
    map[e.category] += e.amount
  })
  return CATEGORIES
    .filter(c => map[c.key])
    .map(c => ({ name: c.label, value: map[c.key], color: c.color, icon: c.icon }))
}

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
  const now = new Date('2026-04-10T13:00:00')
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
