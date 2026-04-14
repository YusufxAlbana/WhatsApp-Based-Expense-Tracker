import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target, Plus, Edit3, Trash2,
  AlertTriangle, Info, ArrowUpRight,
  ArrowDownRight, Save, X, Bell, RefreshCw, Wallet
} from 'lucide-react'
import { formatRupiah, formatShortRupiah } from '../data/mockData.js'
import { getExpensesFromSheets } from '../services/googleSheets.js'
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

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function Budgets() {
  const navigate = useNavigate()
  const [sidebarOpen] = useState(true)
  const [user, setUser]         = useState(null)
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Budgets persisted in localStorage (no dummy defaults – start empty)
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem('weberganize_budgets')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Modal state
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const EMPTY_FORM = {
    category: '', limit: '', threshold: 80,
    cycle: 'Bulanan', priority: 'Wajib',
    rollover: false, icon: '💰', color: '#25D366', notes: ''
  }
  const [form, setForm] = useState(EMPTY_FORM)

  // ── Auth guard
  useEffect(() => {
    const saved = localStorage.getItem('weberganize_user')
    if (!saved) { navigate('/auth'); return }
    setUser(JSON.parse(saved))
  }, [navigate])

  // ── Fetch real data
  const fetchData = async () => {
    if (!user?.id) return
    setIsLoading(true)
    const data = await getExpensesFromSheets(user.id)
    setExpenses(data || [])
    setIsLoading(false)
  }
  useEffect(() => { if (user) fetchData() }, [user])

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
      const isOver    = percent >= Number(b.threshold)
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

  const handleSave = (e) => {
    e.preventDefault()
    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? { ...form, id: b.id } : b))
    } else {
      setBudgets(prev => [...prev, { ...form, id: Date.now() }])
    }
    closeModal()
  }

  const handleDelete = (id) => {
    if (!window.confirm('Hapus anggaran ini?')) return
    setBudgets(prev => prev.filter(b => b.id !== id))
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
            <h1 className="dashboard-topbar__title">🎯 Kelola Anggaran</h1>
            <p className="dashboard-topbar__subtitle">Pantau batas pengeluaran per kategori secara real-time</p>
          </div>
          <div className="dashboard-topbar__right">
            <button className="btn-secondary" onClick={fetchData} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
              <span>Sinkron Data</span>
            </button>
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
                      ? `⚠️ ${overBudgetCount} kategori melebihi batas!`
                      : overallPct > 80
                      ? 'Waspada – Hampir Habis'
                      : 'Dompet Sehat 🎉'}
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
                      {b.icon}
                    </div>
                    <div>
                      <h3 className="cat-name">{b.category}</h3>
                      <span className="cat-meta">
                        {b.priority} &nbsp;·&nbsp; {b.cycle}
                        {b.rollover && <> &nbsp;·&nbsp; <span className="rollover-badge">Rollover</span></>}
                      </span>
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
              <h3>{editingBudget ? '✏️ Edit Anggaran' : '➕ Anggaran Baru'}</h3>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row grid-2">
                <div className="form-group">
                  <label>Nama Kategori *</label>
                  <input
                    required
                    placeholder="Misal: Makan Siang"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Ikon Emoji</label>
                  <input
                    placeholder="Misal: 🍔"
                    value={form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row grid-2">
                <div className="form-group">
                  <label>Nominal Limit (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="Contoh: 1500000"
                    value={form.limit}
                    onChange={e => setForm({ ...form, limit: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Ambang Batas Peringatan (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.threshold}
                    onChange={e => setForm({ ...form, threshold: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row grid-3">
                <div className="form-group">
                  <label>Prioritas</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option>Wajib</option>
                    <option>Opsional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Siklus</label>
                  <select value={form.cycle} onChange={e => setForm({ ...form, cycle: e.target.value })}>
                    <option>Mingguan</option>
                    <option>Bulanan</option>
                    <option>Tahunan</option>
                  </select>
                </div>
                <div className="form-group form-group--center">
                  <label>Rollover Sisa</label>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.rollover}
                      onChange={e => setForm({ ...form, rollover: e.target.checked })}
                    />
                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Catatan / Tujuan</label>
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
                  <Save size={16} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
