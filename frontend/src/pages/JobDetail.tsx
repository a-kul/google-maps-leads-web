import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Ban, Calendar, CheckCircle2, Clock, Download,
  ExternalLink, Globe, MapPin, Phone, Search, Star, Trash2
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import StatusBadge from '../components/StatusBadge'
import type { Lead } from '../types'

const fmt = (dt: string | null) => dt ? new Date(dt).toLocaleString() : '—'
const limit = 100

function InfoChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
      <Icon size={13} className="text-slate-400 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="hover:bg-blue-50/30 group border-b border-slate-100 last:border-0">
      <td className="px-5 py-3">
        <a href={lead.google_maps_url} target="_blank" rel="noreferrer"
          className="font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1.5 group/link">
          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
          <span className="truncate max-w-[160px]" title={lead.name}>{lead.name}</span>
          <ExternalLink size={11} className="opacity-0 group-hover/link:opacity-100 text-blue-400 flex-shrink-0" />
        </a>
      </td>
      <td className="px-5 py-3 text-slate-500 text-xs max-w-[180px]">
        <span className="truncate block" title={lead.address}>{lead.address || '—'}</span>
      </td>
      <td className="px-5 py-3">
        {lead.phone ? (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-sm">
            <Phone size={11} className="text-slate-400" />{lead.phone}
          </a>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-5 py-3">
        {lead.website ? (
          <a href={lead.website} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs truncate max-w-[150px]">
            <Globe size={11} />
            {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-5 py-3">
        {lead.rating != null ? (
          <span className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
            <Star size={12} fill="currentColor" />{lead.rating}
            {lead.review_count != null && <span className="text-slate-400 font-normal text-xs ml-0.5">({lead.review_count.toLocaleString()})</span>}
          </span>
        ) : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
        {lead.distance_meters != null ? `${(lead.distance_meters / 1000).toFixed(1)} km` : '—'}
      </td>
    </tr>
  )
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.jobs.get(id!),
    refetchInterval: q => (q.state.data?.status === 'running' || q.state.data?.status === 'pending') ? 3000 : false,
    enabled: !!id,
  })

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', id, page, search],
    queryFn: () => api.leads.byJob(id!, { skip: page * limit, limit, search: search || undefined }),
    enabled: !!id,
    refetchInterval: job?.status === 'running' ? 4000 : false,
  })

  const cancelMut = useMutation({ mutationFn: () => api.jobs.cancel(id!), onSuccess: () => qc.invalidateQueries({ queryKey: ['job', id] }) })
  const deleteMut = useMutation({ mutationFn: () => api.jobs.delete(id!), onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); navigate('/jobs') } })

  if (!job) return (
    <div className="p-8 flex items-center justify-center min-h-64">
      <div className="text-slate-400 animate-pulse">Loading…</div>
    </div>
  )

  const progress = Math.min((job.leads_found / Math.max(job.max_results, 1)) * 100, 100)

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/jobs" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-600 mb-3 w-fit">
            <ArrowLeft size={14} /> Back to Jobs
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 max-w-xl">{job.query}</h2>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StatusBadge status={job.status} />
            {job.lat != null && (
              <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                <MapPin size={11} /> {job.lat}, {job.lng} · r={job.radius}m
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(job.status === 'running' || job.status === 'pending') && (
            <button onClick={() => cancelMut.mutate()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100">
              <Ban size={14} /> Cancel
            </button>
          )}
          <button onClick={() => { if (confirm('Delete this job and all its leads?')) deleteMut.mutate() }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Info chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoChip icon={CheckCircle2} label="Leads Found"    value={String(job.leads_found)} />
        <InfoChip icon={MapPin}       label="Max Results"    value={String(job.max_results)} />
        <InfoChip icon={Calendar}     label="Created"        value={fmt(job.created_at)} />
        <InfoChip icon={Clock}        label="Finished"       value={fmt(job.finished_at)} />
      </div>

      {/* Progress bar */}
      {(job.status === 'running' || job.status === 'pending') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-slate-700">Scraping in progress…</span>
            <span className="text-sm font-bold text-blue-600">{job.leads_found} / {job.max_results}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{Math.round(progress)}% complete</p>
        </div>
      )}

      {/* Error */}
      {job.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex gap-3">
          <span className="text-lg">⚠️</span>
          <div><strong className="block mb-0.5">Scraping failed</strong>{job.error_message}</div>
        </div>
      )}

      {/* Leads table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <MapPin size={15} className="text-slate-400" />
            Leads
            {leads && <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">{leads.length}</span>}
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search leads…"
                className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
              />
            </div>
            {job.leads_found > 0 && (
              <div className="flex items-center gap-2">
                {(['csv', 'json'] as const).map(fmt => (
                  <a key={fmt} href={api.leads.exportUrl(job.id, fmt)} download
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50">
                    <Download size={12} /> {fmt.toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {leadsLoading ? (
          <div className="py-16 text-center text-slate-400">Loading leads…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Name', 'Address', 'Phone', 'Website', 'Rating', 'Distance'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads?.map(lead => <LeadRow key={lead.id} lead={lead} />)}
                {!leads?.length && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      {job.status === 'pending' ? '⏳ Job is waiting in queue…'
                        : job.status === 'running' ? '🔍 Scraping in progress…'
                        : '🔎 No leads found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {(leads?.length === limit || page > 0) && (
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs disabled:opacity-40">
              ← Prev
            </button>
            <span className="text-slate-400 text-xs">Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={leads?.length !== limit}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
