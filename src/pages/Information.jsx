import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HelpCircle, Info, Target, Repeat, BellRing,
  Wallet, PieChart as PieChartIcon, Zap, Smartphone,
  ChevronDown, ChevronUp, FileText, Lock
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import './Dashboard.css'
import './Dashboard.css'
import './Information.css'

const ExampleChat = ({ userMsg, botMsg, desc }) => (
  <div className="info-chat-wrapper" style={{ marginBottom: '2rem' }}>
    <h5 style={{ marginBottom: '1rem', color: 'var(--brand-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Smartphone size={18} /> {desc}
    </h5>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.05)' }}>
      {/* User Bubble */}
      <div style={{ alignSelf: 'flex-end', background: 'var(--brand-primary)', color: '#000', fontWeight: '500', padding: '0.75rem 1rem', borderRadius: '16px 16px 2px 16px', maxWidth: '85%', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
         {userMsg}
      </div>
      {/* Bot Bubble */}
      <div style={{ alignSelf: 'flex-start', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 2px', maxWidth: '85%', fontSize: '0.95rem', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap' }}>
         {botMsg}
      </div>
    </div>
  </div>
)

export default function Information() {
  const navigate = useNavigate()
  const [sidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  
  const [expandedId, setExpandedId] = useState('rollover') // default open

  useEffect(() => {
    const savedUser = localStorage.getItem('weberganize_user')
    if (!savedUser) {
      navigate('/auth')
    } else {
      setUser(JSON.parse(savedUser))
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('weberganize_user')
    navigate('/')
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const features = [
    {
      id: 'rollover',
      title: 'Rollover Sisa (Akumulasi Budget)',
      icon: <Repeat size={20} />,
      color: 'var(--brand-primary)',
      badge: 'Paling Ditanyakan',
      content: (
        <>
          <p><strong>Bagaimana cara kerjanya?</strong></p>
          <p>Fitur "Rollover Sisa" memungkinkan Anda membawa sisa uang saku/anggaran bulan ini ke bulan berikutnya. Jika Anda berhemat bulan ini, bulan depan budget Anda akan otomatis bertambah!</p>
          <div className="info-example">
            <p className="example-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} /> Contoh Kasus:
            </p>
            <p>Pengeluaran bulan ini: <strong>Rp 800.000</strong></p>
            <p>Sisa: <strong>Rp 200.000</strong></p>
            <p className="example-res">➔ Pada bulan depan, batas anggaran Anda otomatis menjadi <strong>Rp 1.200.000</strong> (Rp 1 Juta + Rp 200 Ribu sisa).</p>
          </div>
        </>
      )
    },
    {
      id: 'threshold',
      title: 'Ambang Batas Peringatan (%)',
      icon: <BellRing size={20} />,
      color: '#f59e0b',
      content: (
        <>
          <p>Saat Anda membuat atau mengedit anggaran, Anda dapat mengatur nilai "Ambang Batas Peringatan". Ini adalah titik persentase di mana sistem akan mulai memberikan label kuning (Waspada) pada pengeluaran Anda.</p>
          <ul>
            <li>Jika diatur ke <strong>80%</strong>, maka ketika pengeluaran Anda mencapai 80% dari batas (misal: 800rb dari 1jt), bar indikator akan berubah warna menjadi kuning.</li>
            <li>Jika melebihi 100%, sistem akan memberikan peringatan merah (Kritis).</li>
          </ul>
        </>
      )
    },
    {
      id: 'integration',
      title: 'Integrasi WhatsApp Bot & Google Sheets',
      icon: <Smartphone size={20} />,
      color: '#3b82f6',
      content: (
        <>
          <p>LedgerLink sangat unik karena Anda tidak harus selalu membuka website untuk mencatat pengeluaran. Anda bisa mengirim chat langsung ke Bot WhatsApp LedgerLink.</p>
          <ul>
            <li><strong>Mencatat Cepat:</strong> Cukup kirim chat "Makan siang 50000" dan bot akan otomatis mendeteksi kategori, nominal, dan mencatatnya.</li>
            <li><strong>Google Sheets:</strong> Semua data Anda aman disimpan di Google Sheets Anda sendiri, bukan di server kami. Anda memegang kendali penuh atas data transaksi Anda.</li>
          </ul>
        </>
      )
    },
    {
      id: 'analytics',
      title: 'Analitik & Pengelompokan Kategori',
      icon: <PieChartIcon size={20} />,
      color: '#8b5cf6',
      content: (
        <>
          <p>Di halaman <strong>Analitik</strong>, aplikasi akan secara otomatis mengelompokkan riwayat belanja Anda berdasarkan kategorinya (Makanan, Transportasi, Hiburan, dll).</p>
          <p>Jika ada entri dari WhatsApp yang kategorinya tidak dikenali, sistem akan memasukkannya ke kategori <strong>"Lainnya"</strong> otomatis, dan Anda dapat mengeditnya kapan saja di halaman Transaksi.</p>
        </>
      )
    },
    {
      id: 'privacy',
      title: 'Privasi & Keamanan Data (CORS)',
      icon: <Lock size={20} />,
      color: '#ef4444',
      content: (
        <>
          <p>Sistem frontend website kami melakukan request langsung ke URL Google Apps Script Anda (tidak melalui server pihak ketiga). Kami menggunakan teknik <strong>JSONP (Script Injection)</strong> agar browser Anda tidak terhalang oleh pembatasan *CORS (Cross-Origin Resource Sharing)*.</p>
          <p>Oleh karena itu, sangat penting bagi URL Endpoint Apps Script (doGet/doPost) Anda siap menerima mode JSONP agar data tampil dengan sempurna di Dashboard dan riwayat Transaksi.</p>
        </>
      )
    },
    {
      id: 'how-to',
      title: 'Contoh Format Perintah WhatsApp (Lengkap)',
      icon: <Smartphone size={20} />,
      color: '#10b981',
      badge: 'WAJIB BACA',
      content: (
        <>
          <p style={{ marginBottom: '1.5rem' }}>Berikut adalah berbagai varasi cara mencatat pengeluaran Anda. Cukup ketik formatnya dan bot LedgerLink akan otomatis mengerjakannya!</p>
          
          <ExampleChat 
             desc="1. Format Standard & Benar" 
             userMsg="Makan Nasi Padang 25000" 
             botMsg={"Berhasil dicatat! ✅\n🍔 Nasi Padang — Rp 25.000\nKategori: Makanan\n───────────────────\n💰 Sisa Saldo Anda: Rp 1.975.000"} 
          />

          <ExampleChat 
             desc="2. Multi-Input (Banyak Sekaligus) - Paling Sakti!" 
             userMsg={"Beli Bensin 30000\nEs Teh 5000\nParkir 2000"}
             botMsg={"Sip! Berhasil mencatat 3 pengeluaran sekaligus! ✅\n\n🚗 Bensin — Rp 30.000 (Kategori: Transportasi)\n🍔 Es Teh — Rp 5.000 (Kategori: Makanan)\n🏷️ Parkir — Rp 2.000 (Kategori: Transportasi)\n───────────────────\nTotal dicatat: Rp 37.000\n💰 Sisa Saldo Anda: Rp 1.938.000"} 
          />

          <ExampleChat 
             desc="3. Salah Ketik / Lupa Angka (Ditolak Sistem)" 
             userMsg={"Tadi aku habis jajan cilok enak banget di depan sekolah"} 
             botMsg={"Sistem bingung! 😵‍💫\nKamu jajan cilok sih oke, tapi harganya berapa bosque?\nFormat wajib: [Nama Item] [Harga]"} 
          />

          <ExampleChat 
             desc="4. Format Meme / Nyeleneh (Admin Gaul)" 
             userMsg={"Bayar Hutang Pinjol 500000 😭"} 
             botMsg={"Tercatat dengan iringan air mata... 🥲✅\n💸 Hutang Pinjol — Rp 500.000\nKategori: Tagihan\n───────────────────\n💰 Sisa Saldo Anda: Rp 1.438.000\nSemangat lunasinnya kak, jangan gali lubang tutup sumur lagi ya!"} 
          />

          <ExampleChat 
             desc="5. Entri Berulang / Ganda (Bot Paham Konteks)" 
             userMsg={"Bensin lagi 20000 gara-gara muter-muter"} 
             botMsg={"Berhasil dicatat! ✅\n🚗 Bensin — Rp 20.000 (Kategori: Transportasi)\n\n💡 Info AI: Hari ini Anda sudah 2x membeli Bensin. Total pengeluaran bensin hari ini: Rp 50.000.\n───────────────────\n💰 Sisa Saldo Anda: Rp 1.418.000"} 
          />
        </>
      )
    }
  ]

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} user={user} onLogout={handleLogout} />

      <main className="dashboard-main info-main">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <h1 className="dashboard-topbar__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Info size={26} className="text-brand" /> Pusat Informasi & Bantuan
            </h1>
            <p className="dashboard-topbar__subtitle">Pelajari fitur-fitur LedgerLink dan cara menggunakannya dengan maksimal.</p>
          </div>
        </header>

        <div className="info-container mt-xl">
          {/* Intro Card */}
          <section className="glass-card info-intro animate-fade-in">
            <div className="info-intro-header">
              <div className="intro-icon bg-brand-light">
                <Zap size={28} className="text-brand" />
              </div>
              <div>
                <h2>Selamat datang di Panduan LedgerLink</h2>
                <p>Aplikasi pintar yang memadukan fleksibilitas Google Sheets dengan kecepatan WhatsApp Bot. Temukan semua penjelasan fitur di bawah ini.</p>
              </div>
            </div>
            
            <div className="intro-stats">
              <div className="i-stat">
                <h3>4+</h3>
                <span>Fitur Inti</span>
              </div>
              <div className="i-stat">
                <h3>100%</h3>
                <span>Aman (Sheets)</span>
              </div>
              <div className="i-stat">
                <h3>Realtime</h3>
                <span>Sync</span>
              </div>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="info-accordion-list mt-xl animate-slide-up">
            <h3 className="section-title"><HelpCircle size={20}/> Penjelasan Detail Fitur</h3>
            
            {features.map((feat) => {
              const isExpanded = expandedId === feat.id
              return (
                <div key={feat.id} className={`info-accordion-item glass-card ${isExpanded ? 'expanded' : ''}`}>
                  <button 
                    className="accordion-trigger" 
                    onClick={() => toggleExpand(feat.id)}
                  >
                    <div className="acc-left">
                      <div className="acc-icon" style={{ backgroundColor: `${feat.color}15`, color: feat.color }}>
                        {feat.icon}
                      </div>
                      <h4 className="acc-title">{feat.title}</h4>
                      {feat.badge && <span className="acc-badge">{feat.badge}</span>}
                    </div>
                    <div className="acc-right">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  <div className={`accordion-body-wrapper ${isExpanded ? 'open' : ''}`}>
                    <div className="accordion-body-content">
                      {feat.content}
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

        </div>
      </main>
    </div>
  )
}
