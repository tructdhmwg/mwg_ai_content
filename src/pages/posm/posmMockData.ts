export type PosmCampaignGroup = 'nh' | 'promotions' | 'mkt'
export type PosmCampaignStatus = 'new' | 'checked' | 'transferred_mkt' | 'mkt_proccessing' | 'mkt_done' | 'nh_approved' | 'completed'

export const LAYOUT_TYPES = ['Tờ rơi', 'Standee', 'Poster', 'Kệ trưng bày', 'Banner', 'Wobbler']

// Layout có sơ đồ slot ngành hàng + đăng ký sản phẩm (khác các layout đơn giản còn lại)
export const SLOT_LAYOUT_TYPES = ['Tờ rơi', 'Banner']

export const NGANH_HANG_OPTIONS = [
  'Điện thoại', 'Laptop', 'Tablet', 'Đồng hồ - Phụ kiện',
  'Điện tử - Điện lạnh', 'Gia dụng', 'Mẹ & bé', 'Làm đẹp - Sức khoẻ',
]

// bg/color theo đúng bảng màu OcpsBadge (features/ocps/components/OcpsBadge.tsx) để 3 tab POSM đồng bộ CSS với khu OCPS gốc
export const STATUS_META: Record<PosmCampaignStatus, { label: string; dot: string; bg: string; color: string }> = {
  new:             { label: 'Mới',           dot: '#0EA5E9', bg: '#E0F2FE', color: '#075985' },
  checked:         { label: 'Đang cập nhật', dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' },
  transferred_mkt: { label: 'Chuyển MKT',    dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  mkt_proccessing: { label: 'MKT Đang xử lý',    dot: '#3B82F6', bg: '#EFF6FF', color: '#5cbc81' },
  mkt_done:        { label: 'MKT trả kết quả',      dot: '#8B5CF6', bg: '#F5F3FF', color: '#5B21B6' },
  nh_approved:   { label: 'NH duyệt',    dot: '#D97706', bg: '#FEF3C7', color: '#92400E' },
  completed:       { label: 'Hoàn tất',      dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
}

// Dot màu theo loại layout — dùng chung 1 kiểu badge (dot + pill) với trạng thái cho đồng bộ
export const LAYOUT_META: Record<string, { dot: string; bg: string; color: string }> = {
  'Tờ rơi':        { dot: '#0EA5E9', bg: '#E0F2FE', color: '#075985' },
  Standee:         { dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  Poster:          { dot: '#8B5CF6', bg: '#F5F3FF', color: '#5B21B6' },
  'Kệ trưng bày':  { dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  Banner:          { dot: '#F97316', bg: '#FFEDD5', color: '#9A3412' },
  Wobbler:         { dot: '#EC4899', bg: '#FCE7F3', color: '#9D174D' },
}

// Trạng thái AI Workflow check thành phẩm MKT — chạy ngầm mỗi khi MKT upload/upload lại thành phẩm
export type PosmWfStatus = 'idle' | 'running' | 'passed' | 'failed'

export const WF_STATUS_META: Record<PosmWfStatus, { label: string; dot: string; bg: string; color: string }> = {
  idle:    { label: 'Chưa chạy',            dot: '#94A3B8', bg: '#F1F5F9', color: '#475569' },
  running: { label: 'Đang chạy AI Workflow', dot: '#3B82F6', bg: '#EFF6FF', color: '#1D4ED8' },
  passed:  { label: 'Đạt yêu cầu',           dot: '#16A34A', bg: '#DCFCE7', color: '#166534' },
  failed:  { label: 'Cần chỉnh sửa',         dot: '#EF4444', bg: '#FEE2E2', color: '#991B1B' },
}

export interface PosmSlotRegistration {
  id: string
  productCode: string
  productName: string
  originalPrice?: number
  promoPrice?: number
  note?: string
  picUrl?: string
  // NH feedback + duyệt từng dòng sản phẩm — chỉ nhập được ở tab Dashboard NH khi chiến dịch đang ở trạng thái "MKT trả kết quả"
  nhFeedback?: string
  nhApproved?: boolean
}

export interface PosmCategorySlot {
  id: string
  nganhHang: string
  slotCount: number
  registrations: PosmSlotRegistration[]
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
  startDate?: string
  endDate?: string
  description?: string
  note?: string
  // Chỉ dùng khi layoutType === 'Tờ rơi' — mặt trước/mặt sau đều gồm các tầng sản phẩm, mỗi tầng cấu hình ngành hàng + số slot riêng
  frontTiers?: PosmTier[]
  backTiers?: PosmTier[]
  // Chỉ dùng khi layoutType === 'Banner' — 1 mặt duy nhất, danh sách ngành hàng + số slot chung
  bannerCategories?: PosmCategorySlot[]
  // Thành phẩm MKT upload (chỉ tab Dashboard MKT được upload/upload lại) + kết quả AI Workflow check ngầm — hiện ở cả 3 tab
  mktArtworkUrl?: string
  mktArtworkName?: string
  mktArtworkUploadedAt?: string
  wfStatus?: PosmWfStatus
  wfCheckedAt?: string
  wfResult?: string
}

export const posmNhCampaigns: PosmCampaign[] = [
  { id: 'POSM-NH-001', group: 'nh', layoutType: 'Standee', campaignName: 'Standee khuyến mãi Điện thoại hè 2026', createdAt: '2026-06-02', status: 'nh_approved' },
  { id: 'POSM-NH-002', group: 'nh', layoutType: 'Kệ trưng bày', campaignName: 'Kệ trưng bày Laptop Gaming Q3', createdAt: '2026-06-18', status: 'mkt_done' },
  { id: 'POSM-NH-003', group: 'nh', layoutType: 'Wobbler', campaignName: 'Wobbler giảm giá Tai nghe không dây', createdAt: '2026-07-01', status: 'checked' },
  {
    id: 'POSM-NH-004', group: 'nh', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi ra mắt TV QLED 2026', createdAt: '2026-07-10', status: 'mkt_done',
    frontTiers: [
      { id: 't1', label: 'Tầng 1', categories: [
        { id: 'c1', nganhHang: 'Điện tử - Điện lạnh', slotCount: 4, registrations: [
          { id: 'r1', productCode: '8806094512347', productName: 'TV QLED 55" Samsung Q70D', originalPrice: 15990000, promoPrice: 13490000 },
          { id: 'r2', productCode: '6970602518823', productName: 'TV QLED 65" TCL C655', originalPrice: 18990000, promoPrice: 16490000 },
        ] },
      ] },
      { id: 't2', label: 'Tầng 2', categories: [
        { id: 'c2', nganhHang: 'Đồng hồ - Phụ kiện', slotCount: 3, registrations: [] },
      ] },
    ],
    backTiers: [
      { id: 'bt1', label: 'Tầng 1', categories: [
        { id: 'bc1', nganhHang: 'Mẹ & bé', slotCount: 2, registrations: [] },
      ] },
      { id: 'bt2', label: 'Tầng 2', categories: [] },
    ],
  },
  { id: 'POSM-NH-005', group: 'nh', layoutType: 'Banner', campaignName: 'Banner Back to School - Laptop', createdAt: '2026-07-20', status: 'completed',
    bannerCategories: [
      { id: 'c1', nganhHang: 'Laptop', slotCount: 5, registrations: [
        { id: 'r1', productCode: '4711387296451', productName: 'Laptop Asus Vivobook 15 A1504', originalPrice: 12990000, promoPrice: 10990000 },
      ] },
    ],
  },
]

export const posmPromotionCampaigns: PosmCampaign[] = [
  {
    id: 'KM-POSM-101', group: 'promotions', layoutType: 'Banner', campaignName: 'Banner Sale sinh nhật DMX 07/2026', createdAt: '2026-07-01', status: 'nh_approved',
    bannerCategories: [
      { id: 'c1', nganhHang: 'Điện thoại', slotCount: 6, registrations: [
        { id: 'r1', productCode: '0194253789012', productName: 'iPhone 17 128GB', originalPrice: 22990000, promoPrice: 21490000 },
        { id: 'r2', productCode: '8806095123456', productName: 'Samsung Galaxy S26', originalPrice: 19990000, promoPrice: 18490000 },
      ] },
      { id: 'c2', nganhHang: 'Tablet', slotCount: 4, registrations: [] },
    ],
  },
  { id: 'KM-POSM-102', group: 'promotions', layoutType: 'Standee', campaignName: 'Standee Mua 1 tặng 1 phụ kiện', createdAt: '2026-07-05', status: 'mkt_done' },
  {
    id: 'KM-POSM-103', group: 'promotions', layoutType: 'Tờ rơi', campaignName: 'Tờ rơi Flash Sale cuối tuần', createdAt: '2026-07-12', status: 'checked',
    frontTiers: [
      { id: 't1', label: 'Tầng 1', categories: [
        { id: 'c1', nganhHang: 'Điện thoại', slotCount: 4, registrations: [] },
      ] },
      { id: 't2', label: 'Tầng 2', categories: [] },
    ],
    backTiers: [
      { id: 'bt1', label: 'Tầng 1', categories: [] },
      { id: 'bt2', label: 'Tầng 2', categories: [] },
    ],
  },
  { id: 'KM-POSM-104', group: 'promotions', layoutType: 'Wobbler', campaignName: 'Wobbler giảm 50% phụ kiện', createdAt: '2026-07-18', status: 'transferred_mkt' },
  { id: 'KM-POSM-105', group: 'promotions', layoutType: 'Kệ trưng bày', campaignName: 'Kệ trưng bày quà tặng Trung thu 2026', createdAt: '2026-07-25', status: 'completed' },
]

export const posmMktCampaigns: PosmCampaign[] = [
  {
    id: 'MKT-POSM-201', group: 'mkt', layoutType: 'Banner', campaignName: 'Banner chiến dịch thương hiệu Q3/2026', createdAt: '2026-06-10', status: 'mkt_done',
    bannerCategories: [
      { id: 'c1', nganhHang: 'Gia dụng', slotCount: 3, registrations: [{ id: 'r1', productCode: '8934563021458', productName: 'Nồi chiên không dầu Sunhouse 5L', originalPrice: 1990000, promoPrice: 1590000 }] },
    ],
    mktArtworkName: 'banner-thuonghieu-q3.png',
    mktArtworkUploadedAt: '2026-06-12T09:30:00',
    wfStatus: 'passed',
    wfCheckedAt: '2026-06-12T09:31:20',
    wfResult: 'AI Workflow: bố cục đúng chuẩn, đủ ngành hàng đăng ký, không phát hiện lỗi.',
  },
  { id: 'MKT-POSM-202', group: 'mkt', layoutType: 'Poster', campaignName: 'Poster đồng bộ nhận diện cửa hàng mới', createdAt: '2026-06-25', status: 'completed' },
  { id: 'MKT-POSM-203', group: 'mkt', layoutType: 'Standee', campaignName: 'Standee sự kiện khai trương AVAKids', createdAt: '2026-07-08', status: 'nh_approved' },
  { id: 'MKT-POSM-204', group: 'mkt', layoutType: 'Wobbler', campaignName: 'Wobbler chương trình khách hàng thân thiết', createdAt: '2026-07-15', status: 'checked' },
  { id: 'MKT-POSM-205', group: 'mkt', layoutType: 'Kệ trưng bày', campaignName: 'Kệ trưng bày Topzone flagship', createdAt: '2026-07-22', status: 'transferred_mkt' },
]
