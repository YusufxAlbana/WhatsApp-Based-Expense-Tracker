import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import './Navbar.css'

export default function Navbar({ variant = 'landing' }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${variant === 'dashboard' ? 'navbar--dashboard' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__logo" id="navbar-logo">
          <div className="navbar__logo-icon">
            <Zap size={20} />
          </div>
          <span className="navbar__logo-text">Weberganize</span>
        </Link>

        {variant === 'landing' && (
          <>
            <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
              <a href="#features" className="navbar__link" onClick={() => setMenuOpen(false)}>Fitur</a>
              <a href="#how-it-works" className="navbar__link" onClick={() => setMenuOpen(false)}>Cara Kerja</a>
              <a href="#pricing" className="navbar__link" onClick={() => setMenuOpen(false)}>Harga</a>
            </div>

            <div className="navbar__actions">
              <Link to="/auth" className="btn-secondary navbar__btn" id="navbar-login-btn">Masuk</Link>
              <Link to="/auth?mode=register" className="btn-primary navbar__btn" id="navbar-signup-btn">Daftar Gratis</Link>
            </div>

            <button
              className="navbar__hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              id="navbar-menu-toggle"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
