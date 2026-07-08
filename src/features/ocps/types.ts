// Types cho khu OCPS (port từ _source_b_reference — source B không có TS,
// type hoá tối thiểu theo MERGE_PLAN.md Phase 1).

export type OcpsRole = 'vendor' | 'nh' | 'content' | 'marketing' | 'admin'

export type DocStatus = 'thieu' | 'du_toithieu' | 'du_full'
export type SeoStatus = 'chua' | 'cho' | 'dang_xu_ly' | 'da_len_web' | 'hoan_tat'
export type MktStatus =
  | 'chua_yeu_cau'
  | 'da_tiep_nhan'
  | 'dang_san_xuat'
  | 'cho_nghiem_thu'
  | 'can_chinh_sua'
  | 'hoan_tat'
  | 'da_huy'
export type Flow = 'chi_content' | 'chi_mkt' | 'ca_hai'
export type SlotKey = 'hinhanh' | 'spec' | 'khac'
export type TrangThaiBoSung = 'dang_kiem_tra' | 'bo_sung_du' | 'con_thieu'
export type KhaiBaoStatus = 'chua_xu_ly' | 'cho_onweb' | 'da_onweb'

export interface OcpsUser {
  id: string
  name: string
  role: OcpsRole
  vendorId?: string
  nganhhang?: string
}

export interface ContentEditEntry {
  vong: number
  ghiChu: string
  ngay: string
}

// Item = master data đồng bộ 1 chiều từ ERP (read-only trừ Admin override)
export interface OcpsItem {
  id: string
  modelCode: string
  erpCreatedAt: string
  ten: string
  nganhhang: string
  vendor: string
  vendorId: string
  linkFolder: string | null
  docStatus: DocStatus
  flow: Flow | null
  seoStatus: SeoStatus
  mktStatus: MktStatus
  slaConLai: number
  nguoiPhuTrachContent: string | null
  nguoiPhuTrachMkt: string | null
  ngayGuiYeuCau: string | null
  erpLastSyncAt: string
  // Field phát sinh lúc runtime (DataContext gắn thêm khi thao tác)
  linkWeb?: string
  contentVongChinhSua?: number
  contentLichSuChinhSua?: ContentEditEntry[]
  erpDirty?: boolean
}

export interface DocRule {
  soAnhToiThieu: number
  sizeMaxMB: number
  minWidthPx: number
  dinhDangChoPhep: string[]
  nenTrangAnhSanPham: boolean
  ghiChuNenTrang: string
}

export interface SlotFile {
  name: string
  date: string
  by?: string
  // Field phát sinh lúc runtime khi upload qua DataContext
  isLatest?: boolean
  superseded?: boolean
  ruleViolation?: boolean
  ruleMessage?: string
}

export interface DocSlot {
  files: SlotFile[]
  ghiChu: string | null
  trangThaiBoSung?: TrangThaiBoSung
}

export type ItemDocSlots = Record<SlotKey, DocSlot>
export type DocumentSlotsMap = Record<string, ItemDocSlots>

export interface FlowRequestHistoryEntry {
  action: 'tao' | 'gui' | 'doi_luong' | 'huy'
  flow: Flow
  at: string
  by: string
  reason?: string
}

export interface FlowRequest {
  id: string
  itemId: string
  flow: Flow
  trangThaiGui: 'da_gui' | 'da_huy'
  trangThaiKhaiBaoDuKien: KhaiBaoStatus
  version: number
  createdAt: string
  createdBy: string
  history: FlowRequestHistoryEntry[]
}

export interface BriefEditEntry {
  vong: number
  ghiChu: string
  ngay: string
}

export interface MktBrief {
  id: string
  itemId: string
  tenSP: string
  nhomKenh: string
  loaiBrief: string
  loaiNhuCau: string[]
  kenh: string[]
  deadline: string
  budget: string
  briefText: string
  fileThamKhao: string[]
  trangThai: MktStatus
  nguoiPhuTrach: string
  ngayTao: string
  vongChinhSua: number
  lichSuChinhSua: BriefEditEntry[]
  linkFolder?: string
  linkMedia?: string
  // Field phát sinh lúc runtime
  lyDoHuy?: string
}

export interface OcpsNotification {
  id: string
  role: OcpsRole[]
  type: string
  entityId: string
  text: string
  read: boolean
  time: string
  link: string
  category: 'event' | 'sla' | 'digest'
  count: number
  scopeKey?: string
}

export interface AuditEntry {
  id: string
  itemId: string
  by: string
  from: string
  to: string
  reason: string
  time: string
  source: 'auto' | 'admin_override'
}

export interface SlaConfigRow {
  trangThai: string
  ngayCanhBao: number
  ngayEscalate: number
}

export interface ReportScheduleConfig {
  chuKyNgay: number
  ngayGuiKeTiep: string
}

export interface NotifyTemplate {
  event: string
  recipient: string
  channel: string
}
