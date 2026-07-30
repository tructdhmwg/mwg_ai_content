import type { ChangeEvent } from 'react'
import { FileText, Loader2, Upload } from 'lucide-react'
import { artworkSlots, isPdfArtwork, type PosmMktArtwork, type PosmWfStatus, type PosmWfTierResult } from './posmMockData'
import { formatDateTime } from '../../lib/utils'

interface Props {
  canUpload: boolean
  layoutType: string
  artworks?: PosmMktArtwork[]
  uploadedAt?: string
  wfStatus?: PosmWfStatus
  wfCheckedAt?: string
  wfResult?: string
  wfResultDetails?: PosmWfTierResult[]
  onUpload: (files: { url: string; name: string; mime: string }[]) => void
}

// MKT nộp thành phẩm: hình (nhiều hình, KHÔNG giới hạn theo số slot của layout) và/hoặc file PDF bản in.
// Số slot của layout (tờ rơi 2 mặt, standee 3, ...) chỉ là mức TỐI THIỂU gợi ý — up thêm bao nhiêu file cũng hiện đủ.
export function PosmMktArtworkSection({ canUpload, layoutType, artworks = [], uploadedAt, wfStatus = 'idle', wfCheckedAt, wfResult, wfResultDetails, onUpload }: Props) {
  const isRunning = wfStatus === 'running'
  const hasArtwork = artworks.length > 0
  const slots = artworkSlots(layoutType)
  // Luôn hiện đủ số ô của layout (ô nào chưa có file thì để trống), và nếu MKT up NHIỀU HƠN thì hiện thêm hết phần dư.
  const cells = Array.from({ length: Math.max(slots.length, artworks.length) }, (_, i) => ({
    label: artworks[i]?.label ?? slots[i] ?? `File ${i + 1}`,
    artwork: artworks[i],
  }))

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onUpload(files.map((f) => ({ url: URL.createObjectURL(f), name: f.name, mime: f.type })))
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#475569]">Thành phẩm MKT &amp; kiểm tra AI</p>
        <p className="text-[11px] text-[#94A3B8]">
          Layout {layoutType} · tối thiểu {slots.length} hình{hasArtwork ? ` · đã nộp ${artworks.length} file` : ''}
        </p>
      </div>
      <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-3">
        {hasArtwork ? (
          <div className="flex flex-wrap gap-3">
            {cells.map((cell, i) => (
              <div key={cell.artwork?.id ?? `empty-${i}`} className="w-24">
                {cell.artwork && isPdfArtwork(cell.artwork) ? (
                  // PDF không xem được bằng <img> — hiện thẻ file, bấm để mở bản PDF ở tab mới
                  <a
                    href={cell.artwork.url}
                    target="_blank"
                    rel="noreferrer"
                    title={cell.artwork.url ? 'Mở file PDF' : 'Chưa có link file'}
                    className="w-24 h-24 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center justify-center gap-1 text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <FileText size={22} />
                    <span className="text-[10px] font-semibold">PDF</span>
                  </a>
                ) : cell.artwork?.url ? (
                  <img src={cell.artwork.url} alt={cell.label} className="w-24 h-24 object-cover rounded border border-[#E2E8F0]" />
                ) : (
                  <div className="w-24 h-24 rounded border border-dashed border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[10px] text-[#CBD5E1] text-center px-1">Chưa có hình</div>
                )}
                <p className="text-[11px] font-medium text-[#475569] mt-1 truncate" title={cell.label}>{cell.label}</p>
                {cell.artwork?.name && <p className="text-[10px] text-[#94A3B8] truncate" title={cell.artwork.name}>{cell.artwork.name}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8]">Chưa có thành phẩm được upload</p>
        )}

        {uploadedAt && hasArtwork && <p className="text-[11px] text-[#94A3B8]">Upload lúc: {formatDateTime(uploadedAt)}</p>}

        {/* Không hiện badge trạng thái WF — chỉ báo spinner lúc đang chạy, còn lại đọc trực tiếp kết quả bên dưới. */}
        {isRunning && (
          <p className="inline-flex items-center gap-1.5 text-xs text-[#3B82F6]">
            <Loader2 size={12} className="animate-spin" /> Đang chạy AI Workflow kiểm tra thành phẩm...
          </p>
        )}
        {wfCheckedAt && wfStatus !== 'running' && (
          <p className="text-[11px] text-[#94A3B8]">Kiểm tra lúc: {formatDateTime(wfCheckedAt)}</p>
        )}
        {wfResult && wfStatus !== 'running' && (
          <p className="text-xs text-[#475569]">{wfResult}</p>
        )}
        {/* Nhận xét chi tiết theo từng tầng/ngành hàng — bổ sung cho wfResult (1 dòng tổng quát) ở trên. */}
        {wfResultDetails && wfResultDetails.length > 0 && wfStatus !== 'running' && (
          <ul className="text-xs text-[#475569] space-y-1">
            {wfResultDetails.map((d, i) => (
              <li key={i}>
                <span className="font-medium text-[#0F172A]">{d.tierLabel}:</span> {d.result}
              </li>
            ))}
          </ul>
        )}

        {canUpload && (
          <label className="inline-flex">
            {/* Nhận nhiều file 1 lượt: hình (jpg/png/webp...) và/hoặc PDF bản in */}
            <input type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={handleFiles} disabled={isRunning} />
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              isRunning
                ? 'text-[#94A3B8] bg-[#F1F5F9] border-[#E2E8F0] cursor-not-allowed'
                : 'text-[#2563EB] bg-white border-[#3B82F6] hover:bg-[#EFF6FF]'
            }`}>
              <Upload size={12} /> {hasArtwork ? 'Upload lại' : 'Upload thành phẩm (nhiều hình hoặc PDF)'}
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
