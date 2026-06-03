import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Navigation, Settings, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { JobCreate } from '../types'

interface Props { onClose: () => void }

const defaultForm: JobCreate = {
  query: '',
  lat: null, lng: null, radius: null,
  max_results: 50, scrolls: 20, timeout_seconds: 30, delay_seconds: 0.4,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400'

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

  const num = (v: string) => v === '' ? null : Number(v)

  const set = (k: keyof JobCreate, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-6 py-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl animated-gradient flex items-center justify-center shadow-lg">
                <MapPin size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">New Scrape Job</h2>
                <p className="text-blue-300 text-xs">Configure and launch a scraping worker</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form
          className="p-6 space-y-5"
          onSubmit={e => {
            e.preventDefault()
            const payload = { ...form }
            if (!useLocation) { payload.lat = null; payload.lng = null; payload.radius = null }
            mutation.mutate(payload)
          }}
        >
          {/* Query */}
          <Field label="Search Query">
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                className={`${inputCls} pl-9`}
                placeholder='e.g. "dentists in Austin TX"'
                value={form.query}
                onChange={e => set('query', e.target.value)}
              />
            </div>
          </Field>

          {/* Location toggle */}
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50 group">
            <div className={`w-9 h-5 rounded-full transition-colors ${useLocation ? 'bg-blue-600' : 'bg-slate-300'} relative flex-shrink-0`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useLocation ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <input type="checkbox" className="sr-only" checked={useLocation} onChange={e => setUseLocation(e.target.checked)} />
            <div className="flex items-center gap-2">
              <Navigation size={14} className={useLocation ? 'text-blue-600' : 'text-slate-400'} />
              <span className="text-sm font-medium text-slate-700">Enable geo-location bias</span>
            </div>
          </label>

          {useLocation && (
            <div className="grid grid-cols-3 gap-3">
              {([['lat', 'Latitude'], ['lng', 'Longitude'], ['radius', 'Radius (m)']] as const).map(([k, lbl]) => (
                <Field key={k} label={lbl}>
                  <input
                    type="number" step="any"
                    className={inputCls}
                    value={form[k] ?? ''}
                    onChange={e => set(k, num(e.target.value))}
                    placeholder={k === 'radius' ? '5000' : '0.000'}
                  />
                </Field>
              ))}
            </div>
          )}

          {/* Settings */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={13} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scraper settings</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['max_results', 'Max Results', 1, 500, 1],
                ['scrolls',     'Scrolls',     1, 100, 1],
                ['timeout_seconds', 'Timeout (s)', 5, 120, 1],
                ['delay_seconds',   'Delay (s)',   0.1, 5, 0.1],
              ] as const).map(([k, lbl, min, max, step]) => (
                <Field key={k} label={lbl}>
                  <input
                    type="number" min={min} max={max} step={step}
                    className={inputCls}
                    value={form[k]}
                    onChange={e => set(k, Number(e.target.value))}
                  />
                </Field>
              ))}
            </div>
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <X size={14} className="flex-shrink-0" />
              {(mutation.error as Error).message}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
              <Zap size={15} />
              {mutation.isPending ? 'Starting…' : 'Start Scraping'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
