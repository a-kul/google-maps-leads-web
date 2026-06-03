import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Globe, MapPin, Phone, Search, Star, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const limit = 100

export default function Leads() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(0) }, 400)
  }

  const { data: leads, isLoading } = useQuery({
    queryKey: ['all-leads', page, debouncedSearch],
    queryFn: () => api.leads.all({ skip: page * limit, limit, search: debouncedSearch || undefined }),
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-slate-400" /> All Leads
          </h2>
          <p className="text-sm text-slate-500 mt-1">Browse scraped leads across all jobs</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, address, phone…"
            className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 shadow-sm"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse">Loading leads…</div>
        ) : !leads?.length ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <MapPin size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold">
              {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No leads yet'}
            </p>
            {!debouncedSearch && (
              <Link to="/jobs" className="text-sm text-blue-600 hover:underline font-medium">
                Start a scrape job →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Name', 'Address', 'Phone', 'Website', 'Rating', 'Job'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-blue-50/20 group">
                    <td className="px-5 py-3.5">
                      <a href={lead.google_maps_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-blue-600 group/link">
                        <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[160px]" title={lead.name}>{lead.name}</span>
                        <ExternalLink size={11} className="opacity-0 group-hover/link:opacity-100 text-blue-400 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[200px]">
                      <span className="truncate block" title={lead.address}>{lead.address || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 text-sm whitespace-nowrap">
                          <Phone size={11} className="text-slate-400" />{lead.phone}
                        </a>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 max-w-[160px]">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs truncate">
                          <Globe size={11} className="flex-shrink-0" />
                          {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {lead.rating != null ? (
                        <span className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                          <Star size={12} fill="currentColor" />{lead.rating}
                          {lead.review_count != null && (
                            <span className="text-slate-400 font-normal text-xs">({lead.review_count.toLocaleString()})</span>
                          )}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/jobs/${lead.job_id}`}
                        className="text-xs font-mono text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded-lg">
                        {lead.job_id.slice(0, 8)}…
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(leads?.length === limit || page > 0) && (
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium disabled:opacity-40">
              ← Prev
            </button>
            <span className="text-xs text-slate-400">Page {page + 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={leads?.length !== limit}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
