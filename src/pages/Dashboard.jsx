import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Receipt, PieChart as PieChartIcon,
  TrendingUp, TrendingDown, Plus, Search,
  ArrowDownCircle, ArrowUpRight, Calendar, ChevronDown,
  Wallet, Target, MessageSquare,
  RefreshCw, Inbox
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  CATEGORIES, formatRupiah, formatShortRupiah, getRelativeTime,
  getDailyTrendData, getBudgetFromExpenses
} from '../data/mockData.js'
import { 
  sendToGoogleSheets, 
  getExpensesFromSheets, 
  getCategoryData as aggregateCategoryData 
} from '../services/googleSheets.js'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'

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

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon size={40} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
    </div>
  )
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
      setExpenses([])
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

  // --- ALL COMPUTED DATA FROM REAL EXPENSES ---
  const hasData = expenses.length > 0

  // Category aggregation
  const aggregatedData = aggregateCategoryData(expenses)
  const categoryPieData = aggregatedData.map(item => {
    const registry = CATEGORIES.find(c =>
      c.label.toLowerCase() === item.name.toLowerCase() ||
      c.key === item.name.toLowerCase()
    )
    return {
      ...item,
      color: registry?.color || '#888',
      icon: registry?.icon || '💰'
    }
  })

  // Stats
  const totalThisMonth = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalItems = expenses.length
  const avgPerDay = totalItems > 0 ? Math.round(totalThisMonth / 30) : 0
  const topCategory = categoryPieData.length > 0 
    ? categoryPieData.reduce((a, b) => a.value > b.value ? a : b)
    : { name: '-', icon: '📊', color: '#555', value: 0 }

  // Trend chart data from REAL expenses
  const dailyTrendData = getDailyTrendData(expenses)

  // Budget from REAL expenses
  const budgetData = getBudgetFromExpenses(expenses)

  // Last transaction for WhatsApp recap
  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null

  // Manual add handler
  const handleRefreshSync = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    try {
      await refreshData()
      setSyncStatus('success')
      setTimeout(() => setSyncStatus(null), 3000)
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
      <Sidebar 
        isOpen={sidebarOpen} 
        user={user} 
        onLogout={handleLogout} 
      />

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
              id="dashboard-sync-btn"
              onClick={handleRefreshSync}
              disabled={isSyncing || !user}
            >
              {isSyncing ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <RefreshCw size={18} />
                  <span>Sync Data</span>
                </>
              )}
            </button>
          </div>
        </header>

        {syncStatus && (
          <div className={`sync-toast sync-toast--${syncStatus} animate-fade-in`}>
            {syncStatus === 'success' ? (
              <><Zap size={16} /> Data berhasil disinkronkan dari Google Sheets!</>
            ) : (
              <>⚠️ Gagal sinkronisasi data.</>
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
            <div className="stat-card__change stat-card__change--neutral">
              <span>Bulan ini</span>
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
            <div className="stat-card__change stat-card__change--neutral">
              <span>Estimasi harian</span>
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
              <span>{totalItems > 0 ? 'Transaksi tercatat' : 'Belum ada data'}</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Kategori Terbesar</span>
              <div className="stat-card__icon stat-card__icon--orange">
                <PieChartIcon size={18} />
              </div>
            </div>
            <div className="stat-card__value">
              {isLoading ? '...' : (topCategory.name === '-' ? '-' : `${topCategory.icon} ${topCategory.name}`)}
            </div>
            <div className="stat-card__change stat-card__change--neutral">
              <span>{isLoading ? '...' : (topCategory.name === '-' ? 'Mulai mencatat di WA' : formatRupiah(topCategory.value))}</span>
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
              </div>
            </div>
            <div className="chart-card__body">
              {!hasData || dailyTrendData.length === 0 ? (
                <EmptyState 
                  icon={TrendingUp} 
                  title="Belum Ada Data Tren" 
                  description="Kirim pengeluaran lewat WhatsApp untuk melihat grafik tren harian kamu di sini."
                />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailyTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
              )}
            </div>
          </div>

          <div className="chart-card glass-card">
            <div className="chart-card__header">
              <h3>Per Kategori</h3>
            </div>
            <div className="chart-card__body chart-card__body--pie">
              {!hasData || categoryPieData.length === 0 ? (
                <EmptyState 
                  icon={PieChartIcon} 
                  title="Belum Ada Kategori" 
                  description="Data kategori akan muncul setelah kamu mulai mencatat pengeluaran."
                />
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Budget + Recent */}
        <div className="bottom-row">
          {/* Budget Progress */}
          <div className="budget-card glass-card">
            <div className="chart-card__header">
              <h3>🎯 Budget Tracker</h3>
            </div>
            <div className="budget-list">
              {!hasData || budgetData.length === 0 ? (
                <EmptyState 
                  icon={Target} 
                  title="Belum Ada Budget" 
                  description="Budget akan otomatis dihitung dari data pengeluaranmu."
                />
              ) : (
                budgetData.slice(0, 5).map((item, i) => {
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
                })
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="recent-card glass-card">
            <div className="chart-card__header">
              <h3>📝 Transaksi Terbaru</h3>
              {hasData && (
                <button className="chart-filter" id="view-all-transactions" onClick={() => navigate('/transactions')}>Lihat Semua</button>
              )}
            </div>
            <div className="recent-list">
              {!hasData ? (
                <EmptyState 
                  icon={Inbox} 
                  title="Belum Ada Transaksi" 
                  description="Kirim pesan pengeluaran ke WhatsApp Bot untuk mulai mencatat."
                />
              ) : (
                expenses.slice(-8).reverse().map((expense, idx) => {
                  const cat = CATEGORIES.find(c => c.key === expense.category?.toLowerCase() || c.label === expense.category)
                  return (
                    <div key={idx} className="recent-item">
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
                })
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Quick Recap */}
        <div className="wa-recap glass-card">
          <div className="wa-recap__icon">
            <MessageSquare size={24} />
          </div>
          <div className="wa-recap__content">
            <h4>💬 Status WhatsApp Bot</h4>
            {lastExpense ? (
              <p>Terakhir tercatat: <strong>{lastExpense.item} {formatRupiah(lastExpense.amount)}</strong> — {(lastExpense.tanggal || lastExpense.created_at) ? getRelativeTime(lastExpense.tanggal || lastExpense.created_at) : 'Baru saja'}. Bot Weberganize aktif dan menunggu pesan berikutnya.</p>
            ) : (
              <p>Belum ada transaksi yang tercatat dari WhatsApp. Kirim pesan ke bot untuk mulai mencatat pengeluaranmu!</p>
            )}
          </div>
          <button className="btn-secondary wa-recap__btn" id="wa-recap-btn" onClick={handleRefreshSync}>
            {isSyncing ? 'Memuat...' : 'Refresh Data'}
          </button>
        </div>
      </main>
    </div>
  )
}
