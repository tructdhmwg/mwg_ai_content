import { FLYER_TIER_LIMITS, type PosmCategorySlot, type PosmTier } from './posmMockData'

// Phác thảo trực quan (wireframe) bố cục in của tờ rơi — KHÔNG chỉnh sửa được, chỉ để hình dung:
// mỗi mặt là 1 "tờ giấy", mỗi tầng là 1 dải ngang cao tỉ lệ theo cap slot của tầng (FLYER_TIER_LIMITS),
// trong tầng mỗi ngành hàng chiếm bề ngang tỉ lệ theo slotCount (kèm số đã đăng ký / tổng slot).

// Tint xoay vòng để 2 ngành hàng cạnh nhau trong cùng tầng dễ phân biệt
const CATEGORY_TINTS = [
  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6' },
  { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
  { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D' },
]

function CategoryBlock({ category, tint }: { category: PosmCategorySlot; tint: typeof CATEGORY_TINTS[number] }) {
  const filled = Math.min(category.registrations.length, category.slotCount)
  return (
    <div
      className="flex flex-col min-w-0 rounded border px-1.5 py-1 justify-end"
      style={{ flexGrow: category.slotCount, flexBasis: 0, backgroundColor: tint.bg, borderColor: tint.border }}
      title={category.nganhHang}
    >
      <p className="text-[9px]" style={{ color: tint.text }}>{filled}/{category.slotCount}</p>
    </div>
  )
}

function PaperSide({ label, tiers, caps }: { label: string; tiers: PosmTier[]; caps: number[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#475569] mb-1.5">{label}</p>
      {/* "Tờ giấy" — nền trắng, viền đậm, chia dải theo tầng */}
      <div className="border-2 border-[#CBD5E1] rounded-md bg-white shadow-sm overflow-hidden flex flex-col" style={{ minHeight: 300 }}>
        {tiers.map((tier, idx) => {
          const cap = caps[idx] ?? 0
          const used = tier.categories.reduce((s, c) => s + c.slotCount, 0)
          return (
            <div
              key={tier.id}
              // flexBasis auto: cao tối thiểu vừa đủ nội dung (không cắt chữ), phần dư mới chia theo cap của tầng
              className={`flex flex-col gap-1 p-1.5 ${idx > 0 ? 'border-t border-dashed border-[#CBD5E1]' : ''}`}
              style={{ flexGrow: cap || 1, flexBasis: 'auto' }}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Label gốc có thể kèm tên ngành hàng ("Tầng 1 · Điện thoại") — wireframe chỉ hiện phần "Tầng N", tên đầy đủ xem qua tooltip */}
                <p className="text-[9px] font-medium text-[#64748B] truncate" title={tier.label}>{tier.label.split(' · ')[0]}</p>
                <span className="text-[9px] text-[#94A3B8] shrink-0">{used}/{cap} slot</span>
              </div>
              {tier.categories.length === 0 ? (
                <div className="flex-1 min-h-0 rounded border border-dashed border-[#E2E8F0] flex items-center justify-center">
                  <span className="text-[9px] text-[#CBD5E1]">Chưa cấu hình ngành hàng</span>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex gap-1">
                  {tier.categories.map((cat, i) => (
                    <CategoryBlock key={cat.id} category={cat} tint={CATEGORY_TINTS[i % CATEGORY_TINTS.length]} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PosmFlyerWireframe({ layoutType, frontTiers, backTiers }: { layoutType: string; frontTiers: PosmTier[]; backTiers: PosmTier[] }) {
  if (layoutType !== 'Tờ rơi') return null

  return (
    <div>
      <p className="text-xs font-medium text-[#475569] mb-2">Phác thảo bố cục tờ rơi</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PaperSide label="Mặt trước" tiers={frontTiers} caps={FLYER_TIER_LIMITS.front} />
        <PaperSide label="Mặt sau" tiers={backTiers} caps={FLYER_TIER_LIMITS.back} />
      </div>
    </div>
  )
}
