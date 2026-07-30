import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '../../features/ocps/components/Card'

interface Props {
  title: string
  // Chú thích ngắn bên phải tiêu đề (vd: "Layout Tờ rơi · 2 mặt")
  hint?: ReactNode
  // Cho phép thu gọn cả vùng. defaultCollapsed chỉ là trạng thái KHỞI TẠO —
  // sau đó user tự bấm mở/thu, không bị ép lại theo trạng thái phiếu.
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: ReactNode
}

// 1 vùng của chi tiết phiếu POSM. Chi tiết phiếu chia 3 vùng: thông tin campaign · bố cục campaign · duyệt & AI.
export function PosmSectionCard({ title, hint, collapsible = false, defaultCollapsed = false, children }: Props) {
  const [collapsed, setCollapsed] = useState(collapsible && defaultCollapsed)
  const open = !collapsible || !collapsed

  return (
    <Card className="mb-4">
      <div className={`flex items-center justify-between gap-3 ${open ? 'mb-4' : ''}`}>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] cursor-pointer"
            title={open ? 'Thu gọn' : 'Mở rộng'}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {title}
          </button>
        ) : (
          <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
        )}
        {hint && <span className="text-[11px] text-[#94A3B8] shrink-0">{hint}</span>}
      </div>
      {open && <div className="space-y-5">{children}</div>}
    </Card>
  )
}
