// Port từ _source_b_reference/src/components/Button.jsx.
// Đổi tên OcpsButton vì A đã có src/components/ui/Button.tsx với API khác
// (B có variant `default`/`success`, mặc định size `sm`). Giữ nguyên API của B
// để các trang port không phải sửa logic.
import type { ButtonHTMLAttributes } from 'react'

export type OcpsButtonVariant = 'default' | 'primary' | 'success' | 'danger' | 'ghost' | 'outline'
export type OcpsButtonSize = 'sm' | 'md' | 'lg'

interface OcpsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OcpsButtonVariant
  size?: OcpsButtonSize
}

export function OcpsButton({ variant = 'default', size = 'sm', children, className = '', ...props }: OcpsButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none'
  const sizes: Record<OcpsButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs h-7',
    md: 'px-4 py-2 text-sm h-9',
    lg: 'px-5 py-2.5 text-sm h-10',
  }
  const variants: Record<OcpsButtonVariant, string> = {
    default: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] shadow-sm',
    primary: 'bg-[#2563EB] text-white border border-[#2563EB] hover:bg-[#1D4ED8] shadow-sm',
    success: 'bg-[#16A34A] text-white border border-[#16A34A] hover:bg-[#15803D] shadow-sm',
    danger:  'bg-[#EF4444] text-white border border-[#EF4444] hover:bg-[#DC2626] shadow-sm',
    ghost:   'bg-transparent text-[#475569] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A]',
    outline: 'bg-white text-[#2563EB] border border-[#3B82F6] hover:bg-[#EFF6FF] shadow-sm',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
