import axios from 'axios'
import type { Job, JobCreate, Lead, Stats } from './types'

const http = axios.create({ baseURL: '/api/v1' })

export const api = {
  stats: {
    get: () => http.get<Stats>('/stats/').then(r => r.data),
  },
  jobs: {
    list: (params?: { skip?: number; limit?: number }) =>
      http.get<Job[]>('/jobs/', { params }).then(r => r.data),
    get: (id: string) => http.get<Job>(`/jobs/${id}`).then(r => r.data),
    create: (data: JobCreate) => http.post<Job>('/jobs/', data).then(r => r.data),
    cancel: (id: string) => http.post(`/jobs/${id}/cancel`).then(r => r.data),
    delete: (id: string) => http.delete(`/jobs/${id}`).then(r => r.data),
  },
  leads: {
    byJob: (jobId: string, params?: { skip?: number; limit?: number; search?: string }) =>
      http.get<Lead[]>(`/jobs/${jobId}/leads`, { params }).then(r => r.data),
    all: (params?: { skip?: number; limit?: number; search?: string }) =>
      http.get<Lead[]>('/leads', { params }).then(r => r.data),
    exportUrl: (jobId: string, format: 'csv' | 'json') =>
      `/api/v1/jobs/${jobId}/leads/export?format=${format}`,
  },
}
