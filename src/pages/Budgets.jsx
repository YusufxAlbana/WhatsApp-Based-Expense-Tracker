import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Receipt, PieChart as PieChartIcon,
  Target, Bell, Settings, LogOut, Plus, Edit3, Trash2, 
  ChevronDown, AlertTriangle, CheckCircle2, Info, ArrowUpRight,
  ArrowDownRight, Save, X, Calendar, Flag, MessageSquare, RefreshCw
} from 'lucide-react'
import {
  CATEGORIES, formatRupiah, formatShortRupiah
} from '../data/mockData.js'
import {
  getExpensesFromSheets
} from '../services/googleSheets.js'
import './Dashboard.css'
import './Budgets.css'

import Sidebar from '../components/Sidebar'

const DEFAULT_BUDGETS = [
  { id: 1, category: 'Makanan', limit: 2000000, threshold: 80, cycle: 'Bulanan', priority: 'Wajib', rollover: false, icon: '🍔', color: '#f97316', notes: 'Makan harian & kantor' },
  { id: 2, category: 'Transportasi', limit: 1000000, threshold: 90, cycle: 'Bulanan', priority: 'Wajib', rollover: true, icon: '🚗', color: '#3b82f6', notes: 'Bensin & Ojol' },
  { id: 3, category: 'Hiburan', limit: 500000, threshold: 70, cycle: 'Bulanan', priority: 'Opsional', rollover: false, icon: '🎮', color: '#ec4899', notes: 'Netflix & Bioskop' },
]

