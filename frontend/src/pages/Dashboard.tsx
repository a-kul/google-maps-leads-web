import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Overview of scraping activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={stats?.total_jobs ?? 0} />
        <StatCard label="Total Leads" value={stats?.total_leads ?? 0} />
        <StatCard
          label="Active"
          value={(stats?.running_jobs ?? 0) + (stats?.pending_jobs ?? 0)}
          sub={`${stats?.running_jobs ?? 0} running · ${stats?.pending_jobs ?? 0} pending`}
        />
        <StatCard label="Failed" value={stats?.failed_jobs ?? 0} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Jobs</h3>
          <Link to="/jobs" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Query</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Leads</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs?.map(job => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">
                  <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:underline">
                    {job.query}
                  </Link>
                </td>
                <td className="px-5 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-5 py-3 text-gray-600">{job.leads_found}</td>
                <td className="px-5 py-3 text-gray-400">{new Date(job.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!jobs?.length && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  No jobs yet. <Link to="/jobs" className="text-blue-600 hover:underline">Create one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
