import { Fragment, useState } from 'react'
import { Plus, X, ImageIcon } from 'lucide-react'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { formatDateTime } from '../../lib/utils'
import { FLYER_TIER_LIMITS, NGANH_HANG_OPTIONS, type PosmCategorySlot, type PosmSlotRegistration, type PosmTier } from './posmMockData'

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

const cellInputClass = 'w-full border border-[#E2E8F0] rounded px-1.5 py-1 text-xs text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]'
const EMPTY_REG_FORM = { productCode: '', productName: '', originalPrice: '', promoPrice: '', note: '', picUrl: '' }

// Hàng nhập liệu ngang (mã SP / tên SP / giá gốc / giá KM / ghi chú / PIC đều là input trên cùng 1 hàng) — theo mẫu bảng Excel gốc
function AddProductRow({ nganhHang, onSubmit }: { nganhHang: string; onSubmit: (reg: Omit<PosmSlotRegistration, 'id'>) => void }) {
  const [form, setForm] = useState(EMPTY_REG_FORM)
  const canSubmit = !!form.productCode.trim() && !!form.productName.trim()

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      productCode: form.productCode.trim(),
      productName: form.productName.trim(),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      promoPrice: form.promoPrice ? Number(form.promoPrice) : undefined,
      note: form.note.trim() || undefined,
      picUrl: form.picUrl.trim() || undefined,
    })
    setForm(EMPTY_REG_FORM)
  }

  return (
    <tr className="border-t border-[#F1F5F9] bg-[#F8FAFC]">
      <td className="px-2.5 py-1.5 text-[#94A3B8] italic whitespace-nowrap">{nganhHang}</td>
      <td className="px-1.5 py-1"><input className={cellInputClass} placeholder="Mã SP *" value={form.productCode} onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))} /></td>
      <td className="px-1.5 py-1"><input className={cellInputClass} placeholder="Tên sản phẩm *" value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} /></td>
      <td className="px-1.5 py-1"><input type="number" min={0} className={cellInputClass} placeholder="Giá gốc" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} /></td>
      <td className="px-1.5 py-1"><input type="number" min={0} className={cellInputClass} placeholder="Giá KM" value={form.promoPrice} onChange={(e) => setForm((f) => ({ ...f, promoPrice: e.target.value }))} /></td>
      <td className="px-1.5 py-1"><input className={cellInputClass} placeholder="Ghi chú" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} /></td>
      <td className="px-1.5 py-1"><input className={cellInputClass} placeholder="Link ảnh" value={form.picUrl} onChange={(e) => setForm((f) => ({ ...f, picUrl: e.target.value }))} /></td>
      <td className="px-2.5 py-1.5 text-center text-[10px] text-[#94A3B8] italic" colSpan={2}>Tự động khi đăng ký</td>
      <td className="px-1.5 py-1 whitespace-nowrap">
        <OcpsButton size="sm" variant="primary" onClick={submit} disabled={!canSubmit} className="whitespace-nowrap">+ Đăng ký</OcpsButton>
      </td>
    </tr>
  )
}

