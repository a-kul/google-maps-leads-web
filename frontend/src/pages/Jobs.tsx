import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import CreateJobModal from '../components/CreateJobModal'
import StatusBadge from '../components/StatusBadge'
import type { Job } from '../types'

function duration(job: Job): string {
  const start = job.started_at ? new Date(job.started_at) : null
  const end = job.finished_at ? new Date(job.finished_at) : null
  if (!start) return '—'
  const ms = (end ?? new Date()).getTime() - start.getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function Jobs() {
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list({ limit: 100 }),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some(j => j.status === 'running' || j.status === 'pending')
      return hasActive ? 3000 : false
    },
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.jobs.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.jobs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scrape Jobs</h2>
          <p className="text-sm text-gray-500 mt-1">{jobs?.length ?? 0} total jobs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + New Job
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Query</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Leads</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs?.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium max-w-xs">
                    <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:underline truncate block">
                      {job.query}
                    </Link>
                    {job.lat != null && (
                      <span className="text-xs text-gray-400">
                        {job.lat},{job.lng} · r={job.radius}m
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={job.status} />
                    {job.error_message && (
                      <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={job.error_message}>
                        {job.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {job.leads_found}
                    {job.status === 'running' && (
                      <span className="text-gray-400"> / {job.max_results}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400">{duration(job)}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(job.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                    {(job.status === 'running' || job.status === 'pending') && (
                      <button
                        onClick={() => cancelMut.mutate(job.id)}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Delete this job and all its leads?')) deleteMut.mutate(job.id)
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!jobs?.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No jobs yet. Click <strong>+ New Job</strong> to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CreateJobModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
