// ─── Master mock data cho khu OCPS ─────────────────────────────────────────
// Port từ _source_b_reference/src/data/mockData.js (đổi tên file tránh trùng
// src/data/mockData.ts của A). Dữ liệu giữ nguyên; riêng field `link` của
// NOTIFICATIONS được prefix `/ocps` theo quyết định route ở MERGE_PLAN.md.

import type {
  AuditEntry,
  DocRule,
  DocumentSlotsMap,
  FlowRequest,
  MktBrief,
  NotifyTemplate,
  OcpsItem,
  OcpsNotification,
  OcpsRole,
  OcpsUser,
  ReportScheduleConfig,
  SlaConfigRow,
} from '../types'

export const ROLES: Record<string, OcpsRole> = {
  VENDOR: 'vendor',
  NH: 'nh',
  CONTENT: 'content',
  MARKETING: 'marketing',
  ADMIN: 'admin',
}

// Ngành hàng Tivi (u3/v3, u8) là phạm vi ưu tiên MVP theo "Thông tin triển khai" — mốc 15/07/2026,
// 3 vai trò bắt buộc vận hành luồng cơ bản: NH, Content SEO/IT, Marketing.
export const USERS: OcpsUser[] = [
  { id: 'u1', name: 'HomeTech Vietnam', role: ROLES.VENDOR, vendorId: 'v1' },
  { id: 'u2', name: 'PureLife Corp', role: ROLES.VENDOR, vendorId: 'v2' },
  { id: 'u3', name: 'Minh Tuấn (NH Gia dụng)', role: ROLES.NH, nganhhang: 'Gia dụng' },
  { id: 'u4', name: 'Thu Hà (NH Mỹ phẩm)', role: ROLES.NH, nganhhang: 'Mỹ phẩm' },
  { id: 'u5', name: 'Bình (Content/IT)', role: ROLES.CONTENT },
  { id: 'u6', name: 'An (Marketing)', role: ROLES.MARKETING },
  { id: 'u7', name: 'Admin OCPS', role: ROLES.ADMIN },
  { id: 'u8', name: 'Quang (NH Tivi)', role: ROLES.NH, nganhhang: 'Tivi' },
  { id: 'u9', name: 'SmartVision Electronics', role: ROLES.VENDOR, vendorId: 'v3' },
]

