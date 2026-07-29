import type { ChangeEvent } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { PosmDotBadge } from './PosmDotBadge'
import { WF_STATUS_META, type PosmWfStatus } from './posmMockData'
import { formatDateTime } from '../../lib/utils'

interface Props {
  canUpload: boolean
  artworkUrl?: string
  artworkName?: string
  uploadedAt?: string
  wfStatus?: PosmWfStatus
  wfCheckedAt?: string
  wfResult?: string
  onUpload: (file: { url: string; name: string }) => void
}

export function PosmMktArtworkSection({ canUpload, artworkUrl, artworkName, uploadedAt, wfStatus = 'idle', wfCheckedAt, wfResult, onUpload }: Props) {
  const isRunning = wfStatus === 'running'
  const hasArtwork = !!artworkName

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload({ url: URL.createObjectURL(file), name: file.name })
    e.target.value = ''
  }

  return (
    <div>
      <p className="text-xs font-medium text-[#475569] mb-2">Thành phẩm MKT &amp; kiểm tra AI</p>
      <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-3">
        {hasArtwork ? (
          <div className="flex items-start gap-3">
            {artworkUrl ? (
              <img src={artworkUrl} alt={artworkName} className="w-20 h-20 object-cover rounded border border-[#E2E8F0] flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[10px] text-[#94A3B8] flex-shrink-0 text-center px-1">Không có preview</div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#0F172A] truncate">{artworkName}</p>
              {uploadedAt && <p className="text-[11px] text-[#94A3B8] mt-0.5">Upload lúc: {formatDateTime(uploadedAt)}</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8]">Chưa có thành phẩm được upload</p>
        )}

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
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={isRunning} />
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              isRunning
                ? 'text-[#94A3B8] bg-[#F1F5F9] border-[#E2E8F0] cursor-not-allowed'
                : 'text-[#2563EB] bg-white border-[#3B82F6] hover:bg-[#EFF6FF]'
            }`}>
              <Upload size={12} /> {hasArtwork ? 'Upload lại' : 'Upload thành phẩm'}
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
