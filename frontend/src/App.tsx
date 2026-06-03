import { BarChart3, ExternalLink, LayoutDashboard, MapPin, ScrollText, Users } from 'lucide-react'
import { NavLink, BrowserRouter, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import JobDetail from './pages/JobDetail'
import Jobs from './pages/Jobs'
import Leads from './pages/Leads'

const navItems = [
  { to: '/',      end: true,  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',  end: false, icon: ScrollText,       label: 'Jobs'      },
  { to: '/leads', end: false, icon: Users,            label: 'All Leads' },
]

function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl animated-gradient flex items-center justify-center shadow-lg">
            <MapPin size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Maps Leads</p>
            <p className="text-slate-500 text-xs">Scraper Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* External links */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-slate-800 pt-4">
        <p className="px-3 pb-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tools</p>
        {[
          { href: 'http://localhost:15672', label: 'RabbitMQ', icon: BarChart3 },
          { href: 'http://localhost:5555',  label: 'Flower',   icon: BarChart3 },
        ].map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-slate-800"
          >
            <Icon size={15} strokeWidth={2} />
            {label}
            <ExternalLink size={12} className="ml-auto opacity-50" />
          </a>
        ))}
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 dot-bg overflow-auto">
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/jobs"    element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/leads"   element={<Leads />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