export const ITEMS: OcpsItem[] = [
  {
    id: 'SP00198',
    modelCode: 'AF360-BLK',
    erpCreatedAt: '2026-04-10',
    ten: 'Nồi chiên không dầu Air360',
    nganhhang: 'Gia dụng',
    vendor: 'HomeTech Vietnam',
    vendorId: 'v1',
    linkFolder: 'https://drive.google.com/...',
    docStatus: 'du_toithieu',
    flow: 'ca_hai',
    seoStatus: 'dang_xu_ly',
    mktStatus: 'dang_san_xuat',
    slaConLai: -4,
    nguoiPhuTrachContent: 'Bình',
    nguoiPhuTrachMkt: 'An',
    ngayGuiYeuCau: '2026-06-20',
    erpLastSyncAt: '2026-06-17',
  },
  {
    id: 'SP00231',
    modelCode: 'AQP-X3-WHT',
    erpCreatedAt: '2026-03-22',
    ten: 'Máy lọc nước AquaPure X3',
    nganhhang: 'Gia dụng',
    vendor: 'PureLife Corp',
    vendorId: 'v2',
    linkFolder: 'https://drive.google.com/...',
    docStatus: 'du_full',
    flow: 'ca_hai',
    seoStatus: 'hoan_tat',
    mktStatus: 'hoan_tat',
    slaConLai: 3,
    nguoiPhuTrachContent: 'Bình',
    nguoiPhuTrachMkt: 'An',
    ngayGuiYeuCau: '2026-06-15',
    erpLastSyncAt: '2026-06-14',
  },
  {
    id: 'SP00177',
    modelCode: 'TMF-750-SLV',
    erpCreatedAt: '2026-05-02',
    ten: 'Bình giữ nhiệt ThermoFlask',
    nganhhang: 'Gia dụng',
    vendor: 'PureLife Corp',
    vendorId: 'v2',
    linkFolder: 'https://drive.google.com/...',
    docStatus: 'du_full',
    flow: 'chi_content',
    seoStatus: 'da_len_web',
    mktStatus: 'chua_yeu_cau',
    slaConLai: 5,
    nguoiPhuTrachContent: 'Bình',
    nguoiPhuTrachMkt: null,
    ngayGuiYeuCau: '2026-06-18',
    linkWeb: 'https://mediamart.vn/binh-giu-nhiet-thermoflask',
    erpLastSyncAt: '2026-06-16',
  },
  {
    id: 'SP00245',
    modelCode: 'NGL-SRM-30ML',
    erpCreatedAt: '2026-06-01',
    ten: 'Serum dưỡng da NaturGlow',
    nganhhang: 'Mỹ phẩm',
    vendor: 'HomeTech Vietnam',
    vendorId: 'v1',
    linkFolder: null,
    docStatus: 'thieu',
    flow: null,
    seoStatus: 'chua',
    mktStatus: 'chua_yeu_cau',
    slaConLai: -1,
    nguoiPhuTrachContent: null,
    nguoiPhuTrachMkt: null,
    ngayGuiYeuCau: null,
    erpLastSyncAt: '2026-06-21',
  },
  {
    id: 'SP00302',
    modelCode: 'SBX-BT53-BLK',
    erpCreatedAt: '2026-05-15',
    ten: 'Loa Bluetooth SoundBoom X',
    nganhhang: 'Điện tử',
    vendor: 'HomeTech Vietnam',
    vendorId: 'v1',
    linkFolder: 'https://drive.google.com/...',
    docStatus: 'du_full',
    flow: 'chi_mkt',
    seoStatus: 'chua',
    mktStatus: 'cho_nghiem_thu',
    slaConLai: -1,
    nguoiPhuTrachContent: null,
    nguoiPhuTrachMkt: 'An',
    ngayGuiYeuCau: '2026-06-22',
    erpLastSyncAt: '2026-06-20',
  },
  {
    id: 'SP00077',
    modelCode: 'STP-2200W',
    erpCreatedAt: '2026-02-18',
    ten: 'Bàn ủi hơi nước SteamPro',
    nganhhang: 'Gia dụng',
    vendor: 'PureLife Corp',
    vendorId: 'v2',
    linkFolder: 'https://drive.google.com/...',
    docStatus: 'du_toithieu',
    flow: 'chi_content',
    seoStatus: 'cho',
    mktStatus: 'chua_yeu_cau',
    slaConLai: -9,
    nguoiPhuTrachContent: 'Bình',
    nguoiPhuTrachMkt: null,
    ngayGuiYeuCau: '2026-06-10',
    erpLastSyncAt: '2026-06-08',
  },
  {
    id: 'SP00318',
    modelCode: 'BLM-900-RED',
    erpCreatedAt: '2026-06-10',
    ten: 'Máy xay sinh tố BlendMax',
    nganhhang: 'Gia dụng',
    vendor: 'HomeTech Vietnam',
    vendorId: 'v1',
    linkFolder: null,
    docStatus: 'thieu',
    flow: null,
    seoStatus: 'chua',
    mktStatus: 'chua_yeu_cau',
    slaConLai: 2,
    nguoiPhuTrachContent: null,
    nguoiPhuTrachMkt: null,
    ngayGuiYeuCau: null,
    erpLastSyncAt: '2026-06-23',
  },
  // Ngành hàng Tivi — phạm vi ưu tiên MVP (mốc 15/07/2026)
  {
    id: 'SP00401',
    modelCode: 'UA55CU7000',
    erpCreatedAt: '2026-06-20',
    ten: 'Tivi Samsung Crystal UHD 55 inch',
    nganhhang: 'Tivi',
    vendor: 'SmartVision Electronics',
    vendorId: 'v3',
    linkFolder: 'https://drive.google.com/...',
    docStatus: 'du_full',
    flow: 'ca_hai',
    seoStatus: 'dang_xu_ly',
    mktStatus: 'dang_san_xuat',
    slaConLai: 1,
    nguoiPhuTrachContent: 'Bình',
    nguoiPhuTrachMkt: 'An',
    ngayGuiYeuCau: '2026-07-01',
    erpLastSyncAt: '2026-06-28',
  },
  {
    id: 'SP00415',
    modelCode: 'OLED65C4PSA',
    erpCreatedAt: '2026-06-25',
    ten: 'Tivi LG OLED 65 inch',
    nganhhang: 'Tivi',
    vendor: 'SmartVision Electronics',
    vendorId: 'v3',
    linkFolder: null,
    docStatus: 'thieu',
    flow: null,
    seoStatus: 'chua',
    mktStatus: 'chua_yeu_cau',
    slaConLai: -2,
    nguoiPhuTrachContent: null,
    nguoiPhuTrachMkt: null,
    ngayGuiYeuCau: null,
    erpLastSyncAt: '2026-07-03',
  },
]

