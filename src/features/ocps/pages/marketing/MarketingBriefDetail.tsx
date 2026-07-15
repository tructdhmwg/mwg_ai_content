// Port từ _source_b_reference/src/pages/marketing/MarketingBriefDetail.jsx (route /ocps/marketing/brief/:id)
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { OcpsBadge, mktGroupBadge } from '../../components/OcpsBadge'
import type { MktStatus } from '../../types'

export function MarketingBriefDetail() {
  const { id = '' } = useParams()
  const { briefs, updateBrief, updateItemStatus } = useOcpsData()
  const navigate = useNavigate()

  const brief = briefs.find(b => b.id === id)
  const [productionLink, setProductionLink] = useState(brief?.linkFolder || brief?.linkMedia || '')
  const [status, setStatus] = useState<MktStatus>(brief?.trangThai || 'da_tiep_nhan')

  if (!brief) return <p className="text-sm text-[#94A3B8]">Không tìm thấy brief</p>

  const isCancelled = brief.trangThai === 'da_huy'

  // Không khoá khi đã "Hoàn tất" — MKT vẫn cập nhật lại được nếu có feedback, mỗi lần lưu tự ghi
  // vào lịch sử cập nhật nội dung (updateBrief trong OcpsDataContext lo việc log).
  function handleSave() {
    updateBrief(id, { trangThai: status, linkFolder: productionLink, linkMedia: '' })
    updateItemStatus(brief!.itemId, { mktStatus: status })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate('/ocps/marketing/dashboard')} className="text-xs text-[#94A3B8] hover:text-[#0F172A]">← Dashboard</button>
        <span className="text-[#E2E8F0]">/</span>
        <span className="text-xs text-[#0F172A]">{brief.tenSP}</span>
      </div>

      {isCancelled && (
        <div className="bg-[#FEE2E2] border border-[#EF4444] rounded-lg px-4 py-3 mb-4 text-sm text-[#991B1B]">
          ✗ Brief này đã bị NH huỷ — chỉ xem, không thể thao tác
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">{brief.tenSP}</h1>
          <p className="text-xs text-[#94A3B8]">Ngày tạo: {brief.ngayTao} · Người tạo: {brief.nguoiPhuTrach}</p>
        </div>
        <OcpsBadge {...mktGroupBadge(brief.trangThai)} />
      </div>

      {/* Nội dung brief từ NH */}
      <Card className="mb-4">
        <p className="text-xs font-medium text-[#475569] mb-3">Brief từ Ngành hàng</p>
        {/* Chỉ hiển thị nội dung brief — các field Nhóm kênh/Loại brief/Kênh/Deadline/Budget tạm ẩn */}
        <div className="bg-[#F1F5F9] rounded-lg p-3 space-y-2 text-xs">
          <div className="flex gap-2">
            <span className="text-[#0F172A]">{brief.briefText}</span>
          </div>
        </div>
      </Card>

      {/* Tạm ẩn Lịch sử cập nhật nội dung — đổi `false &&` thành `brief.lichSuChinhSua.length > 0 &&` khi hiện lại */}
      {false && (
        <Card className="mb-4">
          <p className="text-xs font-medium text-[#475569] mb-2">Lịch sử cập nhật nội dung</p>
          <div className="space-y-2">
            {brief?.lichSuChinhSua?.map(cs => (
              <div key={cs.vong} className="flex gap-3 text-xs">
                <span className="text-[#94A3B8] shrink-0">Cập nhật lần {cs.vong} ({cs.ngay}):</span>
                <span className="text-[#0F172A]">{cs.ghiChu}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cập nhật trạng thái + đầu ra */}
      {!isCancelled && (
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-3">Cập nhật sản xuất</p>
          {/* Trạng thái gom về 3 nhóm: Chờ xử lý (mới tiếp nhận) / Đang xử lý / Hoàn tất */}
          <select
            value={
              status === 'hoan_tat' ? 'hoan_tat'
              : status === 'chua_yeu_cau' || status === 'da_tiep_nhan' ? 'da_tiep_nhan'
              : 'dang_san_xuat'
            }
            onChange={e => setStatus(e.target.value as MktStatus)}
            className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-3 bg-white text-[#0F172A] outline-none focus:border-[#3B82F6]"
          >
            <option value="da_tiep_nhan">Chờ xử lý</option>
            <option value="dang_san_xuat">Đang xử lý</option>
            <option value="hoan_tat">Hoàn tất</option>
          </select>
          <input
            type="text"
            placeholder="Nhập link thành phẩm"
            value={productionLink}
            onChange={e => setProductionLink(e.target.value)}
            className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-3 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]"
          />
          <div className="flex justify-end">
            <OcpsButton variant="primary" size="sm" onClick={handleSave}>Lưu cập nhật</OcpsButton>
          </div>
        </Card>
      )}
    </div>
  )
}
