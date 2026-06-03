import { CheckCircle2, Clock, Loader2, XCircle, Ban } from 'lucide-react'
import type { JobStatus } from '../types'

const config: Record<JobStatus, { label: string; icon: React.ElementType; cls: string }> = {
  pending:   { label: 'Pending',   icon: Clock,         cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  running:   { label: 'Running',   icon: Loader2,       cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  done:      { label: 'Done',      icon: CheckCircle2,  cls: 'bg-green-50  text-green-700  border-green-200'  },
  failed:    { label: 'Failed',    icon: XCircle,       cls: 'bg-red-50    text-red-700    border-red-200'    },
  cancelled: { label: 'Cancelled', icon: Ban,           cls: 'bg-slate-50  text-slate-500  border-slate-200'  },
}

export default function StatusBadge({ status }: { status: JobStatus }) {
  const { label, icon: Icon, cls } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={11} strokeWidth={2.5} className={status === 'running' ? 'animate-spin' : ''} />
      {label}
    </span>
  )
}