// ─── DocRule — cấu hình rule tài liệu/upload theo ngành hàng (Admin cấu hình, không hardcode logic) ──
// Rule hiện tại áp dụng chung (Size < 3MB, ảnh tối thiểu ngang 1200px x freesize,
// JPEG/PNG, ảnh chụp sản phẩm phải nền trắng, ảnh do hãng tự thiết kế không ràng nền).
const DEFAULT_DOC_RULE: DocRule = {
  soAnhToiThieu: 2,
  sizeMaxMB: 3,
  minWidthPx: 1200,
  dinhDangChoPhep: ['jpg', 'jpeg', 'png'],
  nenTrangAnhSanPham: true,
  ghiChuNenTrang: 'Ảnh do hãng tự thiết kế không bắt buộc nền trắng',
}

export const DOC_RULES: Record<string, DocRule> = {
  'Gia dụng': { ...DEFAULT_DOC_RULE },
  'Mỹ phẩm': { ...DEFAULT_DOC_RULE, soAnhToiThieu: 3 },
  'Điện tử': { ...DEFAULT_DOC_RULE },
  'Tivi': { ...DEFAULT_DOC_RULE, soAnhToiThieu: 4 }, // TV cần nhiều góc chụp hơn (mặt trước, cạnh, cổng kết nối, remote)
  DEFAULT: { ...DEFAULT_DOC_RULE },
}

// Template file Spec (Excel) theo từng ngành hàng — NH/Vendor tải về điền thông số rồi upload lại vào slot Spec.
export const SPEC_TEMPLATE_URLS: Record<string, string> = {
  'Gia dụng': 'https://drive.google.com/drive/folders/spec-template-gia-dung',
  'Mỹ phẩm': 'https://drive.google.com/drive/folders/spec-template-my-pham',
  'Điện tử': 'https://drive.google.com/drive/folders/spec-template-dien-tu',
  'Tivi': 'https://drive.google.com/drive/folders/spec-template-tivi',
  DEFAULT: 'https://drive.google.com/drive/folders/spec-template-mac-dinh',
}

