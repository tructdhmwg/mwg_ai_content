// Port từ _source_b_reference/src/pages/vendor/VendorUpload.jsx (route /ocps/vendor/upload)
import { useState } from 'react'
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { DocSlotZone } from '../../components/DocSlotZone'
import { OcpsBadge } from '../../components/OcpsBadge'
import { getDocRuleForItem, formatImageRuleHint, getSpecTemplateUrl } from '../../utils/docRules'
import { DOC_STATUS_LABEL } from '../../data/ocpsMockData'
import type { SlotKey } from '../../types'

const SLOT_DEFS: Array<{ key: SlotKey; label: string; icon: string }> = [
  { key: 'hinhanh', label: 'Hình ảnh', icon: '🖼️' },
  { key: 'spec', label: 'Spec', icon: '📄' },
  { key: 'khac', label: 'Tài liệu khác', icon: '📁' },
]

export function VendorUpload() {
  const { currentUser } = useOcpsAuth()
  const { items, docSlots, uploadFile, scopeItemsForUser } = useOcpsData()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ nganhhang: '', vendor: '', doc: '' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const myItems = scopeItemsForUser(items, currentUser)
  const nganhhangs = [...new Set(myItems.map(i => i.nganhhang))]
  const vendors = [...new Set(myItems.map(i => i.vendor))]

  const filtered = myItems.filter(i =>
    (i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.ten.toLowerCase().includes(search.toLowerCase()) ||
      (i.modelCode || '').toLowerCase().includes(search.toLowerCase())) &&
    (!filters.nganhhang || i.nganhhang === filters.nganhhang) &&
    (!filters.vendor || i.vendor === filters.vendor) &&
    (!filters.doc || i.docStatus === filters.doc)
  )
  const selected = selectedId ? myItems.find(i => i.id === selectedId) : null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Cổng upload tài liệu</h1>
        <p className="text-sm text-[#94A3B8]">Kéo file vào đúng khu vực — hệ thống tự cập nhật trạng thái</p>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#94A3B8]">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc mã model code"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            value={filters.nganhhang}
            onChange={e => setFilters(f => ({ ...f, nganhhang: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Danh mục: tất cả</option>
            {nganhhangs.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select
            value={filters.vendor}
            onChange={e => setFilters(f => ({ ...f, vendor: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Hãng: tất cả</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select
            value={filters.doc}
            onChange={e => setFilters(f => ({ ...f, doc: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Trạng thái: tất cả</option>
            {Object.entries(DOC_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
                <th className="pb-2 pr-3 font-medium">Tên SP</th>
                <th className="pb-2 pr-3 font-medium">Danh mục</th>
                <th className="pb-2 pr-3 font-medium">Hãng</th>
                <th className="pb-2 pr-3 font-medium">Trạng thái</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                  <td className="py-2 pr-3 text-[#0F172A]">{item.ten}</td>
                  <td className="py-2 pr-3 text-[#475569]">{item.nganhhang}</td>
                  <td className="py-2 pr-3 text-[#475569]">{item.vendor}</td>
                  <td className="py-2 pr-3"><OcpsBadge status={item.docStatus} /></td>
                  <td className="py-2">
                    <OcpsButton size="sm" onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}>
                      {item.id === selectedId ? 'Đóng' : 'Mở'}
                    </OcpsButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-xs text-[#94A3B8] py-6">Không có sản phẩm nào</p>
          )}
        </div>
      </Card>

      {selected && (
        <Card>
          <p className="text-sm font-semibold text-[#0F172A] mb-1">{selected.id} — {selected.ten}</p>
          <p className="text-xs text-[#94A3B8] mb-4">Kéo file vào đúng khu vực bên dưới</p>
          {selected.docStatus === 'du_toithieu' && (
            <p className="text-xs text-[#92400E] bg-[#FEF3C7] rounded-lg px-3 py-2 mb-4">
              ⚠ Đã đủ tài liệu tối thiểu để NH gửi xử lý — vẫn cần bổ sung thêm để đạt "Đủ full" (Content mới hoàn tất được AI).
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SLOT_DEFS.map(({ key, label, icon }) => (
              <DocSlotZone
                key={key}
                label={label}
                icon={icon}
                slot={docSlots[selected.id]?.[key]}
                onUpload={file => uploadFile(selected.id, key, file)}
                ruleHint={key === 'hinhanh' ? formatImageRuleHint(getDocRuleForItem(selected)) : undefined}
                templateUrl={key === 'spec' ? getSpecTemplateUrl(selected) : undefined}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
