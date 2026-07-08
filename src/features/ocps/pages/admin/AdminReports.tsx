// Port từ _source_b_reference/src/pages/admin/AdminReports.jsx (route /ocps/admin/reports)
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { StatCard } from '../../components/StatCard'

// MOCK_ASSIGNEES cục bộ của B — số liệu năng suất demo, không lấy từ DataContext
const MOCK_ASSIGNEES = [
  { name: 'Bình', role: 'Content/IT', avgDays: 1.8, handled: 12 },
  { name: 'An', role: 'Marketing', avgDays: 3.2, handled: 8 },
]

export function AdminReports() {
  const { items, briefs } = useOcpsData()

  const total = items.length
  const done = items.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
  const mktDone = briefs.filter(b => b.trangThai === 'hoan_tat').length

  const categories = [...new Set(items.map(i => i.nganhhang))]
  const catStats = categories.map(cat => {
    const catItems = items.filter(i => i.nganhhang === cat)
    const catDone = catItems.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
    return { cat, total: catItems.length, done: catDone, pct: catItems.length ? Math.round((catDone / catItems.length) * 100) : 0 }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#0F172A]">Báo cáo & Xuất dữ liệu</h1>
          <p className="text-sm text-[#94A3B8]">Thống kê tiến độ và năng suất xử lý</p>
        </div>
        <OcpsButton size="md" onClick={() => alert('Export Excel — demo')}>
          ↓ Export Excel
        </OcpsButton>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Tổng SP" value={total} />
        <StatCard label="Content hoàn tất" value={done} color="text-[#166534]" />
        <StatCard label="MKT hoàn tất" value={mktDone} color="text-[#166534]" />
      </div>

      {/* Thời gian xử lý TB */}
      <Card className="mb-5">
        <p className="text-sm font-medium text-[#0F172A] mb-3">Thời gian xử lý trung bình theo người phụ trách</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
              <th className="pb-2 pr-3 font-medium">Người phụ trách</th>
              <th className="pb-2 pr-3 font-medium">Vai trò</th>
              <th className="pb-2 pr-3 font-medium">SP đã xử lý</th>
              <th className="pb-2 font-medium">TB xử lý</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ASSIGNEES.map(a => (
              <tr key={a.name} className="border-b border-[#F8FAFC]">
                <td className="py-2 pr-3 font-medium text-[#0F172A]">{a.name}</td>
                <td className="py-2 pr-3 text-[#475569]">{a.role}</td>
                <td className="py-2 pr-3 text-[#475569]">{a.handled} SP</td>
                <td className={`py-2 font-medium ${a.avgDays <= 2 ? 'text-[#166534]' : 'text-[#92400E]'}`}>
                  {a.avgDays} ngày
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* By category */}
      <Card>
        <p className="text-sm font-medium text-[#0F172A] mb-4">Tỷ lệ hoàn thiện theo Category</p>
        <div className="space-y-4">
          {catStats.map(({ cat, total, done, pct }) => (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#0F172A]">{cat}</span>
                <span className="text-xs text-[#94A3B8]">{done}/{total} SP · {pct}%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all"
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
