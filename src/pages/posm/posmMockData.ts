export type PosmCampaignGroup = 'nh' | 'promotions' | 'mkt'
export type PosmCampaignStatus = 'new' | 'checked' | 'products_full' | 'transferred_mkt' | 'mkt_proccessing' | 'mkt_done' | 'nh_approved' | 'completed'

export const LAYOUT_TYPES = ['Tờ rơi', 'Standee', 'Poster', 'Kệ trưng bày', 'Banner', 'Wobbler']

// Layout có sơ đồ slot ngành hàng + đăng ký sản phẩm (khác các layout đơn giản còn lại)
export const SLOT_LAYOUT_TYPES = ['Tờ rơi', 'Banner']

// Quy định số slot tối đa theo từng tầng của tờ rơi (giới hạn khổ in thực tế) — mặt trước 2 tầng, mặt sau 3 tầng.
// Tổng slotCount của các ngành hàng trong 1 tầng (do user tab Chiến dịch POSM cấu hình khi thêm ngành hàng) không được vượt số này.
// Lúc TẠO MỚI chiến dịch (layout Tờ rơi), mọi tầng bắt buộc phải fill ĐỦ đúng số này thì mới được lưu (xem PosmCampaignDetailPage.handleSave).
export const FLYER_TIER_LIMITS: { front: number[]; back: number[] } = {
  front: [2, 10],
  back: [4, 5, 8],
}

export const NGANH_HANG_OPTIONS = [
  'Điện thoại', 'Laptop', 'Tablet', 'Đồng hồ - Phụ kiện',
  'Điện tử - Điện lạnh', 'Gia dụng', 'Mẹ & bé', 'Làm đẹp - Sức khoẻ',
]

