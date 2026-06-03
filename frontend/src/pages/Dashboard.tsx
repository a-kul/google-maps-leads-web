import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowUpRight, Briefcase, CheckCircle2, Loader2, MapPin, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  gradient: string
  iconBg: string
  sub?: string
}

function StatCard({ label, value, icon: Icon, gradient, iconBg, sub }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">{label}</p>
          <p className="text-4xl font-extrabold mt-1 tracking-tight">{value.toLocaleString()}</p>
          {sub && <p className="text-xs text-white/60 mt-1.5">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-inner`}>
          <Icon size={22} strokeWidth={2} className="text-white" />
        </div>
      </div>
      {/* Decorative circle */}
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
    </div>
  )
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.stats.get,
    refetchInterval: 5000,
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs', { limit: 5 }],
    queryFn: () => api.jobs.list({ limit: 5 }),
    refetchInterval: 5000,
  })

  const active = (stats?.running_jobs ?? 0) + (stats?.pending_jobs ?? 0)

  return (
    <div className="p-8 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-8 shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg animated-gradient flex items-center justify-center">
              <MapPin size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-blue-300 text-sm font-semibold uppercase tracking-widest">Scraper Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Google Maps Leads</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-md">
            Automate lead collection from Google Maps. Create jobs, track progress in real time, export as CSV or JSON.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-blue-50 shadow-lg"
          >
            Start Scraping <ArrowUpRight size={15} />
          </Link>
        </div>
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Jobs"
          value={stats?.total_jobs ?? 0}
          icon={Briefcase}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          iconBg="bg-blue-400/30"
        />
        <StatCard
          label="Total Leads"
          value={stats?.total_leads ?? 0}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          iconBg="bg-emerald-400/30"
        />
        <StatCard
          label="Active Jobs"
          value={active}
          icon={Loader2}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          iconBg="bg-amber-400/30"
          sub={`${stats?.running_jobs ?? 0} running · ${stats?.pending_jobs ?? 0} pending`}
        />
        <StatCard
          label="Failed"
          value={stats?.failed_jobs ?? 0}
          icon={AlertCircle}
          gradient="bg-gradient-to-br from-red-500 to-rose-700"
          iconBg="bg-red-400/30"
          sub={`${stats?.done_jobs ?? 0} completed total`}
        />
      </div>

      {/* Recent jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-slate-400" />
            <h3 className="font-semibold text-slate-800">Recent Jobs</h3>
          </div>
          <Link
            to="/jobs"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all <ArrowUpRight size={13} />
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Query', 'Status', 'Leads', 'Created'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs?.map(job => (
              <tr key={job.id} className="hover:bg-slate-50/80 group">
                <td className="px-6 py-3.5 font-medium">
                  <Link to={`/jobs/${job.id}`} className="text-slate-800 hover:text-blue-600 flex items-center gap-1">
                    {job.query}
                    <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 text-blue-400" />
                  </Link>
                </td>
                <td className="px-6 py-3.5"><StatusBadge status={job.status} /></td>
                <td className="px-6 py-3.5">
                  <span className="font-semibold text-slate-700">{job.leads_found}</span>
                  <span className="text-slate-400 text-xs ml-1">leads</span>
                </td>
                <td className="px-6 py-3.5 text-slate-400 text-xs">{new Date(job.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!jobs?.length && (
              <tr>
                <td colSpan={4} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <MapPin size={24} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No jobs yet</p>
                    <Link to="/jobs" className="text-sm text-blue-600 hover:underline font-medium">
                      Create your first scrape job →
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
