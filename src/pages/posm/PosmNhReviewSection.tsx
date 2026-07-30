import { useState } from 'react'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { formatDateTime } from '../../lib/utils'
import type { PosmNhApproval } from './posmMockData'

interface Props {
  visible: boolean
  // Chỉ tab Dashboard NH được duyệt, và chỉ khi phiếu đang ở "MKT trả kết quả"
  canReview: boolean
  // Các ngành hàng tham gia chiến dịch — mỗi NH tự duyệt đúng phần ngành hàng của mình
  nganhHangs: string[]
  feedback?: string
  approvals?: PosmNhApproval[]
  onApprove: (nganhHang: string, feedback: string) => void
  onSaveFeedback: (feedback: string) => void
}

// Feedback + Duyệt của NH. Mỗi NH chỉ duyệt PHẦN NGÀNH HÀNG CỦA MÌNH (1 dòng/NH trong bảng bên dưới) và
// chỉ có DUY NHẤT 1 nút "Duyệt" — module POSM chưa có đăng nhập theo NH nên nút Duyệt tự áp dụng cho ngành hàng
// CHƯA duyệt đầu tiên (activeNh), không cho chọn tay. Khi ngành hàng cuối cùng duyệt xong, phiếu tự chuyển
// trạng thái "NH duyệt" (xem PosmCampaignDetailPage.handleApproveNh).
export function PosmNhReviewSection({ visible, canReview, nganhHangs, feedback, approvals = [], onApprove, onSaveFeedback }: Props) {
  const [draftFeedback, setDraftFeedback] = useState(feedback ?? '')

  if (!visible) return null

  const approvedSet = new Set(approvals.map((a) => a.nganhHang))
  const pending = nganhHangs.filter((n) => !approvedSet.has(n))
  const activeNh = pending[0] ?? ''

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-medium text-[#475569]">Feedback &amp; Duyệt của NH</p>
        {nganhHangs.length > 0 && (
          <span className="text-[11px] text-[#94A3B8]">Đã duyệt {approvedSet.size}/{nganhHangs.length} ngành hàng</span>
        )}
      </div>
      <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-3">
        {canReview ? (
          <>
            <textarea
              value={draftFeedback}
              onChange={(e) => setDraftFeedback(e.target.value)}
              rows={2}
              placeholder="Feedback của NH cho thành phẩm MKT (nếu có)"
              className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none"
            />
            {pending.length > 0 ? (
              <div className="flex flex-wrap items-end gap-2">
                <OcpsButton variant="success" onClick={() => onApprove(activeNh, draftFeedback)} disabled={!activeNh}>Duyệt</OcpsButton>
                <OcpsButton variant="ghost" onClick={() => onSaveFeedback(draftFeedback)}>Lưu feedback</OcpsButton>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#16A34A] font-medium">✓ Tất cả ngành hàng đã duyệt</span>
                <OcpsButton variant="ghost" onClick={() => onSaveFeedback(draftFeedback)}>Lưu feedback</OcpsButton>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-[#0F172A] whitespace-pre-wrap">{feedback || '—'}</p>
            {pending.length === 0 && nganhHangs.length > 0 ? (
              <span className="text-xs text-[#16A34A] font-medium">✓ Tất cả ngành hàng đã duyệt</span>
            ) : approvedSet.size > 0 ? (
              <span className="text-xs text-[#D97706] font-medium">Còn {pending.length} ngành hàng chưa duyệt</span>
            ) : (
              <span className="text-xs text-[#CBD5E1]">Chưa có ngành hàng nào duyệt</span>
            )}
          </>
        )}

        {/* Danh sách user + thời gian duyệt của các NH — hiện ở cả 3 tab ngay khi có NH đầu tiên bấm Duyệt */}
        {approvals.length > 0 && (
          <div className="pt-1">
            <p className="text-[11px] font-medium text-[#475569] mb-1.5">Chi tiết duyệt theo ngành hàng</p>
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] text-left">
                    <th className="px-2.5 py-2 font-medium">Ngành hàng</th>
                    <th className="px-2.5 py-2 font-medium">Người duyệt</th>
                    <th className="px-2.5 py-2 font-medium">Thời gian duyệt</th>
                    <th className="px-2.5 py-2 font-medium">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((a) => (
                    <tr key={a.nganhHang} className="border-t border-[#F1F5F9]">
                      <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{a.nganhHang}</td>
                      <td className="px-2.5 py-1.5 text-[#475569] whitespace-nowrap">{a.approvedBy}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] whitespace-nowrap">{formatDateTime(a.approvedAt)}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] italic">{a.feedback || '—'}</td>
                    </tr>
                  ))}
                  {/* Ngành hàng chưa duyệt vẫn hiện 1 dòng để thấy rõ còn ai — tránh tưởng đã duyệt hết */}
                  {pending.map((n) => (
                    <tr key={`pending-${n}`} className="border-t border-[#F1F5F9]">
                      <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{n}</td>
                      <td className="px-2.5 py-1.5 text-[#CBD5E1]" colSpan={3}>Chưa duyệt</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
