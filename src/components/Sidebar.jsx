import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Zap, LayoutDashboard, Receipt, PieChart as PieChartIcon,
  Target, MessageSquare, Bell, Settings, LogOut, HelpCircle
} from 'lucide-react'
import logo from '../assets/logo.svg'
import './Sidebar.css'

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',   key: 'dashboard',     path: '/dashboard' },
  { icon: Receipt,         label: 'Transaksi',   key: 'transactions',  path: '/transactions' },
  { icon: PieChartIcon,    label: 'Analitik',    key: 'analytics',     path: '/analytics' },
  { icon: Target,          label: 'Budget',      key: 'budget',        path: '/budget' },
  { icon: HelpCircle,      label: 'Informasi',   key: 'info',          path: '/info' },
  { icon: MessageSquare,   label: 'WhatsApp',    key: 'whatsapp',      path: null }, // belum tersedia
  { icon: Bell,            label: 'Notifikasi',  key: 'notifications', path: '/notifications' },
  { icon: Settings,        label: 'Pengaturan',  key: 'settings',      path: '/settings' },
]

export default function Sidebar({ isOpen, user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleItemClick = (item) => {
    if (item.path) navigate(item.path)
  }

  return (
    <aside className={`sidebar ${isOpen ? '' : 'sidebar--collapsed'}`}>
      <div className="sidebar__top">
        <Link to="/dashboard" className="sidebar__logo">
          <img src={logo} alt="LedgerLink Logo" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />
          {isOpen && <span className="navbar__logo-text">LedgerLink</span>}
        </Link>
      </div>

      <nav className="sidebar__nav">
        {SIDEBAR_ITEMS.map(item => {
          // Active ONLY when path matches exactly — placeholder (path=null) items are never active
          const isActive = item.path !== null && location.pathname === item.path
          const isDisabled = item.path === null

          return (
            <button
              key={item.key}
              className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''} ${isDisabled ? 'sidebar__item--disabled' : ''}`}
              onClick={() => handleItemClick(item)}
              title={isDisabled ? 'Segera hadir' : item.label}
            >
              <item.icon size={20} />
              {isOpen && <span>{item.label}</span>}
              {isOpen && isDisabled && <span className="sidebar__soon">Soon</span>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar__bottom">
        <button className="sidebar__user" onClick={() => navigate('/settings')} title="Pengaturan Profil">
          <div className="sidebar__user-avatar" style={{ background: 'transparent' }}>
             <svg 
                viewBox="0 0 32 32" 
                xmlns="http://www.w3.org/2000/svg" 
                style={{ width: '100%', height: '100%', backgroundColor: '#dfe5e7', borderRadius: '50%' }}
              >
                <path 
                  d="M16 17C19.3137 17 22 14.3137 22 11C22 7.68629 19.3137 5 16 5C12.6863 5 10 7.68629 10 11C10 14.3137 12.6863 17 16 17ZM16 19.5C10.6667 19.5 0 22.1667 0 27.5V32H32V27.5C32 22.1667 21.3333 19.5 16 19.5Z" 
                  fill="#ffffff"
                />
              </svg>
          </div>
          {isOpen && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || 'User'}</span>
              <span className="sidebar__user-plan">Plan: Gratis</span>
            </div>
          )}
        </button>
        <button className="sidebar__item sidebar__logout" onClick={onLogout}>
          <LogOut size={20} />
          {isOpen && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}
