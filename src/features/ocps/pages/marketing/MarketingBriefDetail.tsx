// Port từ _source_b_reference/src/pages/marketing/MarketingBriefDetail.jsx (route /ocps/marketing/brief/:id)
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { OcpsBadge } from '../../components/OcpsBadge'
import { LOAI_NHU_CAU_LABEL, MKT_STATUS_LABEL, NHOM_KENH_LABEL, LOAI_BRIEF_LABEL } from '../../data/ocpsMockData'
import type { MktStatus } from '../../types'

const STATUS_OPTIONS: MktStatus[] = ['da_tiep_nhan', 'dang_san_xuat', 'hoan_tat']

export function MarketingBriefDetail() {
  const { id = '' } = useParams()
  const { briefs, updateBrief, updateItemStatus } = useOcpsData()
  const navigate = useNavigate()

  const brief = briefs.find(b => b.id === id)
  const [linkFolder, setLinkFolder] = useState(brief?.linkFolder || '')
  const [linkMedia, setLinkMedia] = useState(brief?.linkMedia || '')
  const [status, setStatus] = useState<MktStatus>(brief?.trangThai || 'da_tiep_nhan')

  if (!brief) return <p className="text-sm text-[#94A3B8]">Không tìm thấy brief</p>

  const isCancelled = brief.trangThai === 'da_huy'

  // Không khoá khi đã "Hoàn tất" — MKT vẫn cập nhật lại được nếu có feedback, mỗi lần lưu tự ghi
  // vào lịch sử cập nhật nội dung (updateBrief trong OcpsDataContext lo việc log).
  function handleSave() {
    updateBrief(id, { trangThai: status, linkFolder, linkMedia })
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
          <p className="text-xs text-[#94A3B8]">Ngày tạo: {brief.ngayTao} · Phụ trách: {brief.nguoiPhuTrach}</p>
        </div>
        <OcpsBadge status={brief.trangThai} />
      </div>

      {/* Nội dung brief từ NH */}
      <Card className="mb-4">
        <p className="text-xs font-medium text-[#475569] mb-3">Brief từ Ngành hàng</p>
        <div className="bg-[#F1F5F9] rounded-lg p-3 space-y-2 text-xs">
          {brief.nhomKenh && (
            <div className="flex gap-2">
              <span className="text-[#94A3B8] w-24 shrink-0">Nhóm kênh:</span>
              <span className="text-[#0F172A]">{NHOM_KENH_LABEL[brief.nhomKenh] || brief.nhomKenh}</span>
            </div>
          )}
          {brief.loaiBrief && (
            <div className="flex gap-2">
              <span className="text-[#94A3B8] w-24 shrink-0">Loại brief:</span>
              <span className="text-[#0F172A]">{LOAI_BRIEF_LABEL[brief.loaiBrief] || brief.loaiBrief}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-[#94A3B8] w-24 shrink-0">Loại nhu cầu:</span>
            <span className="text-[#0F172A]">{brief.loaiNhuCau.map(l => LOAI_NHU_CAU_LABEL[l]).join(', ')}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#94A3B8] w-24 shrink-0">Kênh:</span>
            <span className="text-[#0F172A]">{(Array.isArray(brief.kenh) ? brief.kenh : [brief.kenh]).join(', ')}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#94A3B8] w-24 shrink-0">Deadline:</span>
            <span className="text-[#0F172A]">{brief.deadline}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#94A3B8] w-24 shrink-0">Budget:</span>
            <span className="text-[#0F172A]">{brief.budget}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#94A3B8] w-24 shrink-0">Brief:</span>
            <span className="text-[#0F172A]">{brief.briefText}</span>
          </div>
        </div>
      </Card>

      {/* Lịch sử cập nhật nội dung */}
      {brief.lichSuChinhSua.length > 0 && (
        <Card className="mb-4">
          <p className="text-xs font-medium text-[#475569] mb-2">Lịch sử cập nhật nội dung</p>
          <div className="space-y-2">
            {brief.lichSuChinhSua.map(cs => (
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
          <select
            value={status}
            onChange={e => setStatus(e.target.value as MktStatus)}
            className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-3 bg-white text-[#0F172A] outline-none focus:border-[#3B82F6]"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{MKT_STATUS_LABEL[s]}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Link folder thành phẩm (Drive)"
            value={linkFolder}
            onChange={e => setLinkFolder(e.target.value)}
            className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]"
          />
          <textarea
            placeholder="Link media (TikTok / Facebook / YouTube)"
            value={linkMedia}
            onChange={e => setLinkMedia(e.target.value)}
            rows={3}
            className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-3 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none"
          />
          <div className="flex justify-end">
            <OcpsButton variant="primary" size="sm" onClick={handleSave}>Lưu cập nhật</OcpsButton>
          </div>
        </Card>
      )}
    </div>
  )
}
