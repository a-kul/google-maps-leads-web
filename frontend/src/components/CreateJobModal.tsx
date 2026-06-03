import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { JobCreate } from '../types'

interface Props {
  onClose: () => void
}

const defaultForm: JobCreate = {
  query: '',
  lat: null,
  lng: null,
  radius: null,
  max_results: 50,
  scrolls: 20,
  timeout_seconds: 30,
  delay_seconds: 0.4,
}

export default function CreateJobModal({ onClose }: Props) {
  const [form, setForm] = useState<JobCreate>(defaultForm)
  const [useLocation, setUseLocation] = useState(false)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: api.jobs.create,
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      onClose()
      navigate(`/jobs/${job.id}`)
    },
  })

  const num = (v: string) => (v === '' ? null : Number(v))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Scrape Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form
          className="p-6 space-y-4"
          onSubmit={e => {
            e.preventDefault()
            const payload = { ...form }
            if (!useLocation) {
              payload.lat = null
              payload.lng = null
              payload.radius = null
            }
            mutation.mutate(payload)
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Query *</label>
            <input
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='e.g. "dentists in Austin TX"'
              value={form.query}
              onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-location"
              checked={useLocation}
              onChange={e => setUseLocation(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="use-location" className="text-sm text-gray-700">Use geo-location bias</label>
          </div>

          {useLocation && (
            <div className="grid grid-cols-3 gap-3">
              {(['lat', 'lng', 'radius'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {field === 'radius' ? 'Radius (m)' : field.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[field] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [field]: num(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Results</label>
              <input
                type="number" min={1} max={500}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.max_results}
                onChange={e => setForm(f => ({ ...f, max_results: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scrolls</label>
              <input
                type="number" min={1} max={100}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.scrolls}
                onChange={e => setForm(f => ({ ...f, scrolls: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Timeout (s)</label>
              <input
                type="number" min={5} step={1}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.timeout_seconds}
                onChange={e => setForm(f => ({ ...f, timeout_seconds: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delay (s)</label>
              <input
                type="number" min={0.1} step={0.1}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.delay_seconds}
                onChange={e => setForm(f => ({ ...f, delay_seconds: Number(e.target.value) }))}
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              Error: {(mutation.error as Error).message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Starting…' : 'Start Scraping'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