// ─── FlowRequest — yêu cầu xử lý do NH tạo, versioned, ghi lịch sử chọn/đổi/huỷ luồng ──
export const FLOW_REQUESTS: FlowRequest[] = [
  {
    id: 'fr-SP00198',
    itemId: 'SP00198',
    flow: 'ca_hai',
    trangThaiGui: 'da_gui',
    trangThaiKhaiBaoDuKien: 'cho_onweb',
    version: 1,
    createdAt: '2026-06-20',
    createdBy: 'Minh Tuấn (NH Gia dụng)',
    history: [
      { action: 'tao', flow: 'ca_hai', at: '2026-06-20', by: 'Minh Tuấn (NH Gia dụng)' },
      { action: 'gui', flow: 'ca_hai', at: '2026-06-20', by: 'Minh Tuấn (NH Gia dụng)' },
    ],
  },
  {
    id: 'fr-SP00231',
    itemId: 'SP00231',
    flow: 'ca_hai',
    trangThaiGui: 'da_gui',
    trangThaiKhaiBaoDuKien: 'da_onweb',
    version: 1,
    createdAt: '2026-06-15',
    createdBy: 'Minh Tuấn (NH Gia dụng)',
    history: [
      { action: 'tao', flow: 'ca_hai', at: '2026-06-15', by: 'Minh Tuấn (NH Gia dụng)' },
      { action: 'gui', flow: 'ca_hai', at: '2026-06-15', by: 'Minh Tuấn (NH Gia dụng)' },
    ],
  },
  {
    id: 'fr-SP00177',
    itemId: 'SP00177',
    flow: 'chi_content',
    trangThaiGui: 'da_gui',
    trangThaiKhaiBaoDuKien: 'da_onweb',
    version: 1,
    createdAt: '2026-06-18',
    createdBy: 'Minh Tuấn (NH Gia dụng)',
    history: [
      { action: 'tao', flow: 'chi_content', at: '2026-06-18', by: 'Minh Tuấn (NH Gia dụng)' },
      { action: 'gui', flow: 'chi_content', at: '2026-06-18', by: 'Minh Tuấn (NH Gia dụng)' },
    ],
  },
  {
    id: 'fr-SP00302',
    itemId: 'SP00302',
    flow: 'chi_mkt',
    trangThaiGui: 'da_gui',
    trangThaiKhaiBaoDuKien: 'chua_xu_ly',
    version: 1,
    createdAt: '2026-06-22',
    createdBy: 'Minh Tuấn (NH Gia dụng)',
    history: [
      { action: 'tao', flow: 'chi_mkt', at: '2026-06-22', by: 'Minh Tuấn (NH Gia dụng)' },
      { action: 'gui', flow: 'chi_mkt', at: '2026-06-22', by: 'Minh Tuấn (NH Gia dụng)' },
    ],
  },
  {
    id: 'fr-SP00077',
    itemId: 'SP00077',
    flow: 'chi_content',
    trangThaiGui: 'da_gui',
    trangThaiKhaiBaoDuKien: 'cho_onweb',
    version: 1,
    createdAt: '2026-06-10',
    createdBy: 'Minh Tuấn (NH Gia dụng)',
    history: [
      { action: 'tao', flow: 'chi_content', at: '2026-06-10', by: 'Minh Tuấn (NH Gia dụng)' },
      { action: 'gui', flow: 'chi_content', at: '2026-06-10', by: 'Minh Tuấn (NH Gia dụng)' },
    ],
  },
  {
    id: 'fr-SP00401',
    itemId: 'SP00401',
    flow: 'ca_hai',
    trangThaiGui: 'da_gui',
    trangThaiKhaiBaoDuKien: 'chua_xu_ly',
    version: 1,
    createdAt: '2026-07-01',
    createdBy: 'Quang (NH Tivi)',
    history: [
      { action: 'tao', flow: 'ca_hai', at: '2026-07-01', by: 'Quang (NH Tivi)' },
      { action: 'gui', flow: 'ca_hai', at: '2026-07-01', by: 'Quang (NH Tivi)' },
    ],
  },
]

