// Port từ _source_b_reference/src/components/Card.jsx (A không có Card — giữ tên).
import type { ReactNode } from 'react'

interface CardProps {
  children?: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}
