export type SiteId = 'avakids' | 'tgdd' | 'dmx' | 'topzone' | 'ntak'
export type JobType = 'product_content' | 'blog_post'
export type JobStatus =
  | 'draft' | 'running'
  | 'outline_pending' | 'outline_running'
  | 'writing_pending' | 'writing_running'
  | 'image_pending' | 'image_running'
  | 'merge_pending' | 'merge_running'
  | 'qc_pending' | 'reviewing'
  | 'approved' | 'published'
  | 'error' | 'rejected' | 'cancelled' | 'spec_incomplete'

export interface ImageEntry {
  id: string
  url: string
  label: string
  file_name?: string
  ai_feedback?: string
  /** Tiêu đề H3 trong bài viết mà ảnh này được gắn vào */
  section_h3?: string
  /** Tên file ảnh gốc (từ hãng) dùng để tạo ảnh AI này */
  source_image?: string
  /** Log lý do AI vision chọn ảnh gốc này cho section */
  selection_reason?: string
}
export interface MetaSEO { title: string; description: string; keywords: string[] }
export interface ErrorEntry { wf: string; message: string; timestamp: string }
export interface StepDurations {
  wf1?: number; wf2?: number; wf3?: number; wf4?: number; wf5?: number
}

export interface Job {
  job_id: string
  site_id: SiteId
  job_type: JobType
  pim_product_id: string
  ten_san_pham: string
  nganh_hang: string
  status: JobStatus
  spec_completeness: number
  outline?: string
  content_html?: string
  final_html?: string
  gallery_images?: ImageEntry[]
  slide_images?: ImageEntry[]
  thumb_url?: string
  meta_seo?: MetaSEO
  thong_so_ky_thuat?: Record<string, string>
  dac_diem_noi_bat?: string[]
  spec_final?: Record<string, unknown>
  error_log?: ErrorEntry[]
  step_durations?: StepDurations
  created_by: string
  created_at: string
  updated_at: string
  note?: string
  /** Yếu tố muốn nhấn mạnh trong bài (vd: "Kích thước, công nghệ") */
  emphasis?: string
  /** Yêu cầu riêng cho bài viết (vd: "Đưa phần kết nối, chơi game lên đầu") */
  special_request?: string
  /** Cho phép AI research thêm nguồn ngoài spec */
  use_external_research?: boolean
  /** Link tham khảo trang hãng */
  reference_url?: string
  /** ID lần chạy pipeline gần nhất (vd: run_1779634007328_rda6xd) */
  run_id?: string
  /** Thời điểm pipeline chạy gần nhất */
  last_run_at?: string
  /** Ghi chú vận hành từ pipeline (vd: "Auto-reset article: kẹt > 20 phút") */
  ops_note?: string
  
  // Custom Prompts
  prompt_category?: string
  custom_prompt_text?: Record<string, string>
}

export interface PromptConfig {
  id: string
  site_id: SiteId
  prompt_category: string
  wf_step:
    | 'wf_name'           // S1 – Tên sản phẩm
    | 'wf_gallery'        // S4 – Gallery ảnh chi tiết
    | 'wf1_specs'         // S6 – Thông số kỹ thuật
    | 'wf_highlights'     // S7 – Đặc điểm nổi bật
    | 'wf2_outline'       // S8 – Dàn bài
    | 'wf_article_images' // S9 – Ảnh bài viết
    | 'wf3_writing'       // S10 – Bài viết chi tiết
    | 'wf5_seo'           // S11 – SEO Meta
  prompt_text: string
  is_active: boolean
  model: string
  updated_at: string
  updated_by: string
}

export interface PromptOption {
  id: string
  name: string
  prompt_label?: string
  image_analysis_prompt?: string
  /** Prompt outline, dùng cho workflow gộp Outline & Bài viết */
  outline_prompt_content?: string
  /** Với workflow gộp Outline & Bài viết, đây là Prompt viết bài */
  template_content: string
  is_active: boolean
  model: string
  updated_at: string
  updated_by: string
}

export interface PromptSubCategory {
  id: string
  workflow_type: string
  name: string
  options: PromptOption[]
}

export interface PromptCategoryLevel1 {
  id: string
  name: string
  site_id: SiteId
  sub_categories: PromptSubCategory[]
  children?: PromptCategoryLevel1[]
}

export interface WebhookConfig {
  wf_key: string
  label: string
  url: string
  timeout_ms: number
  is_active: boolean
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'site_manager' | 'content_manager' | 'viewer'
  sites: SiteId[]
  is_active: boolean
  created_at: string
}

export const SITE_META: Record<SiteId, { label: string; color: string; bgClass: string }> = {
  avakids: { label: 'AVAKids', color: '#ec4899', bgClass: 'bg-pink-100 text-pink-800' },
  tgdd:    { label: 'TGDD',    color: '#3b82f6', bgClass: 'bg-blue-100 text-blue-800' },
  dmx:     { label: 'ĐMX',     color: '#10b981', bgClass: 'bg-green-100 text-green-800' },
  topzone: { label: 'Topzone', color: '#8b5cf6', bgClass: 'bg-purple-100 text-purple-800' },
  ntak:    { label: 'NTAK',    color: '#f59e0b', bgClass: 'bg-yellow-100 text-yellow-800' },
}

