// Port từ _source_b_reference/src/pages/content/ContentProcess.jsx (route /ocps/content/process/:id)
import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { OcpsBadge } from '../../components/OcpsBadge'
import { DocSlotZone } from '../../components/DocSlotZone'
import type { SlotKey } from '../../types'

const SLOT_DEFS: Array<{ key: SlotKey; label: string; icon: string }> = [
  { key: 'hinhanh', label: 'Hình ảnh', icon: '🖼️' },
  { key: 'spec', label: 'Spec', icon: '📄' },
  { key: 'khac', label: 'Tài liệu khác', icon: '📁' },
]

export function ContentProcess() {
  const { id = '' } = useParams()
  const { currentUser } = useOcpsAuth()
  const { items, docSlots, revertDocStatus, isContentEligible, confirmSlotStatus, updateContentLink, updateItemStatus } = useOcpsData()
  const navigate = useNavigate()

  const found = items.find(i => i.id === id)
  // Chỉ chặn truy cập lúc mở trang (URL trực tiếp tới SP chưa đủ điều kiện) — không chặn lại giữa
  // chừng, vì "Gửi ghi chú thiếu file" cố ý lùi docStatus về 'thieu' trong khi Content vẫn đang xử lý.
  // Khoá theo `id` (không phải mount) — route "/ocps/content/process/:id" không remount khi chỉ đổi id.
  const wasEligibleOnOpen = useMemo(() => isContentEligible(found), [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const item = wasEligibleOnOpen ? found : null
  const slots = docSlots[id] || {}

  const [linkWeb, setLinkWeb] = useState(item?.linkWeb || '')
  const [aiNote, setAiNote] = useState('')
  const [missingNote, setMissingNote] = useState('')
  const step2Done = item?.seoStatus === 'hoan_tat'
  const hasSubmitted = !!item?.linkWeb

  if (!item) return <p className="text-sm text-[#94A3B8]">Không tìm thấy sản phẩm</p>

  // Không cần NH duyệt — Content có thể gửi/cập nhật lại link bất kỳ lúc nào, kể cả sau khi đã lên
  // web/hoàn tất (VD có feedback cần chỉnh nội dung); mỗi lần cập nhật đều được ghi vào lịch sử.
  function handleStep1() {
    if (!linkWeb.trim()) return
    updateContentLink(id, linkWeb, currentUser?.name)
  }

  function handleStep2() {
    updateItemStatus(id, { seoStatus: 'hoan_tat' })
  }

  function sendMissingNote() {
    if (!missingNote.trim()) return
    revertDocStatus(id, missingNote)
    setMissingNote('')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate('/ocps/content/dashboard')} className="text-xs text-[#94A3B8] hover:text-[#0F172A]">← Dashboard</button>
        <span className="text-[#E2E8F0]">/</span>
        <span className="text-xs text-[#0F172A]">{id}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">{item.id} — {item.ten}</h1>
          <p className="text-xs text-[#94A3B8]">{item.nganhhang} · {item.vendor}</p>
        </div>
        <OcpsBadge status={item.seoStatus} />
      </div>

      {/* Tài liệu review */}
      <Card className="mb-4">
        <p className="text-sm font-medium text-[#0F172A] mb-3">Tài liệu đã upload</p>
        <div className="grid grid-cols-3 gap-3">
          {SLOT_DEFS.map(({ key, label, icon }) => (
            <DocSlotZone
              key={key}
              label={label}
              icon={icon}
              slot={slots[key]}
              readOnly
              onConfirm={status => confirmSlotStatus(id, key, status, 'Content')}
            />
          ))}
        </div>
      </Card>

      {/* Bước 1 */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${hasSubmitted ? 'bg-[#16A34A] text-white' : 'bg-[#E2E8F0] text-[#475569]'}`}>1</span>
          <p className="text-sm font-medium text-[#0F172A]">Đủ tối thiểu — Lên web</p>
          {hasSubmitted && <span className="text-xs text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">✓ Đã lên web</span>}
        </div>

        {(item.contentLichSuChinhSua?.length ?? 0) > 0 && (
          <div className="bg-[#F1F5F9] rounded-lg p-3 mb-3">
            <p className="text-xs font-medium text-[#475569] mb-2">Lịch sử cập nhật nội dung</p>
            {item.contentLichSuChinhSua!.map(cs => (
              <div key={cs.vong} className="text-xs text-[#475569]">Cập nhật lần {cs.vong} ({cs.ngay}): {cs.ghiChu}</div>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Dán link website"
          value={linkWeb}
          onChange={e => setLinkWeb(e.target.value)}
          className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-3 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]"
        />
        <OcpsButton variant="primary" size="sm" onClick={handleStep1} disabled={!linkWeb.trim()}>
          {hasSubmitted ? 'Cập nhật lại nội dung' : 'Đánh dấu Đã lên web'}
        </OcpsButton>
      </Card>

      {/* Bước 2 */}
      <Card className={`mb-4 ${!hasSubmitted ? 'opacity-40 pointer-events-none' : ''} ${step2Done ? 'opacity-70' : ''}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step2Done ? 'bg-[#16A34A] text-white' : 'bg-[#E2E8F0] text-[#475569]'}`}>2</span>
          <p className="text-sm font-medium text-[#0F172A]">Đủ full — Hoàn tất Content AI</p>
          {item.docStatus !== 'du_full' && <span className="text-xs text-[#94A3B8]">(Chờ tài liệu đủ full)</span>}
          {step2Done && <span className="text-xs text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">Hoàn tất</span>}
        </div>
        <textarea
          placeholder="Ghi chú nội dung AI đã cập nhật (tuỳ chọn)"
          value={aiNote}
          onChange={e => setAiNote(e.target.value)}
          disabled={step2Done}
          rows={2}
          className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-3 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
        />
        <OcpsButton size="sm" onClick={handleStep2} disabled={step2Done || item.docStatus !== 'du_full'}>
          {step2Done ? '✓ Đã hoàn tất' : 'Hoàn tất Content AI'}
        </OcpsButton>
      </Card>

      {/* Ghi chú thiếu file */}
      <Card className="border-dashed">
        <p className="text-xs font-medium text-[#475569] mb-2">Ghi chú thiếu file — gửi ngược về NH / Vendor</p>
        <textarea
          placeholder="VD: Thiếu ảnh mặt lưng, cần file thông số kỹ thuật PDF..."
          value={missingNote}
          onChange={e => setMissingNote(e.target.value)}
          rows={2}
          className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 mb-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none"
        />
        <OcpsButton size="sm" onClick={sendMissingNote} disabled={!missingNote.trim()}>Gửi ghi chú</OcpsButton>
      </Card>
    </div>
  )
}
