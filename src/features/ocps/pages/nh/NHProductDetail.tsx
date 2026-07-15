// Port từ _source_b_reference/src/pages/nh/NHProductDetail.jsx (route /ocps/nh/product/:id)
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { OcpsBadge } from '../../components/OcpsBadge'
import { DocSlotZone } from '../../components/DocSlotZone'
import { getDocRuleForItem, formatImageRuleHint, getSpecTemplateUrl } from '../../utils/docRules'
import { useToast } from '../../../../components/ui/Toast'
import type { Flow, ItemDocSlots, SlotKey } from '../../types'

const SLOT_DEFS: Array<{ key: SlotKey; label: string; icon: string }> = [
  { key: 'hinhanh', label: 'Hình ảnh', icon: '🖼️' },
  { key: 'spec', label: 'Spec', icon: '📄' },
  { key: 'khac', label: 'Tài liệu khác', icon: '📁' },
]

function getContentNotes(slots: Partial<ItemDocSlots> | undefined) {
  return SLOT_DEFS.map(({ key }) => slots?.[key]?.ghiChu?.trim()).filter((note): note is string => Boolean(note))
}

export function NHProductDetail() {
  const { id = '' } = useParams()
  const { currentUser } = useOcpsAuth()
  // cancelBrief tạm bỏ khỏi destructure — dùng lại khi hiện nút Huỷ brief MKT
  const { items, docSlots, briefs, uploadFile, sendFlowRequest, updateItemStatus, confirmSlotStatus, flowRequests } = useOcpsData()
  const navigate = useNavigate()
  const { toast } = useToast()

  const found = items.find(i => i.id === id)
  // Admin vào được mọi /ocps/* (quyết định c) nên không chặn theo nganhhang với admin
  const item = found && (currentUser?.role === 'admin' || found.nganhhang === currentUser?.nganhhang) ? found : null
  const slots = docSlots[id] || {}
  const contentNotes = getContentNotes(slots)
  const flowRequest = flowRequests.find(fr => fr.itemId === id)

  // Content/IT luôn là luồng mặc định — không có lựa chọn "Chỉ Marketing" để tránh SP thiếu bước
  // lên web/Content. Marketing chỉ là tuỳ chọn thêm (checkbox); 'chi_mkt' chỉ còn tồn tại ở dữ liệu
  // lịch sử (VD SP00302), không thể tạo mới từ đây.
  const [sendMarketing, setSendMarketing] = useState(item?.flow === 'ca_hai' || item?.flow === 'chi_mkt')
  const [brief, setBrief] = useState({
    loaiNhuCau: [] as string[], kenh: '', deadline: '', budget: '', briefText: '', fileThamKhao: [] as string[],
    nhomKenh: 'DMX', loaiBrief: 'hang_co_budget',
  })
  // Lý do huỷ nhập tự do (trước là dropdown chọn sẵn)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [sent, setSent] = useState(!!item?.ngayGuiYeuCau)
  // Tạm ẩn nút Huỷ brief MKT — bỏ comment khi hiện lại
  // const [showCancelBrief, setShowCancelBrief] = useState(false)
  // const [cancelBriefReason, setCancelBriefReason] = useState('')

  if (!item) return <p className="text-sm text-[#94A3B8]">Không tìm thấy sản phẩm</p>

  const activeBrief = briefs.find(b => b.itemId === id && b.trangThai !== 'da_huy' && b.trangThai !== 'hoan_tat')
  const resultBrief = briefs.find(b => b.itemId === id)
  const hasContentFlow = item.flow === 'ca_hai' || item.flow === 'chi_content'

  const canSend = item.docStatus !== 'thieu'

  function handleSend() {
    const flow: Flow = sendMarketing ? 'ca_hai' : 'chi_content'
    const briefData = sendMarketing ? { ...brief } : null
    sendFlowRequest(id, item!.ten, flow, briefData)
    setSent(true)
  }

  // Lưu sau khi đã gửi — đẩy lại thông tin qua Hàng đợi Content và Brief Marketing.
  // Nếu đã có brief MKT đang chạy thì không tạo brief trùng, chỉ gửi lại flow request.
  function handleSaveUpdate() {
    sendFlowRequest(id, item!.ten, 'ca_hai', activeBrief ? null : { ...brief })
    setSendMarketing(true)
    setSent(true)
    toast('Đã đẩy thông tin qua Hàng đợi Content và Brief Marketing', 'success')
  }

  function handleCancel() {
    if (!cancelReason.trim()) return
    updateItemStatus(id, { flow: null, seoStatus: 'chua', mktStatus: 'chua_yeu_cau', ngayGuiYeuCau: null })
    setSendMarketing(false)
    setSent(false)
    setShowCancel(false)
    setCancelReason('')
  }

  // Huỷ riêng brief MKT — khác "Huỷ/đổi luồng" (huỷ cả yêu cầu): giữ nguyên nhánh Content đang chạy,
  // chỉ dừng Marketing (đúng fail case "NH huỷ yêu cầu Marketing" — MKT nhận notify, docStatus/Content không đổi)
  // Tạm ẩn nút Huỷ brief MKT — bỏ comment khi hiện lại
  // function handleCancelBrief() {
  //   if (!cancelBriefReason.trim() || !activeBrief) return
  //   cancelBrief(activeBrief.id, cancelBriefReason, currentUser?.name)
  //   setShowCancelBrief(false)
  //   setCancelBriefReason('')
  // }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate('/ocps/nh/dashboard')} className="text-xs text-[#94A3B8] hover:text-[#0F172A]">← Dashboard</button>
        <span className="text-[#E2E8F0]">/</span>
        <span className="text-xs text-[#0F172A]">{id}</span>
      </div>
      <p className="text-xs text-[#94A3B8] mb-4">Ngày tạo: {flowRequest?.createdAt || item.erpCreatedAt} · Người tạo: {flowRequest?.createdBy || '—'}</p>

      {/* A — Thông tin ERP */}
      <Card className="mb-4">
        <p className="text-xs text-[#94A3B8] mb-3">Thông tin từ ERP / Master Data — chỉ đọc</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F1F5F9] rounded-lg p-3">
          {[
            { label: 'Mã ERP', value: item.id },
            { label: 'Mã modelID', value: item.modelCode || '—' },
            { label: 'Ngày tạo ERP', value: item.erpCreatedAt || '—' },
            { label: 'Tên SP', value: item.ten },
            { label: 'Ngành hàng', value: item.nganhhang },
            { label: 'Hãng', value: item.vendor },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[#94A3B8]">{label}</p>
              <p className="text-sm text-[#0F172A] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* B — Upload tài liệu */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#0F172A]">Upload tài liệu</p>
          <OcpsBadge status={item.docStatus} />
        </div>
        {item.docStatus === 'du_toithieu' && (
          <p className="text-xs text-[#92400E] bg-[#FEF3C7] rounded-lg px-3 py-2 mb-3">
            ⚠ Đã đủ tài liệu tối thiểu để gửi xử lý — vẫn cần bổ sung thêm để đạt "Đủ full" (Content mới hoàn tất được AI).
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SLOT_DEFS.map(({ key, label, icon }) => (
            <DocSlotZone
              key={key}
              label={label}
              icon={icon}
              slot={slots[key]}
              onUpload={file => uploadFile(id, key, file)}
              onConfirm={status => confirmSlotStatus(id, key, status, currentUser?.name)}
              ruleHint={key === 'hinhanh' ? formatImageRuleHint(getDocRuleForItem(item)) : undefined}
              templateUrl={key === 'spec' ? getSpecTemplateUrl(item) : undefined}
              allowLink={key === 'khac'}
            />
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium text-[#0F172A] mb-2">Ghi chú của content</p>
        <div className="min-h-10 rounded border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569]">
          {contentNotes.length > 0 ? (
            contentNotes.map((note, index) => <p key={`${index}-${note}`}>{note}</p>)
          ) : (
            <p className="text-[#94A3B8]">Chưa có ghi chú</p>
          )}
        </div>
      </Card>

      {/* C — Chọn luồng */}
      <Card className="mb-4">
        <p className="text-sm font-medium text-[#0F172A] mb-1">Chọn luồng xử lý</p>
        {item.docStatus === 'thieu' && (
          <p className="text-xs text-[#92400E] mb-3">⚠ Cần đủ tài liệu tối thiểu mới có thể chọn luồng</p>
        )}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-left rounded-lg px-3 py-3 border border-[#3B82F6] bg-[#EFF6FF]">
            <p className="text-sm font-medium text-[#1D4ED8]">✓ Content/IT</p>
            <p className="text-xs mt-1 text-[#1D4ED8]">Lên web / SEO — luồng mặc định</p>
          </div>
          <button
            type="button"
            disabled={item.docStatus === 'thieu'}
            onClick={() => setSendMarketing(v => !v)}
            className={`text-left rounded-lg px-3 py-3 border transition-all ${
              sendMarketing
                ? 'border-[#3B82F6] bg-[#EFF6FF]'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <p className={`text-sm font-medium ${sendMarketing ? 'text-[#1D4ED8]' : 'text-[#0F172A]'}`}>
              {sendMarketing ? '☑' : '☐'} Order MKT
            </p>
            <p className={`text-xs mt-1 ${sendMarketing ? 'text-[#1D4ED8]' : 'text-[#94A3B8]'}`}>Ảnh / Clip / Livestream — tuỳ chọn</p>
          </button>
        </div>

        {/* D — Brief MKT */}
        {sendMarketing && (
          <div className="border-t border-[#E2E8F0] pt-4">
            <div className="space-y-3">
              <textarea
                placeholder="Brief ngắn gọn — thông điệp chính, tone, mục tiêu"
                value={brief.briefText}
                onChange={e => setBrief(b => ({ ...b, briefText: e.target.value }))}
                rows={3}
                className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none"
              />
            </div>
          </div>
        )}
      </Card>

      {/* E — Kết quả xử lý — chỉ xem, Content/IT và MKT tự cập nhật nội dung phía họ */}
      {sent && (hasContentFlow || resultBrief) && (
        <Card className="mb-4">
          <p className="text-sm font-medium text-[#0F172A] mb-3">Kết quả xử lý</p>
          <div className="space-y-4">
            {hasContentFlow && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[#475569]">Kết quả Content/IT</p>
                  <OcpsBadge status={item.seoStatus} />
                </div>
                <div className="bg-[#F1F5F9] rounded-lg p-3">
                  {item.linkWeb ? (
                    <a href={item.linkWeb} target="_blank" rel="noreferrer" className="text-xs text-[#2563EB] hover:underline break-all">{item.linkWeb}</a>
                  ) : (
                    <p className="text-xs text-[#94A3B8]">Chưa có kết quả</p>
                  )}
                  {(item.contentLichSuChinhSua?.length ?? 0) > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#E2E8F0] space-y-1">
                      {item.contentLichSuChinhSua!.map(cs => (
                        <div key={cs.vong} className="text-xs text-[#475569]">Cập nhật lần {cs.vong} ({cs.ngay}): {cs.ghiChu}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {resultBrief && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[#475569]">Kết quả Marketing</p>
                  <OcpsBadge status={resultBrief.trangThai} />
                </div>
                <div className="bg-[#F1F5F9] rounded-lg p-3 space-y-2">
                  {resultBrief.linkFolder || resultBrief.linkMedia ? (
                    <>
                      {resultBrief.linkFolder && (
                        <div>
                          <p className="text-xs text-[#94A3B8]">Link Drive:</p>
                          <a href={resultBrief.linkFolder} target="_blank" rel="noreferrer" className="text-xs text-[#2563EB] hover:underline break-all">{resultBrief.linkFolder}</a>
                        </div>
                      )}
                      {resultBrief.linkMedia && (
                        <div>
                          <p className="text-xs text-[#94A3B8]">Link media:</p>
                          <p className="text-xs text-[#0F172A] whitespace-pre-wrap break-all">{resultBrief.linkMedia}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[#94A3B8]">Chưa có kết quả</p>
                  )}
                  {resultBrief.lichSuChinhSua?.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
                      {resultBrief.lichSuChinhSua.map(cs => (
                        <div key={cs.vong} className="text-xs text-[#475569]">Cập nhật lần {cs.vong} ({cs.ngay}): {cs.ghiChu}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {sent ? (
          <div className="flex items-center gap-2">
            {showCancel ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập lý do huỷ..."
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 text-[#0F172A] placeholder:text-[#94A3B8] w-56 outline-none focus:border-[#3B82F6]"
                />
                <OcpsButton
                  variant="danger"
                  size="sm"
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                >Xác nhận huỷ</OcpsButton>
                <OcpsButton size="sm" onClick={() => setShowCancel(false)}>Bỏ qua</OcpsButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <OcpsButton size="sm" variant="danger" onClick={() => setShowCancel(true)}>Huỷ</OcpsButton>
                <OcpsButton size="sm" variant="primary" onClick={handleSaveUpdate}>Lưu</OcpsButton>
              </div>
            )}
            {/* Tạm ẩn nút Huỷ brief MKT
            {activeBrief && (
              showCancelBrief ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Lý do huỷ brief MKT (bắt buộc)"
                    value={cancelBriefReason}
                    onChange={e => setCancelBriefReason(e.target.value)}
                    className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 text-[#0F172A] placeholder:text-[#94A3B8] w-56"
                  />
                  <OcpsButton variant="danger" size="sm" onClick={handleCancelBrief} disabled={!cancelBriefReason.trim()}>Xác nhận huỷ brief</OcpsButton>
                  <OcpsButton size="sm" onClick={() => setShowCancelBrief(false)}>Bỏ qua</OcpsButton>
                </div>
              ) : (
                <OcpsButton size="sm" variant="ghost" onClick={() => setShowCancelBrief(true)}>Huỷ brief MKT</OcpsButton>
              )
            )} */}
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {!sent && (
            <>
              <OcpsButton size="sm">Lưu yêu cầu</OcpsButton>
              <OcpsButton variant="primary" size="sm" onClick={handleSend} disabled={!canSend}>
                Gửi yêu cầu xử lý
              </OcpsButton>
            </>
          )}
          {sent && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#166534] bg-[#DCFCE7] px-3 py-1.5 rounded-full">✓ Đã gửi {item.ngayGuiYeuCau}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
