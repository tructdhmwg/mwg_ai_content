// Port từ _source_b_reference/src/components/Badge.jsx.
// Đổi tên OcpsBadge vì A đã có src/components/ui/Badge.tsx với ngữ nghĩa khác
// (badge của B tự map màu + nhãn theo status key của OCPS).
import { DOC_STATUS_LABEL, SEO_STATUS_LABEL, MKT_STATUS_LABEL } from '../data/ocpsMockData'

interface BadgeScheme {
  dot: string
  bg: string
  color: string
}

const SCHEME: Record<string, BadgeScheme> = {
  thieu:          { dot: '#D97706', bg: '#FEF3C7', color: '#92400E' },
  du_toithieu:    { dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  du_full:        { dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  chua:           { dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' },
  cho:            { dot: '#D97706', bg: '#FEF3C7', color: '#92400E' },
  dang_xu_ly:     { dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  da_len_web:     { dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  hoan_tat:       { dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  chua_yeu_cau:   { dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' },
  da_tiep_nhan:   { dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  dang_san_xuat:  { dot: '#8B5CF6', bg: '#F5F3FF', color: '#5B21B6' },
  cho_nghiem_thu: { dot: '#D97706', bg: '#FEF3C7', color: '#92400E' },
  can_chinh_sua:  { dot: '#EF4444', bg: '#FEE2E2', color: '#991B1B' },
  da_huy:         { dot: '#EF4444', bg: '#FEE2E2', color: '#991B1B' },
}

const ALL_LABELS: Record<string, string> = { ...DOC_STATUS_LABEL, ...SEO_STATUS_LABEL, ...MKT_STATUS_LABEL }
const DEFAULT: BadgeScheme = { dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' }

interface OcpsBadgeProps {
  status?: string
  label?: string
  className?: string
}

export function OcpsBadge({ status, label, className = '' }: OcpsBadgeProps) {
  const text = label ?? ALL_LABELS[status ?? ''] ?? status
  const { dot, bg, color } = SCHEME[status ?? ''] ?? DEFAULT
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bg, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      {text}
    </span>
  )
}