// trangThaiBoSung (theo slot): chỉ có khi slot đã có file upload; slot rỗng chưa có gì
// để xác nhận nên bỏ field. Seed dữ liệu cũ coi như đã xác nhận 'bo_sung_du'
// (trừ slot đang bị Content ghi chú thiếu thì giữ 'con_thieu').
export const DOCUMENT_SLOTS: DocumentSlotsMap = {
  SP00198: {
    hinhanh: { files: [{ name: 'front.jpg', date: '2026-06-18', by: 'HomeTech' }, { name: 'side.jpg', date: '2026-06-18', by: 'HomeTech' }], ghiChu: 'Thiếu ảnh mặt lưng', trangThaiBoSung: 'con_thieu' },
    spec: { files: [], ghiChu: 'Cần file thông số kỹ thuật PDF' },
    khac: { files: [{ name: 'manual.pdf', date: '2026-06-19', by: 'HomeTech' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
  },
  SP00231: {
    hinhanh: { files: [{ name: 'front.jpg', date: '2026-06-14' }, { name: 'back.jpg', date: '2026-06-14' }, { name: 'detail.jpg', date: '2026-06-14' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    spec: { files: [{ name: 'spec_aquapure.pdf', date: '2026-06-14' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    khac: { files: [{ name: 'warranty.pdf', date: '2026-06-14' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
  },
  SP00177: {
    hinhanh: { files: [{ name: 'main.jpg', date: '2026-06-17' }, { name: 'detail.jpg', date: '2026-06-17' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    spec: { files: [{ name: 'thermoflask_spec.pdf', date: '2026-06-17' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    khac: { files: [{ name: 'brochure.pdf', date: '2026-06-17' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
  },
  SP00245: {
    hinhanh: { files: [], ghiChu: 'Cần ảnh sản phẩm chính diện' },
    spec: { files: [], ghiChu: null },
    khac: { files: [], ghiChu: null },
  },
  SP00302: {
    hinhanh: { files: [{ name: 'soundboom_front.jpg', date: '2026-06-21' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    spec: { files: [{ name: 'soundboom_spec.pdf', date: '2026-06-21' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    khac: { files: [], ghiChu: null },
  },
  SP00077: {
    hinhanh: { files: [{ name: 'steampro_main.jpg', date: '2026-06-09' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    spec: { files: [], ghiChu: 'Cần bảng thông số công suất, nhiệt độ' },
    khac: { files: [], ghiChu: null },
  },
  SP00318: {
    hinhanh: { files: [], ghiChu: null },
    spec: { files: [], ghiChu: null },
    khac: { files: [], ghiChu: null },
  },
  SP00401: {
    hinhanh: { files: [
      { name: 'front.jpg', date: '2026-06-29' },
      { name: 'side.jpg', date: '2026-06-29' },
      { name: 'ports.jpg', date: '2026-06-29' },
      { name: 'remote.jpg', date: '2026-06-29' },
    ], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    spec: { files: [{ name: 'samsung_crystal_uhd_spec.pdf', date: '2026-06-29' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
    khac: { files: [{ name: 'warranty_card.pdf', date: '2026-06-29' }], ghiChu: null, trangThaiBoSung: 'bo_sung_du' },
  },
  SP00415: {
    hinhanh: { files: [], ghiChu: 'Cần đủ 4 ảnh: mặt trước, cạnh, cổng kết nối, remote' },
    spec: { files: [], ghiChu: null },
    khac: { files: [], ghiChu: null },
  },
}

export const BO_SUNG_STATUS_LABEL: Record<string, string> = {
  dang_kiem_tra: 'Đang kiểm tra',
  bo_sung_du: 'Bổ sung đủ',
  con_thieu: 'Còn thiếu - Bổ sung thêm',
}

export const MKT_BRIEFS: MktBrief[] = [
  {
    id: 'brief-001',
    itemId: 'SP00198',
    tenSP: 'Nồi chiên không dầu Air360',
    nhomKenh: 'DMX',
    loaiBrief: 'hang_co_budget',
    loaiNhuCau: ['chup_anh', 'quay_clip'],
    kenh: ['Facebook', 'TikTok'],
    deadline: '2026-07-05',
    budget: '15.000.000 đ',
    briefText: 'Nhấn mạnh tính năng chiên không dầu, healthy lifestyle. Tone trẻ trung, năng động.',
    fileThamKhao: ['mood_board.pdf'],
    trangThai: 'dang_san_xuat',
    nguoiPhuTrach: 'An',
    ngayTao: '2026-06-20',
    vongChinhSua: 0,
    lichSuChinhSua: [],
  },
  {
    id: 'brief-002',
    itemId: 'SP00302',
    tenSP: 'Loa Bluetooth SoundBoom X',
    nhomKenh: 'TGDD',
    loaiBrief: 'bai_tin_trai_nghiem',
    loaiNhuCau: ['quay_clip'],
    kenh: ['YouTube', 'TikTok'],
    deadline: '2026-06-29',
    budget: '8.000.000 đ',
    briefText: 'Review loa: chất âm, kết nối Bluetooth 5.3, pin 20h. Hướng đến nhóm 18-30 tuổi.',
    fileThamKhao: [],
    trangThai: 'cho_nghiem_thu',
    nguoiPhuTrach: 'An',
    ngayTao: '2026-06-22',
    vongChinhSua: 1,
    lichSuChinhSua: [
      { vong: 1, ghiChu: 'Đổi thumbnail, thêm cảnh outdoor', ngay: '2026-06-25' },
    ],
    linkFolder: 'https://drive.google.com/soundboom-assets',
    linkMedia: 'https://tiktok.com/@mediamart/soundboom',
  },
  {
    id: 'brief-003',
    itemId: 'SP00231',
    tenSP: 'Máy lọc nước AquaPure X3',
    nhomKenh: 'DMX',
    loaiBrief: 'hang_co_budget',
    loaiNhuCau: ['chup_anh'],
    kenh: ['Facebook'],
    deadline: '2026-06-20',
    budget: '5.000.000 đ',
    briefText: 'Ảnh sản phẩm cho bài quảng cáo Facebook, nền trắng + lifestyle.',
    fileThamKhao: [],
    trangThai: 'hoan_tat',
    nguoiPhuTrach: 'An',
    ngayTao: '2026-06-10',
    vongChinhSua: 0,
    lichSuChinhSua: [],
    linkFolder: 'https://drive.google.com/aquapure-assets',
    linkMedia: 'https://facebook.com/mediamart/aquapure',
  },
  {
    id: 'brief-004',
    itemId: 'SP00401',
    tenSP: 'Tivi Samsung Crystal UHD 55 inch',
    nhomKenh: 'DMX',
    loaiBrief: 'hang_co_budget',
    loaiNhuCau: ['chup_anh', 'quay_clip'],
    kenh: ['Facebook', 'YouTube'],
    deadline: '2026-07-12',
    budget: '20.000.000 đ',
    briefText: 'Nhấn mạnh độ phân giải 4K, công nghệ Crystal Processor. Ưu tiên ngành Tivi cho mốc MVP 15/07.',
    fileThamKhao: [],
    trangThai: 'dang_san_xuat',
    nguoiPhuTrach: 'An',
    ngayTao: '2026-07-01',
    vongChinhSua: 0,
    lichSuChinhSua: [],
  },
]

// category: 'event' | 'sla' | 'digest' — dùng để nhóm/lọc thông báo
// count: số lần notify cùng loại đã gộp lại (chống spam khi sự kiện lặp lại trước khi đọc)
// Lưu ý: link đã prefix /ocps theo quyết định route của MERGE_PLAN.md.
export const NOTIFICATIONS: OcpsNotification[] = [
  { id: 'n1', role: [ROLES.MARKETING], type: 'new_brief', entityId: 'brief-001', text: 'NH vừa gửi brief mới cho SP00198 — Nồi chiên Air360', read: false, time: '5 phút trước', link: '/ocps/marketing/brief/brief-001', category: 'event', count: 1 },
  { id: 'n2', role: [ROLES.NH, ROLES.ADMIN], type: 'content_done', entityId: 'SP00177', text: 'Content đã lên web cho SP00177 — ThermoFlask', read: true, time: 'Hôm qua', link: '/ocps/nh/product/SP00177', category: 'event', count: 1 },
  { id: 'n3', role: [ROLES.ADMIN], type: 'sla_breach', entityId: 'SP00198', text: 'SP00198 — Nồi chiên Air360 trễ SLA 4 ngày (MKT)', read: false, time: '2 ngày trước', link: '/ocps/admin/god-view', category: 'sla', count: 1 },
  { id: 'n4', role: [ROLES.VENDOR], type: 'missing_doc', entityId: 'SP00198', text: 'SP00198 — Thiếu ảnh mặt lưng, cần bổ sung', read: false, time: '3 ngày trước', link: '/ocps/vendor/upload', category: 'event', count: 1 },
  { id: 'n5', role: [ROLES.NH], type: 'review_needed', entityId: 'SP00302', text: 'SP00302 — SoundBoom X đang chờ nghiệm thu từ bạn', read: false, time: '1 ngày trước', link: '/ocps/nh/product/SP00302', category: 'event', count: 1 },
  { id: 'n6', role: [ROLES.ADMIN], type: 'sla_breach', entityId: 'SP00077', text: 'SP00077 — Bàn ủi SteamPro trễ SLA 9 ngày (Content)', read: false, time: '5 ngày trước', link: '/ocps/admin/god-view', category: 'sla', count: 1 },
  { id: 'n7', role: [ROLES.CONTENT], type: 'new_task', entityId: 'SP00231', text: 'SP00231 — AquaPure X3 đã đủ tài liệu, sẵn sàng xử lý', read: true, time: '3 ngày trước', link: '/ocps/content/process/SP00231', category: 'event', count: 1 },
  { id: 'n8', role: [ROLES.NH], type: 'sla_warning', entityId: 'SP00198', text: 'SP00198 — Marketing trễ deadline 4 ngày, cần theo dõi', read: false, time: '2 ngày trước', link: '/ocps/nh/product/SP00198', category: 'sla', count: 1 },
]

// source: 'admin_override' (bắt buộc lý do) | 'auto' (hệ thống tự ghi khi thay đổi trạng thái)
export const AUDIT_LOG: AuditEntry[] = [
  { id: 'a1', itemId: 'SP00198', by: 'Admin OCPS', from: 'dang_san_xuat', to: 'cho_nghiem_thu', reason: 'MKT đã hoàn tất, override để chạy đúng flow', time: '2026-06-28 09:15', source: 'admin_override' },
]

export const SLA_CONFIG: SlaConfigRow[] = [
  { trangThai: 'Thiếu tài liệu', ngayCanhBao: 3, ngayEscalate: 7 },
  { trangThai: 'Chờ xử lý Content', ngayCanhBao: 2, ngayEscalate: 5 },
  { trangThai: 'Đang sản xuất MKT', ngayCanhBao: 2, ngayEscalate: 5 },
  { trangThai: 'Chờ nghiệm thu', ngayCanhBao: 1, ngayEscalate: 3 },
]

// Lịch báo cáo định kỳ gửi cho NH — chu kỳ tính bằng ngày, do Admin cấu hình
export const REPORT_SCHEDULE_CONFIG: ReportScheduleConfig = { chuKyNgay: 14, ngayGuiKeTiep: '2026-07-13' }

export const NOTIFY_TEMPLATES: NotifyTemplate[] = [
  { event: 'NH gửi yêu cầu', recipient: 'Content, MKT', channel: 'In-app' },
  { event: 'Content lên web', recipient: 'NH', channel: 'In-app' },
  { event: 'MKT hoàn tất', recipient: 'NH', channel: 'In-app' },
  { event: 'Trễ SLA cảnh báo', recipient: 'NH, Admin', channel: 'In-app + Email' },
  { event: 'Trễ SLA escalate', recipient: 'Admin', channel: 'In-app + Email + SMS' },
  { event: 'Thiếu tài liệu', recipient: 'Vendor', channel: 'Email' },
  { event: 'Nghiệm thu cần chỉnh sửa', recipient: 'MKT', channel: 'In-app' },
  { event: 'NH huỷ brief', recipient: 'MKT, Admin', channel: 'In-app' },
]

// ─── Helper labels ────────────────────────────────────────────────────────
export const DOC_STATUS_LABEL: Record<string, string> = {
  thieu: 'Thiếu tài liệu',
  du_toithieu: 'Đủ tối thiểu',
  du_full: 'Đủ full',
}
export const KHAI_BAO_STATUS_LABEL: Record<string, string> = {
  chua_xu_ly: 'Chưa xử lý',
  cho_onweb: 'Chờ onweb',
  da_onweb: 'Đã onweb',
}
export const SEO_STATUS_LABEL: Record<string, string> = {
  chua: 'Chưa yêu cầu',
  cho: 'Chờ xử lý',
  dang_xu_ly: 'Đang xử lý',
  da_len_web: 'Đã lên web',
  hoan_tat: 'Hoàn tất AI',
}
export const MKT_STATUS_LABEL: Record<string, string> = {
  chua_yeu_cau: 'Chưa yêu cầu',
  da_tiep_nhan: 'Đã tiếp nhận',
  dang_san_xuat: 'Đang sản xuất',
  cho_nghiem_thu: 'Chờ nghiệm thu',
  can_chinh_sua: 'Cần chỉnh sửa',
  hoan_tat: 'Hoàn tất',
  da_huy: 'Đã huỷ',
}
export const FLOW_LABEL: Record<string, string> = {
  chi_content: 'Chỉ Content',
  chi_mkt: 'Chỉ Marketing',
  ca_hai: 'Cả hai',
}
export const LOAI_NHU_CAU_LABEL: Record<string, string> = {
  chup_anh: 'Chụp ảnh',
  quay_clip: 'Quay clip',
  pr_viet: 'PR / Viết bài',
  livestream: 'Livestream',
}

export const NHOM_KENH_LABEL: Record<string, string> = {
  TGDD: 'Thế Giới Di Động',
  TZ: 'TopZone',
  DMX: 'Điện Máy Xanh',
}

export const LOAI_BRIEF_LABEL: Record<string, string> = {
  hang_co_budget: 'Hãng có budget',
  bai_tin_trai_nghiem: 'Bài tin trải nghiệm',
}
