// Port từ _source_b_reference/src/pages/vendor/VendorUpload.jsx (route /ocps/vendor/upload)
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { DocSlotZone } from '../../components/DocSlotZone'
import { OcpsBadge } from '../../components/OcpsBadge'
import { FullListingTable } from '../../components/FullListingTable'
import { getDocRuleForItem, formatImageRuleHint, getSpecTemplateUrl } from '../../utils/docRules'
import { DOC_STATUS_LABEL, FLOW_LABEL } from '../../data/ocpsMockData'
import type { ItemDocSlots, SlotKey } from '../../types'

const SLOT_DEFS: Array<{ key: SlotKey; label: string; icon: string }> = [
  { key: 'hinhanh', label: 'Hình ảnh', icon: '🖼️' },
  { key: 'spec', label: 'Spec', icon: '📄' },
  { key: 'khac', label: 'Tài liệu khác', icon: '📁' },
]

function getContentNotes(slots: Partial<ItemDocSlots> | undefined) {
  return SLOT_DEFS.map(({ key }) => slots?.[key]?.ghiChu?.trim()).filter((note): note is string => Boolean(note))
}

export function VendorUpload() {
  const { currentUser } = useOcpsAuth()
  const { items, scopeItemsForUser } = useOcpsData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ nganhhang: '', vendor: '', doc: '' })

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
  const listingRows = filtered.map(item => ({
    key: item.id,
    maErp: item.id,
    modelCode: item.modelCode,
    erpCreatedAt: item.erpCreatedAt,
    tenSP: item.ten,
    nganhhang: item.nganhhang,
    vendor: item.vendor,
    docStatus: item.docStatus,
    flowLabel: item.flow ? FLOW_LABEL[item.flow] : '',
    seoStatus: item.seoStatus,
    mktStatus: item.mktStatus,
    ngayGui: item.ngayGuiYeuCau || '',
    action: (
      <OcpsButton size="sm" onClick={() => navigate(`/ocps/vendor/upload/${item.id}`)}>
        Mở
      </OcpsButton>
    ),
  }))

  return (
    <div className="w-full">
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

        <FullListingTable rows={listingRows} emptyText="Không có sản phẩm nào" />
      </Card>

    </div>
  )
}

export function VendorUploadDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useOcpsAuth()
  const { items, docSlots, uploadFile, scopeItemsForUser } = useOcpsData()

  const item = scopeItemsForUser(items, currentUser).find(i => i.id === id)
  const slots = item ? docSlots[item.id] : undefined
  const contentNotes = getContentNotes(slots)

  if (!item) return <p className="text-sm text-[#94A3B8]">Không tìm thấy sản phẩm</p>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate('/ocps/vendor/upload')} className="text-xs text-[#94A3B8] hover:text-[#0F172A]">← Danh sách</button>
        <span className="text-[#E2E8F0]">/</span>
        <span className="text-xs text-[#0F172A]">{id}</span>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-[#0F172A] mb-1">{item.id} — {item.ten}</p>
            <p className="text-xs text-[#94A3B8]">{item.nganhhang} · {item.vendor}</p>
          </div>
          <OcpsBadge status={item.docStatus} />
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">Kéo file vào đúng khu vực bên dưới</p>
        {item.docStatus === 'du_toithieu' && (
          <p className="text-xs text-[#92400E] bg-[#FEF3C7] rounded-lg px-3 py-2 mb-4">
            ⚠ Đã đủ tài liệu tối thiểu để NH gửi xử lý — vẫn cần bổ sung thêm để đạt "Đủ full" (Content mới hoàn tất được AI).
          </p>
        )}
        <div className="mb-4">
          <p className="text-sm font-medium text-[#0F172A] mb-2">Ghi chú của content</p>
          <div className="min-h-10 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569]">
            {contentNotes.length > 0 ? (
              contentNotes.map((note, index) => <p key={`${index}-${note}`}>{note}</p>)
            ) : (
              <p className="text-[#94A3B8]">Chưa có ghi chú</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SLOT_DEFS.map(({ key, label, icon }) => (
            <DocSlotZone
              key={key}
              label={label}
              icon={icon}
              slot={slots?.[key]}
              onUpload={file => uploadFile(item.id, key, file)}
              ruleHint={key === 'hinhanh' ? formatImageRuleHint(getDocRuleForItem(item)) : undefined}
              templateUrl={key === 'spec' ? getSpecTemplateUrl(item) : undefined}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