export const NGANH_HANG_BY_SITE: Record<SiteId, string[]> = {
  avakids: ['Sữa bột', 'Xe đẩy', 'Đồ chơi', 'Quần áo trẻ em', 'Máy hâm sữa', 'Bình sữa', 'Địu em bé'],
  tgdd:    ['Điện thoại', 'Máy tính bảng', 'Tai nghe', 'Phụ kiện', 'Smartwatch'],
  dmx:     ['Tủ lạnh', 'Máy giặt', 'Điều hòa', 'TV', 'Máy lọc không khí'],
  topzone: ['iPhone', 'iPad', 'Mac', 'AirPods', 'Apple Watch'],
  ntak:    ['Thuốc OTC', 'Thực phẩm chức năng', 'Thiết bị y tế', 'Vitamin'],
}

export const STATUS_META: Record<JobStatus, { label: string; color: string }> = {
  draft:            { label: 'Nháp',           color: 'gray' },
  running:          { label: 'Đang chạy',      color: 'blue' },
  outline_pending:  { label: 'Chờ Outline',    color: 'gray' },
  outline_running:  { label: 'Tạo Outline',    color: 'blue' },
  writing_pending:  { label: 'Chờ viết bài',   color: 'gray' },
  writing_running:  { label: 'Đang viết',      color: 'blue' },
  image_pending:    { label: 'Chờ tạo ảnh',    color: 'gray' },
  image_running:    { label: 'Tạo ảnh AI',     color: 'blue' },
  merge_pending:    { label: 'Chờ merge',      color: 'gray' },
  merge_running:    { label: 'Đang merge',     color: 'blue' },
  qc_pending:       { label: 'Chờ QC',         color: 'yellow' },
  reviewing:        { label: 'Đang QC',        color: 'yellow' },
  approved:         { label: 'Đã duyệt',       color: 'green' },
  published:        { label: 'Đã publish',     color: 'green' },
  error:            { label: 'Lỗi',            color: 'red' },
  rejected:         { label: 'Bị từ chối',     color: 'orange' },
  cancelled:        { label: 'Đã hủy',         color: 'gray' },
  spec_incomplete:  { label: 'Spec thiếu',     color: 'orange' },
}

export type ProductCompleteness = 'no_content' | 'partial' | 'complete'
export type ProductPimStatus = 'draft' | 'gen_completed' | 'pending_qc' | 'qc_passed' | 'published'

export interface ReferenceFile {
  id: string
  name: string
  url: string
  size: number
  uploaded_at: string
  file_type?: 'product_image' | 'manufacturer_spec' | 'other'
}


export interface ProductApprovalStatus {
  specs_approved?: boolean
  outline_approved?: boolean
  article_approved?: boolean
  slider_approved?: boolean
  final_approved?: boolean
  highlights_approved?: boolean
  seo_meta_approved?: boolean
}

export interface Product {
  approval_status?: ProductApprovalStatus
  id: string // Mã sản phẩm PIM (vd: PIM-9901)
  model_code: string // Mã model (vd: IPHONE16PM)
  variantcode: string // Mã biến thể (vd: IPHONE16PM_256)
  variant_name?: string // Tên biến thể (vd: LG - Black)
  product_code_erp?: string // Mã sản phẩm ERP (vd: 1751098000187)
  name: string // Tên sản phẩm
  site_id: SiteId
  nganh_hang: string
  status: ProductCompleteness
  completeness: number // 0-100%
  pim_status: ProductPimStatus // Trạng thái sản phẩm (ví dụ: đã publish PIM, đã gen xong, cần QC, đã QC, published)

  // Nội dung biên tập (có thể trống, thiếu hoặc đầy đủ)
  thong_so_ky_thuat?: Record<string, string>
  dac_diem_noi_bat?: string[]
  outline?: string
  content_html?: string
  meta_seo?: MetaSEO

  // Links tham khảo
  reference_url?: string // Link hãng
  drive_url?: string // Link Google Drive tài liệu specs

  // Chỉ dẫn AI
  emphasis?: string // Yếu tố cần nhấn mạnh
  special_request?: string // Yêu cầu riêng
  ai_note?: string // Ghi chú thêm cho AI
  use_external_research?: boolean // Cho phép research thêm bên ngoài (true/false)

  // Cấu hình prompt tùy chỉnh cho sản phẩm này
  active_prompt_category?: string // Có thể chọn ngành hàng khác để nạp prompt
  custom_prompt_text?: Record<string, string> // Ví dụ: { wf2_outline: '...', wf3_writing: '...' }
  selected_sub_categories?: Record<string, string>
  selected_prompt_options?: Record<string, string> // Lưu option_id cho từng workflow (vd: { wf2_outline: 'opt_1' })
  bonus_prompts?: Record<string, string> // Lưu yêu cầu bổ sung
  feedback_prompts?: Record<string, string> // Lưu feedback cho AI (regen)

  // Các file Specs làm tài liệu tham khảo để Gen AI
  specs_files?: ReferenceFile[]

  // Media assets synced from PIM or generated by AI
  thumb_url?: string
  gallery_images?: ImageEntry[]
  slide_images?: ImageEntry[]
  article_images?: ImageEntry[]
  video_url?: string

  created_at: string
  updated_at: string
}
