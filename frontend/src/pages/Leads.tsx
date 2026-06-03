import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const limit = 100

export default function Leads() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: leads, isLoading } = useQuery({
    queryKey: ['all-leads', page, debouncedSearch],
    queryFn: () => api.leads.all({ skip: page * limit, limit, search: debouncedSearch || undefined }),
  })

  let debounceTimer: ReturnType<typeof setTimeout>
  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      setDebouncedSearch(v)
      setPage(0)
    }, 400)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Leads</h2>
          <p className="text-sm text-gray-500 mt-1">Browse leads across all jobs</p>
        </div>
        <input
          type="search"
          placeholder="Search by name, address, phone…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Job'].map(h => (
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
                      {lead.phone || '—'}
                    </td>
                    <td className="px-4 py-2.5 max-w-[160px]">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block truncate">
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
                    <td className="px-4 py-2.5">
                      <Link to={`/jobs/${lead.job_id}`} className="text-xs text-gray-400 hover:text-blue-600 font-mono">
                        {lead.job_id.slice(0, 8)}…
                      </Link>
                    </td>
                  </tr>
                ))}
                {!leads?.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      {debouncedSearch ? 'No results found.' : 'No leads yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {(leads?.length === limit || page > 0) && (
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
              disabled={leads?.length !== limit}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
