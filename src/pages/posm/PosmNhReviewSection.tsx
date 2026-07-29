import { useState } from 'react'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'

interface Props {
  visible: boolean
  canReview: boolean
  feedback?: string
  approved?: boolean
  onSave: (feedback: string, approved: boolean) => void
}

// Feedback + duyệt của NH cho CẢ chiến dịch (không phải theo từng dòng sản phẩm) — chỉ NH sửa được (canReview),
// và chỉ khi chiến dịch đang ở trạng thái "MKT trả kết quả". Có nút Lưu riêng: tick Duyệt + Lưu sẽ chuyển
// trạng thái sang "NH duyệt" (xem PosmCampaignDetailPage.handleSaveReview).
export function PosmNhReviewSection({ visible, canReview, feedback, approved, onSave }: Props) {
  const [draftFeedback, setDraftFeedback] = useState(feedback ?? '')
  const [draftApproved, setDraftApproved] = useState(!!approved)

  if (!visible) return null

  return (
    <div>
      <p className="text-xs font-medium text-[#475569] mb-2">Feedback &amp; Duyệt của NH</p>
      <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-3">
        {canReview ? (
          <>
            <textarea
              value={draftFeedback}
              onChange={(e) => setDraftFeedback(e.target.value)}
              rows={2}
              placeholder="Feedback của NH cho toàn bộ chiến dịch (nếu có)"
              className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none"
            />
            <label className="inline-flex items-center gap-2 text-xs text-[#0F172A] cursor-pointer">
              <input
                type="checkbox"
                checked={draftApproved}
                onChange={(e) => setDraftApproved(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#16A34A] cursor-pointer"
              />
              Duyệt toàn bộ chiến dịch
            </label>
            <OcpsButton size="sm" variant="primary" onClick={() => onSave(draftFeedback, draftApproved)}>Lưu</OcpsButton>
          </>
        ) : (
          <>
            <p className="text-xs text-[#0F172A] whitespace-pre-wrap">{feedback || '—'}</p>
            {approved ? (
              <span className="text-xs text-[#16A34A] font-medium">✓ Đã duyệt</span>
            ) : (
              <span className="text-xs text-[#CBD5E1]">Chưa duyệt</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