// bg/color theo đúng bảng màu OcpsBadge (features/ocps/components/OcpsBadge.tsx) để 3 tab POSM đồng bộ CSS với khu OCPS gốc
export const STATUS_META: Record<PosmCampaignStatus, { label: string; dot: string; bg: string; color: string }> = {
  new:             { label: 'Mới',           dot: '#0EA5E9', bg: '#E0F2FE', color: '#075985' },
  checked:         { label: 'Đang cập nhật', dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' },
  products_full:   { label: 'Đủ sản phẩm',   dot: '#0D9488', bg: '#CCFBF1', color: '#115E59' },
  transferred_mkt: { label: 'Chuyển MKT',    dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  mkt_proccessing: { label: 'MKT Đang xử lý',    dot: '#3B82F6', bg: '#EFF6FF', color: '#5cbc81' },
  mkt_done:        { label: 'MKT trả kết quả',      dot: '#8B5CF6', bg: '#F5F3FF', color: '#5B21B6' },
  nh_approved:   { label: 'NH duyệt',    dot: '#D97706', bg: '#FEF3C7', color: '#92400E' },
  completed:       { label: 'Hoàn tất',      dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
}

// Dot màu theo Loại campaign — dùng chung 1 kiểu badge (dot + pill) với trạng thái cho đồng bộ
export const LAYOUT_META: Record<string, { dot: string; bg: string; color: string }> = {
  'Tờ rơi':        { dot: '#0EA5E9', bg: '#E0F2FE', color: '#075985' },
  Standee:         { dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  Poster:          { dot: '#8B5CF6', bg: '#F5F3FF', color: '#5B21B6' },
  'Kệ trưng bày':  { dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  Banner:          { dot: '#F97316', bg: '#FFEDD5', color: '#9A3412' },
  Wobbler:         { dot: '#EC4899', bg: '#FCE7F3', color: '#9D174D' },
}

// Số hình thành phẩm MKT cần upload theo từng layout (kèm nhãn cho mỗi ô).
// Tờ rơi 2 hình (2 mặt), Standee 3 hình, Kệ/Wobbler 2 hình, Poster/Banner 1 hình.
export const LAYOUT_ARTWORK_SLOTS: Record<string, string[]> = {
  'Tờ rơi':        ['Mặt trước', 'Mặt sau'],
  Standee:         ['Bản chính', 'Bản phụ 1', 'Bản phụ 2'],
  Poster:          ['Poster'],
  'Kệ trưng bày':  ['Header kệ', 'Thân kệ'],
  Banner:          ['Banner ngang'],
  Wobbler:         ['Mặt trước', 'Mặt sau'],
}

export function artworkSlots(layoutType: string): string[] {
  return LAYOUT_ARTWORK_SLOTS[layoutType] ?? ['Thành phẩm']
}

// Trạng thái AI Workflow (dùng chung cho cả 2 loại check: thành phẩm MKT và dữ liệu chiến dịch)
export type PosmWfStatus = 'idle' | 'running' | 'passed' | 'failed'

export const WF_STATUS_META: Record<PosmWfStatus, { label: string; dot: string; bg: string; color: string }> = {
  idle:    { label: 'Chưa chạy',            dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' },
  running: { label: 'Đang chạy AI Workflow', dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  passed:  { label: 'Đạt yêu cầu',           dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  failed:  { label: 'Cần chỉnh sửa',         dot: '#EF4444', bg: '#FEE2E2', color: '#991B1B' },
}

// 1 hình thành phẩm MKT. Số lượng theo LAYOUT_ARTWORK_SLOTS của layout.
export interface PosmMktArtwork {
  id: string
  name: string
  label: string
  url?: string
}

// 1 dòng nhận xét AI Workflow theo từng tầng/ngành hàng khi kiểm tra thành phẩm — bổ sung cho wfResult (1 dòng tổng quát)
// để thấy rõ tầng nào đã soát thay vì chỉ 1 câu chung chung.
export interface PosmWfTierResult {
  tierLabel: string
  result: string
}

export interface PosmSlotRegistration {
  id: string
  productCode: string
  productName: string
  originalPrice?: number
  promoPrice?: number
  note?: string
  picUrl?: string
  // Audit ngắn cho từng dòng sản phẩm — tự set khi NH đăng ký (AddProductRow), không nhập tay.
  updatedBy?: string
  updatedAt?: string
}

export interface PosmCategorySlot {
  id: string
  nganhHang: string
  slotCount: number
  registrations: PosmSlotRegistration[]
}

// 1 lượt duyệt của 1 ngành hàng tham gia chiến dịch — ai duyệt, lúc nào (kèm feedback riêng nếu có)
export interface PosmNhApproval {
  nganhHang: string
  approvedBy: string
  approvedAt: string
  feedback?: string
}

export interface PosmTier {
  id: string
  label: string
  categories: PosmCategorySlot[]
}

export interface PosmCampaign {
  id: string
  group: PosmCampaignGroup
  layoutType: string
  campaignName: string
  createdAt: string
  status: PosmCampaignStatus
  // Người tạo phiếu (user tab Chiến dịch POSM) — chỉ đọc, tự đóng dấu lúc tạo
  createdBy?: string
  startDate?: string
  endDate?: string
  // Ngày triển khai (phát/dán tại điểm bán) & ngày in ấn — mốc vận hành, nằm cùng vùng thông tin campaign
  deployDate?: string
  printDate?: string
  description?: string
  note?: string
  // Chỉ dùng khi layoutType === 'Tờ rơi' — mặt trước/mặt sau đều gồm các tầng sản phẩm, mỗi tầng cấu hình ngành hàng + số slot riêng
  // (tổng slot/tầng bị chặn theo FLYER_TIER_LIMITS)
  frontTiers?: PosmTier[]
  backTiers?: PosmTier[]
  // Chỉ dùng khi layoutType === 'Banner' — 1 mặt duy nhất, danh sách ngành hàng + số slot chung
  bannerCategories?: PosmCategorySlot[]
  // Thành phẩm MKT upload (chỉ tab Dashboard MKT được upload/upload lại) + kết quả AI Workflow check ngầm — hiện ở cả 3 tab.
  // Số hình theo LAYOUT_ARTWORK_SLOTS: tờ rơi 2, standee 3, ...
  mktArtworks?: PosmMktArtwork[]
  mktArtworkUploadedAt?: string
  wfStatus?: PosmWfStatus
  wfCheckedAt?: string
  wfResult?: string
  // Nhận xét chi tiết theo từng tầng (Tờ rơi)/ngành hàng (Banner) của lần kiểm tra thành phẩm gần nhất — xem wfTierResults().
  wfResultDetails?: PosmWfTierResult[]
  // Feedback + duyệt của NH cho CẢ chiến dịch (không phải theo từng dòng sản phẩm) — chỉ nhập được ở tab Dashboard NH
  // khi chiến dịch đang ở trạng thái "MKT trả kết quả"; nhApproved=true khi lưu sẽ chuyển trạng thái sang "NH duyệt".
  nhFeedback?: string
  nhApproved?: boolean
  // Chi tiết duyệt theo TỪNG ngành hàng tham gia chiến dịch (ai duyệt, lúc nào) — mỗi NH tự bấm Duyệt cho
  // ngành hàng của mình (1 dòng/NH); đủ mọi ngành hàng mới chuyển trạng thái sang "NH duyệt".
  nhApprovals?: PosmNhApproval[]
  // Duyệt CHỐT của user tab Chiến dịch POSM (sau khi NH duyệt) — chuyển trạng thái sang "Hoàn tất".
  posmApproved?: boolean
  posmApprovedBy?: string
  posmApprovedAt?: string
  // AI Workflow kiểm tra DỮ LIỆU cấu hình chiến dịch (khác WF kiểm tra thành phẩm MKT ở trên) — user tab Chiến dịch POSM
  // chủ động chạy để tự soát lại cấu hình tầng/slot + thông tin campaign trước khi lưu.
  dataCheckStatus?: PosmWfStatus
  dataCheckCheckedAt?: string
  dataCheckResult?: string
}

type CampaignSlots = Pick<PosmCampaign, 'layoutType' | 'frontTiers' | 'backTiers' | 'bannerCategories'>

// Gom mọi ngành hàng-slot của chiến dịch (banner: 1 mặt; tờ rơi: mọi tầng của cả 2 mặt)
function allCategories(campaign: CampaignSlots): PosmCategorySlot[] {
  return campaign.layoutType === 'Banner'
    ? (campaign.bannerCategories ?? [])
    : [...(campaign.frontTiers ?? []), ...(campaign.backTiers ?? [])].flatMap((t) => t.categories)
}

// Đã đăng ký đủ sản phẩm cho MỌI slot chưa (mọi ngành hàng ở mọi tầng/mặt đều registrations.length === slotCount)?
// Dùng để tự chuyển trạng thái "Đủ sản phẩm" ngay khi NH đăng ký xong slot cuối cùng (xem PosmCampaignDetailPage.persistIfRegisterOnly).
export function isFullyRegistered(campaign: CampaignSlots): boolean {
  const categories = allCategories(campaign)
  if (categories.length === 0) return false
  return categories.every((c) => c.registrations.length >= c.slotCount)
}

// Danh sách ngành hàng (không trùng, giữ thứ tự xuất hiện) đang tham gia chiến dịch — dùng để dựng danh sách duyệt theo từng NH.
export function campaignNganhHangs(campaign: CampaignSlots): string[] {
  return [...new Set(allCategories(campaign).map((c) => c.nganhHang))]
}

// Mọi ngành hàng tham gia chiến dịch đều đã tự duyệt phần của mình chưa? Đủ hết thì phiếu mới chuyển sang "NH duyệt"
// (xem PosmCampaignDetailPage.handleApproveNh) — mỗi NH chỉ duyệt đúng ngành hàng của họ, không duyệt hộ NH khác.
export function allNhApproved(campaign: CampaignSlots & { nhApprovals?: PosmNhApproval[] }): boolean {
  const nganhHangs = campaignNganhHangs(campaign)
  if (nganhHangs.length === 0) return false
  const done = new Set((campaign.nhApprovals ?? []).map((a) => a.nganhHang))
  return nganhHangs.every((n) => done.has(n))
}

// Nhận xét AI Workflow theo từng tầng (Tờ rơi: gộp cả mặt trước/sau) hoặc từng ngành hàng (Banner) — dùng khi
// upload/chạy lại "AI kiểm tra thành phẩm" (xem PosmCampaignDetailPage.handleUploadArtwork/handleRecheckArtwork),
// để NH/MKT thấy rõ tầng nào đã soát thay vì chỉ 1 dòng wfResult chung chung. Tầng/ngành hàng chưa có sản phẩm nào
// thì bỏ qua, không có gì để AI soát.
const TIER_WF_NOTE = 'Sản phẩm đúng thông tin, đúng giá, khớp thành phẩm đã upload.'
export function wfTierResults(campaign: CampaignSlots): PosmWfTierResult[] {
  if (campaign.layoutType === 'Banner') {
    return (campaign.bannerCategories ?? [])
      .filter((c) => c.registrations.length > 0)
      .map((c) => ({ tierLabel: c.nganhHang, result: TIER_WF_NOTE }))
  }
  const sides: [string, PosmTier[]][] = [['Mặt trước', campaign.frontTiers ?? []], ['Mặt sau', campaign.backTiers ?? []]]
  return sides.flatMap(([sideLabel, tiers]) =>
    tiers
      .filter((t) => t.categories.some((c) => c.registrations.length > 0))
      .map((t) => ({ tierLabel: `${sideLabel} · ${t.label}`, result: TIER_WF_NOTE })),
  )
}

// ---- Helpers dựng data demo ----------------------------------------------------

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Mockup thành phẩm MKT cho tờ rơi "Laptop tựu trường T8" — dựng lại theo đúng bố cục/màu/nội dung ảnh mẫu thực tế.
// Mọi phiếu Tờ rơi đã có thành phẩm đều dùng chung bộ hình này để data "Thành phẩm MKT & kiểm tra AI" đồng bộ nhau.
function t8FrontArtwork(): string {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
    `<rect width="160" height="160" fill="#FBBF24"/>` +
    `<rect x="0" y="0" width="160" height="20" fill="#0EA5E9"/>` +
    `<text x="8" y="14" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#ffffff">Điện máy XANH</text>` +
    `<text x="80" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="900" fill="#1D4ED8">TỰU TRƯỜNG</text>` +
    `<text x="80" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="900" fill="#DC2626">SALE TO</text>` +
    `<text x="80" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="600" fill="#1D4ED8">10 ngày: 14 - 23/8</text>` +
    `<rect x="10" y="90" width="140" height="28" rx="4" fill="#1D4ED8"/>` +
    `<text x="80" y="102" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="#FDE047">Tặng 10 voucher</text>` +
    `<text x="80" y="113" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#ffffff">2 TRIỆU</text>` +
    `<circle cx="32" cy="140" r="17" fill="#DC2626"/>` +
    `<text x="32" y="136" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" fill="#ffffff">Máy in</text>` +
    `<text x="32" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#FDE047">0Đ</text>` +
    `<circle cx="128" cy="140" r="17" fill="#DC2626"/>` +
    `<text x="128" y="136" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" fill="#ffffff">Phụ kiện</text>` +
    `<text x="128" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#FDE047">0Đ</text>` +
    `</svg>`,
  )
}

function t8BackArtwork(): string {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
    `<rect width="160" height="160" fill="#1D4ED8"/>` +
    `<rect x="0" y="0" width="160" height="30" fill="#1E40AF"/>` +
    `<text x="80" y="14" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="900" fill="#ffffff">100% Laptop</text>` +
    `<text x="80" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#FDE047">tặng Office bản quyền</text>` +
    `<rect x="8" y="36" width="70" height="40" rx="3" fill="#ffffff"/>` +
    `<text x="43" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="#1D4ED8">Màn hình</text>` +
    `<text x="43" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#DC2626">1.090k</text>` +
    `<rect x="82" y="36" width="70" height="40" rx="3" fill="#ffffff"/>` +
    `<text x="117" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="#1D4ED8">Laptop SV</text>` +
    `<text x="117" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#DC2626">15.99tr</text>` +
    `<rect x="8" y="80" width="70" height="40" rx="3" fill="#ffffff"/>` +
    `<text x="43" y="96" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="#1D4ED8">Laptop AI</text>` +
    `<text x="43" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#DC2626">21.99tr</text>` +
    `<rect x="82" y="80" width="70" height="40" rx="3" fill="#ffffff"/>` +
    `<text x="117" y="96" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="700" fill="#1D4ED8">Gaming</text>` +
    `<text x="117" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#DC2626">22.99tr</text>` +
    `<rect x="0" y="124" width="160" height="36" fill="#1E40AF"/>` +
    `<text x="80" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="6.5" fill="#ffffff">Điện tử - Gia dụng</text>` +
    `<text x="80" y="154" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="#FDE047">Giảm thêm 10%</text>` +
    `</svg>`,
  )
}

function t8Artwork(key: string): PosmMktArtwork[] {
  return [
    { id: `${key}-art-1`, label: 'Mặt trước', name: `${key}-1.png`, url: t8FrontArtwork() },
    { id: `${key}-art-2`, label: 'Mặt sau', name: `${key}-2.png`, url: t8BackArtwork() },
  ]
}

type RegInput = [code: string, name: string, orig: number, promo: number, picUrl?: string]

// Vài NH mẫu xoay vòng cho cột "Người cập nhật" — chỉ để demo có dữ liệu, không ánh xạ nhân sự thật.
const NH_STAFF = ['Nguyễn Thị Hạnh', 'Trần Văn Minh', 'Lê Thị Thu', 'Phạm Đức Anh']
function staffFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return NH_STAFF[h % NH_STAFF.length]
}

// Tạo danh sách đăng ký sản phẩm gọn gàng từ tuple [mã, tên, giá gốc, giá KM, (link hình - tuỳ chọn)].
// updatedAt (tuỳ chọn): thời điểm cả lô sản phẩm này được NH đăng ký/chỉnh sửa — "Người cập nhật" suy ra xoay vòng theo mã SP.
function regs(prefix: string, items: RegInput[], updatedAt?: string): PosmSlotRegistration[] {
  return items.map(([productCode, productName, originalPrice, promoPrice, picUrl], i) => ({
    id: `${prefix}-r${i + 1}`,
    productCode,
    productName,
    originalPrice,
    promoPrice,
    picUrl,
    updatedAt,
    updatedBy: updatedAt ? staffFor(productCode) : undefined,
  }))
}

// Kho sản phẩm mẫu theo ngành hàng — đủ số lượng để lấp ĐẦY slot của ngành hàng đó trong khung tờ rơi chuẩn bên dưới.
const PRODUCT_POOL: Record<string, RegInput[]> = {
  'Điện thoại': [
    ['0194253789012', 'iPhone 17 128GB', 22990000, 21490000, 'https://www.dienmayxanh.com/dtdd/iphone-17-128gb'],
    ['8806095123456', 'Samsung Galaxy S26 5G', 19990000, 18490000, 'https://www.dienmayxanh.com/dtdd/samsung-galaxy-s26-5g'],
  ],
  Laptop: [
    ['4711387296451', 'Laptop Asus Vivobook 15 A1504', 12990000, 10990000, 'https://www.dienmayxanh.com/laptop/asus-vivobook-15-a1504'],
    ['0195949012345', 'MacBook Air M4 13"', 27990000, 26490000, 'https://www.dienmayxanh.com/laptop/macbook-air-m4-13-inch'],
    ['0196123456789', 'Laptop Dell Inspiron 15', 15990000, 13990000, 'https://www.dienmayxanh.com/laptop/dell-inspiron-15'],
    ['0196234567890', 'Laptop Lenovo IdeaPad Slim 3', 11990000, 10490000, 'https://www.dienmayxanh.com/laptop/lenovo-ideapad-slim-3'],
    ['0196345678901', 'Laptop HP 240 G9', 12990000, 11490000, 'https://www.dienmayxanh.com/laptop/hp-240-g9'],
    ['0196456789012', 'Laptop Acer Aspire 3', 13990000, 12490000, 'https://www.dienmayxanh.com/laptop/acer-aspire-3'],
    ['0196567890123', 'Laptop MSI Modern 14', 14990000, 13290000, 'https://www.dienmayxanh.com/laptop/msi-modern-14'],
    ['0196678901234', 'Laptop Gaming Acer Nitro V', 25990000, 22990000, 'https://www.dienmayxanh.com/laptop-gaming/acer-nitro-v'],
    ['0196789012345', 'Laptop AI Asus Zenbook 14', 23990000, 21990000, 'https://www.dienmayxanh.com/laptop/asus-zenbook-14-ai'],
    ['0196890123456', 'Laptop Sinh viên HP 15', 17990000, 15990000, 'https://www.dienmayxanh.com/laptop/hp-15-sinh-vien'],
  ],
  'Gia dụng': [
    ['8934563021458', 'Nồi chiên không dầu Sunhouse 5L', 1990000, 1590000, 'https://www.dienmayxanh.com/noi-chien-khong-dau/sunhouse-5l'],
    ['8809123456789', 'Robot hút bụi Ecovacs Deebot', 6990000, 5490000, 'https://www.dienmayxanh.com/robot-hut-bui/ecovacs-deebot'],
    ['8935001100028', 'Bình đun siêu tốc Rapido RK2015-C 2L', 399000, 250000, 'https://www.dienmayxanh.com/binh-dun-sieu-toc/rapido-rk2015-c'],
    ['8935001100042', 'Quạt đứng Midea FS40-10NAVN(K)', 690000, 450000, 'https://www.dienmayxanh.com/quat-dieu-hoa'],
  ],
  'Đồng hồ - Phụ kiện': [
    ['8840001000017', 'Cáp sạc Type-C 1m', 59000, 39000, 'https://www.dienmayxanh.com/phu-kien-dien-thoai/cap-sac-type-c-1m'],
    ['8840001000024', 'Adapter sạc 20W', 149000, 99000, 'https://www.dienmayxanh.com/phu-kien-dien-thoai/adapter-sac-20w'],
    ['8840001000031', 'Chuột không dây DareU LM106G', 99000, 69000, 'https://www.dienmayxanh.com/phu-kien-may-tinh/chuot-dareu-lm106g'],
    ['8840001000055', 'Sạc dự phòng JP388 10.000mAh', 199000, 149000, 'https://www.dienmayxanh.com/sac-du-phong/jp388-10000mah'],
    ['8840005500035', 'Đồng hồ thông minh Xiaomi Watch', 990000, 790000, 'https://www.dienmayxanh.com/dong-ho-thong-minh/xiaomi-watch'],
  ],
  'Mẹ & bé': [
    ['8936012300011', 'Bỉm Bobby size M 62 miếng', 259000, 219000, 'https://www.dienmayxanh.com/me-be/bim-bobby-size-m'],
    ['8936012300028', 'Sữa bột Nan Nga 800g', 550000, 490000, 'https://www.dienmayxanh.com/me-be/sua-bot-nan-nga-800g'],
    ['8936012300035', 'Xe đẩy em bé gấp gọn', 1990000, 1590000, 'https://www.dienmayxanh.com/me-be/xe-day-em-be-gap-gon'],
    ['8936012300042', 'Ghế ăn dặm đa năng', 890000, 690000, 'https://www.dienmayxanh.com/me-be/ghe-an-dam-da-nang'],
  ],
  'Làm đẹp - Sức khoẻ': [
    ['8938012400011', 'Sữa rửa mặt Cetaphil 500ml', 350000, 290000, 'https://www.dienmayxanh.com/lam-dep/sua-rua-mat-cetaphil-500ml'],
    ['8938012400028', 'Kem chống nắng Anessa', 550000, 450000, 'https://www.dienmayxanh.com/lam-dep/kem-chong-nang-anessa'],
    ['8938012400035', 'Máy massage cầm tay', 690000, 490000, 'https://www.dienmayxanh.com/lam-dep/may-massage-cam-tay'],
    ['8938012400042', 'Vitamin C DHC 60 viên', 250000, 190000, 'https://www.dienmayxanh.com/lam-dep/vitamin-c-dhc-60-vien'],
  ],
}

// Khung tờ rơi 2 mặt chuẩn: ngành hàng + slot của từng tầng, tổng mỗi tầng khớp đúng FLYER_TIER_LIMITS (trước 2,10 · sau 4,5,8).
// Mọi chiến dịch Tờ rơi chỉ được tạo khi đã lấp đầy đúng mức này (validation ở handleSave) nên không tầng nào để trống.
const STANDARD_FLYER: { side: 'front' | 'back'; label: string; cats: Array<[nganhHang: string, slots: number]> }[] = [
  { side: 'front', label: 'Tầng 1 · Điện thoại', cats: [['Điện thoại', 2]] },
  { side: 'front', label: 'Tầng 2 · Laptop', cats: [['Laptop', 10]] },
  { side: 'back', label: 'Tầng 1 · Gia dụng', cats: [['Gia dụng', 4]] },
  { side: 'back', label: 'Tầng 2 · Đồng hồ - Phụ kiện', cats: [['Đồng hồ - Phụ kiện', 5]] },
  { side: 'back', label: 'Tầng 3 · Mẹ & bé - Làm đẹp', cats: [['Mẹ & bé', 4], ['Làm đẹp - Sức khoẻ', 4]] },
]

// Dựng khung tờ rơi chuẩn với mức lấp đầy đăng ký sản phẩm theo trạng thái phiếu:
//   'empty'   → chỉ có khung slot, chưa đăng ký gì (trạng thái "Mới")
//   'partial' → mới đăng ký dở ngành hàng đầu tiên (trạng thái "Đang cập nhật")
//   'full'    → mọi slot của mọi ngành hàng đã đăng ký đủ (từ "Đủ sản phẩm" trở đi)
function standardFlyer(key: string, fill: 'empty' | 'partial' | 'full', updatedAt?: string): Pick<PosmCampaign, 'frontTiers' | 'backTiers'> {
  const build = (side: 'front' | 'back') =>
    STANDARD_FLYER.filter((t) => t.side === side).map((tier, ti) => ({
      id: `${key}-${side}${ti + 1}`,
      label: tier.label,
      categories: tier.cats.map(([nganhHang, slots], ci) => {
        const pool = PRODUCT_POOL[nganhHang] ?? []
        const take = fill === 'full' ? slots : fill === 'partial' && side === 'front' && ti === 0 && ci === 0 ? 1 : 0
        return {
          id: `${key}-${side}${ti + 1}c${ci + 1}`,
          nganhHang,
          slotCount: slots,
          registrations: regs(`${key}${side}${ti + 1}${ci + 1}`, pool.slice(0, take), updatedAt),
        }
      }),
    }))
  return { frontTiers: build('front'), backTiers: build('back') }
}

// Ghép thêm Ghi chú/Link hình cho từng dòng sản phẩm theo mã SP — dùng để làm giàu dữ liệu cho 1 phiếu CỤ THỂ
// (vd. đã "MKT trả kết quả"/"Hoàn tất") mà KHÔNG đụng tới PRODUCT_POOL/t8FlyerTiers dùng chung, nên các phiếu
// khác lấy cùng sản phẩm gốc vẫn giữ nguyên, không tự nhiên có thêm ghi chú/link.
function withExtras(tiers: Pick<PosmCampaign, 'frontTiers' | 'backTiers'>, extras: Record<string, { note?: string; picUrl?: string }>): Pick<PosmCampaign, 'frontTiers' | 'backTiers'> {
  const applyTiers = (list: PosmTier[]) => list.map((t) => ({
    ...t,
    categories: t.categories.map((c) => ({
      ...c,
      registrations: c.registrations.map((r) => (extras[r.productCode] ? { ...r, ...extras[r.productCode] } : r)),
    })),
  }))
  return { frontTiers: applyTiers(tiers.frontTiers ?? []), backTiers: applyTiers(tiers.backTiers ?? []) }
}

// Ghi chú + link hình cho 24 sản phẩm của tờ rơi "Laptop tựu trường T8" — dùng chung cho phiếu 3 (MKT trả kết quả)
// và phiếu 6 (Hoàn tất), vì 2 phiếu này cùng nội dung t8FlyerTiers.
const T8_NOTE_LINKS: Record<string, { note?: string; picUrl?: string }> = {
  '8850009900017': { note: 'Chỉ 2 suất/ngày, khách xếp hàng trước 9h', picUrl: 'https://www.dienmayxanh.com/may-in/canon-pixma-g2010' },
  '8850009900024': { note: 'Quay số ngẫu nhiên, không đổi được sản phẩm khác', picUrl: 'https://www.dienmayxanh.com/phu-kien/combo-qua-tang-t8' },
  '8840001000017': { note: 'Tặng kèm khi mua điện thoại từ 5 triệu', picUrl: 'https://www.dienmayxanh.com/phu-kien-dien-thoai/cap-sac-type-c-1m' },
  '8840001000024': { note: 'Hàng chính hãng, bảo hành 12 tháng', picUrl: 'https://www.dienmayxanh.com/phu-kien-dien-thoai/adapter-sac-20w' },
  '8840001000031': { note: 'Còn 50 sản phẩm tại kho HCM', picUrl: 'https://www.dienmayxanh.com/phu-kien-may-tinh/chuot-dareu-lm106g' },
  '8840001000048': { note: 'Cần bổ sung hình chụp thực tế trước khi in', picUrl: 'https://www.dienmayxanh.com/balo-tui-chong-soc/togo-keo-ngang' },
  '8840001000055': { note: 'Ưu tiên trưng bày đầu kệ phụ kiện', picUrl: 'https://www.dienmayxanh.com/sac-du-phong/jp388-10000mah' },
  '8935001100011': { note: 'Áp dụng đổi trả trong 7 ngày', picUrl: 'https://www.dienmayxanh.com/do-dung-nha-bep/chao-chong-dinh-26cm' },
  '8935001100028': { note: 'Tặng kèm khăn lau bếp', picUrl: 'https://www.dienmayxanh.com/binh-dun-sieu-toc/rapido-rk2015-c' },
  '8935001100035': { note: 'Hàng trưng bày, còn 8 sản phẩm', picUrl: 'https://www.dienmayxanh.com/ban-ui-hoi-nuoc/tefal-fv1955e0' },
  '8935001100042': { note: 'Giao hàng miễn phí nội thành' },
  '8935001100059': { note: 'Tặng kèm hộp giữ nhiệt', picUrl: 'https://www.dienmayxanh.com/noi-com-dien/bluestone-rcb-5520' },
  '8850002200015': { note: 'Áp dụng khi mua kèm Laptop văn phòng', picUrl: 'https://www.dienmayxanh.com/man-hinh-may-tinh/dell-24-inch' },
  '8850002200022': { note: 'Tặng Office 365 bản quyền 1 năm', picUrl: 'https://www.dienmayxanh.com/laptop/hp-15-sinh-vien' },
  '8850002200039': { note: 'Ưu tiên trưng bày khu vực AI PC', picUrl: 'https://www.dienmayxanh.com/laptop/asus-zenbook-14-ai' },
  '8850002200046': { note: 'Chờ xác nhận lại giá KM từ NCC', picUrl: 'https://www.dienmayxanh.com/laptop-gaming/acer-nitro-v' },
  '8850002300012': { note: 'Áp dụng trả góp 0%', picUrl: 'https://www.dienmayxanh.com/dtdd/samsung-galaxy-a16' },
  '8850002300029': { note: 'Tặng kèm ốp lưng chính hãng', picUrl: 'https://www.dienmayxanh.com/dtdd/samsung-galaxy-a56' },
  '8850002300036': { note: 'Trả chậm 0% qua thẻ tín dụng', picUrl: 'https://www.dienmayxanh.com/tablet/ipad-a16-128gb' },
  '8850002300043': { note: 'Tặng kèm khi mua Laptop Gaming', picUrl: 'https://www.dienmayxanh.com/balo-laptop/chong-soc-15-6-inch' },
  '8850002300067': { note: 'Cần chốt lại mẫu mã trước khi in', picUrl: 'https://www.dienmayxanh.com/tai-nghe-bluetooth/loa-mini-t8' },
  '8935003300019': { note: 'Còn 15 sản phẩm tại kho HCM', picUrl: 'https://www.dienmayxanh.com/may-xay-sinh-to/sunhouse-shd5120dmx' },
  '8935003300026': { note: 'Giao hàng miễn phí nội thành', picUrl: 'https://www.dienmayxanh.com/quat-treo-tuong/asia-vy628890' },
  '8935003300033': { note: 'Kiểm tra lại giá KM trước khi in chính thức', picUrl: 'https://www.dienmayxanh.com/may-loc-nuoc/kangaroo-kg11a3' },
}

// Ghi chú riêng cho phiếu 8 (MKT trả kết quả) qua withExtras — picUrl ở đây trùng giá trị đã khai báo sẵn trong
// PRODUCT_POOL (mọi phiếu dùng chung pool đều có link hình), chỉ note là đặc thù riêng của phiếu 8.
const ID8_NOTE_LINKS: Record<string, { note?: string; picUrl?: string }> = {
  '0194253789012': { note: 'Bảo hành chính hãng Apple 12 tháng', picUrl: 'https://www.dienmayxanh.com/dtdd/iphone-17-128gb' },
  '8806095123456': { note: 'Tặng kèm sạc nhanh 45W', picUrl: 'https://www.dienmayxanh.com/dtdd/samsung-galaxy-s26-5g' },
  '4711387296451': { note: 'Ưu tiên trưng bày khu vực học sinh sinh viên', picUrl: 'https://www.dienmayxanh.com/laptop/asus-vivobook-15-a1504' },
  '0195949012345': { note: 'Trả góp 0% qua thẻ tín dụng', picUrl: 'https://www.dienmayxanh.com/laptop/macbook-air-m4-13-inch' },
  '0196123456789': { note: 'Tặng túi chống sốc khi mua kèm', picUrl: 'https://www.dienmayxanh.com/laptop/dell-inspiron-15' },
  '0196234567890': { note: 'Hàng mới về, còn nhiều màu', picUrl: 'https://www.dienmayxanh.com/laptop/lenovo-ideapad-slim-3' },
  '0196345678901': { note: 'Phù hợp văn phòng, nhẹ 1.5kg', picUrl: 'https://www.dienmayxanh.com/laptop/hp-240-g9' },
  '0196456789012': { note: 'Giá tốt nhất phân khúc phổ thông', picUrl: 'https://www.dienmayxanh.com/laptop/acer-aspire-3' },
  '0196567890123': { note: 'Thiết kế mỏng nhẹ, pin 10 tiếng', picUrl: 'https://www.dienmayxanh.com/laptop/msi-modern-14' },
  '0196678901234': { note: 'Cần xác nhận lại số lượng tồn kho', picUrl: 'https://www.dienmayxanh.com/laptop-gaming/acer-nitro-v' },
  '0196789012345': { note: 'Ưu tiên trưng bày khu vực AI PC', picUrl: 'https://www.dienmayxanh.com/laptop/asus-zenbook-14-ai' },
  '0196890123456': { note: 'Tặng Office 365 bản quyền 1 năm', picUrl: 'https://www.dienmayxanh.com/laptop/hp-15-sinh-vien' },
  '8934563021458': { note: 'Tặng kèm cọ vệ sinh chuyên dụng', picUrl: 'https://www.dienmayxanh.com/noi-chien-khong-dau/sunhouse-5l' },
  '8809123456789': { note: 'Bảo hành 24 tháng chính hãng', picUrl: 'https://www.dienmayxanh.com/robot-hut-bui/ecovacs-deebot' },
  '8935001100028': { note: 'Tặng kèm khăn lau bếp', picUrl: 'https://www.dienmayxanh.com/binh-dun-sieu-toc/rapido-rk2015-c' },
  '8935001100042': { note: 'Giao hàng miễn phí nội thành' },
  '8840001000017': { note: 'Tặng kèm khi mua điện thoại từ 5 triệu', picUrl: 'https://www.dienmayxanh.com/phu-kien-dien-thoai/cap-sac-type-c-1m' },
  '8840001000024': { note: 'Hàng chính hãng, bảo hành 12 tháng', picUrl: 'https://www.dienmayxanh.com/phu-kien-dien-thoai/adapter-sac-20w' },
  '8840001000031': { note: 'Còn 50 sản phẩm tại kho HCM', picUrl: 'https://www.dienmayxanh.com/phu-kien-may-tinh/chuot-dareu-lm106g' },
  '8840001000055': { note: 'Ưu tiên trưng bày đầu kệ phụ kiện', picUrl: 'https://www.dienmayxanh.com/sac-du-phong/jp388-10000mah' },
  '8840005500035': { note: 'Tặng kèm dây đeo dự phòng', picUrl: 'https://www.dienmayxanh.com/dong-ho-thong-minh/xiaomi-watch' },
  '8936012300011': { note: 'Áp dụng mua 2 tặng 1 khăn ướt', picUrl: 'https://www.dienmayxanh.com/me-be/bim-bobby-size-m' },
  '8936012300028': { note: 'Hàng nhập khẩu, hạn dùng còn 18 tháng', picUrl: 'https://www.dienmayxanh.com/me-be/sua-bot-nan-nga-800g' },
  '8936012300035': { note: 'Bảo hành khung 12 tháng', picUrl: 'https://www.dienmayxanh.com/me-be/xe-day-em-be-gap-gon' },
  '8936012300042': { note: 'Tặng kèm yếm ăn dặm silicon', picUrl: 'https://www.dienmayxanh.com/me-be/ghe-an-dam-da-nang' },
  '8938012400011': { note: 'Phù hợp da nhạy cảm', picUrl: 'https://www.dienmayxanh.com/lam-dep/sua-rua-mat-cetaphil-500ml' },
  '8938012400028': { note: 'Hàng chính hãng Nhật Bản', picUrl: 'https://www.dienmayxanh.com/lam-dep/kem-chong-nang-anessa' },
  '8938012400035': { note: 'Bảo hành 6 tháng, tặng kèm pin sạc', picUrl: 'https://www.dienmayxanh.com/lam-dep/may-massage-cam-tay' },
  '8938012400042': { note: 'Hàng nội địa Nhật, có tem phụ', picUrl: 'https://www.dienmayxanh.com/lam-dep/vitamin-c-dhc-60-vien' },
}

// Dựng danh sách duyệt theo từng ngành hàng của chiến dịch — mỗi NH 1 dòng: ai duyệt, lúc nào (giãn cách 25 phút cho tự nhiên).
function mockNhApprovals(tiers: Pick<PosmCampaign, 'frontTiers' | 'backTiers'>, baseAt: string, feedback?: string): PosmNhApproval[] {
  return campaignNganhHangs({ layoutType: 'Tờ rơi', ...tiers }).map((nganhHang, i) => ({
    nganhHang,
    approvedBy: staffFor(nganhHang),
    approvedAt: new Date(new Date(baseAt).getTime() + i * 25 * 60_000).toISOString(),
    feedback: i === 0 ? feedback : undefined,
  }))
}

// Tờ rơi "Laptop tựu trường T8" — nội dung mặt trước/sau lấy đúng theo ảnh mẫu thực tế:
// mặt trước = quà tặng 0đ (máy in/phụ kiện trúng thưởng) + phụ kiện & gia dụng giá sốc,
// mặt sau = laptop/màn hình tặng Office + điện thoại/tablet/phụ kiện giảm 10% + gia dụng.
// Mỗi tầng lấp ĐẦY đúng FLYER_TIER_LIMITS: trước T1=2 (1+1), trước T2=10 (5+5), sau T1=4 (1+3), sau T2=5 (2+1+2), sau T3=3/8.
// Dùng chung cho 2 phiếu demo cùng nội dung, khác thời điểm/trạng thái: showcase "MKT trả kết quả" (id 3) và "Hoàn tất" (id 6).
function t8FlyerTiers(key: string, updatedAt: string): Pick<PosmCampaign, 'frontTiers' | 'backTiers'> {
  return {
    frontTiers: [
      { id: `${key}-f1`, label: 'Tầng 1 · Quà tặng 0đ', categories: [
        { id: `${key}-f1c1`, nganhHang: 'Gia dụng', slotCount: 1, registrations: regs(`${key}f1a`, [
          ['8850009900017', 'Máy in Canon PIXMA (02 suất/ngày)', 1090000, 0],
        ], updatedAt) },
        { id: `${key}-f1c2`, nganhHang: 'Đồng hồ - Phụ kiện', slotCount: 1, registrations: regs(`${key}f1b`, [
          ['8850009900024', 'Phụ kiện trúng thưởng (20 suất/ngày)', 150000, 0],
        ], updatedAt) },
      ] },
      { id: `${key}-f2`, label: 'Tầng 2 · Phụ kiện & Gia dụng giá sốc', categories: [
        { id: `${key}-f2c1`, nganhHang: 'Đồng hồ - Phụ kiện', slotCount: 5, registrations: regs(`${key}f2a`, [
          ['8840001000017', 'Cáp sạc Type-C 1m', 59000, 10000],
          ['8840001000024', 'Adapter sạc 20W', 149000, 20000],
          ['8840001000031', 'Chuột không dây DareU LM106G', 99000, 20000],
          ['8840001000048', 'Túi chống sốc Togo Kéo Ngang', 129000, 40000],
          ['8840001000055', 'Sạc dự phòng JP388 10.000mAh', 199000, 80000],
        ], updatedAt) },
        { id: `${key}-f2c2`, nganhHang: 'Gia dụng', slotCount: 5, registrations: regs(`${key}f2b`, [
          ['8935001100011', 'Chảo nhôm chống dính 26cm', 89000, 10000],
          ['8935001100028', 'Bình đun siêu tốc Rapido RK2015-C 2L', 399000, 250000],
          ['8935001100035', 'Bàn ủi hơi nước Tefal FV1955E0 1400W', 590000, 290000],
          ['8935001100042', 'Quạt đứng Midea FS40-10NAVN(K)', 690000, 450000, 'https://www.dienmayxanh.com/quat-dieu-hoa'],
          ['8935001100059', 'Nồi cơm điện Bluestone RCB-5520 1.8L', 790000, 490000],
        ], updatedAt) },
      ] },
    ],
    backTiers: [
      { id: `${key}-b1`, label: 'Tầng 1 · Laptop & Màn hình', categories: [
        { id: `${key}-b1c1`, nganhHang: 'Điện tử - Điện lạnh', slotCount: 1, registrations: regs(`${key}b1a`, [
          ['8850002200015', 'Màn hình máy tính Dell 24"', 2490000, 1090000],
        ], updatedAt) },
        { id: `${key}-b1c2`, nganhHang: 'Laptop', slotCount: 3, registrations: regs(`${key}b1b`, [
          ['8850002200022', 'Laptop Sinh viên HP 15', 17990000, 15990000],
          ['8850002200039', 'Laptop AI Asus Zenbook 14', 23990000, 21990000],
          ['8850002200046', 'Laptop Gaming Acer Nitro V', 25990000, 22990000],
        ], updatedAt) },
      ] },
      { id: `${key}-b2`, label: 'Tầng 2 · Điện thoại - Tablet - Phụ kiện', categories: [
        { id: `${key}-b2c1`, nganhHang: 'Điện thoại', slotCount: 2, registrations: regs(`${key}b2a`, [
          ['8850002300012', 'Điện thoại giá sốc Galaxy A16', 3490000, 2990000],
          ['8850002300029', 'Điện thoại AI Galaxy A56', 5990000, 4990000],
        ], updatedAt) },
        { id: `${key}-b2c2`, nganhHang: 'Tablet', slotCount: 1, registrations: regs(`${key}b2b`, [
          ['8850002300036', 'iPad A16 128GB', 13990000, 12490000],
        ], updatedAt) },
        { id: `${key}-b2c3`, nganhHang: 'Đồng hồ - Phụ kiện', slotCount: 2, registrations: regs(`${key}b2c`, [
          ['8850002300043', 'Balo túi chống sốc', 149000, 80000],
          ['8850002300067', 'Tai nghe Bluetooth / Loa', 290000, 190000],
        ], updatedAt) },
      ] },
      { id: `${key}-b3`, label: 'Tầng 3 · Gia dụng', categories: [
        { id: `${key}-b3c1`, nganhHang: 'Gia dụng', slotCount: 3, registrations: regs(`${key}b3`, [
          ['8935003300019', 'Máy xay sinh tố Sunhouse SHD5120DMX 350W', 840000, 390000],
          ['8935003300026', 'Quạt lửng Asia VY628890 Đen', 900000, 450000],
          ['8935003300033', 'Máy lọc nước Kangaroo KG11A3 11 lõi', 12990000, 8490000],
        ], updatedAt) },
      ] },
    ],
  }
}

// ===============================================================================
// DATA DEMO — CHỈ 1 loại campaign: TỜ RƠI, phủ đủ 8 trạng thái, ID cột là số.
// Mỗi tầng tuân thủ FLYER_TIER_LIMITS (trước: 2, 10 · sau: 4, 5, 8) — có thể nhiều ngành hàng/tầng,
// miễn tổng slotCount trong tầng không vượt mức quy định. Riêng phiếu "Mới" (id 1) lấp ĐẦY đúng mọi tầng
// (như khi vừa được tạo qua validation bắt buộc), các phiếu khác giữ slot gọn để demo nhẹ.
// Mỗi ngành hàng luôn hiển thị ĐỦ số dòng theo slotCount (dòng đã đăng ký + dòng trống còn lại).
// Feedback + Duyệt là của CẢ chiến dịch (nhFeedback/nhApproved ở cấp campaign), không theo từng dòng sản phẩm.
// Mỗi dòng sản phẩm có "Người cập nhật"/"Ngày cập nhật" (updatedBy/updatedAt) riêng.
// Data từng dòng khớp trạng thái:
//   Mới            → mọi tầng đã lấp đầy slot (đúng FLYER_TIER_LIMITS), đăng ký rỗng, CHƯA có thông tin AI nào
//                    (không kết quả kiểm tra dữ liệu, không thành phẩm MKT/WF)
//   Đang cập nhật  → có ≥1 ngành hàng đã đăng ký sản phẩm nhưng CHƯA đủ mọi slot — ví dụ (2)
//   Đủ sản phẩm    → mọi slot ở mọi ngành hàng/tầng đã đăng ký đủ sản phẩm (hệ thống tự chuyển khi NH đăng ký xong
//                    slot cuối — xem isFullyRegistered/persistIfRegisterOnly) — ví dụ (9)
//   Chuyển MKT     → mọi slot đã fill đủ, chưa có thành phẩm MKT
//   MKT Đang xử lý → đã upload 2 hình (mặt trước/sau), AI Workflow đang chạy
//   MKT trả kết quả→ đủ 2 hình + WF passed, NH đang soạn feedback/duyệt cho cả phiếu (chưa lưu duyệt)
//   NH duyệt       → NH đã lưu duyệt cho cả phiếu (nhApproved = true)
//   Hoàn tất       → tab Chiến dịch POSM đã duyệt chốt
// Phiếu ID 3 & 6 dùng chung nội dung tờ rơi "Laptop tựu trường T8" (mặt trước/sau đúng ảnh mẫu) — id 3 đang ở
// "MKT trả kết quả" (đợt chạy 14–23/8), id 6 là đợt chạy trước đó đã "Hoàn tất" (12–21/6).
// ===============================================================================

export const posmNhCampaigns: PosmCampaign[] = [
  // (1) Mới — vừa được tạo, PHẢI lấp đầy đúng slot mọi tầng (front 2,10 · back 4,5,8) mới được lưu (xem validation ở handleSave),
  //     nên demo cũng lấp đầy 100% slotCount cho cả 5 tầng — nhưng registrations vẫn rỗng vì NH chưa đăng ký sản phẩm.
  //     Phiếu vừa tạo thì CHƯA có thông tin AI nào (không dataCheck*, không thành phẩm/WF) — khu AI cũng bị ẩn ở trạng thái này.
  {
    id: '1', group: 'nh', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi khai trương chi nhánh Q3/2026', createdAt: '2026-07-26', status: 'new',
    createdBy: 'Trần Quốc Bảo (POSM)',
    startDate: '2026-08-08', endDate: '2026-08-20', printDate: '2026-08-01', deployDate: '2026-08-06',
    description: 'Tờ rơi phát tại khu vực có chi nhánh mới khai trương.',
    note: 'Đã cấu hình đủ slot tờ rơi 2 mặt theo đúng quy định (2-10-4-5-8), chờ NH đăng ký sản phẩm.',
    ...standardFlyer('c1', 'empty'),
  },

  // (2) Đang cập nhật — Điện thoại (trước T1, slotCount 2) mới đăng ký 1/2, các ngành hàng khác còn trống
  //     → minh hoạ đúng "1 slot = 1 dòng": 1 dòng có sản phẩm + 1 dòng trống trong cùng ngành hàng.
  {
    id: '2', group: 'nh', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi Flash Sale cuối tuần', createdAt: '2026-07-20', status: 'checked',
    createdBy: 'Nguyễn Minh Châu (POSM)',
    startDate: '2026-08-01', endDate: '2026-08-03', printDate: '2026-07-27', deployDate: '2026-07-30',
    description: 'Tờ rơi flash sale áp dụng 2 ngày cuối tuần.',
    ...standardFlyer('c2', 'partial', '2026-07-21T09:10:00'),
  },

  // (9) Đủ sản phẩm — mọi slot ở mọi ngành hàng/tầng đã đăng ký đủ sản phẩm (Điện thoại 2/2, Laptop 6/6, Tablet 4/4,
  //     Gia dụng 4/4, Đồng hồ - Phụ kiện 5/5, Mẹ & bé 4/4, Làm đẹp - Sức khoẻ 4/4) → hệ thống tự chuyển trạng thái này.
  {
    id: '9', group: 'nh', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi khuyến mãi Laptop & Gia dụng T8', createdAt: '2026-07-24', status: 'products_full',
    createdBy: 'Trần Quốc Bảo (POSM)',
    startDate: '2026-08-05', endDate: '2026-08-18', printDate: '2026-07-30', deployDate: '2026-08-03',
    description: 'Tờ rơi khuyến mãi song song Laptop văn phòng và Gia dụng nhà bếp, đang trong giai đoạn NH đăng ký sản phẩm.',
    note: 'Đã đăng ký đủ sản phẩm cho mọi ngành hàng, sẵn sàng chuyển MKT.',
    frontTiers: [
      { id: 'c9-f1', label: 'Tầng 1 · Điện thoại', categories: [
        { id: 'c9-f1c1', nganhHang: 'Điện thoại', slotCount: 2, registrations: regs('c9f1', [
          ['6972436123456', 'OPPO Reno13 5G', 11990000, 10490000, 'https://www.dienmayxanh.com/dtdd/oppo-reno13-5g'],
          ['6941059765432', 'Xiaomi Redmi Note 14', 6990000, 5990000, 'https://www.dienmayxanh.com/dtdd/xiaomi-redmi-note-14'],
        ], '2026-07-25T10:00:00') },
      ] },
      { id: 'c9-f2', label: 'Tầng 2 · Laptop & Tablet', categories: [
        { id: 'c9-f2c1', nganhHang: 'Laptop', slotCount: 6, registrations: regs('c9f2a', [
          ['0196123456789', 'Laptop Dell Inspiron 15', 15990000, 13990000, 'https://www.dienmayxanh.com/laptop/dell-inspiron-15'],
          ['0196234567890', 'Laptop Lenovo IdeaPad Slim 3', 11990000, 10490000, 'https://www.dienmayxanh.com/laptop/lenovo-ideapad-slim-3'],
          ['0196345678901', 'Laptop HP 240 G9', 12990000, 11490000, 'https://www.dienmayxanh.com/laptop/hp-240-g9'],
          ['0196456789012', 'Laptop Acer Aspire 3', 13990000, 12490000, 'https://www.dienmayxanh.com/laptop/acer-aspire-3'],
          ['0196567890123', 'Laptop ASUS Vivobook 14', 14990000, 12990000, 'https://www.dienmayxanh.com/laptop/asus-vivobook-14'],
          ['0196678901234', 'MacBook Air M4 13"', 27990000, 25990000, 'https://www.dienmayxanh.com/laptop/macbook-air-m4-13-inch'],
        ], '2026-07-28T09:00:00') },
        { id: 'c9-f2c2', nganhHang: 'Tablet', slotCount: 4, registrations: regs('c9f2b', [
          ['8850012300011', 'iPad A16 128GB', 13990000, 12490000, 'https://www.dienmayxanh.com/tablet/ipad-a16-128gb'],
          ['8850012300028', 'Samsung Galaxy Tab A10', 6990000, 5990000, 'https://www.dienmayxanh.com/tablet/samsung-galaxy-tab-a10'],
          ['8850012300035', 'Xiaomi Pad 7', 8990000, 7490000, 'https://www.dienmayxanh.com/tablet/xiaomi-pad-7'],
          ['8850012300042', 'Lenovo Tab M11', 5990000, 4990000, 'https://www.dienmayxanh.com/tablet/lenovo-tab-m11'],
        ], '2026-07-28T09:00:00') },
      ] },
    ],
    backTiers: [
      { id: 'c9-b1', label: 'Tầng 1 · Gia dụng', categories: [
        { id: 'c9-b1c1', nganhHang: 'Gia dụng', slotCount: 4, registrations: regs('c9b1', [
          ['8935009900011', 'Máy hút bụi cầm tay Xiaomi', 1490000, 1190000, 'https://www.dienmayxanh.com/may-hut-bui-cam-tay/xiaomi'],
          ['8935009900028', 'Bình lọc nước Kangaroo để bàn', 890000, 690000, 'https://www.dienmayxanh.com/may-loc-nuoc/kangaroo-de-ban'],
          ['8935009900035', 'Nồi chiên không dầu Sunhouse 5L', 1990000, 1590000, 'https://www.dienmayxanh.com/noi-chien-khong-dau/sunhouse-5l'],
          ['8935009900042', 'Bếp hồng ngoại đôi Sunhouse', 990000, 790000, 'https://www.dienmayxanh.com/bep-hong-ngoai/sunhouse-doi'],
        ], '2026-07-28T09:00:00') },
      ] },
      { id: 'c9-b2', label: 'Tầng 2', categories: [
        { id: 'c9-b2c1', nganhHang: 'Đồng hồ - Phụ kiện', slotCount: 5, registrations: regs('c9b2', [
          ['8840005500011', 'Cáp sạc Type-C 1m', 59000, 39000, 'https://www.dienmayxanh.com/phu-kien-dien-thoai/cap-sac-type-c-1m'],
          ['8840005500028', 'Tai nghe Bluetooth JBL', 590000, 490000, 'https://www.dienmayxanh.com/tai-nghe-bluetooth/jbl'],
          ['8840005500035', 'Đồng hồ thông minh Xiaomi', 990000, 790000, 'https://www.dienmayxanh.com/dong-ho-thong-minh/xiaomi-watch'],
          ['8840005500042', 'Sạc dự phòng 10.000mAh', 299000, 199000, 'https://www.dienmayxanh.com/sac-du-phong/10000mah'],
          ['8840005500059', 'Chuột không dây Logitech', 199000, 149000, 'https://www.dienmayxanh.com/phu-kien-may-tinh/chuot-logitech'],
        ], '2026-07-28T09:00:00') },
      ] },
      { id: 'c9-b3', label: 'Tầng 3', categories: [
        { id: 'c9-b3c1', nganhHang: 'Mẹ & bé', slotCount: 4, registrations: regs('c9b3a', [
          ['8936012300011', 'Bỉm Bobby size M 62 miếng', 259000, 219000, 'https://www.dienmayxanh.com/me-be/bim-bobby-size-m'],
          ['8936012300028', 'Sữa bột Nan Nga 800g', 550000, 490000, 'https://www.dienmayxanh.com/me-be/sua-bot-nan-nga-800g'],
          ['8936012300035', 'Xe đẩy em bé gấp gọn', 1990000, 1590000, 'https://www.dienmayxanh.com/me-be/xe-day-em-be-gap-gon'],
          ['8936012300042', 'Ghế ăn dặm đa năng', 890000, 690000, 'https://www.dienmayxanh.com/me-be/ghe-an-dam-da-nang'],
        ], '2026-07-28T09:00:00') },
        { id: 'c9-b3c2', nganhHang: 'Làm đẹp - Sức khoẻ', slotCount: 4, registrations: regs('c9b3b', [
          ['8938012400011', 'Sữa rửa mặt Cetaphil 500ml', 350000, 290000, 'https://www.dienmayxanh.com/lam-dep/sua-rua-mat-cetaphil-500ml'],
          ['8938012400028', 'Kem chống nắng Anessa', 550000, 450000, 'https://www.dienmayxanh.com/lam-dep/kem-chong-nang-anessa'],
          ['8938012400035', 'Máy massage cầm tay', 690000, 490000, 'https://www.dienmayxanh.com/lam-dep/may-massage-cam-tay'],
          ['8938012400042', 'Vitamin C DHC 60 viên', 250000, 190000, 'https://www.dienmayxanh.com/lam-dep/vitamin-c-dhc-60-vien'],
        ], '2026-07-28T09:00:00') },
      ] },
    ],
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-07-28T10:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },

  // (3) MKT trả kết quả — SHOWCASE theo tờ rơi "Laptop tựu trường T8" (đợt chạy 14–23/8): đủ 2 mặt + 2 hình + WF passed.
  //     NH đã soạn feedback cho cả phiếu nhưng CHƯA tick duyệt (đang cân nhắc) → minh hoạ trạng thái "đang xử lý review".
  {
    id: '3', group: 'nh', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi Laptop tựu trường T8', createdAt: '2026-07-05', status: 'mkt_done',
    createdBy: 'Lê Hoàng Nam (POSM)',
    startDate: '2026-08-14', endDate: '2026-08-23', printDate: '2026-08-06', deployDate: '2026-08-12',
    description: 'Tựu trường Sale To — 10 ngày 14–23/8. Mặt trước quà tặng 0đ + phụ kiện/gia dụng giá sốc, mặt sau laptop tặng Office bản quyền.',
    ...withExtras(t8FlyerTiers('c3', '2026-07-08T09:00:00'), T8_NOTE_LINKS),
    mktArtworks: t8Artwork('3'),
    mktArtworkUploadedAt: '2026-07-12T10:15:00',
    wfStatus: 'passed',
    wfCheckedAt: '2026-07-12T10:16:20',
    wfResult: 'AI Workflow: kiểm tra 2/2 mặt tờ rơi — font, màu thương hiệu, giá & tên sản phẩm khớp phiếu đăng ký.',
    wfResultDetails: wfTierResults({ layoutType: 'Tờ rơi', ...t8FlyerTiers('c3', '2026-07-08T09:00:00') }),
    nhFeedback: 'Đang rà lại giá KM nhóm phụ kiện quà tặng 0đ trước khi duyệt.',
    nhApproved: false,
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-07-06T09:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },
]

export const posmPromotionCampaigns: PosmCampaign[] = [
  // (4) Chuyển MKT — mọi slot đã fill đủ, chưa có thành phẩm MKT
  {
    id: '4', group: 'promotions', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi Sinh nhật DMX 07/2026', createdAt: '2026-07-10', status: 'transferred_mkt',
    createdBy: 'Nguyễn Minh Châu (POSM)',
    startDate: '2026-07-28', endDate: '2026-08-05', printDate: '2026-07-22', deployDate: '2026-07-26',
    description: 'Tờ rơi chương trình sinh nhật Điện Máy Xanh.',
    note: 'NH đã fill đủ slot, chuyển MKT dàn layout.',
    ...standardFlyer('c4', 'full', '2026-07-15T14:20:00'),
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-07-11T09:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },

  // (5) NH duyệt — đủ slot, NH đã lưu duyệt cho cả phiếu
  {
    id: '5', group: 'promotions', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi ra mắt TV & Laptop 2026', createdAt: '2026-06-28', status: 'nh_approved',
    createdBy: 'Trần Quốc Bảo (POSM)',
    startDate: '2026-07-10', endDate: '2026-07-31', printDate: '2026-07-04', deployDate: '2026-07-08',
    description: 'Tờ rơi ra mắt dòng sản phẩm mới, NH đã duyệt toàn bộ chiến dịch.',
    ...standardFlyer('c5', 'full', '2026-07-02T10:00:00'),
    mktArtworks: t8Artwork('5'),
    mktArtworkUploadedAt: '2026-07-04T09:00:00',
    wfStatus: 'passed',
    wfCheckedAt: '2026-07-04T09:01:10',
    wfResult: 'AI Workflow: kiểm tra 2/2 mặt tờ rơi — font, màu thương hiệu, giá & tên sản phẩm khớp phiếu đăng ký.',
    wfResultDetails: wfTierResults({ layoutType: 'Tờ rơi', ...standardFlyer('c5', 'full') }),
    nhFeedback: 'Đạt yêu cầu, duyệt toàn bộ chiến dịch.',
    nhApproved: true,
    nhApprovals: mockNhApprovals(standardFlyer('c5', 'full'), '2026-07-05T08:30:00', 'Đạt yêu cầu, duyệt toàn bộ chiến dịch.'),
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-06-29T09:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },

  // (6) Hoàn tất — cùng nội dung tờ rơi "Laptop tựu trường T8" như phiếu 3, nhưng là đợt chạy TRƯỚC đó (12–21/6),
  //     đã hoàn tất và phát hành. Minh hoạ chính flyer mẫu ở CẢ 2 trạng thái "MKT trả kết quả" và "Hoàn tất" theo yêu cầu.
  {
    id: '6', group: 'promotions', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi Laptop tựu trường T8', createdAt: '2026-06-01', status: 'completed',
    createdBy: 'Lê Hoàng Nam (POSM)',
    startDate: '2026-06-12', endDate: '2026-06-21', printDate: '2026-06-06', deployDate: '2026-06-10',
    description: 'Tựu trường Sale To — đợt chạy 12–21/6 (đợt trước). Mặt trước quà tặng 0đ + phụ kiện/gia dụng giá sốc, mặt sau laptop tặng Office bản quyền. Đã hoàn tất và phát hành.',
    ...withExtras(t8FlyerTiers('c6', '2026-06-05T09:00:00'), T8_NOTE_LINKS),
    mktArtworks: t8Artwork('6'),
    mktArtworkUploadedAt: '2026-06-08T10:00:00',
    wfStatus: 'passed',
    wfCheckedAt: '2026-06-08T10:01:20',
    wfResult: 'AI Workflow: kiểm tra 2/2 mặt tờ rơi — font, màu thương hiệu, giá & tên sản phẩm khớp phiếu đăng ký.',
    wfResultDetails: wfTierResults({ layoutType: 'Tờ rơi', ...t8FlyerTiers('c6', '2026-06-05T09:00:00') }),
    nhFeedback: 'Đạt yêu cầu, duyệt toàn bộ chiến dịch.',
    nhApproved: true,
    nhApprovals: mockNhApprovals(t8FlyerTiers('c6', '2026-06-05T09:00:00'), '2026-06-09T08:15:00', 'Đạt yêu cầu, duyệt toàn bộ chiến dịch.'),
    posmApproved: true,
    posmApprovedBy: 'Lê Hoàng Nam (POSM)',
    posmApprovedAt: '2026-06-09T14:20:00',
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-06-02T09:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },
]

export const posmMktCampaigns: PosmCampaign[] = [
  // (7) MKT Đang xử lý — đã upload 2 hình (mặt trước/sau), AI Workflow đang chạy
  {
    id: '7', group: 'mkt', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi ưu đãi thành viên VIP', createdAt: '2026-07-22', status: 'mkt_proccessing',
    createdBy: 'Nguyễn Minh Châu (POSM)',
    startDate: '2026-07-29', endDate: '2026-08-12', printDate: '2026-07-24', deployDate: '2026-07-27',
    description: 'Tờ rơi ưu đãi riêng khách hàng thành viên VIP.',
    ...standardFlyer('c7', 'full', '2026-07-25T11:30:00'),
    mktArtworks: t8Artwork('7'),
    mktArtworkUploadedAt: '2026-07-28T16:40:00',
    wfStatus: 'running',
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-07-23T09:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },

  // (8) MKT trả kết quả (thứ 2) — đủ 2 hình + WF passed, NH CHƯA nhập feedback/duyệt gì (trạng thái trống, mới nhận kết quả)
  {
    id: '8', group: 'mkt', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi Điện máy mùa nắng nóng', createdAt: '2026-07-01', status: 'mkt_done',
    createdBy: 'Trần Quốc Bảo (POSM)',
    startDate: '2026-07-15', endDate: '2026-08-15', printDate: '2026-07-09', deployDate: '2026-07-13',
    description: 'Tờ rơi nhóm điện máy cao điểm mùa nắng nóng.',
    ...withExtras(standardFlyer('c8', 'full', '2026-07-04T16:45:00'), ID8_NOTE_LINKS),
    mktArtworks: t8Artwork('8'),
    mktArtworkUploadedAt: '2026-07-06T11:05:00',
    wfStatus: 'passed',
    wfCheckedAt: '2026-07-06T11:06:15',
    wfResult: 'AI Workflow: kiểm tra 2/2 mặt tờ rơi — bố cục & nhận diện đạt, đối chiếu giá khớp phiếu.',
    wfResultDetails: wfTierResults({ layoutType: 'Tờ rơi', ...standardFlyer('c8', 'full') }),
    nhFeedback: 'Giá & tên sản phẩm khớp phiếu đăng ký, đạt yêu cầu.',
    nhApproved: false,
    dataCheckStatus: 'passed',
    dataCheckCheckedAt: '2026-07-02T09:00:00',
    dataCheckResult: 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.',
  },
]
