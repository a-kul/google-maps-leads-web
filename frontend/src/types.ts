export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled'

export interface Job {
  id: string
  query: string
  lat: number | null
  lng: number | null
  radius: number | null
  max_results: number
  scrolls: number
  timeout_seconds: number
  delay_seconds: number
  status: JobStatus
  leads_found: number
  error_message: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface Lead {
  id: string
  job_id: string
  place_id: string
  name: string
  address: string
  phone: string
  website: string
  google_maps_url: string
  rating: number | null
  review_count: number | null
  latitude: number | null
  longitude: number | null
  distance_meters: number | null
  created_at: string
}

export interface Stats {
  total_jobs: number
  total_leads: number
  pending_jobs: number
  running_jobs: number
  done_jobs: number
  failed_jobs: number
}

export interface JobCreate {
  query: string
  lat?: number | null
  lng?: number | null
  radius?: number | null
  max_results: number
  scrolls: number
  timeout_seconds: number
  delay_seconds: number
}
