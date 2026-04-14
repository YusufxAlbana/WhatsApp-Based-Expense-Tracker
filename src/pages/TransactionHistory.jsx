import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Receipt, PieChart as PieChartIcon,
  Search, RefreshCw, Inbox, Edit3, Trash2,
  Check, X, SlidersHorizontal, ArrowUpDown,
  ChevronLeft, ChevronRight, Wallet, MessageSquare
} from 'lucide-react'
import {
  CATEGORIES, formatRupiah, getRelativeTime
} from '../data/mockData.js'
import {
  getExpensesFromSheets,
  updateExpenseInSheets,
  deleteExpenseInSheets
} from '../services/googleSheets.js'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'
import './TransactionHistory.css'

const ITEMS_PER_PAGE = 10

export default function TransactionHistory() {
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
  const [syncStatus, setSyncStatus] = useState(null)

  // Filters & Sort
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc') // date-desc, date-asc, amount-desc, amount-asc
  const [currentPage, setCurrentPage] = useState(1)

  // Edit mode
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ item: '', amount: '', category: '' })

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null)

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
      // Sync di background (tanpa loading screen) secara instan saat halamn dibuka
      refreshData(true)
    }
  }, [user])

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

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  // --- EDIT ---
  const startEdit = (expense, index) => {
    setEditingId(index)
    setEditForm({
      item: expense.item,
      amount: expense.amount.toString(),
      category: expense.category
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ item: '', amount: '', category: '' })
  }

  const saveEdit = async (expense, index) => {
    try {
      await updateExpenseInSheets({
        rowIndex: expense.rowIndex || index + 2, // +2 for header row + 0-index
        userId: user.id,
        item: editForm.item,
        amount: Number(editForm.amount),
        category: editForm.category
      })

      // Update locally
      const newExpenses = [...expenses]
      newExpenses[index] = {
        ...newExpenses[index],
        item: editForm.item,
        amount: Number(editForm.amount),
        category: editForm.category
      }
      setExpenses(newExpenses)
      setEditingId(null)

      setSyncStatus('success')
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (err) {
      console.error(err)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus(null), 3000)
    }
  }

  // --- DELETE ---
  const confirmDelete = async (expense, index) => {
    try {
      await deleteExpenseInSheets({
        rowIndex: expense.rowIndex || index + 2,
        userId: user.id
      })

      const newExpenses = expenses.filter((_, i) => i !== index)
      setExpenses(newExpenses)
      setDeletingId(null)

      setSyncStatus('success')
      setTimeout(() => setSyncStatus(null), 3000)
    } catch (err) {
      console.error(err)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus(null), 3000)
    }
  }

  // --- FILTER & SORT ---
  const filteredAndSorted = useMemo(() => {
    let result = [...expenses]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.item?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.amount?.toString().includes(q)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(e =>
        e.category?.toLowerCase() === categoryFilter.toLowerCase()
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.tanggal || b.created_at || 0) - new Date(a.tanggal || a.created_at || 0)
        case 'date-asc':
          return new Date(a.tanggal || a.created_at || 0) - new Date(b.tanggal || b.created_at || 0)
        case 'amount-desc':
          return Number(b.amount) - Number(a.amount)
        case 'amount-asc':
          return Number(a.amount) - Number(b.amount)
        default:
          return 0
      }
    })

    return result
  }, [expenses, searchQuery, categoryFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE)
  const paginatedData = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, sortBy])

  // Stats
  const totalAmount = filteredAndSorted.reduce((sum, e) => sum + Number(e.amount), 0)
  const uniqueCategories = [...new Set(expenses.map(e => e.category))]

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
            <h1 className="dashboard-topbar__title">📜 Riwayat Transaksi</h1>
            <p className="dashboard-topbar__subtitle">Lihat, edit, dan kelola semua transaksi kamu</p>
          </div>
          <div className="dashboard-topbar__right">
            <button
              className={`btn-primary dashboard-topbar__add ${isSyncing ? 'btn--loading' : ''}`}
              id="transaction-sync-btn"
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
              <><Zap size={16} /> Data berhasil disinkronkan!</>
            ) : (
              <>⚠️ Gagal sinkronisasi data.</>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="txn-summary">
          <div className="txn-summary__card glass-card">
            <div className="txn-summary__icon txn-summary__icon--total">
              <Wallet size={20} />
            </div>
            <div className="txn-summary__info">
              <span className="txn-summary__label">Total Pengeluaran</span>
              <span className="txn-summary__value">{isLoading ? '...' : formatRupiah(totalAmount)}</span>
            </div>
          </div>
          <div className="txn-summary__card glass-card">
            <div className="txn-summary__icon txn-summary__icon--count">
              <Receipt size={20} />
            </div>
            <div className="txn-summary__info">
              <span className="txn-summary__label">Jumlah Transaksi</span>
              <span className="txn-summary__value">{isLoading ? '...' : filteredAndSorted.length}</span>
            </div>
          </div>
          <div className="txn-summary__card glass-card">
            <div className="txn-summary__icon txn-summary__icon--cat">
              <PieChartIcon size={20} />
            </div>
            <div className="txn-summary__info">
              <span className="txn-summary__label">Kategori Aktif</span>
              <span className="txn-summary__value">{isLoading ? '...' : uniqueCategories.length}</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="txn-filters glass-card">
          <div className="txn-filters__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari item, kategori, atau jumlah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="txn-search-input"
            />
          </div>

          <div className="txn-filters__actions">
            <div className="txn-filter-select">
              <SlidersHorizontal size={14} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                id="txn-category-filter"
              >
                <option value="all">Semua Kategori</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="txn-filter-select">
              <ArrowUpDown size={14} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                id="txn-sort-select"
              >
                <option value="date-desc">Terbaru</option>
                <option value="date-asc">Terlama</option>
                <option value="amount-desc">Terbesar</option>
                <option value="amount-asc">Terkecil</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="txn-table-wrapper glass-card">
          {isLoading ? (
            <div className="txn-loading">
              <div className="spinner"></div>
              <p>Memuat transaksi...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Inbox size={40} />
              </div>
              <h3 className="empty-state__title">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Tidak Ada Hasil'
                  : 'Belum Ada Transaksi'}
              </h3>
              <p className="empty-state__desc">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Coba ubah filter atau kata kunci pencarian kamu.'
                  : 'Kirim pesan pengeluaran ke WhatsApp Bot untuk mulai mencatat.'}
              </p>
            </div>
          ) : (
            <>
              <div className="txn-table-scroll">
                <table className="txn-table">
                  <thead>
                    <tr>
                      <th className="txn-th txn-th--num">#</th>
                      <th className="txn-th">Item</th>
                      <th className="txn-th">Kategori</th>
                      <th className="txn-th txn-th--amount">Jumlah</th>
                      <th className="txn-th">Tanggal</th>
                      <th className="txn-th txn-th--actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((expense, pageIdx) => {
                      const realIndex = expenses.indexOf(expense)
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIdx + 1
                      const isEditing = editingId === realIndex
                      const isDeleting = deletingId === realIndex
                      const cat = CATEGORIES.find(c =>
                        c.key === expense.category?.toLowerCase() || c.label === expense.category
                      )

                      return (
                        <tr key={realIndex} className={`txn-row ${isEditing ? 'txn-row--editing' : ''} ${isDeleting ? 'txn-row--deleting' : ''}`}>
                          <td className="txn-td txn-td--num">{globalIndex}</td>

                          <td className="txn-td">
                            {isEditing ? (
                              <input
                                className="txn-edit-input"
                                value={editForm.item}
                                onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                                autoFocus
                              />
                            ) : (
                              <div className="txn-item-cell">
                                <div className="txn-item-icon" style={{ background: `${cat?.color || '#333'}18`, color: cat?.color || '#888' }}>
                                  {cat?.icon || '💰'}
                                </div>
                                <span className="txn-item-name">{expense.item}</span>
                              </div>
                            )}
                          </td>

                          <td className="txn-td">
                            {isEditing ? (
                              <select
                                className="txn-edit-select"
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              >
                                {CATEGORIES.map(c => (
                                  <option key={c.key} value={c.label}>{c.icon} {c.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="txn-category-badge" style={{ background: `${cat?.color || '#555'}18`, color: cat?.color || '#888' }}>
                                {cat?.icon || '📦'} {expense.category}
                              </span>
                            )}
                          </td>

                          <td className="txn-td txn-td--amount">
                            {isEditing ? (
                              <input
                                className="txn-edit-input txn-edit-input--amount"
                                type="number"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              />
                            ) : (
                              <span className="txn-amount">-{formatRupiah(expense.amount)}</span>
                            )}
                          </td>

                          <td className="txn-td txn-td--date">
                            {(expense.tanggal || expense.created_at)
                              ? getRelativeTime(expense.tanggal || expense.created_at)
                              : 'Baru saja'
                            }
                          </td>

                          <td className="txn-td txn-td--actions">
                            {isEditing ? (
                              <div className="txn-action-group">
                                <button className="txn-action-btn txn-action-btn--save" onClick={() => saveEdit(expense, realIndex)} title="Simpan">
                                  <Check size={16} />
                                </button>
                                <button className="txn-action-btn txn-action-btn--cancel" onClick={cancelEdit} title="Batal">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : isDeleting ? (
                              <div className="txn-delete-confirm">
                                <span className="txn-delete-text">Hapus?</span>
                                <button className="txn-action-btn txn-action-btn--confirm-delete" onClick={() => confirmDelete(expense, realIndex)} title="Ya, hapus">
                                  <Check size={14} />
                                </button>
                                <button className="txn-action-btn txn-action-btn--cancel" onClick={() => setDeletingId(null)} title="Batal">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="txn-action-group">
                                <button className="txn-action-btn txn-action-btn--edit" onClick={() => startEdit(expense, realIndex)} title="Edit">
                                  <Edit3 size={15} />
                                </button>
                                <button className="txn-action-btn txn-action-btn--delete" onClick={() => setDeletingId(realIndex)} title="Hapus">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="txn-pagination">
                  <span className="txn-pagination__info">
                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)} dari {filteredAndSorted.length} transaksi
                  </span>
                  <div className="txn-pagination__controls">
                    <button
                      className="txn-pagination__btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, idx, arr) => (
                        <span key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="txn-pagination__ellipsis">…</span>
                          )}
                          <button
                            className={`txn-pagination__btn ${currentPage === page ? 'txn-pagination__btn--active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </span>
                      ))
                    }
                    <button
                      className="txn-pagination__btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Banner */}
        <div className="txn-info-banner glass-card">
          <div className="txn-info-banner__icon">
            <MessageSquare size={20} />
          </div>
          <div className="txn-info-banner__content">
            <h4>💡 Tips: Edit data langsung dari sini!</h4>
            <p>Klik ikon ✏️ untuk mengedit item, jumlah, atau kategori. Perubahan akan otomatis tersinkronisasi ke Google Sheets kamu.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
