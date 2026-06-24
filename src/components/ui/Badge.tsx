import { FileText, Loader2, Clock, Eye, CheckCircle, AlertCircle, XCircle, Ban, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { SiteId, JobStatus } from '../../types'
import { SITE_META, STATUS_META } from '../../types'

interface BadgeProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'outline'
}

export function Badge({ className, children, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
      variant === 'outline' && 'border border-current bg-transparent',
      className
    )}>
      {children}
    </span>
  )
}

export function SiteBadge({ site }: { site: SiteId }) {
  const meta = SITE_META[site]
  return <Badge className={meta.bgClass}>{meta.label}</Badge>
}

const STATUS_STYLE: Record<string, string> = {
  gray:   'bg-gray-100 text-gray-600',
  blue:   'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
}

const STATUS_ICON: Partial<Record<JobStatus, LucideIcon>> = {
  draft:           FileText,
  outline_pending: Clock,
  writing_pending: Clock,
  image_pending:   Clock,
  merge_pending:   Clock,
  qc_pending:      Eye,
  reviewing:       Eye,
  approved:        CheckCircle,
  published:       CheckCircle,
  error:           AlertCircle,
  rejected:        XCircle,
  cancelled:       Ban,
  spec_incomplete: AlertTriangle,
  running:         Loader2,
  outline_running: Loader2,
  writing_running: Loader2,
  image_running:   Loader2,
  merge_running:   Loader2,
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status]
  if (!meta) return null
  const Icon = STATUS_ICON[status]
  const isRunning = meta.color === 'blue'
  return (
    <Badge className={STATUS_STYLE[meta.color] ?? STATUS_STYLE.gray}>
      {Icon && <Icon size={11} className={cn(isRunning && 'animate-spin')} />}
      <span className={cn(status === 'cancelled' && 'line-through opacity-60')}>{meta.label}</span>
    </Badge>
  )
}
