import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Zap, BarChart3, Shield, ArrowRight,
  Smartphone, Brain, Database, PieChart, Bell, Globe,
  Star, Check, ChevronRight, Send
} from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import logo from '../assets/logo.svg'
import './LandingPage.css'

const CHAT_MESSAGES = [
  { type: 'user', text: 'Barusan beli nasi padang 20 ribu', delay: 0 },
  { type: 'bot', text: 'Berhasil dicatat! ✅\n🍔 Nasi Padang — Rp20.000\nKategori: Makanan', delay: 1500 },
  { type: 'user', text: 'Bensin 35.000', delay: 3500 },
  { type: 'bot', text: 'Berhasil dicatat! ✅\n🚗 Bensin — Rp35.000\nKategori: Transportasi', delay: 5000 },
]

export default function LandingPage() {
  const [visibleMessages, setVisibleMessages] = useState([])
  const [typingIndex, setTypingIndex] = useState(-1)

  useEffect(() => {
    let cancelled = false
    const timeouts = []

    setVisibleMessages([])
    setTypingIndex(-1)

    CHAT_MESSAGES.forEach((msg, i) => {
      const t1 = setTimeout(() => {
        if (!cancelled) setTypingIndex(i)
      }, msg.delay)
      timeouts.push(t1)

      const t2 = setTimeout(() => {
        if (!cancelled) {
          setVisibleMessages(prev => [...prev, msg])
          setTypingIndex(-1)
        }
      }, msg.delay + 800)
      timeouts.push(t2)
    })

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="landing">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="hero" id="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1"></div>
          <div className="hero__orb hero__orb--2"></div>
          <div className="hero__orb hero__orb--3"></div>
          <div className="hero__grid-lines"></div>
        </div>

        <div className="hero__content container">
          <div className="hero__text">
            <div className="hero__badge badge animate-fade-in-up">
              <Zap size={14} />
              Powered by AI + WhatsApp
            </div>

            <h1 className="hero__title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Catat Pengeluaran
              <br />
              <span className="gradient-text">Cukup Lewat Chat</span>
            </h1>

            <p className="hero__subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Kirim pesan di WhatsApp, AI yang catat. Tanpa buka aplikasi,
              tanpa isi form. Lihat visualisasi keuanganmu langsung di dashboard.
            </p>

            <div className="hero__ctas animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth?mode=register" className="btn-primary" id="hero-cta-primary">
                Mulai Gratis <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-secondary" id="hero-cta-secondary">
                Lihat Cara Kerja
              </a>
            </div>

            <div className="hero__stats animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="hero__stat">
                <span className="hero__stat-value">⚡</span>
                <span className="hero__stat-label">AI Super Cepat</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-value">📊</span>
                <span className="hero__stat-label">Dashboard Realtime</span>
              </div>
              <div className="hero__stat-divider"></div>
              <div className="hero__stat">
                <span className="hero__stat-value">100%</span>
                <span className="hero__stat-label">Gratis</span>
              </div>
            </div>
          </div>

          <div className="hero__visual animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="phone-mockup">
              <div className="phone-mockup__header">
                <div className="phone-mockup__avatar">W</div>
                <div>
                  <div className="phone-mockup__name">LedgerLink Bot</div>
                  <div className="phone-mockup__status">online</div>
                </div>
              </div>
              <div className="phone-mockup__body">
                {visibleMessages.map((msg, i) => (
                  <div key={i} className={`chat-bubble chat-bubble--${msg.type}`}>
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                ))}
                {typingIndex >= 0 && (
                  <div className={`chat-bubble chat-bubble--${CHAT_MESSAGES[typingIndex]?.type || 'bot'}`}>
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>
              <div className="phone-mockup__input">
                <span>Tulis pengeluaranmu...</span>
                <Send size={18} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-label badge">
              <Star size={14} /> Fitur Unggulan
            </span>
            <h2 className="section-title">
              Semua yang Kamu Butuhkan
              <br />
              <span className="gradient-text">Dalam Satu Platform</span>
            </h2>
            <p className="section-subtitle">
              Dari pencatatan otomatis sampai analisis AI — semuanya gratis dan mudah.
            </p>
          </div>

          <div className="features__grid stagger-children">
            <FeatureCard
              icon={<MessageSquare size={24} />}
              title="Chat-Based Input"
              desc="Kirim pesan WA sebebasnya. AI memahami bahasa kamu dan langsung mencatat."
              color="var(--brand-primary)"
            />
            <FeatureCard
              icon={<Brain size={24} />}
              title="AI Parsing (Groq)"
              desc="Groq AI mengekstrak item, jumlah, dan kategori dari pesanmu secara otomatis."
              color="var(--brand-accent)"
            />
            <FeatureCard
              icon={<BarChart3 size={24} />}
              title="Dashboard Visual"
              desc="Grafik harian, mingguan, dan pie chart per kategori. Semua realtime."
              color="var(--cat-transport)"
            />
            <FeatureCard
              icon={<Bell size={24} />}
              title="Smart Budgeting"
              desc="Set target anggaran dan dapat reminder otomatis lewat WhatsApp."
              color="var(--cat-food)"
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="Aman & Private"
              desc="Data dienkripsi di Supabase. Hanya kamu yang bisa akses datamu."
              color="var(--cat-health)"
            />
            <FeatureCard
              icon={<Globe size={24} />}
              title="Multi-Currency"
              desc="AI otomatis deteksi mata uang. Support IDR, USD, EUR, dan lainnya."
              color="var(--cat-entertainment)"
            />
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-label badge">
              <Zap size={14} /> Cara Kerja
            </span>
            <h2 className="section-title">
              3 Langkah <span className="gradient-text">Super Simpel</span>
            </h2>
          </div>

          <div className="steps">
            <StepCard
              num="01"
              icon={<Smartphone size={32} />}
              title="Chat di WhatsApp"
              desc="Kirim pesan ke bot LedgerLink. Tulis pengeluaranmu dalam bahasa apapun."
              color="var(--brand-primary)"
            />
            <div className="steps__connector">
              <ChevronRight size={24} />
            </div>
            <StepCard
              num="02"
              icon={<Brain size={32} />}
              title="AI Proses & Catat"
              desc="Groq AI ekstrak data, kategorikan, dan simpan ke Google Sheets secara otomatis."
              color="var(--brand-accent)"
            />
            <div className="steps__connector">
              <ChevronRight size={24} />
            </div>
            <StepCard
              num="03"
              icon={<PieChart size={32} />}
              title="Lihat Dashboard"
              desc="Buka dashboard untuk melihat grafik, analisis, dan tips keuanganmu."
              color="var(--cat-transport)"
            />
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box glass-card">
            <div className="cta-box__bg">
              <div className="hero__orb hero__orb--1"></div>
              <div className="hero__orb hero__orb--2"></div>
            </div>
            <h2>Siap Mulai Kontrol Keuanganmu?</h2>
            <p>Daftar gratis dan mulai catat pengeluaran lewat WhatsApp sekarang juga.</p>
            <Link to="/auth?mode=register" className="btn-primary" id="cta-final-btn">
              Daftar Gratis Sekarang <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <div className="navbar__logo">
                <img src={logo} alt="LedgerLink Logo" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />
                <span className="navbar__logo-text">LedgerLink</span>
              </div>
              <p className="footer__desc">Smart expense tracking via WhatsApp, powered by AI.</p>
            </div>
            <div className="footer__links">
              <div className="footer__col">
                <h4>Produk</h4>
                <a href="#features">Fitur</a>
                <a href="#how-it-works">Cara Kerja</a>
              </div>
              <div className="footer__col">
                <h4>Legal</h4>
                <a href="#">Privasi</a>
                <a href="#">Ketentuan</a>
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 LedgerLink. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }) {
  return (
    <div className="feature-card glass-card">
      <div className="feature-card__icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__desc">{desc}</p>
    </div>
  )
}

function StepCard({ num, icon, title, desc, color }) {
  return (
    <div className="step-card glass-card">
      <span className="step-card__num" style={{ color }}>{num}</span>
      <div className="step-card__icon" style={{ color }}>{icon}</div>
      <h3 className="step-card__title">{title}</h3>
      <p className="step-card__desc">{desc}</p>
    </div>
  )
}

