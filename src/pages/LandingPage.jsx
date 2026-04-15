import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Zap, BarChart3, Shield, ArrowRight,
  Smartphone, Brain, Database, PieChart, Bell, Globe,
  Star, Check, ChevronRight, Send, ChevronDown,
  ShoppingBag, Car, Coffee, Clapperboard, GraduationCap,
  Heart, Receipt, Lightbulb, HelpCircle, Utensils,
  Fuel, Wifi, Ticket, Pill, BookOpen, Sparkles,
  TrendingDown, ListChecks, Clock
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

const EXAMPLE_SCENARIOS = [
  {
    id: 'daily',
    label: '🛒 Belanja Harian',
    title: 'Pencatatan Belanja Sehari-hari',
    description: 'Catat pengeluaran makanan, minuman, dan belanja harian dengan bahasa natural.',
    messages: [
      { type: 'user', text: 'Makan siang di warteg 15rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🍔 Makan siang warteg — Rp15.000\nKategori: Makanan' },
      { type: 'user', text: 'Beli kopi susu 22000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n☕ Kopi susu — Rp22.000\nKategori: Makanan' },
      { type: 'user', text: 'Belanja indomaret sabun, shampoo totalnya 45ribu' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🛒 Belanja Indomaret — Rp45.000\nKategori: Belanja' },
    ],
  },
  {
    id: 'transport',
    label: '🚗 Transportasi',
    title: 'Catat Biaya Transportasi',
    description: 'Semua jenis transportasi — bensin, ojol, parkir, tol — tercatat otomatis.',
    messages: [
      { type: 'user', text: 'Grab ke kantor 28rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🚗 Grab ke kantor — Rp28.000\nKategori: Transportasi' },
      { type: 'user', text: 'Isi bensin full tank 80000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n⛽ Bensin full tank — Rp80.000\nKategori: Transportasi' },
      { type: 'user', text: 'Parkir mall 5rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🅿️ Parkir mall — Rp5.000\nKategori: Transportasi' },
    ],
  },
  {
    id: 'bills',
    label: '📱 Tagihan',
    title: 'Bayar Tagihan & Langganan',
    description: 'Tagihan listrik, internet, streaming — semua bisa dicatat lewat chat.',
    messages: [
      { type: 'user', text: 'Bayar listrik bulan ini 350rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n⚡ Listrik bulanan — Rp350.000\nKategori: Tagihan' },
      { type: 'user', text: 'Langganan spotify 54900' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🎵 Spotify — Rp54.900\nKategori: Hiburan' },
      { type: 'user', text: 'Wifi indihome 330000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n📡 IndiHome — Rp330.000\nKategori: Tagihan' },
    ],
  },
  {
    id: 'lifestyle',
    label: '🎮 Gaya Hidup',
    title: 'Hiburan & Lifestyle',
    description: 'Nonton bioskop, gaming, hangout — tetap terkontrol dengan pencatatan otomatis.',
    messages: [
      { type: 'user', text: 'Nonton bioskop berdua 100rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🎬 Bioskop x2 — Rp100.000\nKategori: Hiburan' },
      { type: 'user', text: 'Top up game 50000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🎮 Top up game — Rp50.000\nKategori: Hiburan' },
      { type: 'user', text: 'Ngopi di starbucks 65rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n☕ Starbucks — Rp65.000\nKategori: Makanan' },
    ],
  },
  {
    id: 'health',
    label: '🏥 Kesehatan',
    title: 'Biaya Kesehatan & Medis',
    description: 'Obat, dokter, suplemen — semua pengeluaran kesehatan tercatat rapi.',
    messages: [
      { type: 'user', text: 'Beli obat di apotek 75000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n💊 Obat apotek — Rp75.000\nKategori: Kesehatan' },
      { type: 'user', text: 'Ke dokter gigi 200rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🦷 Dokter gigi — Rp200.000\nKategori: Kesehatan' },
      { type: 'user', text: 'Vitamin C dan D 120000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n💊 Vitamin C & D — Rp120.000\nKategori: Kesehatan' },
    ],
  },
  {
    id: 'education',
    label: '📚 Pendidikan',
    title: 'Investasi Pendidikan',
    description: 'Kursus online, buku, alat tulis — catat pengeluaran edukasimu.',
    messages: [
      { type: 'user', text: 'Beli buku di gramedia 95rb' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n📖 Buku Gramedia — Rp95.000\nKategori: Pendidikan' },
      { type: 'user', text: 'Bayar kursus udemy 150000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n🎓 Kursus Udemy — Rp150.000\nKategori: Pendidikan' },
      { type: 'user', text: 'Fotokopi tugas 8000' },
      { type: 'bot', text: 'Berhasil dicatat! ✅\n📄 Fotokopi — Rp8.000\nKategori: Pendidikan' },
    ],
  },
]

const CATEGORY_DATA = [
  { icon: <Utensils size={22} />, name: 'Makanan', color: 'var(--cat-food)', examples: ['Nasi goreng 15rb', 'Kopi susu 22000', 'Makan siang warteg 18rb'] },
  { icon: <Car size={22} />, name: 'Transportasi', color: 'var(--cat-transport)', examples: ['Grab 28000', 'Bensin full 80rb', 'Parkir 5000'] },
  { icon: <ShoppingBag size={22} />, name: 'Belanja', color: 'var(--cat-shopping)', examples: ['Beli baju 150rb', 'Indomaret 45000', 'Shopee 200rb'] },
  { icon: <Clapperboard size={22} />, name: 'Hiburan', color: 'var(--cat-entertainment)', examples: ['Bioskop 50rb', 'Netflix 54000', 'Top up game 25rb'] },
  { icon: <Heart size={22} />, name: 'Kesehatan', color: 'var(--cat-health)', examples: ['Obat 75000', 'Dokter gigi 200rb', 'Vitamin 45rb'] },
  { icon: <Receipt size={22} />, name: 'Tagihan', color: 'var(--cat-bills)', examples: ['Listrik 350rb', 'Wifi 330000', 'Air PDAM 85rb'] },
  { icon: <GraduationCap size={22} />, name: 'Pendidikan', color: 'var(--cat-education)', examples: ['Kursus 150rb', 'Buku 95000', 'Print tugas 8rb'] },
  { icon: <Sparkles size={22} />, name: 'Lainnya', color: 'var(--cat-other)', examples: ['Cuci motor 20rb', 'Laundry 35000', 'Sedekah 50rb'] },
]

const TIPS_DATA = [
  {
    icon: <MessageSquare size={24} />,
    title: 'Pakai Bahasa Bebas',
    desc: 'Tulis pesan sebebas mungkin — "Beli makan 20rb", "makan siang nasi padang dua puluh ribu", atau "lunch 20k" semuanya dipahami AI.',
    example: '"Barusan jajan bakso 15ribu"',
  },
  {
    icon: <ListChecks size={24} />,
    title: 'Kirim Sekaligus Banyak',
    desc: 'Kamu bisa kirim beberapa pengeluaran dalam satu pesan. AI akan mem-parse semuanya otomatis.',
    example: '"Makan 25rb, bensin 50rb, parkir 5rb"',
  },
  {
    icon: <TrendingDown size={24} />,
    title: 'Cek Ringkasan Budget',
    desc: 'Set budget bulanan di dashboard dan pantau progress. Kamu akan dapat notifikasi saat mendekati limit.',
    example: '"Budget makanan bulan ini tinggal 200rb"',
  },
  {
    icon: <Clock size={24} />,
    title: 'Catat Kapanpun',
    desc: 'Lupa catat kemarin? Tidak masalah! Tambahkan keterangan waktu dan AI akan mencatat di tanggal yang benar.',
    example: '"Kemarin makan 30rb"',
  },
]

const FAQ_DATA = [
  {
    q: 'Apakah LedgerLink benar-benar gratis?',
    a: 'Ya! LedgerLink 100% gratis untuk digunakan. Tidak ada biaya tersembunyi atau langganan premium.'
  },
  {
    q: 'Bahasa apa saja yang didukung untuk input?',
    a: 'Saat ini AI kami mendukung Bahasa Indonesia dan Bahasa Inggris. Kamu bisa menulis dengan gaya santai, formal, atau bahkan campuran ("beli lunch 30rb").'
  },
  {
    q: 'Bagaimana AI tahu kategori pengeluaran saya?',
    a: 'AI kami dilatih untuk mengenali konteks dari pesan. Misalnya "Grab" otomatis masuk Transportasi, "nasi goreng" masuk Makanan, "Netflix" masuk Hiburan. Jika salah, kamu bisa koreksi di dashboard.'
  },
  {
    q: 'Apakah data keuangan saya aman?',
    a: 'Tentu! Data disimpan terenkripsi di Supabase dan Google Sheets milikmu sendiri. Hanya kamu yang memiliki akses ke data tersebut.'
  },
  {
    q: 'Bisa kirim banyak pengeluaran dalam satu pesan?',
    a: 'Bisa! Cukup tulis semua dalam satu pesan: "Makan 25rb, bensin 50rb, parkir 5rb". AI akan mem-parse dan mencatat semuanya.'
  },
  {
    q: 'Apakah saya harus install aplikasi tambahan?',
    a: 'Tidak perlu! Cukup gunakan WhatsApp yang sudah ada di HP kamu. Dashboard bisa diakses lewat browser.'
  },
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

      {/* ========== EXAMPLES GALLERY ========== */}
      <ExamplesSection />

      {/* ========== CATEGORY SHOWCASE ========== */}
      <section className="categories" id="categories">
        <div className="container">
          <div className="section-header">
            <span className="section-label badge">
              <Sparkles size={14} /> Kategori Otomatis
            </span>
            <h2 className="section-title">
              AI Mengenali <span className="gradient-text">8 Kategori</span> Otomatis
            </h2>
            <p className="section-subtitle">
              Tidak perlu pilih kategori manual. Cukup tulis pesanmu, AI langsung tahu kategorinya.
            </p>
          </div>

          <div className="categories__grid stagger-children">
            {CATEGORY_DATA.map((cat) => (
              <div key={cat.name} className="category-card glass-card">
                <div className="category-card__icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                  {cat.icon}
                </div>
                <div className="category-card__info">
                  <h4 className="category-card__name">{cat.name}</h4>
                  <div className="category-card__examples">
                    {cat.examples.map((ex, i) => (
                      <span key={i} className="category-card__tag">💬 {ex}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TIPS & TRICKS ========== */}
      <section className="tips" id="tips">
        <div className="container">
          <div className="section-header">
            <span className="section-label badge">
              <Lightbulb size={14} /> Tips & Trik
            </span>
            <h2 className="section-title">
              Gunakan Lebih Efektif <span className="gradient-text">Dengan Tips Ini</span>
            </h2>
            <p className="section-subtitle">
              Beberapa tips agar pencatatan pengeluaranmu makin cepat dan akurat.
            </p>
          </div>

          <div className="tips__grid stagger-children">
            {TIPS_DATA.map((tip, idx) => (
              <div key={idx} className="tip-card glass-card">
                <div className="tip-card__icon">
                  {tip.icon}
                </div>
                <div className="tip-card__content">
                  <h3 className="tip-card__title">{tip.title}</h3>
                  <p className="tip-card__desc">{tip.desc}</p>
                  <div className="tip-card__example">
                    <Send size={14} />
                    <code>{tip.example}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <FAQSection />

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

/* ===== Examples Section Component ===== */
function ExamplesSection() {
  const [activeTab, setActiveTab] = useState(0)
  const scenario = EXAMPLE_SCENARIOS[activeTab]

  return (
    <section className="examples" id="examples">
      <div className="container">
        <div className="section-header">
          <span className="section-label badge">
            <MessageSquare size={14} /> Contoh Penggunaan
          </span>
          <h2 className="section-title">
            Lihat Bagaimana <span className="gradient-text">Mudahnya!</span>
          </h2>
          <p className="section-subtitle">
            Tidak percaya? Lihat contoh nyata bagaimana AI kami memahami pesanmu
            dan langsung mencatat pengeluaran secara otomatis.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="examples__tabs">
          {EXAMPLE_SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              className={`examples__tab ${i === activeTab ? 'examples__tab--active' : ''}`}
              onClick={() => setActiveTab(i)}
              id={`example-tab-${s.id}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Active Scenario */}
        <div className="examples__showcase">
          <div className="examples__info">
            <h3 className="examples__title">{scenario.title}</h3>
            <p className="examples__desc">{scenario.description}</p>
            <div className="examples__highlights">
              <div className="examples__highlight">
                <Check size={16} />
                <span>Bahasa natural, tanpa format khusus</span>
              </div>
              <div className="examples__highlight">
                <Check size={16} />
                <span>Kategori terdeteksi otomatis</span>
              </div>
              <div className="examples__highlight">
                <Check size={16} />
                <span>Jumlah diekstrak secara akurat</span>
              </div>
            </div>
          </div>

          <div className="examples__chat-container">
            <div className="phone-mockup phone-mockup--mini">
              <div className="phone-mockup__header">
                <div className="phone-mockup__avatar">W</div>
                <div>
                  <div className="phone-mockup__name">LedgerLink Bot</div>
                  <div className="phone-mockup__status">online</div>
                </div>
              </div>
              <div className="phone-mockup__body phone-mockup__body--scroll">
                {scenario.messages.map((msg, i) => (
                  <div key={`${scenario.id}-${i}`} className={`chat-bubble chat-bubble--${msg.type}`}>
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="phone-mockup__input">
                <span>Tulis pengeluaranmu...</span>
                <Send size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ===== FAQ Section Component ===== */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-header">
          <span className="section-label badge">
            <HelpCircle size={14} /> FAQ
          </span>
          <h2 className="section-title">
            Pertanyaan yang <span className="gradient-text">Sering Ditanyakan</span>
          </h2>
          <p className="section-subtitle">
            Belum yakin? Baca jawaban dari pertanyaan yang paling sering ditanyakan.
          </p>
        </div>

        <div className="faq__list">
          {FAQ_DATA.map((item, idx) => (
            <div
              key={idx}
              className={`faq__item glass-card ${openIndex === idx ? 'faq__item--open' : ''}`}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              id={`faq-item-${idx}`}
            >
              <div className="faq__question">
                <span>{item.q}</span>
                <ChevronDown size={20} className={`faq__chevron ${openIndex === idx ? 'faq__chevron--open' : ''}`} />
              </div>
              <div className={`faq__answer ${openIndex === idx ? 'faq__answer--visible' : ''}`}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
