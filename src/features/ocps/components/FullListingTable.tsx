import type { ReactNode } from 'react'
import { OcpsBadge } from './OcpsBadge'

export interface FullListingRow {
  key: string
  maErp?: string
  modelCode?: string
  erpCreatedAt?: string
  tenSP?: string
  nganhhang?: string
  vendor?: string
  docStatus?: string
  flowLabel?: string
  seoStatus?: string
  mktStatus?: string
  ngayGui?: string
  loaiNhuCau?: string
  action?: ReactNode
}

interface FullListingTableProps {
  rows: FullListingRow[]
  emptyText: string
}

function TextCell({ children, strong = false, muted = false }: { children?: string; strong?: boolean; muted?: boolean }) {
  return (
    <td className={`py-2 pr-3 ${strong ? 'font-medium text-[#0F172A]' : muted ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
      {children || ''}
    </td>
  )
}

function BadgeCell({ status }: { status?: string }) {
  return <td className="py-2 pr-3">{status ? <OcpsBadge status={status} /> : null}</td>
}

export function FullListingTable({ rows, emptyText }: FullListingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-xs">
        <thead>
          <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
            <th className="pb-2 pr-3 font-medium">Mã ERP</th>
            <th className="pb-2 pr-3 font-medium">Mã model code</th>
            <th className="pb-2 pr-3 font-medium">Ngày tạo ERP</th>
            <th className="pb-2 pr-3 font-medium">Tên SP</th>
            <th className="pb-2 pr-3 font-medium">Ngành hàng</th>
            <th className="pb-2 pr-3 font-medium">Hãng</th>
            <th className="pb-2 pr-3 font-medium">Tài liệu</th>
            <th className="pb-2 pr-3 font-medium">Luồng xử lý</th>
            <th className="pb-2 pr-3 font-medium">Content</th>
            <th className="pb-2 pr-3 font-medium">MKT</th>
            <th className="pb-2 pr-3 font-medium">Ngày gửi</th>
            <th className="pb-2 pr-3 font-medium">Loại nhu cầu</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
              <TextCell strong>{row.maErp}</TextCell>
              <TextCell>{row.modelCode}</TextCell>
              <TextCell muted>{row.erpCreatedAt}</TextCell>
              <TextCell strong>{row.tenSP}</TextCell>
              <TextCell>{row.nganhhang}</TextCell>
              <TextCell>{row.vendor}</TextCell>
              <BadgeCell status={row.docStatus} />
              <TextCell>{row.flowLabel}</TextCell>
              <BadgeCell status={row.seoStatus} />
              <BadgeCell status={row.mktStatus} />
              <TextCell muted>{row.ngayGui}</TextCell>
              <TextCell>{row.loaiNhuCau}</TextCell>
              <td className="py-2">{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-center text-xs text-[#94A3B8] py-6">{emptyText}</p>
      )}
    </div>
  )
}
