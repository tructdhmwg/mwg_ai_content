import type { ChangeEvent } from 'react'
import { FileText, Loader2, Upload, X } from 'lucide-react'
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
  // MKT tự đặt lại tên từng file đã nộp (Mặt trước / Mặt sau / ...) — chỉ tab Dashboard MKT dùng
  onRename: (artworkId: string, label: string) => void
  // Gỡ 1 file đã nộp — cần vì upload là cộng dồn, không ghi đè
  onRemove: (artworkId: string) => void
}

// Mở file ở tab mới. Chrome CHẶN điều hướng top-level tới data: URI (hình demo dựng sẵn dùng data:image/svg+xml),
// nên phải đổi sang blob: rồi mới mở; file MKT upload thật vốn đã là blob: nên mở thẳng.
function openArtworkInNewTab(url: string) {
  if (!url.startsWith('data:')) {
    window.open(url, '_blank', 'noopener')
    return
  }
  const commaAt = url.indexOf(',')
  const meta = url.slice(5, commaAt)
  const payload = url.slice(commaAt + 1)
  const isBase64 = meta.endsWith(';base64')
  const mime = isBase64 ? meta.slice(0, -';base64'.length) : meta
  const bytes = isBase64
    ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(payload))
  window.open(URL.createObjectURL(new Blob([bytes], { type: mime })), '_blank', 'noopener')
}

// MKT nộp thành phẩm: hình (nhiều hình, KHÔNG giới hạn theo số slot của layout) và/hoặc file PDF bản in.
// Số slot của layout (tờ rơi 2 mặt, standee 3, ...) chỉ là mức TỐI THIỂU gợi ý — up thêm bao nhiêu file cũng hiện đủ.
export function PosmMktArtworkSection({ canUpload, layoutType, artworks = [], uploadedAt, wfStatus = 'idle', wfCheckedAt, wfResult, wfResultDetails, onUpload, onRename, onRemove }: Props) {
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
          {canUpload && hasArtwork ? ' · bấm vào tên để sửa, × để gỡ' : ''}
        </p>
      </div>
      <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-3">
        {hasArtwork ? (
          <div className="flex flex-wrap gap-3">
            {cells.map((cell, i) => (
              <div key={cell.artwork?.id ?? `empty-${i}`} className="w-24">
                <div className="relative w-24 h-24 group">
                  {cell.artwork && isPdfArtwork(cell.artwork) ? (
                    // PDF không xem được bằng <img> — hiện thẻ file, bấm để mở bản PDF ở tab mới
                    <a
                      href={cell.artwork.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => { e.preventDefault(); if (cell.artwork?.url) openArtworkInNewTab(cell.artwork.url) }}
                      title={cell.artwork.url ? 'Mở file PDF ở tab mới' : 'Chưa có link file'}
                      className="w-24 h-24 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center justify-center gap-1 text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                    >
                      <FileText size={22} />
                      <span className="text-[10px] font-semibold">PDF</span>
                    </a>
                  ) : cell.artwork?.url ? (
                    // Bấm vào hình để mở ảnh gốc ở tab mới (xem cỡ thật, thumbnail bị crop)
                    <a
                      href={cell.artwork.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => { e.preventDefault(); if (cell.artwork?.url) openArtworkInNewTab(cell.artwork.url) }}
                      title="Mở hình ở tab mới"
                    >
                      <img
                        src={cell.artwork.url}
                        alt={cell.label}
                        className="w-24 h-24 object-cover rounded border border-[#E2E8F0] hover:border-[#3B82F6] transition-colors"
                      />
                    </a>
                  ) : (
                    <div className="w-24 h-24 rounded border border-dashed border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[10px] text-[#CBD5E1] text-center px-1">Chưa có hình</div>
                  )}

                  {/* Gỡ file — chỉ MKT, hiện khi rê chuột vào ô */}
                  {canUpload && cell.artwork && (
                    <button
                      type="button"
                      onClick={() => onRemove(cell.artwork!.id)}
                      title="Gỡ file này"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#E2E8F0] text-[#94A3B8] hover:text-[#DC2626] hover:border-[#DC2626] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                {/* Tên hình do MKT tự đặt để phân biệt mặt trước / mặt sau — mặc định lấy theo nhãn slot của layout */}
                {canUpload && cell.artwork ? (
                  <input
                    value={cell.artwork.label}
                    onChange={(e) => onRename(cell.artwork!.id, e.target.value)}
                    placeholder="Đặt tên hình"
                    title="Đặt tên để phân biệt mặt trước / mặt sau"
                    className="w-24 mt-1 text-[11px] font-medium text-[#475569] bg-transparent rounded px-1 py-0.5 border border-transparent hover:border-[#E2E8F0] focus:border-[#3B82F6] focus:bg-white outline-none"
                  />
                ) : (
                  <p className="text-[11px] font-medium text-[#475569] mt-1 truncate" title={cell.label}>{cell.label}</p>
                )}
                {cell.artwork?.name && <p className="text-[10px] text-[#94A3B8] truncate px-1" title={cell.artwork.name}>{cell.artwork.name}</p>}
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
              {/* Upload là CỘNG DỒN — file cũ giữ nguyên, muốn bỏ file nào thì bấm dấu × trên ô đó */}
              <Upload size={12} /> {hasArtwork ? 'Upload thêm hình / PDF' : 'Upload thành phẩm (nhiều hình hoặc PDF)'}
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
