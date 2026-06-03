import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString() : '—'
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const limit = 100

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.jobs.get(id!),
    refetchInterval: (q) =>
      q.state.data?.status === 'running' || q.state.data?.status === 'pending' ? 3000 : false,
    enabled: !!id,
  })

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', id, page, search],
    queryFn: () => api.leads.byJob(id!, { skip: page * limit, limit, search: search || undefined }),
    enabled: !!id,
    refetchInterval: job?.status === 'running' ? 4000 : false,
  })

  const cancelMut = useMutation({
    mutationFn: () => api.jobs.cancel(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job', id] }),
  })

  const deleteMut = useMutation({
    mutationFn: () => api.jobs.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      navigate('/jobs')
    },
  })

  if (!job) return <div className="p-8 text-gray-400">Loading…</div>

  const progress = job.max_results > 0 ? Math.min((job.leads_found / job.max_results) * 100, 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/jobs" className="text-sm text-gray-400 hover:text-gray-600">← Jobs</Link>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{job.query}</h2>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={job.status} />
            {job.lat != null && (
              <span className="text-xs text-gray-400">
                lat {job.lat} · lng {job.lng} · radius {job.radius}m
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(job.status === 'running' || job.status === 'pending') && (
            <button
              onClick={() => cancelMut.mutate()}
              className="px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this job and all its leads?')) deleteMut.mutate()
            }}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Leads Found', value: job.leads_found },
          { label: 'Max Results', value: job.max_results },
          { label: 'Created', value: fmt(job.created_at) },
          { label: 'Finished', value: fmt(job.finished_at) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {(job.status === 'running' || job.status === 'pending') && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{job.leads_found} / {job.max_results}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {job.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Error:</strong> {job.error_message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900">
            Leads {leads ? `(${leads.length})` : ''}
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Search…"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
            {job.leads_found > 0 && (
              <div className="flex gap-2">
                <a
                  href={api.leads.exportUrl(job.id, 'csv')}
                  download
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  CSV
                </a>
                <a
                  href={api.leads.exportUrl(job.id, 'json')}
                  download
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  JSON
                </a>
              </div>
            )}
          </div>
        </div>

        {leadsLoading ? (
          <div className="p-8 text-center text-gray-400">Loading leads…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Distance'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads?.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium max-w-[180px]">
                      <a href={lead.google_maps_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block truncate" title={lead.name}>
                        {lead.name}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[200px]">
                      <span className="block truncate" title={lead.address}>{lead.address || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 max-w-[180px]">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block truncate" title={lead.website}>
                          {lead.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {lead.rating != null ? `⭐ ${lead.rating}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {lead.review_count != null ? lead.review_count.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                      {lead.distance_meters != null ? `${(lead.distance_meters / 1000).toFixed(1)} km` : '—'}
                    </td>
                  </tr>
                ))}
                {!leads?.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                      {job.status === 'pending' ? 'Job is waiting in queue…' :
                       job.status === 'running' ? 'Scraping in progress…' :
                       'No leads found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {(leads?.length === limit) && (
          <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
