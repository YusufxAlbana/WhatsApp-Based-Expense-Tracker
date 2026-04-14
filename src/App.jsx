import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TransactionHistory from './pages/TransactionHistory.jsx'
import Analytics from './pages/Analytics.jsx'
import Budgets from './pages/Budgets.jsx'
import Settings from './pages/Settings.jsx'
import Information from './pages/Information.jsx'

function App() {
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
    </Routes>
  )
}

export default App
