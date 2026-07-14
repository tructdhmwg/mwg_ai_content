// Reusable drag-drop zone for a single document slot.
// Port từ _source_b_reference/src/components/DocSlotZone.jsx.
import { useState } from 'react'
import type { DragEvent, ChangeEvent, ReactNode } from 'react'
import { OcpsButton } from './OcpsButton'
import { BO_SUNG_STATUS_LABEL } from '../data/ocpsMockData'
import type { DocSlot, TrangThaiBoSung } from '../types'

const BO_SUNG_STYLE: Record<TrangThaiBoSung, string> = {
  dang_kiem_tra: 'bg-[#EFF6FF] text-[#1D4ED8]',
  bo_sung_du: 'bg-[#DCFCE7] text-[#166534]',
  con_thieu: 'bg-[#FEE2E2] text-[#991B1B]',
}

export interface UploadPayload {
  name: string
  size: number
  date: string
  by: string
  url?: string
}

interface DocSlotZoneProps {
  label: ReactNode
  icon?: ReactNode
  slot?: Partial<DocSlot>
  onUpload?: (file: UploadPayload) => void
  readOnly?: boolean
  ruleHint?: string
  onConfirm?: (status: TrangThaiBoSung) => void
  templateUrl?: string
  showNote?: boolean
  // Cho phép thêm tài liệu dạng link bên cạnh upload file
  allowLink?: boolean
}

export function DocSlotZone({ label, icon, slot = {}, onUpload, readOnly = false, ruleHint, onConfirm, templateUrl, showNote = false, allowLink = false }: DocSlotZoneProps) {
  const { files = [], ghiChu, trangThaiBoSung } = slot
  const displayStatus: TrangThaiBoSung = trangThaiBoSung ?? 'con_thieu'
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  function handleAddLink() {
    if (readOnly || !onUpload) return
    const url = linkValue.trim()
    if (!url) return
    onUpload({ name: url, size: 0, date: new Date().toISOString().slice(0, 10), by: 'Bạn', url })
    setLinkValue('')
    setShowLinkInput(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (readOnly || !onUpload) return
    const f = e.dataTransfer.files[0]
    if (f) onUpload({ name: f.name, size: f.size, date: new Date().toISOString().slice(0, 10), by: 'Bạn' })
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    if (readOnly || !onUpload) return
    const f = e.target.files?.[0]
    if (f) onUpload({ name: f.name, size: f.size, date: new Date().toISOString().slice(0, 10), by: 'Bạn' })
    e.target.value = ''
  }

  return (
    <div
      className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2.5 min-h-[148px] hover:border-[#3B82F6] hover:bg-[#F8FAFC] transition-colors"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {showNote && ghiChu && (
        <div className="bg-[#FEE2E2] text-[#991B1B] text-xs rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
          <span>⚠</span> {ghiChu}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="text-2xl">{icon}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${BO_SUNG_STYLE[displayStatus]}`}>
          {BO_SUNG_STATUS_LABEL[displayStatus]}
        </span>
      </div>
      <p className="text-xs font-semibold text-[#0F172A] uppercase tracking-wide">{label}</p>
      <p className="text-xs text-[#94A3B8]">{files.length ? `${files.length} file` : 'Chưa có file'}</p>
      {templateUrl && !readOnly && (
        <a
          href={templateUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1"
          onClick={e => e.stopPropagation()}
        >
          📥 Tải template mẫu
        </a>
      )}
      {ruleHint && !files.some(f => f.ruleViolation && !f.superseded) && (
        <p className="text-xs text-[#94A3B8] italic">{ruleHint}</p>
      )}
      {onConfirm && files.length > 0 && trangThaiBoSung !== 'bo_sung_du' && (
        <div className="flex gap-1.5">
          <OcpsButton size="sm" variant="success" onClick={() => onConfirm('bo_sung_du')}>✓ Đủ</OcpsButton>
          <OcpsButton size="sm" variant="danger" onClick={() => onConfirm('con_thieu')}>✗ Thiếu</OcpsButton>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-col gap-1">
          {files.map((f, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className={`text-xs rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 ${f.superseded ? 'text-[#94A3B8] bg-[#F8FAFC] line-through opacity-60' : 'text-[#475569] bg-[#F1F5F9]'}`}>
                <span>{f.url ? '🔗' : '📄'}</span>
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-[#3B82F6] hover:underline" onClick={e => e.stopPropagation()}>{f.name}</a>
                ) : (
                  <span className="flex-1 truncate">{f.name}</span>
                )}
                <span className="text-[#94A3B8] shrink-0">{f.date}</span>
                {f.isLatest && <span className="text-[#16A34A] font-medium">✓</span>}
              </div>
              {f.ruleViolation && !f.superseded && (
                <div className="bg-[#FEF3C7] text-[#92400E] text-xs rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                  <span>⚠</span> {f.ruleMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <div className="mt-auto flex flex-col gap-1.5">
          {allowLink && showLinkInput && (
            <div className="flex gap-1.5">
              <input
                type="url"
                autoFocus
                value={linkValue}
                onChange={e => setLinkValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddLink(); if (e.key === 'Escape') setShowLinkInput(false) }}
                placeholder="Dán link tài liệu..."
                className="flex-1 min-w-0 text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]"
              />
              <OcpsButton size="sm" variant="primary" onClick={handleAddLink}>Thêm</OcpsButton>
            </div>
          )}
          <div className="flex gap-1.5">
            <label className="flex-1 cursor-pointer">
              <input type="file" className="hidden" onChange={handleInput} />
              <div className="w-full text-xs text-center text-[#3B82F6] font-medium bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg py-1.5 transition-colors">
                ↑ {allowLink ? 'Up file' : 'Chọn hoặc thả file'}
              </div>
            </label>
            {allowLink && (
              <button
                type="button"
                onClick={() => setShowLinkInput(v => !v)}
                className="flex-1 text-xs text-center text-[#3B82F6] font-medium bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg py-1.5 transition-colors"
              >
                🔗 Up link
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
