import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Phone } from 'lucide-react'
import { sendToGoogleSheets } from '../services/googleSheets.js'
import './AuthPage.css'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id.replace('auth-', '')]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const user = {
      name: mode === 'register' ? formData.name : formData.email.split('@')[0],
      email: formData.email,
      id: formData.email // Using email as simplified userId for now
    }

    if (mode === 'register') {
      try {
        await sendToGoogleSheets({
          action: 'register',
          userId: user.id
        })
      } catch (err) {
        console.error('Failed to register user to sheets', err)
      }
    }

    localStorage.setItem('weberganize_user', JSON.stringify(user))
    
    // Simulate slight loading delay for UX
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 800)
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="hero__orb hero__orb--1"></div>
        <div className="hero__orb hero__orb--2"></div>
        <div className="hero__grid-lines"></div>
      </div>

      <div className="auth-container">
        <Link to="/" className="auth-logo" id="auth-logo">
          <div className="navbar__logo-icon"><Zap size={20} /></div>
          <span className="navbar__logo-text">Weberganize</span>
        </Link>

        <div className="auth-card glass-card">
          <div className="auth-card__header">
            <h1>{mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h1>
            <p>{mode === 'login'
              ? 'Masuk untuk melihat dashboard keuanganmu'
              : 'Daftar gratis dan mulai tracking pengeluaran'
            }</p>
          </div>

          {/* Social login */}
          <button className="auth-social-btn" id="auth-google-btn" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          <div className="auth-divider">
            <span>atau</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} id="auth-form">
            {mode === 'register' && (
              <div className="auth-field">
                <label htmlFor="auth-name">Nama Lengkap</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    id="auth-name"
                    placeholder="Nama kamu"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email atau Nomor HP</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  type="text"
                  id="auth-email"
                  placeholder="email@contoh.com atau 08xxx"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">
                Password
                {mode === 'login' && (
                  <a href="#" className="auth-forgot">Lupa password?</a>
                )}
              </label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="auth-password"
                  placeholder="Min. 8 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary auth-submit ${loading ? 'auth-submit--loading' : ''}`}
              id="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="auth-spinner"></div>
              ) : (
                <>
                  {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login'
              ? 'Belum punya akun? '
              : 'Sudah punya akun? '
            }
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              id="auth-switch-btn"
            >
              {mode === 'login' ? 'Daftar Gratis' : 'Masuk'}
            </button>
          </p>
        </div>

        <p className="auth-footer-text">
          Dengan mendaftar, kamu menyetujui <a href="#">Ketentuan Layanan</a> dan <a href="#">Kebijakan Privasi</a>.
        </p>
      </div>
    </div>
  )
}
