import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Receipt, PieChart as PieChartIcon,
  TrendingUp, Bell, Settings, LogOut, Wallet, Target,
  MessageSquare, RefreshCw, ArrowUpCircle, ArrowDownCircle,
  TrendingDown, Info, ShieldCheck, CreditCard
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import {
  CATEGORIES, formatRupiah, formatShortRupiah, getRelativeTime
} from '../data/mockData.js'
import {
  getExpensesFromSheets,
  getCategoryData as aggregateCategoryData
} from '../services/googleSheets.js'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'
import './Analytics.css'

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

// SIDEBAR_ITEMS REMOVED

export default function Analytics() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [expenses, setExpenses] = useState(() => {
    try {
      const cached = localStorage.getItem('weberganize_expenses')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('weberganize_expenses'))
  const [isSyncing, setIsSyncing] = useState(false)

  // In a real app, income might be in another sheet or a special category.
  // For now, we search for a "Pemasukan" category or return 0.
  const monthlyIncome = useMemo(() => {
    return expenses
      .filter(e => e.category?.toLowerCase() === 'pemasukan' || e.type?.toLowerCase() === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }, [expenses])

  const actualExpenses = useMemo(() => {
    return expenses.filter(e => e.category?.toLowerCase() !== 'pemasukan' && e.type?.toLowerCase() !== 'income')
  }, [expenses])

  useEffect(() => {
    const savedUser = localStorage.getItem('weberganize_user')
    if (!savedUser) {
      navigate('/auth')
    } else {
      setUser(JSON.parse(savedUser))
    }
  }, [navigate])

  const refreshData = async (isBackground = false) => {
    if (!user?.id) return
    if (!isBackground) setIsLoading(true)
    
    try {
      const data = await getExpensesFromSheets(user.id)
      if (data && data.length > 0) {
        setExpenses(data)
        localStorage.setItem('weberganize_expenses', JSON.stringify(data))
      } else {
        setExpenses([])
        localStorage.setItem('weberganize_expenses', JSON.stringify([]))
      }
    } catch (error) {
      console.error('Sync failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      refreshData(true)
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalExp = actualExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netIncome = monthlyIncome - totalExp
    
    // Spending Breakdown by Category
    const catData = aggregateCategoryData(actualExpenses).map(item => {
      const reg = CATEGORIES.find(c => 
        c.label.toLowerCase() === item.name.toLowerCase() || 
        c.key === item.name.toLowerCase()
      )
      return { ...item, color: reg?.color || '#888', icon: reg?.icon || '💰' }
    })

    // Merchant Breakdown
    const merchants = {}
    actualExpenses.forEach(e => {
      const name = e.item || 'Tidak Diketahui'
      merchants[name] = (merchants[name] || 0) + Number(e.amount)
    })
    const topMerchants = Object.entries(merchants)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Financial Health
    const savingRate = monthlyIncome > 0 ? (Math.max(netIncome, 0) / monthlyIncome) * 100 : 0
    // Emergency Fund: How many months of current expenses are covered by current "savings" (surplus)
    const emergencyFundRatio = totalExp > 0 ? (netIncome) / (totalExp / 1) : 0 

    return {
      totalExp,
      netIncome,
      catData,
      topMerchants,
      savingRate,
      emergencyFundRatio,
      hasExpenses: actualExpenses.length > 0,
      hasIncome: monthlyIncome > 0
    }
  }, [actualExpenses, monthlyIncome])

  const chartData = useMemo(() => {
    if (expenses.length === 0) return []
    
    const monthlyData = {}
    expenses.forEach(e => {
      const date = new Date(e.tanggal || e.created_at)
      const monthKey = date.toLocaleDateString('id-ID', { month: 'short' })
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { name: monthKey, exp: 0, inc: 0 }
      
      const isIncome = e.category?.toLowerCase() === 'pemasukan' || e.type?.toLowerCase() === 'income'
      if (isIncome) {
        monthlyData[monthKey].inc += Number(e.amount)
      } else {
        monthlyData[monthKey].exp += Number(e.amount)
      }
    })

    return Object.values(monthlyData).sort((a, b) => {
      // Very basic sort by month name - in real app would use timestamp
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      return months.indexOf(a.name) - months.indexOf(b.name)
    })
  }, [expenses])

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChartIcon size={26} className="text-brand" style={{ marginRight: '8px' }} />
              Analitik Keuangan
            </h1>
            <p className="dashboard-topbar__subtitle">Laporan kesehatan finansial dan proyeksi dompet Anda</p>
          </div>
        </header>

        {/* 1. Cash Flow Section */}
        <section className="analytics-section stagger-children">
          <h2 className="section-title">1. Arus Kas (Cash Flow)</h2>
          <div className="analytics-grid">
            <div className="stat-card glass-card">
              <div className="stat-card__header">
                <span className="stat-card__label">Total Pemasukan</span>
                <div className="stat-card__icon stat-card__icon--green"><ArrowUpCircle /></div>
              </div>
              <div className="stat-card__value">{formatRupiah(monthlyIncome)}</div>
              <div className="stat-card__change stat-card__change--neutral">Estimasi per bulan</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-card__header">
                <span className="stat-card__label">Total Pengeluaran</span>
                <div className="stat-card__icon stat-card__icon--orange"><ArrowDownCircle /></div>
              </div>
              <div className="stat-card__value">{formatRupiah(stats.totalExp)}</div>
              <div className="stat-card__change stat-card__change--neutral">Bulan ini</div>
            </div>
            <div className="stat-card glass-card highlight-card">
              <div className="stat-card__header">
                <span className="stat-card__label">Net Income (Saldo Bersih)</span>
                <div className={`stat-card__icon ${stats.netIncome >= 0 ? 'icon-success' : 'icon-danger'}`}>
                  {stats.netIncome >= 0 ? <TrendingUp /> : <TrendingDown />}
                </div>
              </div>
              <div className={`stat-card__value ${stats.netIncome >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatRupiah(stats.netIncome)}
              </div>
              <div className="stat-card__change stat-card__change--neutral">
                {stats.netIncome >= 0 ? 'Surplus' : 'Defisit'} akhir periode
              </div>
            </div>
          </div>
        </section>

        {/* 2. Alokasi & Merchants */}
        <div className="charts-row mt-xl">
          <div className="chart-card glass-card">
            <h3>2. Alokasi Pengeluaran</h3>
            {!stats.hasExpenses ? (
              <EmptyState icon={PieChartIcon} title="Data Kosong" description="Belum ada transaksi pengeluaran untuk dianalisis." />
            ) : (
              <div className="chart-container-row">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.catData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.catData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend-list">
                  {stats.catData.slice(0, 5).map(cat => (
                    <div className="legend-item" key={cat.name}>
                      <span className="legend-dot" style={{ background: cat.color }}></span>
                      <span className="legend-text">{cat.icon} {cat.name}</span>
                      <span className="legend-val">{formatShortRupiah(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="chart-card glass-card">
            <h3>Top Merchants (Layanan Terbesar)</h3>
            {!stats.hasExpenses ? (
              <EmptyState icon={Receipt} title="Data Kosong" description="Data merchant akan muncul setelah Anda mencatat transaksi." />
            ) : (
              <div className="merchant-list">
                {stats.topMerchants.map((m, i) => (
                  <div className="merchant-item" key={i}>
                    <div className="merchant-rank">{i + 1}</div>
                    <div className="merchant-info">
                      <span className="merchant-name">{m.name}</span>
                      <div className="merchant-progress">
                        <div className="merchant-progress-fill" style={{ width: `${(m.value / stats.totalExp) * 100}%` }}></div>
                      </div>
                    </div>
                    <span className="merchant-value">{formatShortRupiah(m.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Budgeting vs Actual */}
        <section className="analytics-section mt-xl">
          <h2 className="section-title">3. Anggaran (Budgeting)</h2>
          {!stats.hasExpenses ? (
            <div className="glass-card padding-lg text-center">
              <EmptyState icon={Target} title="Anggaran Belum Tersedia" description="Catat pengeluaran untuk melihat performa anggaran Anda." />
            </div>
          ) : (
            <div className="analytics-grid grid-2">
              <div className="glass-card padding-lg">
                <div className="budget-progress-header">
                  <div>
                    <h4 className="text-muted">Budget vs Actual</h4>
                    <p className="text-lg font-bold">Terpakai {stats.hasIncome ? Math.round((stats.totalExp / (monthlyIncome * 0.7)) * 100) : 0}%</p>
                  </div>
                  <Target size={32} className="text-brand" />
                </div>
                <div className="mega-progress-bar">
                  <div 
                    className="mega-progress-fill" 
                    style={{ width: `${stats.hasIncome ? Math.min((stats.totalExp / (monthlyIncome * 0.7)) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted mt-md">Estimasi budget operasional (70% dari pemasukan yang tercatat)</p>
              </div>
              <div className="glass-card padding-lg flex-center-between">
                <div>
                  <h4 className="text-muted">Sisa Saldo Aman</h4>
                  <div className={`text-2xl font-black ${stats.netIncome >= 0 ? 'text-brand-primary' : 'text-danger'}`}>
                    {formatRupiah(Math.max(stats.netIncome, 0))}
                  </div>
                  <p className="text-xs text-muted flex items-center gap-1 mt-xs">
                    <ShieldCheck size={12} /> {stats.netIncome > 0 ? 'Boleh dihabiskan sampai gajian berikutnya' : 'Segera hemat pengeluaran Anda'}
                  </p>
                </div>
                <div className="safe-balance-badge"><Wallet size={40} /></div>
              </div>
            </div>
          )}
        </section>

        {/* 4. Kesehatan Finansial */}
        <div className="charts-row mt-xl">
          <div className="chart-card glass-card accent-blue">
            <div className="flex-between items-start mb-md">
              <h3>4. Kesehatan Finansial</h3>
              <Info size={16} className="text-muted" />
            </div>
            {!stats.hasIncome ? (
              <EmptyState icon={ShieldCheck} title="Pemasukan Tidak Terdeteksi" description="Catat data dengan kategori 'Pemasukan' untuk melihat rasio kesehatan finansial." />
            ) : (
              <div className="health-metrics">
                <div className="health-item">
                  <div className="health-label">
                    <span>Saving Rate</span>
                    <span className="text-brand">{Math.round(stats.savingRate)}%</span>
                  </div>
                  <div className="health-bar"><div className="health-fill" style={{ width: `${stats.savingRate}%` }}></div></div>
                </div>
                <div className="health-item">
                  <div className="health-label">
                    <span>Dana Darurat (Kecukupan)</span>
                    <span className="text-brand">{stats.emergencyFundRatio.toFixed(1)} Bulan</span>
                  </div>
                  <div className="health-bar"><div className="health-fill bg-blue" style={{ width: `${Math.min(stats.emergencyFundRatio * 20, 100)}%` }}></div></div>
                </div>
                <div className="health-item">
                  <div className="health-label">
                    <span>Arus Kas Bersih</span>
                    <span className={stats.netIncome >= 0 ? 'text-brand' : 'text-orange'}>{Math.round((stats.netIncome / monthlyIncome) * 100)}%</span>
                  </div>
                  <div className="health-bar"><div className="health-fill bg-orange" style={{ width: `${Math.abs((stats.netIncome / monthlyIncome) * 100)}%` }}></div></div>
                </div>
              </div>
            )}
          </div>

          <div className="chart-card glass-card accent-purple">
             <h3>5. Tren & Proyeksi</h3>
             {chartData.length < 1 ? (
               <EmptyState icon={TrendingUp} title="Tren Belum Terbentuk" description="Data historis bulanan akan muncul seiring bertambahnya transaksi." />
             ) : (
               <div className="trend-projection">
                 <div className="flex-between mb-sm">
                   <span className="text-sm text-muted">Aktivitas Bulanan (IDR)</span>
                   <span className="text-md font-bold text-success">{chartData[chartData.length - 1].name}</span>
                 </div>
                 <div className="h-40 project-chart mt-md">
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={chartData}>
                      <XAxis dataKey="name" stroke="#555" fontSize={10} />
                      <Tooltip formatter={(v) => formatShortRupiah(v)} />
                      <Area type="monotone" name="Pengeluaran" dataKey="exp" stroke="#ef4444" fill="#ef444422" />
                      <Area type="monotone" name="Pemasukan" dataKey="inc" stroke="#25D366" fill="#25D36622" />
                    </AreaChart>
                  </ResponsiveContainer>
                 </div>
                 <p className="text-xs text-muted italic mt-sm">* Merah: Pengeluaran, Hijau: Pemasukan</p>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  )
}
