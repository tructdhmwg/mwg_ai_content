import type { ChangeEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { PosmDotBadge } from './PosmDotBadge'
import { WF_STATUS_META, artworkSlots, type PosmMktArtwork, type PosmWfStatus } from './posmMockData'
import { formatDateTime } from '../../lib/utils'

interface Props {
  canUpload: boolean
  layoutType: string
  artworks?: PosmMktArtwork[]
  uploadedAt?: string
  wfStatus?: PosmWfStatus
  wfCheckedAt?: string
  wfResult?: string
  onUpload: (files: { url: string; name: string }[]) => void
}

export function PosmMktArtworkSection({ canUpload, layoutType, artworks = [], uploadedAt, wfStatus = 'idle', wfCheckedAt, wfResult, onUpload }: Props) {
  const isRunning = wfStatus === 'running'
  const hasArtwork = artworks.length > 0
  const slots = artworkSlots(layoutType)
  // Hiển thị đủ số ô theo layout (tờ rơi 2, standee 3, ...) — ô nào chưa có hình thì để trống
  const cells = slots.map((label, i) => ({ label, artwork: artworks[i] }))

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onUpload(files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })))
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#475569]">Thành phẩm MKT &amp; kiểm tra AI</p>
        <p className="text-[11px] text-[#94A3B8]">Layout {layoutType} · cần {slots.length} hình</p>
      </div>
      <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-3">
        {hasArtwork ? (
          <div className="flex flex-wrap gap-3">
            {cells.map((cell, i) => (
              <div key={i} className="w-24">
                {cell.artwork?.url ? (
                  <img src={cell.artwork.url} alt={cell.label} className="w-24 h-24 object-cover rounded border border-[#E2E8F0]" />
                ) : (
                  <div className="w-24 h-24 rounded border border-dashed border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[10px] text-[#CBD5E1] text-center px-1">Chưa có hình</div>
                )}
                <p className="text-[11px] font-medium text-[#475569] mt-1 truncate">{cell.label}</p>
                {cell.artwork?.name && <p className="text-[10px] text-[#94A3B8] truncate">{cell.artwork.name}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8]">Chưa có thành phẩm được upload</p>
        )}

        {uploadedAt && hasArtwork && <p className="text-[11px] text-[#94A3B8]">Upload lúc: {formatDateTime(uploadedAt)}</p>}

        <div className="flex items-center gap-2">
          <PosmDotBadge label={WF_STATUS_META[wfStatus].label} dot={WF_STATUS_META[wfStatus].dot} bg={WF_STATUS_META[wfStatus].bg} color={WF_STATUS_META[wfStatus].color} />
          {isRunning && <Loader2 size={12} className="animate-spin text-[#3B82F6]" />}
        </div>
        {wfCheckedAt && wfStatus !== 'running' && (
          <p className="text-[11px] text-[#94A3B8]">Kiểm tra lúc: {formatDateTime(wfCheckedAt)}</p>
        )}
        {wfResult && wfStatus !== 'running' && (
          <p className="text-xs text-[#475569]">{wfResult}</p>
        )}

        {canUpload && (
          <label className="inline-flex">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={isRunning} />
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              isRunning
                ? 'text-[#94A3B8] bg-[#F1F5F9] border-[#E2E8F0] cursor-not-allowed'
                : 'text-[#2563EB] bg-white border-[#3B82F6] hover:bg-[#EFF6FF]'
            }`}>
              <Upload size={12} /> {hasArtwork ? 'Upload lại' : `Upload ${slots.length} hình thành phẩm`}
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
