import type { JobStatus } from '../types'

const colors: Record<JobStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  running:   'bg-blue-100 text-blue-800',
  done:      'bg-green-100 text-green-800',
  failed:    'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

const labels: Record<JobStatus, string> = {
  pending:   'Pending',
  running:   'Running',
  done:      'Done',
  failed:    'Failed',
  cancelled: 'Cancelled',
}

export default function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {labels[status]}
    </span>
  )
}
