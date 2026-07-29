import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card } from '../../features/ocps/components/Card'
import { formatDate } from '../../lib/utils'
import { PosmDotBadge } from './PosmDotBadge'
import { LAYOUT_META, LAYOUT_TYPES, STATUS_META, type PosmCampaign, type PosmCampaignStatus } from './posmMockData'

interface Props {
  rows: PosmCampaign[]
  emptyText?: string
  onRowClick?: (row: PosmCampaign) => void
}

const selectClass = 'text-xs border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#0F172A] outline-none focus:border-[#3B82F6] bg-white'

export function PosmCampaignTable({ rows, emptyText = 'Chưa có chiến dịch POSM nào.', onRowClick }: Props) {
  const [query, setQuery] = useState('')
  const [layoutFilter, setLayoutFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PosmCampaignStatus>('all')

  // Chỉ hiện trong filter những giá trị đang có trong data (giữ đúng thứ tự chuẩn) — không tạo lựa chọn "chết"
  const layoutOptions = useMemo(() => LAYOUT_TYPES.filter((lt) => rows.some((r) => r.layoutType === lt)), [rows])
  const statusOptions = useMemo(
    () => (Object.keys(STATUS_META) as PosmCampaignStatus[]).filter((s) => rows.some((r) => r.status === s)),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (layoutFilter !== 'all' && r.layoutType !== layoutFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (q && !r.campaignName.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, query, layoutFilter, statusFilter])

  return (
    <div className="space-y-3">
      {/* Thanh tìm kiếm (tên campaign / ID) + 2 filter: Loại campaign, Trạng thái */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên campaign hoặc ID..."
            className="w-full text-xs border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] bg-white"
          />
        </div>
        <select value={layoutFilter} onChange={(e) => setLayoutFilter(e.target.value)} className={selectClass}>
          <option value="all">Tất cả loại campaign</option>
          {layoutOptions.map((lt) => <option key={lt} value={lt}>{lt}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | PosmCampaignStatus)} className={selectClass}>
          <option value="all">Tất cả trạng thái</option>
          {statusOptions.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
      </div>

      <Card padding={false} className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-xs text-[#94A3B8]">{rows.length === 0 ? emptyText : 'Không có chiến dịch khớp bộ lọc.'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
                <th className="pl-5 pr-3 py-3 font-medium w-20">ID</th>
                <th className="pr-3 py-3 font-medium w-40">Loại campaign</th>
                <th className="pr-3 py-3 font-medium">Tên campaign</th>
                <th className="pr-3 py-3 font-medium w-32">Ngày tạo campaign</th>
                <th className="pr-5 py-3 font-medium w-36">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const layoutMeta = LAYOUT_META[row.layoutType] ?? { dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' }
                const statusMeta = STATUS_META[row.status]
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-[#F8FAFC] transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[#F8FAFC]' : ''}`}
                  >
                    <td className="pl-5 pr-3 py-2.5 font-mono text-[#475569]">{row.id}</td>
                    <td className="pr-3 py-2.5">
                      <PosmDotBadge label={row.layoutType} {...layoutMeta} />
                    </td>
                    <td className="pr-3 py-2.5 font-medium text-[#0F172A]">{row.campaignName}</td>
                    <td className="pr-3 py-2.5 text-[#94A3B8]">{formatDate(row.createdAt)}</td>
                    <td className="pr-5 py-2.5">
                      <PosmDotBadge label={statusMeta.label} dot={statusMeta.dot} bg={statusMeta.bg} color={statusMeta.color} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
