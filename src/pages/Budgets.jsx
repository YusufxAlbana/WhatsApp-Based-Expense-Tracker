import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, Plus, Edit3, Trash2,
  AlertTriangle, Info, ArrowUpRight,
  ArrowDownRight, Save, X, Bell, RefreshCw, Wallet,
  ChevronDown, Check
} from 'lucide-react'
import { formatRupiah, formatShortRupiah } from '../data/mockData.js'
import {
  getExpensesFromSheets,
  getBudgetsFromSheets,
  saveBudgetToSheets,
  deleteBudgetInSheets
} from '../services/googleSheets.js'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'
import './Budgets.css'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function EmptyBudgets({ onAdd }) {
  return (
    <div className="budgets-empty-state">
      <div className="budgets-empty-icon">
        <Target size={52} />
      </div>
      <h3>Belum Ada Anggaran</h3>
      <p>Buat anggaran pertama Anda untuk mulai memantau kesehatan dompet secara lebih terstruktur.</p>
      <button className="btn-primary mt-lg" onClick={onAdd}>
        <Plus size={18} /> Buat Anggaran
      </button>
    </div>
  )
}

// Custom Modern Dropdown Component
const CustomSelect = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="custom-select-container">
      <label className="settings-label">{label}</label>
      <div className="custom-select-wrapper">
        <button 
          type="button" 
          className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedOption?.label || value}</span>
          <ChevronDown size={14} className={`chevron ${isOpen ? 'rotate' : ''}`} />
        </button>

        {isOpen && (
          <div className="dropdown-portal">
            <div className="custom-select-overlay" onClick={() => setIsOpen(false)} />
            <ul className="custom-select-options animate-slide-up">
              {options.map((opt) => (
                <li 
                  key={opt.value} 
                  className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check size={14} className="check-icon" />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function Budgets() {
  const navigate = useNavigate()
  const [sidebarOpen] = useState(true)
  const [user, setUser]         = useState(null)
  const [expenses, setExpenses] = useState(() => {
    try {
      const cached = localStorage.getItem('weberganize_expenses')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('weberganize_expenses'))

  // Budgets persisted in localStorage (no dummy defaults – start empty)
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem('weberganize_budgets')
      const parsed = saved ? JSON.parse(saved) : []
      return parsed.map((b) => ({
        ...b,
        budgetId: b.budgetId || b.id || `budget-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        id: b.budgetId || b.id || `budget-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        limit: Number(b.limit || 0)
      }))
    } catch {
      return []
    }
  })

  // Modal state
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const EMPTY_FORM = {
    category: '', limit: '', color: '#25D366', notes: ''
  }
  const [form, setForm] = useState(EMPTY_FORM)
  const [isBudgetLoading, setIsBudgetLoading] = useState(false)
  const [budgetSyncStatus, setBudgetSyncStatus] = useState(null)

  // ── Auth guard
  useEffect(() => {
    const saved = localStorage.getItem('weberganize_user')
    if (!saved) { navigate('/auth'); return }
    setUser(JSON.parse(saved))
  }, [navigate])

  const fetchBudgets = async (isBackground = false) => {
    if (!user?.id) return
    if (!isBackground) setIsBudgetLoading(true)

    try {
      const data = await getBudgetsFromSheets(user.id)
      if (data && data.length > 0) {
        const normalized = data.map((budget) => ({
          ...budget,
          id: budget.budgetId || budget.id,
          budgetId: budget.budgetId || budget.id,
          limit: Number(budget.limit || 0)
        }))
        setBudgets(normalized)
        localStorage.setItem('weberganize_budgets', JSON.stringify(normalized))
      } else {
        setBudgets([])
        localStorage.setItem('weberganize_budgets', JSON.stringify([]))
      }
    } catch (error) {
      console.error('Budget sync failed', error)
    } finally {
      setIsBudgetLoading(false)
    }
  }

  // ── Fetch real data
  const fetchData = async (isBackground = false) => {
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
      fetchData(true)
      fetchBudgets(true)
    }
  }, [user])

  // ── Persist budgets
  useEffect(() => {
    localStorage.setItem('weberganize_budgets', JSON.stringify(budgets))
  }, [budgets])

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  // ── Compute stats from real expenses
  const budgetStats = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(e => e.category?.toLowerCase() === b.category?.toLowerCase())
        .reduce((sum, e) => sum + Number(e.amount || 0), 0)

      const limit     = Number(b.limit) || 1
      const remaining = limit - spent
      const percent   = Math.min(Math.round((spent / limit) * 100), 999)
      const isOver    = percent >= 80
      const isCritical = percent >= 100

      return { ...b, spent, remaining, percent, isOver, isCritical }
    })
  }, [budgets, expenses])

  const totalBudget  = budgets.reduce((s, b) => s + Number(b.limit || 0), 0)
  const totalSpent   = budgetStats.reduce((s, b) => s + b.spent, 0)
  const totalRemain  = totalBudget - totalSpent
  const overallPct   = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0
  const overBudgetCount = budgetStats.filter(b => b.isCritical).length

  // ── Modal helpers
  const openAdd = () => {
    setEditingBudget(null)
    setForm(EMPTY_FORM)
    setIsModalOpen(true)
  }
  const openEdit = (b) => {
    setEditingBudget(b)
    setForm({ ...b })
    setIsModalOpen(true)
  }
  const closeModal = () => setIsModalOpen(false)

  const handleSave = async (e) => {
    e.preventDefault()

    const budgetId = editingBudget?.budgetId || editingBudget?.id || `budget-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const payload = {
      userId: user.id,
      budgetId,
      category: form.category,
      limit: Number(form.limit || 0),
      color: form.color,
      notes: form.notes || ''
    }

    try {
      await saveBudgetToSheets(payload)
      await fetchBudgets(false)
    } catch (error) {
      console.error('Gagal menyimpan anggaran:', error)
      alert('Gagal menyimpan anggaran. Coba lagi.')
    } finally {
      closeModal()
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus anggaran ini?')) return
    try {
      await deleteBudgetInSheets({ userId: user.id, budgetId: id })
      await fetchBudgets(false)
    } catch (error) {
      console.error('Gagal menghapus anggaran:', error)
      alert('Gagal menghapus anggaran. Coba lagi.')
    }
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        {/* ── Top Bar ── */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title">
               <Target size={26} className="text-brand mr-sm" style={{ marginRight: '8px' }} />
               Kelola Anggaran
            </h1>
            <p className="dashboard-topbar__subtitle">Pantau batas pengeluaran per kategori secara real-time</p>
          </div>
          <div className="dashboard-topbar__right">
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={16} />
              <span>Budget Baru</span>
            </button>
          </div>
        </header>

        {/* ── Summary Cards ── */}
        {budgets.length > 0 && (
          <div className="budget-overview-grid">
            {/* Total Budget Card */}
            <div className="glass-card budget-summary-card">
              <div className="summary-header">
                <div className="summary-info">
                  <span className="label-muted">Total Budget Bulanan</span>
                  <h2 className="summary-total">{formatRupiah(totalBudget)}</h2>
                </div>
                <div className="circular-progress" style={{ '--percent': overallPct }}>
                  <span>{overallPct}%</span>
                </div>
              </div>
              <div className="summary-footer">
                <div className="footer-item">
                  <ArrowDownRight className="icon-danger" size={16} />
                  <span>Terpakai: <strong>{formatShortRupiah(totalSpent)}</strong></span>
                </div>
                <div className="footer-item">
                  <ArrowUpRight className="icon-success" size={16} />
                  <span>Sisa: <strong className={totalRemain < 0 ? 'text-danger' : 'text-success'}>{formatShortRupiah(Math.abs(totalRemain))}</strong></span>
                </div>
              </div>
            </div>

            {/* Insight Card */}
            <div className="glass-card budget-insight-card">
              <div className="insight-row">
                <div className={`insight-icon-wrap ${overallPct > 80 ? 'warn' : 'ok'}`}>
                  {overallPct > 80 ? <AlertTriangle size={22} /> : <Info size={22} />}
                </div>
                <div className="insight-body">
                  <h4 className="insight-title">
                    {overBudgetCount > 0
                      ? `${overBudgetCount} kategori melebihi batas!`
                      : overallPct > 80
                      ? 'Waspada – Hampir Habis'
                      : 'Kesehatan Dompet Terjaga'}
                  </h4>
                  <p className="insight-desc">
                    {overBudgetCount > 0
                      ? 'Segera kurangi pengeluaran di kategori yang melebihi anggaran.'
                      : overallPct > 80
                      ? 'Pengeluaran hampir mencapai batas total. Hati-hati!'
                      : `Tersisa ${formatShortRupiah(Math.max(totalRemain, 0))} dari total anggaran bulan ini.`}
                  </p>
                  <div className="summary-bar-wrap">
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill"
                        style={{
                          width: `${overallPct}%`,
                          background: overallPct >= 100 ? '#ef4444' : overallPct > 80 ? '#f59e0b' : 'var(--brand-primary)'
                        }}
                      />
                    </div>
                    <span className="bar-label">{overallPct}% terpakai</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading State ── */}
        {isLoading && budgets.length > 0 && (
          <div className="loading-bar-strip">
            <div className="loading-bar-fill" />
          </div>
        )}

        {/* ── Empty State ── */}
        {budgets.length === 0 && !isLoading && (
          <EmptyBudgets onAdd={openAdd} />
        )}

        {/* ── Budget Cards Grid ── */}
        {budgets.length > 0 && (
          <div className="budget-list-grid mt-xl">
            {budgetStats.map(b => (
              <div
                key={b.id}
                className={`budget-card-item glass-card ${b.isCritical ? 'border-critical' : b.isOver ? 'border-warning' : ''}`}
              >
                {/* Card Header */}
                <div className="budget-card-header">
                  <div className="category-info">
                    <div
                      className="cat-icon-container"
                      style={{ backgroundColor: `${b.color}20`, color: b.color }}
                    >
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h3 className="cat-name">{b.category}</h3>
                      <span className="cat-meta">Budget Bulanan</span>
                    </div>
                  </div>
                  <div className="budget-card-actions">
                    <button className="action-circle edit" onClick={() => openEdit(b)} title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button className="action-circle delete" onClick={() => handleDelete(b.id)} title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="budget-progress-section">
                  <div className="progress-labels">
                    <span className="spent-label">
                      {formatShortRupiah(b.spent)} terpakai
                    </span>
                    <span className="limit-label">dari {formatShortRupiah(Number(b.limit))}</span>
                  </div>
                  <div className="budget-bar-large">
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${Math.min(b.percent, 100)}%`,
                        backgroundColor: b.isCritical ? '#ef4444' : b.isOver ? '#f59e0b' : b.color
                      }}
                    />
                  </div>
                  <div className="progress-footer">
                    <span
                      className={`pct-badge ${b.isCritical ? 'pct-critical' : b.isOver ? 'pct-warning' : 'pct-ok'}`}
                    >
                      {b.percent}% terpakai
                    </span>
                    <span className={`remaining-val ${b.remaining < 0 ? 'text-danger' : 'text-success'}`}>
                      {b.remaining < 0 ? '-' : ''}{formatShortRupiah(Math.abs(b.remaining))} sisa
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {b.notes && (
                  <p className="budget-notes">"{b.notes}"</p>
                )}

                {/* Alert Pill */}
                {b.isOver && (
                  <div className={`budget-alert-pill ${b.isCritical ? 'critical' : 'warning'}`}>
                    {b.isCritical ? <AlertTriangle size={13} /> : <Bell size={13} />}
                    <span>{b.isCritical ? 'Anggaran Terlampaui!' : `Ambang batas ${b.threshold}% tercapai`}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Add Trigger */}
            <button className="budget-card-item add-card" onClick={openAdd}>
              <div className="add-card-inner">
                <div className="add-icon-circle"><Plus size={28} /></div>
                <span>Tambah Anggaran</span>
              </div>
            </button>
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-card card-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingBudget ? <Edit3 size={20} /> : <Plus size={20} />} 
                {editingBudget ? 'Edit Anggaran' : 'Anggaran Baru'}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Nama Kategori *</label>
                <input
                  required
                  placeholder="Misal: Makanan, Transportasi, Hiburan..."
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  <option value="Makanan" />
                  <option value="Transportasi" />
                  <option value="Hiburan" />
                  <option value="Belanja" />
                  <option value="Kesehatan" />
                  <option value="Tagihan" />
                  <option value="Pendidikan" />
                  <option value="Lainnya" />
                </datalist>
              </div>

              <div className="form-group">
                <label>Batas Pengeluaran (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="Contoh: 1500000"
                  value={form.limit}
                  onChange={e => setForm({ ...form, limit: e.target.value })}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  💡 Bisa juga set budget via WhatsApp: <strong>"budget makanan 1500000"</strong>
                </small>
              </div>

              <div className="form-group">
                <label>Catatan (Opsional)</label>
                <textarea
                  rows="2"
                  placeholder="Misal: Untuk makan siang kantor dan kopi pagi..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn-primary">
                  <Save size={16} /> Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
