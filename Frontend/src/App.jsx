import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FeedbackForm from './pages/FeedbackForm'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
