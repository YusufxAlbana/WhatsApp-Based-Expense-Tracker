import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Receipt, PieChart as PieChartIcon,
  TrendingUp, Bell, Settings, LogOut, Search, Plus,
  ArrowUpRight, ArrowDownRight, Calendar, Filter,
  ChevronDown, Wallet, Target, MessageSquare, Download
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  Legend
} from 'recharts'
import {
  MOCK_EXPENSES, DAILY_DATA, CATEGORIES,
  getCategoryData as getMockCategoryData, formatRupiah, getRelativeTime
} from '../data/mockData.js'
import { 
  sendToGoogleSheets, 
  getExpensesFromSheets, 
  getCategoryData as aggregateCategoryData 
} from '../services/googleSheets.js'
import './Dashboard.css'

// Constants removed here as they are now handled inside the Dashboard component state

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard', active: true },
  { icon: Receipt, label: 'Transaksi', key: 'transactions' },
  { icon: PieChartIcon, label: 'Analitik', key: 'analytics' },
  { icon: Target, label: 'Budget', key: 'budget' },
  { icon: MessageSquare, label: 'WhatsApp', key: 'whatsapp' },
  { icon: Bell, label: 'Notifikasi', key: 'notifications' },
  { icon: Settings, label: 'Pengaturan', key: 'settings' },
]

