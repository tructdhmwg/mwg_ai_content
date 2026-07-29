import { Card } from '../../features/ocps/components/Card'
import { formatDate } from '../../lib/utils'
import { PosmDotBadge } from './PosmDotBadge'
import { LAYOUT_META, STATUS_META, type PosmCampaign } from './posmMockData'

interface Props {
  rows: PosmCampaign[]
  emptyText?: string
  onRowClick?: (row: PosmCampaign) => void
}

export function PosmCampaignTable({ rows, emptyText = 'Chưa có chiến dịch POSM nào.', onRowClick }: Props) {
  return (
    <Card padding={false} className="overflow-hidden">
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-xs text-[#94A3B8]">{emptyText}</p>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
              <th className="pl-5 pr-3 py-3 font-medium w-32">ID</th>
              <th className="pr-3 py-3 font-medium w-40">Loại layout</th>
              <th className="pr-3 py-3 font-medium">Tên campaign</th>
              <th className="pr-3 py-3 font-medium w-32">Ngày tạo campaign</th>
              <th className="pr-5 py-3 font-medium w-36">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
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
  )
}
