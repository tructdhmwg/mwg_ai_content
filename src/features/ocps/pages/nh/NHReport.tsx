// Port từ _source_b_reference/src/pages/nh/NHReport.jsx (route /ocps/nh/report)
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { StatCard } from '../../components/StatCard'
import { KHAI_BAO_STATUS_LABEL } from '../../data/ocpsMockData'
import type { KhaiBaoStatus } from '../../types'

export function NHReport() {
  const { currentUser } = useOcpsAuth()
  const { items, docSlots, flowRequests, scopeItemsForUser } = useOcpsData()

  const myItems = scopeItemsForUser(items, currentUser)
  const myItemIds = new Set(myItems.map(i => i.id))

  const done = myItems.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
  const total = myItems.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const overdue = myItems.filter(i => i.slaConLai < 0 && i.ngayGuiYeuCau)

  // Tình trạng bổ sung tài liệu — SP có slot đang chờ kiểm tra hoặc còn thiếu
  const canBoSung = myItems.filter(i => {
    const slots = docSlots[i.id] || {}
    return Object.values(slots).some(s => s.trangThaiBoSung === 'dang_kiem_tra' || s.trangThaiBoSung === 'con_thieu')
  })

  // Trạng thái khai báo dự kiến — tổng hợp từ FlowRequest của các SP thuộc ngành mình
  const khaiBaoCounts: Record<KhaiBaoStatus, number> = { chua_xu_ly: 0, cho_onweb: 0, da_onweb: 0 }
  flowRequests.filter(fr => myItemIds.has(fr.itemId)).forEach(fr => {
    if (fr.trangThaiKhaiBaoDuKien in khaiBaoCounts) khaiBaoCounts[fr.trangThaiKhaiBaoDuKien] += 1
  })

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Báo cáo của tôi</h1>
        <p className="text-sm text-[#94A3B8]">Tổng hợp tiến độ ngành hàng {currentUser?.nganhhang ?? 'Tất cả (admin)'}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Tổng sản phẩm" value={total} />
        <StatCard label="Đã hoàn tất" value={done} color="text-[#166534]" />
        <StatCard label="Tỷ lệ hoàn tất" value={`${pct}%`} color={pct >= 80 ? 'text-[#166534]' : 'text-[#92400E]'} />
      </div>

      {/* Progress bar */}
      <Card className="mb-5">
        <p className="text-xs font-medium text-[#475569] mb-2">Tiến độ tổng thể — {currentUser?.nganhhang ?? 'Tất cả'}</p>
        <div className="w-full bg-[#F1F5F9] rounded-full h-3 mb-1">
          <div
            className="bg-[#16A34A] h-3 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-[#94A3B8]">{done} / {total} sản phẩm hoàn tất</p>
      </Card>

      {/* Trạng thái khai báo dự kiến */}
      <Card className="mb-5">
        <p className="text-sm font-medium text-[#0F172A] mb-3">Trạng thái khai báo dự kiến</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(KHAI_BAO_STATUS_LABEL) as Array<[KhaiBaoStatus, string]>).map(([k, label]) => (
            <div key={k} className="border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-center">
              <p className="text-lg font-semibold text-[#0F172A]">{khaiBaoCounts[k]}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tình trạng bổ sung tài liệu */}
      <Card className="mb-5">
        <p className="text-sm font-medium text-[#0F172A] mb-3">
          Tình trạng bổ sung tài liệu
          {canBoSung.length > 0 && (
            <span className="ml-2 text-xs bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full">{canBoSung.length}</span>
          )}
        </p>
        {canBoSung.length === 0 && (
          <p className="text-xs text-[#94A3B8] py-3">Không có SP nào cần bổ sung/kiểm tra tài liệu 🎉</p>
        )}
        <div className="flex flex-col gap-2">
          {canBoSung.map(item => (
            <div key={item.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-lg px-3 py-2.5">
              <p className="text-xs font-medium text-[#0F172A]">{item.id} — {item.ten}</p>
              <span className="text-xs text-[#92400E]">Cần rà soát tài liệu</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Trễ tiến độ */}
      <Card>
        <p className="text-sm font-medium text-[#0F172A] mb-3">
          Đang trễ tiến độ
          {overdue.length > 0 && (
            <span className="ml-2 text-xs bg-[#FEE2E2] text-[#991B1B] px-2 py-0.5 rounded-full">{overdue.length}</span>
          )}
        </p>
        {overdue.length === 0 && (
          <p className="text-xs text-[#94A3B8] py-3">Không có sản phẩm nào trễ tiến độ 🎉</p>
        )}
        <div className="flex flex-col gap-2">
          {overdue.map(item => (
            <div key={item.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-lg px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-[#0F172A]">{item.id} — {item.ten}</p>
                <p className="text-xs text-[#94A3B8]">{item.vendor}</p>
              </div>
              <span className={`text-xs font-medium ${Math.abs(item.slaConLai) > 3 ? 'text-[#991B1B]' : 'text-[#92400E]'}`}>
                Trễ {Math.abs(item.slaConLai)} ngày
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
