import { Fragment, useState } from 'react'
import { Plus, X, ImageIcon } from 'lucide-react'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { NGANH_HANG_OPTIONS, type PosmCategorySlot, type PosmSlotRegistration, type PosmTier } from './posmMockData'

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
      <td className="px-1.5 py-1 whitespace-nowrap">
        <OcpsButton size="sm" variant="primary" onClick={submit} disabled={!canSubmit} className="whitespace-nowrap">+ Đăng ký</OcpsButton>
      </td>
    </tr>
  )
}

// Quản lý danh sách ngành hàng + số slot của 1 tầng/mặt — tách riêng khỏi bảng sản phẩm, chỉ tab Chiến dịch POSM (editable) mới thấy
function CategoryManager({ categories, onChange }: { categories: PosmCategorySlot[]; onChange: (next: PosmCategorySlot[]) => void }) {
  const [newNganhHang, setNewNganhHang] = useState('')
  const [newSlotCount, setNewSlotCount] = useState('4')
  const available = NGANH_HANG_OPTIONS.filter((nh) => !categories.some((c) => c.nganhHang === nh))

  const addCategory = () => {
    if (!newNganhHang) return
    const slotCount = Math.max(1, Number(newSlotCount) || 1)
    onChange([...categories, { id: crypto.randomUUID(), nganhHang: newNganhHang, slotCount, registrations: [] }])
    setNewNganhHang('')
    setNewSlotCount('4')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      {categories.map((cat) => (
        <span key={cat.id} className="inline-flex items-center gap-1.5 text-[11px] bg-[#F1F5F9] text-[#475569] rounded-full pl-2.5 pr-1.5 py-1">
          {cat.nganhHang} · {cat.registrations.length}/{cat.slotCount} slot
          <button onClick={() => onChange(categories.filter((c) => c.id !== cat.id))} className="text-[#94A3B8] hover:text-[#EF4444]"><X size={11} /></button>
        </span>
      ))}
      {available.length > 0 && (
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
  )
}

// Bảng sản phẩm ngang, mỗi hàng 1 sản phẩm — theo đúng mẫu bảng Excel (Ngành hàng / Mã SP / Tên SP / Giá gốc / Giá KM / Ghi chú / PIC)
// showReview/canReview: cột Feedback + Duyệt của NH — chỉ hiện khi chiến dịch đang ở trạng thái "MKT trả kết quả", chỉ NH sửa được (canReview)
function ProductTable({ categories, canRegister, showReview, canReview, onChange }: { categories: PosmCategorySlot[]; canRegister: boolean; showReview: boolean; canReview: boolean; onChange: (next: PosmCategorySlot[]) => void }) {
  if (categories.length === 0) {
    return <p className="text-xs text-[#94A3B8]">Chưa cấu hình ngành hàng</p>
  }

  const updateCategory = (catId: string, next: PosmCategorySlot) => onChange(categories.map((c) => (c.id === catId ? next : c)))
  const updateRegistration = (catId: string, regId: string, partial: Partial<PosmSlotRegistration>) => {
    const cat = categories.find((c) => c.id === catId)
    if (!cat) return
    updateCategory(catId, { ...cat, registrations: cat.registrations.map((r) => (r.id === regId ? { ...r, ...partial } : r)) })
  }
  const emptyColSpan = 6 + (showReview ? 2 : 0)

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
            {showReview && <th className="px-2.5 py-2 font-medium">Feedback NH</th>}
            {showReview && <th className="px-2.5 py-2 font-medium">Duyệt</th>}
            {canRegister && <th className="px-2.5 py-2 font-medium w-8" />}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const isFull = cat.registrations.length >= cat.slotCount
            return (
              <Fragment key={cat.id}>
                {cat.registrations.map((r) => (
                  <tr key={r.id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{cat.nganhHang}</td>
                    <td className="px-2.5 py-1.5 font-mono text-[#475569]">{r.productCode}</td>
                    <td className="px-2.5 py-1.5 text-[#0F172A]">{r.productName}</td>
                    <td className="px-2.5 py-1.5 text-[#94A3B8] whitespace-nowrap">
                      {r.originalPrice != null ? <span className={r.promoPrice != null ? 'line-through' : ''}>{formatVnd(r.originalPrice)}</span> : '—'}
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
                    {showReview && (
                      <td className="px-1.5 py-1">
                        {canReview ? (
                          <input
                            className={cellInputClass}
                            placeholder="Feedback..."
                            value={r.nhFeedback ?? ''}
                            onChange={(e) => updateRegistration(cat.id, r.id, { nhFeedback: e.target.value })}
                          />
                        ) : (
                          <span className="text-[#94A3B8] italic">{r.nhFeedback || '—'}</span>
                        )}
                      </td>
                    )}
                    {showReview && (
                      <td className="px-2.5 py-1.5 text-center">
                        {canReview ? (
                          <input
                            type="checkbox"
                            checked={!!r.nhApproved}
                            onChange={(e) => updateRegistration(cat.id, r.id, { nhApproved: e.target.checked })}
                            className="w-3.5 h-3.5 accent-[#16A34A] cursor-pointer"
                          />
                        ) : r.nhApproved ? (
                          <span className="text-[#16A34A] font-medium">✓ Đã duyệt</span>
                        ) : (
                          <span className="text-[#CBD5E1]">—</span>
                        )}
                      </td>
                    )}
                    {canRegister && (
                      <td className="px-2.5 py-1.5">
                        <button
                          onClick={() => updateCategory(cat.id, { ...cat, registrations: cat.registrations.filter((x) => x.id !== r.id) })}
                          className="text-[#CBD5E1] hover:text-[#EF4444]"
                        ><X size={12} /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {cat.registrations.length === 0 && !canRegister && (
                  <tr className="border-t border-[#F1F5F9]">
                    <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{cat.nganhHang}</td>
                    <td colSpan={emptyColSpan} className="px-2.5 py-1.5 text-[#CBD5E1]">Chưa có sản phẩm đăng ký</td>
                  </tr>
                )}
                {canRegister && !isFull && (
                  <AddProductRow nganhHang={cat.nganhHang} onSubmit={(reg) => updateCategory(cat.id, { ...cat, registrations: [...cat.registrations, { id: crypto.randomUUID(), ...reg }] })} />
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TierSide({ tiers, editable, canRegister, showReview, canReview, onChange }: { tiers: PosmTier[]; editable: boolean; canRegister: boolean; showReview: boolean; canReview: boolean; onChange: (tiers: PosmTier[]) => void }) {
  return (
    <div className="space-y-4">
      {tiers.map((tier) => (
        <div key={tier.id} className="border border-[#E2E8F0] rounded-lg p-3 bg-white">
          <p className="text-xs font-semibold text-[#0F172A] mb-2">{tier.label}</p>
          {editable && (
            <CategoryManager
              categories={tier.categories}
              onChange={(next) => onChange(tiers.map((t) => (t.id === tier.id ? { ...t, categories: next } : t)))}
            />
          )}
          <ProductTable
            categories={tier.categories}
            canRegister={canRegister}
            showReview={showReview}
            canReview={canReview}
            onChange={(next) => onChange(tiers.map((t) => (t.id === tier.id ? { ...t, categories: next } : t)))}
          />
        </div>
      ))}
    </div>
  )
}

interface Props {
  layoutType: string
  editable: boolean
  canRegister: boolean
  showReview: boolean
  canReview: boolean
  frontTiers: PosmTier[]
  backTiers: PosmTier[]
  bannerCategories: PosmCategorySlot[]
  onChangeFrontTiers: (tiers: PosmTier[]) => void
  onChangeBackTiers: (tiers: PosmTier[]) => void
  onChangeBannerCategories: (categories: PosmCategorySlot[]) => void
}

export function PosmFlyerSketch({ layoutType, editable, canRegister, showReview, canReview, frontTiers, backTiers, bannerCategories, onChangeFrontTiers, onChangeBackTiers, onChangeBannerCategories }: Props) {
  if (layoutType === 'Tờ rơi') {
    return (
      <div className="space-y-5">
        <p className="text-xs font-medium text-[#475569]">Sơ đồ tờ rơi</p>
        <div>
          <p className="text-xs font-semibold text-[#94A3B8] mb-2">Mặt trước</p>
          <TierSide tiers={frontTiers} editable={editable} canRegister={canRegister} showReview={showReview} canReview={canReview} onChange={onChangeFrontTiers} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#94A3B8] mb-2">Mặt sau</p>
          <TierSide tiers={backTiers} editable={editable} canRegister={canRegister} showReview={showReview} canReview={canReview} onChange={onChangeBackTiers} />
        </div>
      </div>
    )
  }

  if (layoutType === 'Banner') {
    return (
      <div>
        <p className="text-xs font-medium text-[#475569] mb-3">Sơ đồ banner</p>
        {editable && <CategoryManager categories={bannerCategories} onChange={onChangeBannerCategories} />}
        <ProductTable categories={bannerCategories} canRegister={canRegister} showReview={showReview} canReview={canReview} onChange={onChangeBannerCategories} />
      </div>
    )
  }

  return null
}
