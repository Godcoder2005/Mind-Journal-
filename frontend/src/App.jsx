import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Journal from './pages/Journal'
import Dashboard from './pages/Dashboard'
import AlterEgo from './pages/AlterEgo'
import EnergyTracker from './pages/EnergyTracker'
import NightlyCheckin from './pages/NightlyCheckin'
import FutureLetter from './pages/FutureLetter'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/journal" />} />
          <Route path="journal" element={<Journal />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="energy" element={<EnergyTracker />} />
          <Route path="alter-ego" element={<AlterEgo />} />
          <Route path="checkin" element={<NightlyCheckin />} />
          <Route path="letter" element={<FutureLetter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}