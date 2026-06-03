import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import JobDetail from './pages/JobDetail'
import Jobs from './pages/Jobs'
import Leads from './pages/Leads'

function Nav() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`
  return (
    <nav className="w-56 shrink-0 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col gap-1">
      <div className="mb-6 px-4">
        <h1 className="text-base font-bold text-gray-900 leading-tight">Maps Leads</h1>
        <p className="text-xs text-gray-400">Scraper Platform</p>
      </div>
      <NavLink to="/" end className={cls}>Dashboard</NavLink>
      <NavLink to="/jobs" className={cls}>Jobs</NavLink>
      <NavLink to="/leads" className={cls}>All Leads</NavLink>
      <div className="mt-auto pt-4 border-t border-gray-100 text-xs text-gray-400 px-4">
        <a href="http://localhost:15672" target="_blank" rel="noreferrer" className="block hover:text-gray-600">RabbitMQ →</a>
        <a href="http://localhost:5555" target="_blank" rel="noreferrer" className="block hover:text-gray-600 mt-1">Flower →</a>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Nav />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/leads" element={<Leads />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
