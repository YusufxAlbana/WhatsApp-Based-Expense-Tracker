import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TransactionHistory from './pages/TransactionHistory.jsx'
import Analytics from './pages/Analytics.jsx'
import Budgets from './pages/Budgets.jsx'
import Settings from './pages/Settings.jsx'
import Information from './pages/Information.jsx'
import Notifications from './pages/Notifications.jsx'

function App() {
  useEffect(() => {
    const prefsStr = localStorage.getItem('weberganize_prefs')
    if (prefsStr) {
      try {
        const prefs = JSON.parse(prefsStr)
        if (prefs.theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light')
        } else {
          document.documentElement.removeAttribute('data-theme')
        }
      } catch (e) {
        // Abaikan jika format error
      }
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<TransactionHistory />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/budget" element={<Budgets />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/info" element={<Information />} />
      <Route path="/notifications" element={<Notifications />} />
    </Routes>
  )
}

export default App
