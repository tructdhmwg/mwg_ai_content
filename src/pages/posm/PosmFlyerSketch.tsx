import { Fragment, useEffect, useState } from 'react'
import { Plus, Pencil, X, ImageIcon } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { formatDateTime } from '../../lib/utils'
import { FLYER_TIER_LIMITS, NGANH_HANG_OPTIONS, type PosmCategorySlot, type PosmSlotRegistration, type PosmTier } from './posmMockData'

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

// Feedback AI tự động soát giá KM so với giá gốc cho từng dòng sản phẩm — phát hiện giá KM cao hơn giá gốc (nhập sai).
function priceFeedback(r: PosmSlotRegistration): { label: string; color: string } {
  if (r.originalPrice != null && r.promoPrice != null && r.promoPrice > r.originalPrice) {
    return { label: 'Giá khuyến mãi bất thường', color: '#DC2626' }
  }
  return { label: 'Hợp lệ', color: '#16A34A' }
}

const dialogInputClass = 'w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]'
const dialogLabelClass = 'block text-xs font-medium text-[#475569] mb-1.5'
const EMPTY_REG_FORM = { productCode: '', productName: '', originalPrice: '', promoPrice: '', promotion1: '', promotion2: '', promotion3: '', picUrl: '' }

// Popup thêm mới/chỉnh sửa 1 dòng sản phẩm — bảng chi tiết phiếu chỉ hiển thị (không cho điền trực tiếp),
// mọi thao tác thêm/sửa đều qua popup này để tránh sửa nhầm lúc đang xem. initial có giá trị = đang sửa dòng
// đã đăng ký (giữ nguyên updatedBy/updatedAt cũ, chỉ đóng dấu lại khi lưu); không có = đang đăng ký slot trống.
function ProductFormDialog({ open, nganhHang, initial, onClose, onSubmit }: {
  open: boolean
  nganhHang: string
  initial?: PosmSlotRegistration
  onClose: () => void
  onSubmit: (reg: Omit<PosmSlotRegistration, 'id' | 'updatedBy' | 'updatedAt'>) => void
}) {
  const [form, setForm] = useState(EMPTY_REG_FORM)

  useEffect(() => {
    if (!open) return
    setForm(initial ? {
      productCode: initial.productCode,
      productName: initial.productName,
      originalPrice: initial.originalPrice?.toString() ?? '',
      promoPrice: initial.promoPrice?.toString() ?? '',
      promotion1: initial.promotion1 ?? '',
      promotion2: initial.promotion2 ?? '',
      promotion3: initial.promotion3 ?? '',
      picUrl: initial.picUrl ?? '',
    } : EMPTY_REG_FORM)
  }, [open, initial])

  const canSubmit = !!form.productCode.trim() && !!form.productName.trim()

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      productCode: form.productCode.trim(),
      productName: form.productName.trim(),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      promoPrice: form.promoPrice ? Number(form.promoPrice) : undefined,
      promotion1: form.promotion1.trim() || undefined,
      promotion2: form.promotion2.trim() || undefined,
      promotion3: form.promotion3.trim() || undefined,
      picUrl: form.picUrl.trim() || undefined,
    })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      subtitle={nganhHang}
      className="max-w-lg"
      footer={
        <div className="flex gap-2 ml-auto">
          <OcpsButton variant="ghost" onClick={onClose}>Hủy</OcpsButton>
          <OcpsButton variant="primary" onClick={submit} disabled={!canSubmit}>{initial ? 'Lưu thay đổi' : '+ Đăng ký'}</OcpsButton>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={dialogLabelClass}>Mã SP <span style={{ color: '#EF4444' }}>*</span></label>
            <input className={dialogInputClass} value={form.productCode} onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))} />
          </div>
          <div>
            <label className={dialogLabelClass}>Tên SP hiển thị <span style={{ color: '#EF4444' }}>*</span></label>
            <input className={dialogInputClass} value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={dialogLabelClass}>Giá gốc</label>
            <input type="number" min={0} className={dialogInputClass} value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} />
          </div>
          <div>
            <label className={dialogLabelClass}>Giá KM</label>
            <input type="number" min={0} className={dialogInputClass} value={form.promoPrice} onChange={(e) => setForm((f) => ({ ...f, promoPrice: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={dialogLabelClass}>Link hình (drive hoặc web)</label>
          <input className={dialogInputClass} value={form.picUrl} onChange={(e) => setForm((f) => ({ ...f, picUrl: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={dialogLabelClass}>Khuyến mãi 1</label>
            <input className={dialogInputClass} value={form.promotion1} onChange={(e) => setForm((f) => ({ ...f, promotion1: e.target.value }))} />
          </div>
          <div>
            <label className={dialogLabelClass}>Khuyến mãi 2</label>
            <input className={dialogInputClass} value={form.promotion2} onChange={(e) => setForm((f) => ({ ...f, promotion2: e.target.value }))} />
          </div>
          <div>
            <label className={dialogLabelClass}>Khuyến mãi 3</label>
            <input className={dialogInputClass} value={form.promotion3} onChange={(e) => setForm((f) => ({ ...f, promotion3: e.target.value }))} />
          </div>
        </div>
      </div>
    </Dialog>
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

// Bảng sản phẩm ngang, mỗi hàng 1 sản phẩm — theo đúng mẫu bảng Excel (Ngành hàng / Mã SP / Tên SP / Giá gốc / Giá KM / Khuyến mãi 1-3 / PIC).
// Luôn hiển thị ĐỦ slotCount dòng cho mỗi ngành hàng: dòng đã đăng ký trước, phần còn trống hiển thị placeholder.
// Bảng luôn CHỈ ĐỌC — không cho điền/sửa trực tiếp trên bảng; canRegister chỉ quyết định có hiện nút "Sửa"/"+ Thêm"
// (mở popup ProductFormDialog) hay không. Cột Ngành hàng luôn tĩnh dù ở trạng thái nào. Không có nút xoá — 1 slot
// đã có sản phẩm là vĩnh viễn, chỉ sửa được nội dung (xem PosmCampaignDetailPage: canRegister truyền vào đây đã
// tắt sẵn khi chiến dịch ở trạng thái "Hoàn tất").
function ProductTable({ categories, canRegister, onChange }: { categories: PosmCategorySlot[]; canRegister: boolean; onChange: (next: PosmCategorySlot[]) => void }) {
  const [dialog, setDialog] = useState<{ catId: string; reg?: PosmSlotRegistration } | null>(null)

  if (categories.length === 0) {
    return <p className="text-xs text-[#94A3B8]">Chưa cấu hình ngành hàng</p>
  }

  const updateCategory = (catId: string, next: PosmCategorySlot) => onChange(categories.map((c) => (c.id === catId ? next : c)))

  const handleDialogSubmit = (reg: Omit<PosmSlotRegistration, 'id' | 'updatedBy' | 'updatedAt'>) => {
    if (!dialog) return
    const cat = categories.find((c) => c.id === dialog.catId)
    if (!cat) return
    const stamp = { updatedBy: `NH ${cat.nganhHang}`, updatedAt: new Date().toISOString() }
    updateCategory(cat.id, {
      ...cat,
      registrations: dialog.reg
        ? cat.registrations.map((r) => (r.id === dialog.reg!.id ? { ...r, ...reg, ...stamp } : r))
        : [...cat.registrations, { id: crypto.randomUUID(), ...reg, ...stamp }],
    })
  }

  const dialogCat = dialog ? categories.find((c) => c.id === dialog.catId) : undefined

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
            <th className="px-2.5 py-2 font-medium">Khuyến mãi 1</th>
            <th className="px-2.5 py-2 font-medium">Khuyến mãi 2</th>
            <th className="px-2.5 py-2 font-medium">Khuyến mãi 3</th>
            <th className="px-2.5 py-2 font-medium">Link hình (drive hoặc web)</th>
            <th className="px-2.5 py-2 font-medium">Người cập nhật</th>
            <th className="px-2.5 py-2 font-medium">Ngày cập nhật</th>
            <th className="px-2.5 py-2 font-medium">Feedback AI</th>
            {canRegister && <th className="px-2.5 py-2 font-medium w-16" />}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const emptySlots = Math.max(0, cat.slotCount - cat.registrations.length)
            return (
              <Fragment key={cat.id}>
                {cat.registrations.map((r) => {
                  const feedback = priceFeedback(r)
                  return (
                    <tr key={r.id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{cat.nganhHang}</td>
                      <td className="px-2.5 py-1.5 font-mono text-[#475569]">{r.productCode}</td>
                      <td className="px-2.5 py-1.5 text-[#0F172A]">{r.productName}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] whitespace-nowrap">
                        {r.originalPrice != null ? formatVnd(r.originalPrice) : '—'}
                      </td>
                      <td className="px-2.5 py-1.5 text-[#DC2626] font-medium whitespace-nowrap">{r.promoPrice != null ? formatVnd(r.promoPrice) : '—'}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] italic">{r.promotion1 || '—'}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] italic">{r.promotion2 || '—'}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] italic">{r.promotion3 || '—'}</td>
                      <td className="px-2.5 py-1.5">
                        {r.picUrl ? (
                          <a href={r.picUrl} target="_blank" rel="noreferrer" className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 whitespace-nowrap">
                            <ImageIcon size={11} /> Xem
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-2.5 py-1.5 text-[#475569] whitespace-nowrap">{r.updatedBy || '—'}</td>
                      <td className="px-2.5 py-1.5 text-[#94A3B8] whitespace-nowrap">{r.updatedAt ? formatDateTime(r.updatedAt) : '—'}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        <span className="font-medium" style={{ color: feedback.color }}>{feedback.label}</span>
                      </td>
                      {/* Không có nút xoá — 1 slot đã đăng ký sản phẩm là vĩnh viễn, chỉ sửa được nội dung qua popup. */}
                      {canRegister && (
                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                          <button onClick={() => setDialog({ catId: cat.id, reg: r })} className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-medium">
                            <Pencil size={11} /> Sửa
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <tr key={`${cat.id}-empty-${i}`} className="border-t border-[#F1F5F9]">
                    <td className="px-2.5 py-1.5 text-[#0F172A] font-medium whitespace-nowrap">{cat.nganhHang}</td>
                    <td colSpan={11} className="px-2.5 py-1.5 text-[#CBD5E1]">Chưa có sản phẩm đăng ký</td>
                    {canRegister && (
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        <button onClick={() => setDialog({ catId: cat.id })} className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-medium">
                          <Plus size={11} /> Thêm
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      <ProductFormDialog
        open={!!dialog}
        nganhHang={dialogCat?.nganhHang ?? ''}
        initial={dialog?.reg}
        onClose={() => setDialog(null)}
        onSubmit={handleDialogSubmit}
      />
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