// Quản lý danh sách ngành hàng + số slot của 1 tầng/mặt — tách riêng khỏi bảng sản phẩm, chỉ tab Chiến dịch POSM (editable) mới thấy.
// maxSlots: tổng slotCount tối đa của TẦNG này (FLYER_TIER_LIMITS) — không giới hạn khi Infinity (vd. Banner không có quy định tầng).
function CategoryManager({ categories, maxSlots, onChange }: { categories: PosmCategorySlot[]; maxSlots: number; onChange: (next: PosmCategorySlot[]) => void }) {
  const [newNganhHang, setNewNganhHang] = useState('')
  const [newSlotCount, setNewSlotCount] = useState('1')
  const available = NGANH_HANG_OPTIONS.filter((nh) => !categories.some((c) => c.nganhHang === nh))
  const usedSlots = categories.reduce((sum, c) => sum + c.slotCount, 0)
  const remaining = Math.max(0, maxSlots - usedSlots)

  const addCategory = () => {
    if (!newNganhHang || remaining <= 0) return
    const slotCount = Math.min(Math.max(1, Number(newSlotCount) || 1), remaining)
    onChange([...categories, { id: crypto.randomUUID(), nganhHang: newNganhHang, slotCount, registrations: [] }])
    setNewNganhHang('')
    setNewSlotCount('1')
  }

  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <span key={cat.id} className="inline-flex items-center gap-1.5 text-[11px] bg-[#F1F5F9] text-[#475569] rounded-full pl-2.5 pr-1.5 py-1">
            {cat.nganhHang} · {cat.registrations.length}/{cat.slotCount} slot
            <button onClick={() => onChange(categories.filter((c) => c.id !== cat.id))} className="text-[#94A3B8] hover:text-[#EF4444]"><X size={11} /></button>
          </span>
        ))}
        {available.length > 0 && remaining > 0 && (
          <div className="flex items-center gap-1">
            <select
              value={newNganhHang}
              onChange={(e) => setNewNganhHang(e.target.value)}
              className="border border-[#E2E8F0] rounded px-1.5 py-1 text-[11px] text-[#0F172A] outline-none focus:border-[#3B82F6]"
            >
              <option value="">+ Ngành hàng...</option>
              {available.map((nh) => <option key={nh} value={nh}>{nh}</option>)}
            </select>
            <input
              type="number"
              min={1}
              max={remaining}
              value={newSlotCount}
              onChange={(e) => setNewSlotCount(e.target.value)}
              className="w-12 border border-[#E2E8F0] rounded px-1.5 py-1 text-[11px] text-[#0F172A] outline-none focus:border-[#3B82F6]"
            />
            <OcpsButton size="sm" onClick={addCategory} disabled={!newNganhHang}>
              <Plus size={11} /> Thêm
            </OcpsButton>
          </div>
        )}
      </div>
      {Number.isFinite(maxSlots) && (
        <p className="text-[11px] text-[#94A3B8] mt-1">
          Đã dùng {usedSlots}/{maxSlots} slot của tầng
          {remaining === 0 && <span className="text-[#DC2626]"></span>}
        </p>
      )}
    </div>
  )
}

