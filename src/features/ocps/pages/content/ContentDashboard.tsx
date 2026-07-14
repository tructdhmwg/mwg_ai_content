// Port từ _source_b_reference/src/pages/content/ContentDashboard.jsx (route /ocps/content/dashboard)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { StatCard } from '../../components/StatCard'
import { FullListingTable } from '../../components/FullListingTable'
import { FLOW_LABEL } from '../../data/ocpsMockData'

export function ContentDashboard() {
  const { items, getContentQueue } = useOcpsData()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  // Đã ưu tiên: trễ SLA nhiều nhất trước, sau đó gửi yêu cầu sớm nhất trước
  const eligible = getContentQueue(items)

  // Trạng thái gom về 2 nhóm: Hoàn tất (da_len_web/hoan_tat) và Chờ xử lý (còn lại)
  const isDone = (s?: string) => s === 'da_len_web' || s === 'hoan_tat'

  const filtered = eligible.filter(i =>
    (!filterStatus || (filterStatus === 'hoan_tat' ? isDone(i.seoStatus) : !isDone(i.seoStatus))) &&
    (!search ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.ten.toLowerCase().includes(search.toLowerCase()) ||
      (i.modelCode || '').toLowerCase().includes(search.toLowerCase()))
  )

  const done = eligible.filter(i => isDone(i.seoStatus)).length
  const cho = eligible.length - done
  const aiPending = eligible.filter(i => i.docStatus === 'du_full' && i.seoStatus === 'da_len_web').length
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
    action: <OcpsButton size="sm" onClick={() => navigate(`/ocps/content/process/${item.id}`)}>Mở</OcpsButton>,
  }))

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard Content</h1>
        <p className="text-sm text-[#94A3B8]">Danh sách sản phẩm đủ điều kiện xử lý</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Chờ xử lý" value={cho} color="text-[#92400E]" />
        <StatCard label="Hoàn tất" value={done} color="text-[#166534]" />
      </div>

      {aiPending > 0 && (
        <div className="bg-[#EFF6FF] border border-[#3B82F6] rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2 text-xs text-[#1D4ED8]">
          🤖 Crawl AI: <strong>{aiPending} sản phẩm</strong> đủ full tài liệu — sẵn sàng Hoàn tất Content AI
        </div>
      )}

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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="cho_xu_ly">Chờ xử lý</option>
            <option value="hoan_tat">Hoàn tất</option>
          </select>
        </div>

        <FullListingTable rows={listingRows} emptyText="Không có sản phẩm nào" />
      </Card>
    </div>
  )
}
