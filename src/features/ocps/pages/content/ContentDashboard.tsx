// Port từ _source_b_reference/src/pages/content/ContentDashboard.jsx (route /ocps/content/dashboard)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsBadge } from '../../components/OcpsBadge'
import { OcpsButton } from '../../components/OcpsButton'
import { StatCard } from '../../components/StatCard'

export function ContentDashboard() {
  const { items, getContentQueue } = useOcpsData()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  // Đã ưu tiên: trễ SLA nhiều nhất trước, sau đó gửi yêu cầu sớm nhất trước
  const eligible = getContentQueue(items)

  const filtered = eligible.filter(i =>
    (!filterStatus || i.seoStatus === filterStatus) &&
    (!search ||
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.ten.toLowerCase().includes(search.toLowerCase()) ||
      (i.modelCode || '').toLowerCase().includes(search.toLowerCase()))
  )

  const cho = eligible.filter(i => i.seoStatus === 'cho').length
  const dang = eligible.filter(i => i.seoStatus === 'dang_xu_ly').length
  const done = eligible.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
  const aiPending = eligible.filter(i => i.docStatus === 'du_full' && i.seoStatus === 'da_len_web').length

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard Content</h1>
        <p className="text-sm text-[#94A3B8]">Danh sách sản phẩm đủ điều kiện xử lý</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Chờ xử lý" value={cho} color="text-[#92400E]" />
        <StatCard label="Đang xử lý" value={dang} color="text-[#1D4ED8]" />
        <StatCard label="Đã lên web" value={done} color="text-[#166534]" />
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
            <option value="cho">Chờ xử lý</option>
            <option value="dang_xu_ly">Đang xử lý</option>
            <option value="da_len_web">Đã lên web</option>
            <option value="hoan_tat">Hoàn tất AI</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
                <th className="pb-2 pr-3 font-medium">Mã ERP</th>
                <th className="pb-2 pr-3 font-medium">Tên SP</th>
                <th className="pb-2 pr-3 font-medium">Ngành hàng</th>
                <th className="pb-2 pr-3 font-medium">Tài liệu</th>
                <th className="pb-2 pr-3 font-medium">Trạng thái</th>
                <th className="pb-2 pr-3 font-medium">Ngày gửi</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC]">
                  <td className="py-2 pr-3 font-medium text-[#0F172A]">{item.id}</td>
                  <td className="py-2 pr-3 text-[#0F172A]">{item.ten}</td>
                  <td className="py-2 pr-3 text-[#475569]">{item.nganhhang}</td>
                  <td className="py-2 pr-3"><OcpsBadge status={item.docStatus} /></td>
                  <td className="py-2 pr-3"><OcpsBadge status={item.seoStatus} /></td>
                  <td className="py-2 pr-3 text-[#94A3B8]">{item.ngayGuiYeuCau || '—'}</td>
                  <td className="py-2">
                    <OcpsButton size="sm" onClick={() => navigate(`/ocps/content/process/${item.id}`)}>Mở</OcpsButton>
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
    </div>
  )
}