// Bảng sản phẩm ngang, mỗi hàng 1 sản phẩm — theo đúng mẫu bảng Excel (Ngành hàng / Mã SP / Tên SP / Giá gốc / Giá KM / Ghi chú / PIC).
// Luôn hiển thị ĐỦ slotCount dòng cho mỗi ngành hàng: dòng đã đăng ký trước, phần còn trống hiển thị placeholder
// (khi canRegister, dòng trống đầu tiên là form nhập — AddProductRow — các dòng trống còn lại là placeholder).
// canRegister cũng quyết định các dòng ĐÃ đăng ký có sửa được không (trừ cột Ngành hàng, luôn tĩnh) — không có nút xoá:
// 1 slot đã có sản phẩm là vĩnh viễn, chỉ sửa được nội dung, không gỡ bỏ được (xem PosmCampaignDetailPage: canRegister
// truyền vào đây đã tắt sẵn khi chiến dịch ở trạng thái "Hoàn tất").
function ProductTable({ categories, canRegister, onChange }: { categories: PosmCategorySlot[]; canRegister: boolean; onChange: (next: PosmCategorySlot[]) => void }) {
  if (categories.length === 0) {
    return <p className="text-xs text-[#94A3B8]">Chưa cấu hình ngành hàng</p>
  }

  const updateCategory = (catId: string, next: PosmCategorySlot) => onChange(categories.map((c) => (c.id === catId ? next : c)))
  const updateRegistration = (catId: string, regId: string, partial: Partial<PosmSlotRegistration>) => {
    const cat = categories.find((c) => c.id === catId)
    if (!cat) return
    updateCategory(catId, { ...cat, registrations: cat.registrations.map((r) => (r.id === regId ? { ...r, ...partial } : r)) })
  }
  // Đóng dấu "Người cập nhật"/"Ngày cập nhật" khi rời khỏi ô chỉnh sửa (onBlur) — không đóng dấu theo từng phím gõ.
  const stampUpdated = (catId: string, regId: string, nganhHang: string) =>
    updateRegistration(catId, regId, { updatedBy: `NH ${nganhHang}`, updatedAt: new Date().toISOString() })
  const emptyColSpan = 8 + (canRegister ? 1 : 0)

  return (
    <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
      <table className="w-full text-xs min-w-[860px]">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] text-left">
            <th className="px-2.5 py-2 font-medium">Ngành hàng</th>
            <th className="px-2.5 py-2 font-medium">Mã SP</th>
            <th className="px-2.5 py-2 font-medium">Tên SP hiển thị</th>
            <th className="px-2.5 py-2 font-medium">Giá gốc</th>
            <th className="px-2.5 py-2 font-medium">Giá KM</th>
            <th className="px-2.5 py-2 font-medium">Ghi chú</th>
            <th className="px-2.5 py-2 font-medium">Link hình (drive hoặc web)</th>
            <th className="px-2.5 py-2 font-medium">Người cập nhật</th>
            <th className="px-2.5 py-2 font-medium">Ngày cập nhật</th>
            {canRegister && <th className="px-2.5 py-2 font-medium w-8" />}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const emptySlots = Math.max(0, cat.slotCount - cat.registrations.length)
            const isFull = emptySlots === 0
            // Khi canRegister: dòng trống đầu tiên là AddProductRow (form nhập), các dòng trống còn lại là placeholder.
            const placeholderCount = canRegister ? Math.max(0, emptySlots - 1) : emptySlots
            return (
              <Fragment key={cat.id}>
                {cat.registrations.map((r) => (
                  <tr key={r.id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{cat.nganhHang}</td>
                    {canRegister ? (
                      <>
                        <td className="px-1.5 py-1">
                          <input
                            className={cellInputClass}
                            value={r.productCode}
                            onChange={(e) => updateRegistration(cat.id, r.id, { productCode: e.target.value })}
                            onBlur={() => stampUpdated(cat.id, r.id, cat.nganhHang)}
                          />
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            className={cellInputClass}
                            value={r.productName}
                            onChange={(e) => updateRegistration(cat.id, r.id, { productName: e.target.value })}
                            onBlur={() => stampUpdated(cat.id, r.id, cat.nganhHang)}
                          />
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            type="number" min={0}
                            className={cellInputClass}
                            value={r.originalPrice ?? ''}
                            onChange={(e) => updateRegistration(cat.id, r.id, { originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                            onBlur={() => stampUpdated(cat.id, r.id, cat.nganhHang)}
                          />
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            type="number" min={0}
                            className={cellInputClass}
                            value={r.promoPrice ?? ''}
                            onChange={(e) => updateRegistration(cat.id, r.id, { promoPrice: e.target.value ? Number(e.target.value) : undefined })}
                            onBlur={() => stampUpdated(cat.id, r.id, cat.nganhHang)}
                          />
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            className={cellInputClass}
                            value={r.note ?? ''}
                            onChange={(e) => updateRegistration(cat.id, r.id, { note: e.target.value || undefined })}
                            onBlur={() => stampUpdated(cat.id, r.id, cat.nganhHang)}
                          />
                        </td>
                        <td className="px-1.5 py-1">
                          <input
                            className={cellInputClass}
                            value={r.picUrl ?? ''}
                            onChange={(e) => updateRegistration(cat.id, r.id, { picUrl: e.target.value || undefined })}
                            onBlur={() => stampUpdated(cat.id, r.id, cat.nganhHang)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2.5 py-1.5 font-mono text-[#475569]">{r.productCode}</td>
                        <td className="px-2.5 py-1.5 text-[#0F172A]">{r.productName}</td>
                        <td className="px-2.5 py-1.5 text-[#94A3B8] whitespace-nowrap">
                          {r.originalPrice != null ? formatVnd(r.originalPrice) : '—'}
                        </td>
                        <td className="px-2.5 py-1.5 text-[#DC2626] font-medium whitespace-nowrap">{r.promoPrice != null ? formatVnd(r.promoPrice) : '—'}</td>
                        <td className="px-2.5 py-1.5 text-[#94A3B8] italic">{r.note || '—'}</td>
                        <td className="px-2.5 py-1.5">
                          {r.picUrl ? (
                            <a href={r.picUrl} target="_blank" rel="noreferrer" className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 whitespace-nowrap">
                              <ImageIcon size={11} /> Xem
                            </a>
                          ) : '—'}
                        </td>
                      </>
                    )}
                    <td className="px-2.5 py-1.5 text-[#475569] whitespace-nowrap">{r.updatedBy || '—'}</td>
                    <td className="px-2.5 py-1.5 text-[#94A3B8] whitespace-nowrap">{r.updatedAt ? formatDateTime(r.updatedAt) : '—'}</td>
                    {/* Không có nút xoá — 1 slot đã đăng ký sản phẩm là vĩnh viễn, chỉ sửa được nội dung. Ô trống giữ đúng số cột với AddProductRow. */}
                    {canRegister && <td className="px-2.5 py-1.5" />}
                  </tr>
                ))}
                {canRegister && !isFull && (
                  <AddProductRow
                    nganhHang={cat.nganhHang}
                    onSubmit={(reg) => updateCategory(cat.id, {
                      ...cat,
                      registrations: [...cat.registrations, { id: crypto.randomUUID(), ...reg, updatedBy: `NH ${cat.nganhHang}`, updatedAt: new Date().toISOString() }],
                    })}
                  />
                )}
                {Array.from({ length: placeholderCount }).map((_, i) => (
                  <tr key={`${cat.id}-empty-${i}`} className="border-t border-[#F1F5F9]">
                    <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{cat.nganhHang}</td>
                    <td colSpan={emptyColSpan} className="px-2.5 py-1.5 text-[#CBD5E1]">Chưa có sản phẩm đăng ký</td>
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TierSide({ side, tiers, editable, canRegister, onChange }: { side: 'front' | 'back'; tiers: PosmTier[]; editable: boolean; canRegister: boolean; onChange: (tiers: PosmTier[]) => void }) {
  return (
    <div className="space-y-4">
      {tiers.map((tier, idx) => {
        const maxSlots = FLYER_TIER_LIMITS[side][idx] ?? Infinity
        return (
          <div key={tier.id} className="border border-[#E2E8F0] rounded-lg p-3 bg-white">
            <p className="text-xs font-semibold text-[#0F172A] mb-2">{tier.label}</p>
            {editable && (
              <CategoryManager
                categories={tier.categories}
                maxSlots={maxSlots}
                onChange={(next) => onChange(tiers.map((t) => (t.id === tier.id ? { ...t, categories: next } : t)))}
              />
            )}
            <ProductTable
              categories={tier.categories}
              canRegister={canRegister}
              onChange={(next) => onChange(tiers.map((t) => (t.id === tier.id ? { ...t, categories: next } : t)))}
            />
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  layoutType: string
  editable: boolean
  canRegister: boolean
  frontTiers: PosmTier[]
  backTiers: PosmTier[]
  bannerCategories: PosmCategorySlot[]
  onChangeFrontTiers: (tiers: PosmTier[]) => void
  onChangeBackTiers: (tiers: PosmTier[]) => void
  onChangeBannerCategories: (categories: PosmCategorySlot[]) => void
}

export function PosmFlyerSketch({ layoutType, editable, canRegister, frontTiers, backTiers, bannerCategories, onChangeFrontTiers, onChangeBackTiers, onChangeBannerCategories }: Props) {
  if (layoutType === 'Tờ rơi') {
    return (
      <div className="space-y-5">
        <p className="text-xs font-medium text-[#475569]">Sơ đồ tờ rơi</p>
        <div>
          <p className="text-xs font-semibold text-[#94A3B8] mb-2">Mặt trước</p>
          <TierSide side="front" tiers={frontTiers} editable={editable} canRegister={canRegister} onChange={onChangeFrontTiers} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#94A3B8] mb-2">Mặt sau</p>
          <TierSide side="back" tiers={backTiers} editable={editable} canRegister={canRegister} onChange={onChangeBackTiers} />
        </div>
      </div>
    )
  }

  if (layoutType === 'Banner') {
    return (
      <div>
        <p className="text-xs font-medium text-[#475569] mb-3">Sơ đồ banner</p>
        {editable && <CategoryManager categories={bannerCategories} maxSlots={Infinity} onChange={onChangeBannerCategories} />}
        <ProductTable categories={bannerCategories} canRegister={canRegister} onChange={onChangeBannerCategories} />
      </div>
    )
  }

  return null
}
