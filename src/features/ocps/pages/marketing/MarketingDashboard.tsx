// Port từ _source_b_reference/src/pages/marketing/MarketingDashboard.jsx (route /ocps/marketing/dashboard)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { StatCard } from '../../components/StatCard'
import { FullListingTable } from '../../components/FullListingTable'
import { FLOW_LABEL } from '../../data/ocpsMockData'
import type { MktBrief, OcpsItem } from '../../types'

type BriefWithItem = MktBrief & { _item?: OcpsItem }

export function MarketingDashboard() {
  const { briefs, items } = useOcpsData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ trangThai: '', nganhhang: '', vendor: '' })
  const [search, setSearch] = useState('')

  const active: BriefWithItem[] = briefs
    .filter(b => b.trangThai !== 'da_huy')
    .map(b => ({ ...b, _item: items.find(i => i.id === b.itemId) }))

  // Gom trạng thái về 2 nhóm: hoàn tất và đang xử lý (mọi trạng thái còn lại)
  const hoanthat = active.filter(b => b.trangThai === 'hoan_tat').length
  const dangXuLy = active.length - hoanthat

  const nganhhangs = [...new Set(active.map(b => b._item?.nganhhang).filter(Boolean))] as string[]
  const vendors = [...new Set(active.map(b => b._item?.vendor).filter(Boolean))] as string[]

  const filtered = active.filter(b => {
    if (search) {
      const q = search.toLowerCase()
      const match = b.tenSP.toLowerCase().includes(q) ||
        b._item?.id.toLowerCase().includes(q) ||
        (b._item?.modelCode || '').toLowerCase().includes(q)
      if (!match) return false
    }
    if (filters.trangThai === 'hoan_tat' && b.trangThai !== 'hoan_tat') return false
    if (filters.trangThai === 'dang_xu_ly' && b.trangThai === 'hoan_tat') return false
    if (filters.nganhhang && b._item?.nganhhang !== filters.nganhhang) return false
    if (filters.vendor && b._item?.vendor !== filters.vendor) return false
    return true
  })
  const listingRows = filtered.map(brief => ({
    key: brief.id,
    maErp: brief._item?.id || brief.itemId,
    modelCode: brief._item?.modelCode || '',
    erpCreatedAt: brief._item?.erpCreatedAt || '',
    tenSP: brief.tenSP,
    nganhhang: brief._item?.nganhhang || '',
    vendor: brief._item?.vendor || '',
    docStatus: brief._item?.docStatus,
    flowLabel: brief._item?.flow ? FLOW_LABEL[brief._item.flow] : '',
    seoStatus: brief._item?.seoStatus,
    mktStatus: brief.trangThai,
    ngayGui: brief._item?.ngayGuiYeuCau || brief.ngayTao || '',
    action: <OcpsButton size="sm" onClick={() => navigate(`/ocps/marketing/brief/${brief.id}`)}>Mở</OcpsButton>,
  }))

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard Marketing</h1>
        <p className="text-sm text-[#94A3B8]">Danh sách brief — vận hành như ticket system</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Đang xử lý" value={dangXuLy} color="text-[#1D4ED8]" />
        <StatCard label="Hoàn tất" value={hoanthat} color="text-[#166534]" />
      </div>

      <Card>
        <p className="text-sm font-medium text-[#0F172A] mb-3">Danh sách brief ({filtered.length})</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#94A3B8]">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, mã ERP hoặc mã model code"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            value={filters.trangThai}
            onChange={e => setFilters(f => ({ ...f, trangThai: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Trạng thái: tất cả</option>
            <option value="dang_xu_ly">Đang xử lý</option>
            <option value="hoan_tat">Hoàn tất</option>
          </select>
          <select
            value={filters.nganhhang}
            onChange={e => setFilters(f => ({ ...f, nganhhang: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Ngành hàng: tất cả</option>
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
        </div>
        <FullListingTable rows={listingRows} emptyText="Không có brief nào" />
      </Card>
    </div>
  )
}
