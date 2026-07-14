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

// Luồng xử lý chỉ hiển thị 2 giá trị: "Cả hai" và "Chỉ Content"
function normalizeFlowLabel(label?: string) {
  if (!label) return ''
  return label === 'Chỉ Content' ? label : 'Cả hai'
}

// Content/MKT chỉ hiển thị 2 giá trị: "Đang xử lý" và "Hoàn tất"
function ProgressBadgeCell({ status }: { status?: string }) {
  if (!status) return <td className="py-2 pr-3" />
  const done = status === 'hoan_tat' || status === 'da_len_web'
  return (
    <td className="py-2 pr-3">
      <OcpsBadge status={done ? 'hoan_tat' : 'dang_xu_ly'} label={done ? 'Hoàn tất' : 'Đang xử lý'} />
    </td>
  )
}

function normalizeDocStatus(status?: string) {
  if (!status) return null
  if (status === 'thieu') return { status: 'thieu', label: 'Thiếu' }
  if (status === 'du_toithieu' || status === 'du_full') return { status: 'du_full', label: 'Đủ' }
  return { status, label: status }
}

function DocStatusCell({ status }: { status?: string }) {
  const normalized = normalizeDocStatus(status)
  return (
    <td className="py-2 pr-3">
      {normalized ? <OcpsBadge status={normalized.status} label={normalized.label} /> : null}
    </td>
  )
}

export function FullListingTable({ rows, emptyText }: FullListingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] text-xs">
        <thead>
          <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
            <th className="pb-2 pr-3 font-medium">Mã ERP</th>
            <th className="pb-2 pr-3 font-medium">Mã modelID</th>
            <th className="pb-2 pr-3 font-medium">Ngày tạo ERP</th>
            <th className="pb-2 pr-3 font-medium">Tên SP</th>
            <th className="pb-2 pr-3 font-medium">Ngành hàng</th>
            <th className="pb-2 pr-3 font-medium">Hãng</th>
            <th className="pb-2 pr-3 font-medium">Tài liệu</th>
            <th className="pb-2 pr-3 font-medium">Luồng xử lý</th>
            <th className="pb-2 pr-3 font-medium">Content</th>
            <th className="pb-2 pr-3 font-medium">MKT</th>
            <th className="pb-2 pr-3 font-medium">Ngày gửi</th>
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
              <DocStatusCell status={row.docStatus} />
              <TextCell>{normalizeFlowLabel(row.flowLabel)}</TextCell>
              <ProgressBadgeCell status={row.seoStatus} />
              <ProgressBadgeCell status={row.mktStatus} />
              <TextCell muted>{row.ngayGui}</TextCell>
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
