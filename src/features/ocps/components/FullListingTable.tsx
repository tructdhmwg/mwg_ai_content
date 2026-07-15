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

// Content/MKT hiển thị theo Luồng xử lý:
// - Chưa có luồng (hoặc nhánh không nằm trong luồng, VD MKT khi "Chỉ Content") → "Chưa yêu cầu"
// - Có luồng → 3 trạng thái: "Chờ xử lý", "Đang xử lý", "Hoàn tất"
function ProgressBadgeCell({ status, requested }: { status?: string; requested: boolean }) {
  if (!status) return <td className="py-2 pr-3" />
  if (!requested) {
    return (
      <td className="py-2 pr-3">
        <OcpsBadge status="chua_yeu_cau" label="Chưa yêu cầu" />
      </td>
    )
  }
  const done = status === 'hoan_tat' || status === 'da_len_web'
  const waiting = status === 'chua' || status === 'chua_yeu_cau' || status === 'cho' || status === 'da_tiep_nhan'
  const display = done
    ? { status: 'hoan_tat', label: 'Hoàn tất' }
    : waiting
      ? { status: 'cho', label: 'Chờ xử lý' }
      : { status: 'dang_xu_ly', label: 'Đang xử lý' }
  return (
    <td className="py-2 pr-3">
      <OcpsBadge status={display.status} label={display.label} />
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
          {rows.map(row => {
            const flow = normalizeFlowLabel(row.flowLabel)
            return (
            <tr key={row.key} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
              <TextCell strong>{row.maErp}</TextCell>
              <TextCell>{row.modelCode}</TextCell>
              <TextCell muted>{row.erpCreatedAt}</TextCell>
              <TextCell strong>{row.tenSP}</TextCell>
              <TextCell>{row.nganhhang}</TextCell>
              <TextCell>{row.vendor}</TextCell>
              <DocStatusCell status={row.docStatus} />
              <TextCell>{flow}</TextCell>
              {/* Content thuộc mọi luồng; MKT chỉ thuộc luồng "Cả hai" */}
              <ProgressBadgeCell status={row.seoStatus} requested={!!flow} />
              <ProgressBadgeCell status={row.mktStatus} requested={flow === 'Cả hai'} />
              {/* Chưa gửi yêu cầu (chưa có luồng) thì Ngày gửi để trống */}
              <TextCell muted>{flow ? row.ngayGui : ''}</TextCell>
              <td className="py-2">{row.action}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="text-center text-xs text-[#94A3B8] py-6">{emptyText}</p>
      )}
    </div>
  )
}
