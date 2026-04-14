import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Receipt, PieChart as PieChartIcon,
  Target, MessageSquare, Bell, Settings, LogOut
} from 'lucide-react'
import './Sidebar.css'

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard', path: '/dashboard' },
  { icon: Receipt, label: 'Transaksi', key: 'transactions', path: '/transactions' },
  { icon: PieChartIcon, label: 'Analitik', key: 'analytics', path: '/analytics' },
  { icon: Target, label: 'Budget', key: 'budget', path: '/budget' },
  { icon: MessageSquare, label: 'WhatsApp', key: 'whatsapp', path: '/dashboard' }, // Placeholder paths for others
  { icon: Bell, label: 'Notifikasi', key: 'notifications', path: '/dashboard' },
  { icon: Settings, label: 'Pengaturan', key: 'settings', path: '/dashboard' },
]

export default function Sidebar({ isOpen, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className={`sidebar ${isOpen ? '' : 'sidebar--collapsed'}`}>
      <div className="sidebar__top">
        <Link to="/dashboard" className="sidebar__logo">
          <div className="navbar__logo-icon"><Zap size={18} /></div>
          {isOpen && <span className="navbar__logo-text">Weberganize</span>}
        </Link>
      </div>

      <nav className="sidebar__nav">
        {SIDEBAR_ITEMS.map(item => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.key}
              className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar__bottom">
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">{user?.name?.[0] || 'U'}</div>
          {isOpen && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || 'User'}</span>
              <span className="sidebar__user-plan">Plan: Gratis</span>
            </div>
          )}
        </div>
        <button className="sidebar__item sidebar__logout" onClick={onLogout}>
          <LogOut size={20} />
          {isOpen && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}
