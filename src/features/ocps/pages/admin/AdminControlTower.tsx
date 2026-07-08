// Port từ _source_b_reference/src/pages/admin/AdminControlTower.jsx (route /ocps/admin/control-tower)
import { useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { StatCard } from '../../components/StatCard'

export function AdminControlTower() {
  const { items } = useOcpsData()
  const navigate = useNavigate()

  const total = items.length
  const daLenWeb = items.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
  const ketMkt = items.filter(i => ['dang_san_xuat', 'cho_nghiem_thu', 'can_chinh_sua'].includes(i.mktStatus)).length
  const thieuTaiLieu = items.filter(i => i.docStatus === 'thieu').length

  const overdue = items.filter(i => i.slaConLai < 0 && i.ngayGuiYeuCau)

  const categories = [...new Set(items.map(i => i.nganhhang))]
  const catStats = categories.map(cat => {
    const catItems = items.filter(i => i.nganhhang === cat)
    const done = catItems.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
    return { cat, total: catItems.length, done, pct: catItems.length ? Math.round((done / catItems.length) * 100) : 0 }
  })

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Control Tower</h1>
        <p className="text-sm text-[#94A3B8]">Tổng quan hệ thống theo thời gian thực</p>
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Tổng SP" value={total} />
        <StatCard label="Đã lên web" value={daLenWeb} color="text-[#166534]" />
        <StatCard label="Đang kẹt MKT" value={ketMkt} color="text-[#92400E]" />
        <StatCard label="Thiếu tài liệu" value={thieuTaiLieu} color="text-[#991B1B]" />
      </div>

      {/* Trễ SLA */}
      <Card className="mb-5 border-[#EF4444]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#991B1B]">⚠ Đang trễ SLA ({overdue.length})</p>
          <button onClick={() => navigate('/ocps/admin/god-view')} className="text-xs text-[#1D4ED8] hover:underline">Xem tất cả →</button>
        </div>
        {overdue.length === 0 && (
          <p className="text-xs text-[#94A3B8]">Không có sản phẩm nào trễ SLA 🎉</p>
        )}
        <div className="flex flex-col gap-2">
          {overdue.map(item => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span className="text-[#0F172A] font-medium">{item.id} — {item.ten}</span>
              <span className="text-[#991B1B] font-medium">Trễ {Math.abs(item.slaConLai)} ngày · {
                item.seoStatus === 'dang_xu_ly' || item.seoStatus === 'cho' ? 'Content' : 'MKT'
              }</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Category breakdown */}
      <Card>
        <p className="text-sm font-medium text-[#0F172A] mb-4">Tỷ lệ hoàn thiện theo Category</p>
        <div className="space-y-3">
          {catStats.map(({ cat, total, done, pct }) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#0F172A]">{cat}</span>
                <span className="text-xs text-[#94A3B8]">{done}/{total} · {pct}%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: pct >= 80 ? '#16A34A' : pct >= 50 ? '#3B82F6' : '#EF4444' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