export default function Budgets() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Budget State
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('weberganize_budgets')
    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS
  })

  // Modal/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    category: '', limit: '', threshold: 80, cycle: 'Bulanan', 
    priority: 'Wajib', rollover: false, icon: '💰', color: '#25D366', notes: ''
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('weberganize_user')
    if (!savedUser) {
      navigate('/auth')
    } else {
      setUser(JSON.parse(savedUser))
    }
  }, [navigate])

  const refreshData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    const data = await getExpensesFromSheets(user.id)
    setExpenses(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    if (user) refreshData()
  }, [user])

  useEffect(() => {
    localStorage.setItem('weberganize_budgets', JSON.stringify(budgets))
  }, [budgets])

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  // Calculate Real Spent per Budget Category
  const budgetStats = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(e => e.category?.toLowerCase() === b.category?.toLowerCase() || 
                     e.category?.toLowerCase() === b.id.toString())
        .reduce((sum, e) => sum + Number(e.amount), 0)
      
      const remaining = b.limit - spent
      const percent = Math.round((spent / b.limit) * 100)
      const isOver = percent >= b.threshold
      const isCritical = percent >= 100

      return { ...b, spent, remaining, percent, isOver, isCritical }
    })
  }, [budgets, expenses])

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit), 0)
  const totalSpent = budgetStats.reduce((sum, b) => sum + b.spent, 0)
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  // Actions
  const handleOpenModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget)
      setFormData({ ...budget })
    } else {
      setEditingBudget(null)
      setFormData({
        category: '', limit: '', threshold: 80, cycle: 'Bulanan', 
        priority: 'Wajib', rollover: false, icon: '💰', color: '#25D366', notes: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingBudget) {
      setBudgets(budgets.map(b => b.id === editingBudget.id ? { ...formData, id: b.id } : b))
    } else {
      setBudgets([...budgets, { ...formData, id: Date.now() }])
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Hapus anggaran ini?')) {
      setBudgets(budgets.filter(b => b.id !== id))
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
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title">🎯 Kelola Anggaran</h1>
            <p className="dashboard-topbar__subtitle">Atur batas pengeluaran untuk kesehatan dompet Anda</p>
          </div>
          <div className="dashboard-topbar__right">
            <button className="btn-secondary" onClick={refreshData} disabled={isLoading}>
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span>Update Data</span>
            </button>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} />
              <span>Budget Baru</span>
            </button>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="budget-overview-grid stagger-children">
          <div className="glass-card budget-summary-card">
            <div className="summary-header">
              <div className="summary-info">
                <span className="text-muted text-sm">Total Budget Bulanan</span>
                <h2 className="text-2xl font-black">{formatRupiah(totalBudget)}</h2>
              </div>
              <div className="summary-percentage">
                <div className="circular-progress" style={{ '--percent': overallPercent }}>
                  <span>{overallPercent}%</span>
                </div>
              </div>
            </div>
            <div className="summary-footer">
              <div className="footer-item">
                <ArrowDownRight className="text-danger" size={16} />
                <span>Terpakai: {formatShortRupiah(totalSpent)}</span>
              </div>
              <div className="footer-item">
                <ArrowUpRight className="text-brand" size={16} />
                <span>Sisa: {formatShortRupiah(totalBudget - totalSpent)}</span>
              </div>
            </div>
          </div>

          <div className="glass-card budget-insight-card">
            <div className="flex items-start gap-4">
              <div className="insight-icon info-bg"><Info size={24} /></div>
              <div>
                <h4 className="font-bold">Insight Anggaran</h4>
                <p className="text-sm text-muted mt-1">
                  {overallPercent > 80 ? 'Waspada! Pengeluaran total hampir mencapai batas.' : 'Dompet Anda dalam kondisi sehat bulan ini.'}
                </p>
                <div className="period-comparison mt-3">
                   <span className="text-xs text-brand bg-brand-light px-2 py-1 rounded-full">
                     <ArrowDownRight size={10} className="inline mr-1" /> 12% lebih hemat dari bulan lalu
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Cards List */}
        <div className="budget-list-grid mt-xl">
          {budgetStats.map(b => (
            <div key={b.id} className={`budget-card-item glass-card ${b.isCritical ? 'border-critical' : b.isOver ? 'border-warning' : ''}`}>
              <div className="budget-card-header">
                <div className="category-info">
                  <div className="cat-icon-container" style={{ backgroundColor: `${b.color}22`, color: b.color }}>
                    <span>{b.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{b.category}</h3>
                    <span className="text-xs text-muted font-medium uppercase tracking-wider">{b.priority} • {b.cycle}</span>
                  </div>
                </div>
                <div className="budget-card-actions">
                  <button className="action-circle edit" onClick={() => handleOpenModal(b)}><Edit3 size={14} /></button>
                  <button className="action-circle delete" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="budget-progress-section mt-lg">
                <div className="flex-between mb-2">
                  <span className="text-sm font-bold">{b.percent}% Terpakai</span>
                  <span className="text-xs text-muted">Limit: {formatShortRupiah(b.limit)}</span>
                </div>
                <div className="budget-bar-large">
                  <div 
                    className="budget-bar-fill" 
                    style={{ 
                      width: `${Math.min(b.percent, 100)}%`, 
                      backgroundColor: b.isCritical ? '#ef4444' : b.isOver ? '#f59e0b' : b.color 
                    }}
                  ></div>
                </div>
              </div>

              <div className="budget-details mt-lg">
                <div className="detail-row">
                   <span className="text-muted text-sm">Sisa Anggaran</span>
                   <span className={`font-bold ${b.remaining < 0 ? 'text-danger' : 'text-brand'}`}>
                     {formatRupiah(b.remaining)}
                   </span>
                </div>
                {b.notes && (
                  <div className="budget-notes mt-md">
                    <p className="text-xs text-muted italic">" {b.notes} "</p>
                  </div>
                )}
              </div>

              {b.isOver && (
                <div className={`budget-alert-pill mt-md ${b.isCritical ? 'critical' : 'warning'}`}>
                  {b.isCritical ? <AlertTriangle size={14} /> : <Bell size={14} />}
                  <span>{b.isCritical ? 'Budget Terlampaui!' : 'Mendekati Batas!'}</span>
                </div>
              )}
            </div>
          ))}

          {/* Add New Trigger Card */}
          <div className="budget-card-item add-card cursor-pointer" onClick={() => handleOpenModal()}>
             <div className="flex-center flex-col gap-3 py-10 opacity-60 hover:opacity-100 transition-opacity">
                <div className="add-icon-circle"><Plus size={30} /></div>
                <span className="font-bold">Tambah Anggaran</span>
             </div>
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-card card-xl">
            <div className="modal-header">
              <h3>{editingBudget ? 'Edit Anggaran' : 'Anggaran Baru'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row grid-2">
                <div className="form-group">
                  <label>Nama Kategori</label>
                  <input 
                    required 
                    placeholder="Misal: Jajan" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Simbol Ikon</label>
                  <input 
                    placeholder="Emoji, misal: 🍟" 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row grid-2">
                <div className="form-group">
                  <label>Nominal Limit (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="1000000" 
                    value={formData.limit} 
                    onChange={e => setFormData({...formData, limit: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Ambang Batas Peringatan (%)</label>
                  <input 
                    type="number" 
                    value={formData.threshold} 
                    onChange={e => setFormData({...formData, threshold: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row grid-3">
                <div className="form-group">
                  <label>Prioritas</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option>Wajib</option>
                    <option>Opsional</option>
                  </select>
                </div>
                <div className="form-group">
                   <label>Siklus</label>
                   <select value={formData.cycle} onChange={e => setFormData({...formData, cycle: e.target.value})}>
                     <option>Mingguan</option>
                     <option>Bulanan</option>
                     <option>Tahunan</option>
                   </select>
                </div>
                <div className="form-group flex items-end">
                   <label className="checkbox-group">
                     <input 
                       type="checkbox" 
                       checked={formData.rollover} 
                       onChange={e => setFormData({...formData, rollover: e.target.checked})} 
                     />
                     <span>Rollover</span>
                   </label>
                </div>
              </div>

              <div className="form-group">
                <label>Catatan / Tujuan</label>
                <textarea 
                  rows="2" 
                  placeholder="Deskripsi singkat..." 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary"><Save size={18} /> Simpan Anggaran</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
