// Port từ _source_b_reference/src/components/StatCard.jsx.
// A chỉ có một StatCard cục bộ (không export) trong JobListPage — không xung đột module.
import type { ReactNode } from 'react'

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  color?: string
  icon?: ReactNode
}

export function StatCard({ label, value, color = 'text-[#0F172A]', icon }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
