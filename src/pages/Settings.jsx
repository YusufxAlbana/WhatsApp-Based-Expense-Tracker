import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, Lock, Bell, Globe, ChevronDown, Check,
  Save, Smartphone, Mail, Eye, EyeOff
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'
import './Settings.css'

// Custom Modern Dropdown Component
const CustomSelect = ({ label, options, value, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`custom-select-container ${disabled ? 'disabled' : ''}`}>
      <label className="settings-label">{label}</label>
      <div className="custom-select-wrapper">
        <button 
          type="button" 
          className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span>{selectedOption.label}</span>
          <ChevronDown size={18} className={`chevron ${isOpen ? 'rotate' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="custom-select-overlay" onClick={() => setIsOpen(false)} />
            <ul className="custom-select-options animate-slide-up">
              {options.map((opt) => (
                <li 
                  key={opt.value} 
                  className={`custom-select-option ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'opt-disabled' : ''}`}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check size={16} className="check-icon" />}
                  {opt.disabled && <span className="disabled-badge">Soon</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default function Settings() {
  const navigate = useNavigate()
  const [sidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  
  // Tabs: profile, preferences, security
  const [activeTab, setActiveTab] = useState('profile')
  
  // Forms state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  })
  
  const [prefForm, setPrefForm] = useState({
    currency: 'IDR',
    theme: 'dark',
    notifications: true
  })

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('weberganize_user')
    if (!savedUser) {
      navigate('/auth')
    } else {
      const parsed = JSON.parse(savedUser)
      setUser(parsed)
      setProfileForm({
        name: parsed.name || '',
        email: parsed.id || '', // we use email as id
      })
      
      const savedPrefs = localStorage.getItem('weberganize_prefs')
      if(savedPrefs) {
        setPrefForm(JSON.parse(savedPrefs))
      }
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveStatus(null)
    
    setTimeout(() => {
      const updatedUser = { ...user, name: profileForm.name }
      localStorage.setItem('weberganize_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsSaving(false)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    }, 1000)
  }

  const handleSavePrefs = (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveStatus(null)
    
    setTimeout(() => {
      localStorage.setItem('weberganize_prefs', JSON.stringify(prefForm))
      
      // Terapkan Tema Secara Global
      if (prefForm.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme'); // Kembali ke dark (default)
      }

      setIsSaving(false)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    }, 1000)
  }

  const handleSaveSecurity = (e) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveStatus(null)
    
    setTimeout(() => {
      setIsSaving(false)
      if(securityForm.newPassword !== securityForm.confirmPassword) {
         setSaveStatus('error')
      } else {
         setSaveStatus('success')
         setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
      setTimeout(() => setSaveStatus(null), 3000)
    }, 1000)
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
      <main className="dashboard-main settings-main">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title">⚙️ Pengaturan</h1>
            <p className="dashboard-topbar__subtitle">Kelola profil, preferensi aplikasi, dan keamanan akun Anda</p>
          </div>
        </header>

        {saveStatus && (
          <div className={`sync-toast sync-toast--${saveStatus} animate-fade-in`}>
            {saveStatus === 'success' ? (
              <>✅ Pengaturan berhasil disimpan!</>
            ) : (
              <>⚠️ Gagal menyimpan pengaturan. Pastikan data valid.</>
            )}
          </div>
        )}

        <div className="settings-container mt-xl">
          {/* Settings Navigation */}
          <aside className="settings-sidebar glass-card">
            <nav className="settings-nav">
              <button 
                className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="tab-icon"><User size={18} /></div>
                <div className="tab-text">
                  <span>Profil Akun</span>
                  <small>Nama, Email, Nomor WA</small>
                </div>
              </button>
              
              <button 
                className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <div className="tab-icon"><Globe size={18} /></div>
                <div className="tab-text">
                  <span>Preferensi</span>
                  <small>Mata Uang, Tema, Notifikasi</small>
                </div>
              </button>
              
              <button 
                className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <div className="tab-icon"><Lock size={18} /></div>
                <div className="tab-text">
                  <span>Keamanan</span>
                  <small>Kata Sandi & Autentikasi</small>
                </div>
              </button>
            </nav>
          </aside>

          {/* Settings Content Area */}
          <section className="settings-content glass-card">
            
            {/* ====== PROFILE TAB ====== */}
            {activeTab === 'profile' && (
              <div className="settings-pane animate-fade-in">
                <div className="pane-header">
                  <h2>Profil Akun</h2>
                  <p>Perbarui informasi identitas dan kontak WhatsApp Anda.</p>
                </div>
                
                <div className="profile-avatar-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
                   <svg 
                      viewBox="0 0 32 32" 
                      xmlns="http://www.w3.org/2000/svg" 
                      style={{ width: '80px', height: '80px', backgroundColor: '#dfe5e7', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <path 
                        d="M16 17C19.3137 17 22 14.3137 22 11C22 7.68629 19.3137 5 16 5C12.6863 5 10 7.68629 10 11C10 14.3137 12.6863 17 16 17ZM16 19.5C10.6667 19.5 0 22.1667 0 27.5V32H32V27.5C32 22.1667 21.3333 19.5 16 19.5Z" 
                        fill="#ffffff"
                      />
                    </svg>
                </div>

                <form onSubmit={handleSaveProfile} className="settings-form mt-lg">
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input 
                        type="text" 
                        value={profileForm.name} 
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Email Akses (Digunakan untuk Sinkronisasi Sheets)</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input 
                        type="email" 
                        value={profileForm.email} 
                        disabled
                        className="input-disabled"
                        title="Email akses Google Sheets tidak dapat diubah"
                      />
                    </div>
                    <span className="form-hint">Email identitas Google Sheets untuk akses data pengeluaran.</span>
                  </div>


                  <div className="form-actions border-top pt-lg mt-xl">
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <span className="spinner spin-sm"></span> : <Save size={18} />}
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ====== PREFERENCES TAB ====== */}
            {activeTab === 'preferences' && (
              <div className="settings-pane animate-fade-in">
                <div className="pane-header">
                  <h2>Preferensi Aplikasi</h2>
                  <p>Sesuaikan tampilan dan perilaku aplikasi sesuai kenyamanan.</p>
                </div>

                <form onSubmit={handleSavePrefs} className="settings-form mt-lg">
                  
                  <div className="form-row grid-2">
                    <CustomSelect 
                      label="Mata Uang Utama"
                      value={prefForm.currency}
                      onChange={val => setPrefForm({...prefForm, currency: val})}
                      options={[
                        { value: 'IDR', label: 'Rupiah (IDR)' },
                        { value: 'USD', label: 'US Dollar (USD)', disabled: true },
                        { value: 'EUR', label: 'Euro (EUR)', disabled: true }
                      ]}
                    />

                    <CustomSelect 
                      label="Tema Tampilan"
                      value={prefForm.theme}
                      onChange={val => setPrefForm({...prefForm, theme: val})}
                      options={[
                        { value: 'dark', label: 'Dark Mode (Default)' },
                        { value: 'light', label: 'Light Mode' }
                      ]}
                    />
                  </div>

                  <div className="form-group mt-lg">
                    <h3 className="sub-heading">Notifikasi WhatsApp</h3>
                    <div className="setting-card">
                       <div className="setting-card-info">
                         <div className="setting-icon bg-brand-light text-brand">
                           <Bell size={20} />
                         </div>
                         <div>
                           <h4>Laporan Mingguan & Peringatan Budget</h4>
                           <p>Terima ringkasan transaksi mingguan otomatis dari Bot.</p>
                         </div>
                       </div>
                       <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={prefForm.notifications}
                            onChange={e => setPrefForm({ ...prefForm, notifications: e.target.checked })}
                          />
                          <span className="toggle-track"><span className="toggle-thumb" /></span>
                        </label>
                    </div>
                  </div>

                  <div className="form-actions border-top pt-lg mt-xl">
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <span className="spinner spin-sm"></span> : <Save size={18} />}
                      {isSaving ? 'Menyimpan...' : 'Simpan Preferensi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ====== SECURITY TAB ====== */}
            {activeTab === 'security' && (
              <div className="settings-pane animate-fade-in">
                <div className="pane-header">
                  <h2>Keamanan Akun</h2>
                  <p>Ganti kata sandi atau atur ulang autentikasi.</p>
                </div>

                <form onSubmit={handleSaveSecurity} className="settings-form mt-lg">
                  <div className="form-group">
                    <label>Kata Sandi Saat Ini</label>
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={securityForm.currentPassword} 
                        onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                        required
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-row grid-2 mt-md">
                    <div className="form-group">
                      <label>Kata Sandi Baru</label>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={securityForm.newPassword} 
                        onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                        required
                        placeholder="Minimal 8 karakter"
                        minLength={8}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ulangi Kata Sandi Baru</label>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={securityForm.confirmPassword} 
                        onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                        required
                        placeholder="Minimal 8 karakter"
                        minLength={8}
                      />
                    </div>
                  </div>
                  
                  {securityForm.newPassword && securityForm.confirmPassword && securityForm.newPassword !== securityForm.confirmPassword && (
                    <p className="text-danger text-sm mt-2">⚠️ Kata sandi baru tidak cocok.</p>
                  )}

                  <div className="form-actions border-top pt-lg mt-xl flex-between">
                    <button type="button" className="btn-text text-danger" onClick={handleLogout}>
                      Keluar dari Perangkat Ini
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSaving || (securityForm.newPassword !== securityForm.confirmPassword)}>
                      {isSaving ? <span className="spinner spin-sm"></span> : <Save size={18} />}
                      {isSaving ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  )
}