const BUDGET_DATA = [
  { category: 'Makanan', spent: 110000, limit: 500000, color: '#f97316', icon: '🍔' },
  { category: 'Transportasi', spent: 78000, limit: 300000, color: '#3b82f6', icon: '🚗' },
  { category: 'Hiburan', spent: 158990, limit: 200000, color: '#ec4899', icon: '🎮' },
  { category: 'Tagihan', spent: 654990, limit: 800000, color: '#eab308', icon: '📄' },
]

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__label">{label}</p>
        <p className="chart-tooltip__value">{formatRupiah(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [timeFilter, setTimeFilter] = useState('Bulan Ini')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  
  // User state from localStorage
  const [user, setUser] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('weberganize_user')
    if (!savedUser) {
      navigate('/auth')
    } else {
      setUser(JSON.parse(savedUser))
    }
  }, [navigate])

  // Fetch data from Sheets using userId
  const refreshData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    const data = await getExpensesFromSheets(user.id)
    if (data && data.length > 0) {
      setExpenses(data)
    } else {
      setExpenses([]) // No fallback to mock for logged in user to avoid confusion
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (user) {
      refreshData()
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  // Recalculate stats based on current expenses
  const currentExpenses = expenses.length > 0 ? expenses : MOCK_EXPENSES
  
  // Use the new aggregator from Sheets service
  const aggregatedData = aggregateCategoryData(currentExpenses)
  
  // Enrich with icons and colors for UI
  const categoryPieData = aggregatedData.map(item => {
    const registry = CATEGORIES.find(c => c.label.toLowerCase() === item.name.toLowerCase() || c.key === item.name.toLowerCase())
    return {
      ...item,
      color: registry?.color || '#888',
      icon: registry?.icon || '💰'
    }
  })

  const totalThisMonth = currentExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalItems = currentExpenses.length
  const avgPerDay = Math.round(totalThisMonth / 30)
  const topCategory = categoryPieData.length > 0 
    ? categoryPieData.reduce((a, b) => a.value > b.value ? a : b)
    : { name: 'None', icon: '❓', color: '#ccc', value: 0 }

  const handleAddMockExpense = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    
    const mockAiData = {
      userId: user.id, // Include userId in data
      item: "Kopi Gula Aren",
      amount: 18000,
      category: "Makanan"
    }

    try {
      const success = await sendToGoogleSheets(mockAiData)
      if (success) {
        setSyncStatus('success')
        refreshData() // Refresh data after adding
        setTimeout(() => setSyncStatus(null), 3000)
      } else {
        setSyncStatus('error')
        setTimeout(() => setSyncStatus(null), 3000)
      }
    } catch (err) {
      setSyncStatus('error')
      setTimeout(() => setSyncStatus(null), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar--collapsed'}`}>
        <div className="sidebar__top">
          <Link to="/" className="sidebar__logo" id="sidebar-logo">
            <div className="navbar__logo-icon"><Zap size={18} /></div>
            {sidebarOpen && <span className="navbar__logo-text">Weberganize</span>}
          </Link>
        </div>

        <nav className="sidebar__nav">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.key}
              className={`sidebar__item ${activeTab === item.key ? 'sidebar__item--active' : ''}`}
              onClick={() => setActiveTab(item.key)}
              id={`sidebar-${item.key}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">{user?.name?.[0] || 'U'}</div>
            {sidebarOpen && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.name || 'User'}</span>
                <span className="sidebar__user-plan">Plan: Gratis</span>
              </div>
            )}
          </div>
          <button className="sidebar__item sidebar__logout" id="sidebar-logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title">Dashboard</h1>
            <p className="dashboard-topbar__subtitle">Selamat datang kembali, {user?.name || 'User'} 👋</p>
          </div>
          <div className="dashboard-topbar__right">
            <div className="dashboard-topbar__search">
              <Search size={16} />
              <input type="text" placeholder="Cari transaksi..." id="dashboard-search" />
            </div>
            <button className="dashboard-topbar__filter" id="dashboard-time-filter">
              <Calendar size={16} />
              {timeFilter}
              <ChevronDown size={14} />
            </button>
            <button 
              className={`btn-primary dashboard-topbar__add ${isSyncing ? 'btn--loading' : ''}`} 
              id="dashboard-add-btn"
              onClick={handleAddMockExpense}
              disabled={isSyncing || !user}
            >
              {isSyncing ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Test Sync ke Sheets</span>
                </>
              )}
            </button>
          </div>
        </header>

        {syncStatus && (
          <div className={`sync-toast sync-toast--${syncStatus} animate-fade-in`}>
            {syncStatus === 'success' ? (
              <><Zap size={16} /> Data berhasil dikirim ke Google Sheets!</>
            ) : (
              <>⚠️ Gagal mengirim data ke Sheets.</>
            )}
          </div>
        )}

        {/* Stat Cards */}
        <div className="stat-cards stagger-children">
          <div className="stat-card glass-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Total Pengeluaran</span>
              <div className="stat-card__icon stat-card__icon--green">
                <Wallet size={18} />
              </div>
            </div>
            <div className="stat-card__value">{isLoading ? '...' : formatRupiah(totalThisMonth)}</div>
            <div className="stat-card__change stat-card__change--down">
              <ArrowUpRight size={14} />
              <span>+12% dari bulan lalu</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Rata-rata/Hari</span>
              <div className="stat-card__icon stat-card__icon--blue">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-card__value">{isLoading ? '...' : formatRupiah(avgPerDay)}</div>
            <div className="stat-card__change stat-card__change--up">
              <ArrowDownRight size={14} />
              <span>-5% dari minggu lalu</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Total Transaksi</span>
              <div className="stat-card__icon stat-card__icon--purple">
                <Receipt size={18} />
              </div>
            </div>
            <div className="stat-card__value">{isLoading ? '...' : totalItems}</div>
            <div className="stat-card__change stat-card__change--neutral">
              <span>Bulan ini</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Kategori Terbesar</span>
              <div className="stat-card__icon stat-card__icon--orange">
                <PieChartIcon size={18} />
              </div>
            </div>
            <div className="stat-card__value">{isLoading ? '...' : `${topCategory.icon} ${topCategory.name}`}</div>
            <div className="stat-card__change stat-card__change--neutral">
              <span>{isLoading ? '...' : formatRupiah(topCategory.value)}</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-card glass-card">
            <div className="chart-card__header">
              <h3>Tren Pengeluaran</h3>
              <div className="chart-card__filters">
                <button className="chart-filter chart-filter--active">Harian</button>
                <button className="chart-filter">Mingguan</button>
              </div>
            </div>
            <div className="chart-card__body">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={DAILY_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8888a0', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8888a0', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v/1000)}rb`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#25D366"
                    strokeWidth={2.5}
                    fill="url(#colorAmount)"
                    dot={{ fill: '#25D366', strokeWidth: 2, r: 4, stroke: '#0a0a0f' }}
                    activeDot={{ r: 6, stroke: '#25D366', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass-card">
            <div className="chart-card__header">
              <h3>Per Kategori</h3>
              <button className="chart-filter">
                <Download size={14} /> Export
              </button>
            </div>
            <div className="chart-card__body chart-card__body--pie">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatRupiah(value)}
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: '#f0f0f5',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {categoryPieData.map((item, i) => (
                  <div key={i} className="pie-legend__item">
                    <span className="pie-legend__dot" style={{ background: item.color }}></span>
                    <span className="pie-legend__label">{item.icon} {item.name}</span>
                    <span className="pie-legend__value">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Budget + Recent */}
        <div className="bottom-row">
          {/* Budget Progress */}
          <div className="budget-card glass-card">
            <div className="chart-card__header">
              <h3>🎯 Budget Tracker</h3>
              <button className="chart-filter">Edit Budget</button>
            </div>
            <div className="budget-list">
              {BUDGET_DATA.map((item, i) => {
                const pct = Math.round((item.spent / item.limit) * 100)
                const isOver = pct > 80
                return (
                  <div key={i} className="budget-item">
                    <div className="budget-item__header">
                      <span className="budget-item__name">{item.icon} {item.category}</span>
                      <span className={`budget-item__pct ${isOver ? 'budget-item__pct--warn' : ''}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="budget-bar">
                      <div
                        className="budget-bar__fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: isOver
                            ? 'linear-gradient(90deg, #f97316, #ef4444)'
                            : `linear-gradient(90deg, ${item.color}, ${item.color}88)`
                        }}
                      ></div>
                    </div>
                    <div className="budget-item__amounts">
                      <span>{formatRupiah(item.spent)}</span>
                      <span>dari {formatRupiah(item.limit)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="recent-card glass-card">
            <div className="chart-card__header">
              <h3>📝 Transaksi Terbaru</h3>
              <button className="chart-filter" id="view-all-transactions">Lihat Semua</button>
            </div>
            <div className="recent-list">
              {currentExpenses.slice(0, 8).map((expense, idx) => {
                const cat = CATEGORIES.find(c => c.key === expense.category || c.label === expense.category)
                return (
                  <div key={expense.id || idx} className="recent-item">
                    <div className="recent-item__icon" style={{ background: `${cat?.color || '#333'}18`, color: cat?.color || '#888' }}>
                      {cat?.icon || '💰'}
                    </div>
                    <div className="recent-item__info">
                      <span className="recent-item__name">{expense.item}</span>
                      <span className="recent-item__time">{(expense.tanggal || expense.created_at) ? getRelativeTime(expense.tanggal || expense.created_at) : 'Baru saja'}</span>
                    </div>
                    <div className="recent-item__amount">
                      <span>-{formatRupiah(expense.amount)}</span>
                      <span className="recent-item__cat" style={{ color: cat?.color || '#888' }}>{cat?.label || expense.category}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* WhatsApp Quick Recap */}
        <div className="wa-recap glass-card">
          <div className="wa-recap__icon">
            <MessageSquare size={24} />
          </div>
          <div className="wa-recap__content">
            <h4>💬 Update dari WhatsApp</h4>
            <p>Terakhir tercatat: <strong>Nasi Padang Rp20.000</strong> — 30 menit lalu. Bot Weberganize aktif dan menunggu pesan berikutnya.</p>
          </div>
          <button className="btn-secondary wa-recap__btn" id="wa-recap-btn">
            Lihat Riwayat Chat
          </button>
        </div>
      </main>
    </div>
  )
}
