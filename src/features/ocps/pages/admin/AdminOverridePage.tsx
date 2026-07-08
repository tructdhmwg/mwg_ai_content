// Port từ _source_b_reference/src/pages/admin/AdminOverridePage.jsx (route /ocps/admin/override/:id)
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOcpsAuth } from '../../context/OcpsAuthContext'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { OcpsBadge } from '../../components/OcpsBadge'
import { SEO_STATUS_LABEL, MKT_STATUS_LABEL, DOC_STATUS_LABEL } from '../../data/ocpsMockData'
import type { OcpsItem } from '../../types'

type OverrideField = 'seoStatus' | 'mktStatus' | 'docStatus'

const FIELD_OPTIONS: Record<OverrideField, { label: string; values: Record<string, string> }> = {
  seoStatus: { label: 'Content Status', values: SEO_STATUS_LABEL },
  mktStatus: { label: 'MKT Status', values: MKT_STATUS_LABEL },
  docStatus: { label: 'Doc Status', values: DOC_STATUS_LABEL },
}

export function AdminOverridePage() {
  const { id } = useParams()
  const { currentUser } = useOcpsAuth()
  const { items, auditLog, adminOverride, erpUpdateWarning } = useOcpsData()
  const navigate = useNavigate()

  const item = items.find(i => i.id === id) || items[0]
  const [selectedItem, setSelectedItem] = useState(item?.id || '')
  const [field, setField] = useState<OverrideField>('seoStatus')
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')
  const [saved, setSaved] = useState(false)

  const currentItem = items.find(i => i.id === selectedItem)
  const itemAudit = auditLog.filter(a => a.itemId === selectedItem)

  function handleConfirm() {
    if (!reason.trim() || !newValue) return
    adminOverride(selectedItem, { [field]: newValue } as Partial<OcpsItem>, reason, currentUser?.name ?? 'Admin')
    setNewValue('')
    setReason('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate('/ocps/admin/god-view')} className="text-xs text-[#94A3B8] hover:text-[#0F172A]">← God View</button>
        <span className="text-[#E2E8F0]">/</span>
        <span className="text-xs text-[#0F172A]">Override Panel</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#0F172A]">Override Panel — 3A</h1>
          <p className="text-sm text-[#94A3B8]">Mọi thay đổi được ghi vào audit log với lý do bắt buộc</p>
        </div>
        {saved && (
          <span className="text-xs text-[#166534] bg-[#DCFCE7] px-3 py-1.5 rounded-full">✓ Đã lưu</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Chọn SP */}
        <Card>
          <p className="text-xs font-medium text-[#475569] mb-2">Sản phẩm cần override</p>
          <select
            value={selectedItem}
            onChange={e => { setSelectedItem(e.target.value); setNewValue(''); setField('seoStatus') }}
            className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 bg-white text-[#0F172A] outline-none focus:border-[#3B82F6]"
          >
            {items.map(i => (
              <option key={i.id} value={i.id}>{i.id} — {i.ten}</option>
            ))}
          </select>

          {currentItem && (
            <div className="mt-3 bg-[#F1F5F9] rounded-lg p-3">
              <p className="text-xs text-[#94A3B8] mb-2">Trạng thái hiện tại</p>
              <div className="flex gap-2 flex-wrap">
                <OcpsBadge status={currentItem.docStatus} label={`Tài liệu: ${DOC_STATUS_LABEL[currentItem.docStatus]}`} />
                <OcpsBadge status={currentItem.seoStatus} label={`Content: ${SEO_STATUS_LABEL[currentItem.seoStatus]}`} />
                <OcpsBadge status={currentItem.mktStatus} label={`MKT: ${MKT_STATUS_LABEL[currentItem.mktStatus]}`} />
              </div>
              {currentItem.erpDirty && (
                <p className="text-xs text-[#92400E] mt-2">⚠ ERP đã cập nhật — nội dung web có thể lệch</p>
              )}
            </div>
          )}
        </Card>

        {/* Form override */}
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-3">Override trạng thái</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#475569] mb-1.5">Trường cần override</p>
              <select value={field} onChange={e => { setField(e.target.value as OverrideField); setNewValue('') }}
                className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 bg-white text-[#0F172A] outline-none focus:border-[#3B82F6]">
                {(Object.entries(FIELD_OPTIONS) as Array<[OverrideField, { label: string; values: Record<string, string> }]>).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-[#475569] mb-1.5">Giá trị mới</p>
              <select value={newValue} onChange={e => setNewValue(e.target.value)}
                className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 bg-white text-[#0F172A] outline-none focus:border-[#3B82F6]">
                <option value="">Chọn giá trị mới...</option>
                {Object.entries(FIELD_OPTIONS[field].values).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-[#475569] mb-1.5">Lý do override <span className="text-[#EF4444]">*</span></p>
              <textarea
                placeholder="Bắt buộc nhập lý do — không được để trống"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none"
              />
            </div>
            <OcpsButton variant="danger" size="md" onClick={handleConfirm} disabled={!reason.trim() || !newValue}>
              Xác nhận override
            </OcpsButton>
          </div>
        </Card>

        {/* ERP update warning trigger */}
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-1">Mô phỏng ERP cập nhật</p>
          <p className="text-xs text-[#94A3B8] mb-3">Khi ERP cập nhật trường master sau khi SP đã lên web → gửi cảnh báo về Content/IT</p>
          {currentItem && (currentItem.seoStatus === 'da_len_web' || currentItem.seoStatus === 'hoan_tat') ? (
            <OcpsButton size="sm" onClick={() => erpUpdateWarning(selectedItem, 'tên sản phẩm')}>
              🔄 Mô phỏng ERP cập nhật cho {selectedItem}
            </OcpsButton>
          ) : (
            <p className="text-xs text-[#94A3B8]">Chỉ áp dụng khi SP đã lên web (seoStatus = da_len_web / hoan_tat)</p>
          )}
        </Card>

        {/* Audit log */}
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-3">
            Lịch sử override — {selectedItem}
            <span className="ml-2 text-xs text-[#94A3B8]">({itemAudit.length} lần)</span>
          </p>
          {itemAudit.length === 0 && (
            <p className="text-xs text-[#94A3B8]">Chưa có override nào</p>
          )}
          <div className="space-y-2">
            {itemAudit.map(a => (
              <div key={a.id} className="bg-[#F1F5F9] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[#0F172A]">{a.by}</span>
                  <span className="text-xs text-[#94A3B8]">{a.time}</span>
                </div>
                <p className="text-xs text-[#475569] mb-1">{a.from} → {a.to}</p>
                <p className="text-xs text-[#991B1B] bg-[#FEE2E2] px-2 py-1 rounded">{a.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
