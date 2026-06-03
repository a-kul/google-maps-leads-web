import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Clock, MapPin, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import CreateJobModal from '../components/CreateJobModal'
import StatusBadge from '../components/StatusBadge'
import type { Job } from '../types'

function duration(job: Job): string {
  const start = job.started_at ? new Date(job.started_at) : null
  const end   = job.finished_at ? new Date(job.finished_at) : null
  if (!start) return '—'
  const s = Math.floor(((end ?? new Date()).getTime() - start.getTime()) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function Jobs() {
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list({ limit: 100 }),
    refetchInterval: (q) => q.state.data?.some(j => j.status === 'running' || j.status === 'pending') ? 3000 : false,
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.jobs.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.jobs.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); qc.invalidateQueries({ queryKey: ['stats'] }) },
  })

  const counts = {
    done:    jobs?.filter(j => j.status === 'done').length ?? 0,
    running: jobs?.filter(j => j.status === 'running').length ?? 0,
    failed:  jobs?.filter(j => j.status === 'failed').length ?? 0,
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Scrape Jobs</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />{counts.done} done</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />{counts.running} running</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />{counts.failed} failed</span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} /> New Job
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading…</div>
        ) : !jobs?.length ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <MapPin size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-semibold text-lg">No jobs yet</p>
            <p className="text-slate-400 text-sm">Create your first scraping job to collect leads</p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
            >
              <Plus size={15} /> Create Job
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Query', 'Status', 'Progress', 'Duration', 'Created', ''].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/70 group">
                  <td className="px-5 py-4">
                    <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block max-w-[220px] truncate">
                      {job.query}
                    </Link>
                    {job.lat != null && (
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        📍 {job.lat}, {job.lng} · r={job.radius}m
                      </span>
                    )}
                    {job.error_message && (
                      <span className="text-xs text-red-500 block mt-0.5 max-w-[220px] truncate" title={job.error_message}>
                        ⚠ {job.error_message}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${job.status === 'done' ? 'bg-emerald-500' : job.status === 'failed' ? 'bg-red-400' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((job.leads_found / job.max_results) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{job.leads_found}<span className="text-slate-400">/{job.max_results}</span></span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} />
                      {duration(job)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{new Date(job.created_at).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                      {(job.status === 'running' || job.status === 'pending') && (
                        <button onClick={() => cancelMut.mutate(job.id)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50" title="Cancel">
                          <Ban size={14} />
                        </button>
                      )}
                      <button onClick={() => { if (confirm('Delete this job and all its leads?')) deleteMut.mutate(job.id) }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CreateJobModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
