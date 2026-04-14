import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Mail } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'

export default function Notifications() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('weberganize_user')
    if (!savedUser) {
      navigate('/auth')
    } else {
      setUser(JSON.parse(savedUser))
    }
  }, [navigate])

  const notifications = [
    {
      id: 1,
      type: 'success',
      icon: <CheckCircle2 size={24} className="text-green-500" />,
      title: 'Pendaftaran Berhasil',
      message: 'Selamat datang di LedgerLink! Email pendaftaran Anda juga telah dikirim via Email otomatis oleh sistem Google. Cek kotak masuk Anda.',
      time: 'Baru saja',
      isUnread: true
    },
    {
      id: 2,
      type: 'warning',
      icon: <AlertTriangle size={24} className="text-orange-500" />,
      title: 'Fitur Peringatan Email Aktif',
      message: 'Mulai sekarang, jika pengeluaran Anda melewati batas budget melebihi Rp 5.000.000, sistem Google Sheets kami akan mengirim Notifikasi Warning darurat ke email Anda.',
      time: 'Beberapa menit lalu',
      isUnread: true
    },
    {
      id: 3,
      type: 'info',
      icon: <Info size={24} className="text-brand" />,
      title: 'Tips LedgerLink',
      message: 'Simpan file logo dengan benar agar favicon dan icon tetap menyala. Jangan lupa integrasikan nomor WhatsApp untuk pencatatan ajaib.',
      time: '1 jam lalu',
      isUnread: false
    }
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        user={user} 
        onLogout={() => {
          localStorage.removeItem('weberganize_user')
          navigate('/')
        }} 
      />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={26} className="text-brand" /> Riwayat Notifikasi
            </h1>
            <p className="dashboard-topbar__subtitle">Pantau seluruh pesan masuk, sistem, dan pengingat limit saldo Anda.</p>
          </div>
        </header>

        <div className="dashboard-content" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
          
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={24} className="text-brand" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Kotak Masuk Sistem</h2>
              </div>
              <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Tandai semua dibaca
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '1.5rem', 
                    padding: '1.5rem', 
                    borderRadius: '16px',
                    background: notif.isUnread ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                    border: notif.isUnread ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {notif.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: notif.isUnread ? 600 : 500, color: notif.isUnread ? '#fff' : '#ccc' }}>
                        {notif.title}
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {notif.time}
                      </span>
                    </div>
                    <p style={{ color: '#aaa', lineHeight: 1.5, fontSize: '0.95rem' }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
