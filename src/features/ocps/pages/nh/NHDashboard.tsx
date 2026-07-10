// Port từ _source_b_reference/src/pages/nh/NHDashboard.jsx (route /ocps/nh/dashboard)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
// import { StatCard } from '../../components/StatCard' // Tạm ẩn thẻ thống kê
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { FullListingTable } from '../../components/FullListingTable'
import { DOC_STATUS_LABEL, MKT_STATUS_LABEL, FLOW_LABEL } from '../../data/ocpsMockData'

export function NHDashboard() {
  const { currentUser } = useOcpsAuth()
  const { items, scopeItemsForUser } = useOcpsData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ nganhhang: '', hang: '', doc: '', mkt: '', tuNgay: '', denNgay: '' })
  const [search, setSearch] = useState('')

  const myItems = scopeItemsForUser(items, currentUser)

  const filtered = myItems.filter(i => {
    if (search &&
      !i.id.toLowerCase().includes(search.toLowerCase()) &&
      !i.ten.toLowerCase().includes(search.toLowerCase()) &&
      !(i.modelCode || '').toLowerCase().includes(search.toLowerCase())
    ) return false
    if (filters.doc && i.docStatus !== filters.doc) return false
    if (filters.mkt && i.mktStatus !== filters.mkt) return false
    if (filters.hang && i.vendor !== filters.hang) return false
    if (filters.tuNgay && (!i.erpCreatedAt || i.erpCreatedAt < filters.tuNgay)) return false
    if (filters.denNgay && (!i.erpCreatedAt || i.erpCreatedAt > filters.denNgay)) return false
    return true
  })

  // Tạm ẩn thẻ thống kê — bỏ comment khi hiện lại
  // const thieu = myItems.filter(i => i.docStatus === 'thieu').length
  // const ketMkt = myItems.filter(i => i.mktStatus === 'dang_san_xuat' || i.mktStatus === 'cho_nghiem_thu').length
  // const hoanthat = myItems.filter(i => i.seoStatus === 'hoan_tat' || i.seoStatus === 'da_len_web').length
  const vendors = [...new Set(myItems.map(i => i.vendor))]
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
    action: <OcpsButton size="sm" onClick={() => navigate(`/ocps/nh/product/${item.id}`)}>Mở</OcpsButton>,
  }))

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard sản phẩm</h1>
        {/* Admin đi tắt vào /ocps/nh/* không có nganhhang → xem tất cả */}
        <p className="text-sm text-[#94A3B8]">Ngành hàng: {currentUser?.nganhhang ?? 'Tất cả (admin)'}</p>
      </div>

      {/* Tạm ẩn hàng thẻ thống kê */}
      {/* <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Thiếu tài liệu" value={thieu} color="text-[#92400E]" />
        <StatCard label="Đang kẹt MKT" value={ketMkt} />
        <StatCard label="Đã hoàn tất" value={hoanthat} color="text-[#166534]" />
      </div> */}

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#94A3B8]">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo mã ERP, tên sản phẩm hoặc mã model code"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none text-[#0F172A] placeholder:text-[#94A3B8]"
          />
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            value={filters.hang}
            onChange={e => setFilters(f => ({ ...f, hang: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Tất cả hãng</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select
            value={filters.doc}
            onChange={e => setFilters(f => ({ ...f, doc: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Tài liệu: tất cả</option>
            {Object.entries(DOC_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={filters.mkt}
            onChange={e => setFilters(f => ({ ...f, mkt: e.target.value }))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">MKT: tất cả</option>
            {Object.entries(MKT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#94A3B8]">Ngày tạo ERP</span>
            <input
              type="date"
              value={filters.tuNgay}
              onChange={e => setFilters(f => ({ ...f, tuNgay: e.target.value }))}
              className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 text-[#0F172A] outline-none focus:border-[#3B82F6]"
            />
            <span className="text-xs text-[#94A3B8]">đến</span>
            <input
              type="date"
              value={filters.denNgay}
              onChange={e => setFilters(f => ({ ...f, denNgay: e.target.value }))}
              className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 text-[#0F172A] outline-none focus:border-[#3B82F6]"
            />
          </div>
        </div>

        <FullListingTable rows={listingRows} emptyText="Không có sản phẩm nào" />
      </Card>
    </div>
  )
}
