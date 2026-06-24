# AICPS Frontend Demo — Project Context

## Tổng quan

**AICPS** (AI Content Production System) — công cụ nội bộ MWG để quản lý pipeline sản xuất nội dung AI cho 5 sites: AVAKids, TGDD, ĐMX, Topzone, NTAK.

- **Mục đích**: Demo nội bộ, pitch hệ thống, không có backend — toàn bộ data mock
- **Tech stack**: Vite + React 18 + TypeScript + Tailwind CSS v3 + React Router v6 + Zustand
- **Dev**: `cd aicps-ui && npm run dev` → port 5174
- **Login demo**: `admin@mwg.vn` / `admin123`

---

## Cấu trúc file nguồn (`aicps-ui/src/`)

```
src/
├── App.tsx                      ← Router chính (8 routes)
├── main.tsx                     ← Entry point
├── index.css                    ← Global CSS
├── types/index.ts               ← Types + constants (SiteId, JobStatus, SITE_META, NGANH_HANG_BY_SITE, STATUS_META...)
├── data/mockData.ts             ← 16 MOCK_JOBS, MOCK_STATS, MOCK_PROMPT_CONFIGS, MOCK_WEBHOOK_CONFIGS, MOCK_USERS
├── lib/utils.ts                 ← Helpers: format*, getWfStepStates, canApprove/Rerun/Cancel, generateJobId
├── store/
│   ├── authStore.ts             ← Zustand: user, login, logout
│   ├── jobStore.ts              ← Zustand: jobs[], updateJobStatus, updateJob, addJob
│   ├── filterStore.ts           ← Zustand: site_id, status, job_type, search, page, setFilter, reset
│   ├── promptStore.ts           ← Zustand: prompts[], updatePrompt
│   ├── webhookStore.ts          ← Zustand: webhooks[], updateWebhook
│   └── userStore.ts             ← Zustand: users[], addUser, updateUser, deleteUser, toggleActive
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         ← Layout chính: guard auth → Sidebar + <main>
│   │   └── Sidebar.tsx          ← Sidebar cố định 220px, nav theo role, user info + logout
│   └── ui/
│       ├── Badge.tsx            ← Badge, SiteBadge, StatusBadge (có icon + animate spin)
│       ├── Button.tsx           ← Button (primary/secondary/danger/warning/ghost/outline, sm/md/lg)
│       ├── Dialog.tsx           ← Modal overlay (scroll body lock)
│       ├── JobProgressBar.tsx   ← 5 dot WF1→WF5 (done/running/error/pending)
│       └── Toast.tsx            ← Toast notification system (Context + Provider)
└── pages/
    ├── LoginPage.tsx            ← /login — mock auth từ MOCK_USERS
    ├── JobListPage.tsx          ← /jobs — StatsBar (4 stat cards), FilterBar, JobTable + pagination
    ├── JobDetailPage.tsx        ← /jobs/:jobId — Header, ActionBar, OutputFields, 7 tabs, ApproveDialog, RejectDialog
    ├── CreateJobPage.tsx        ← /jobs/new — 3-step wizard (info → data source → review), FileDropZone
    ├── config/
    │   ├── PromptConfigPage.tsx ← /config/prompts — list + textarea editor, filter site/nganh/wf
    │   └── WebhookConfigPage.tsx← /config/webhooks — bảng 5 WF, edit URL/timeout, test, toggle
    └── admin/
        ├── UserListPage.tsx     ← /admin/users — table, filter role/site/search, delete, toggle active
        └── UserFormPage.tsx     ← /admin/users/new & /:id — form tạo/sửa user
```

---

## Routes

| Path | Component | Guard |
|---|---|---|
| `/login` | LoginPage | — |
| `/jobs` | JobListPage | auth |
| `/jobs/new` | CreateJobPage | auth |
| `/jobs/:jobId` | JobDetailPage | auth |
| `/config/prompts` | PromptConfigPage | auth + manager |
| `/config/webhooks` | WebhookConfigPage | auth + admin |
| `/admin/users` | UserListPage | auth + admin |
| `/admin/users/new` | UserFormPage | auth + admin |
| `/admin/users/:id` | UserFormPage | auth + admin |

---

## Data Model

### Job

```typescript
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

interface ImageEntry {
  id: string
  url: string
  label: string
  section_h3?: string       // Tiêu đề H3 mà ảnh này gắn vào (dùng để inject vào HTML preview)
  source_image?: string     // Tên file ảnh gốc từ hãng
  selection_reason?: string // Log lý do AI vision chọn ảnh này
}

interface Job {
  job_id: string
  site_id: SiteId
  job_type: JobType
  pim_product_id: string
  ten_san_pham: string
  nganh_hang: string
  status: JobStatus
  spec_completeness: number          // 0-100%
  outline?: string                   // Markdown
  content_html?: string              // HTML bài viết
  final_html?: string                // HTML sau khi merge ảnh
  gallery_images?: ImageEntry[]      // 4 ảnh gallery
  slide_images?: ImageEntry[]        // 3 ảnh slide (kèm section_h3)
  thumb_url?: string
  meta_seo?: { title: string; description: string; keywords: string[] }
  thong_so_ky_thuat?: Record<string, string>
  dac_diem_noi_bat?: string[]
  spec_final?: Record<string, unknown>
  error_log?: { wf: string; message: string; timestamp: string }[]
  step_durations?: { wf1?: number; wf2?: number; wf3?: number; wf4?: number; wf5?: number }  // seconds
  created_by: string
  created_at: string
  updated_at: string
  note?: string
  emphasis?: string                  // Yếu tố muốn nhấn mạnh
  special_request?: string           // Yêu cầu riêng về bố cục
  use_external_research?: boolean
  reference_url?: string             // Link tham khảo trang hãng
  run_id?: string
  last_run_at?: string
  ops_note?: string                  // Ghi chú vận hành từ pipeline n8n
}
```

### PromptConfig

```typescript
interface PromptConfig {
  id: string
  site_id: SiteId
  nganh_hang: string
  wf_step: 'wf2_outline' | 'wf3_writing' | 'wf4_image'
  prompt_text: string
  is_active: boolean
  model: string          // 'gpt-4o' | 'gpt-4o-mini' | 'claude-sonnet-4-6'
  updated_at: string
  updated_by: string
}
```

### WebhookConfig

```typescript
interface WebhookConfig {
  wf_key: string         // 'wf1'...'wf5'
  label: string
  url: string            // https://automation.tgdd.vn/webhook/aicps-wfN
  timeout_ms: number
  is_active: boolean
}
```

### User

```typescript
interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'site_manager' | 'content_manager' | 'viewer'
  sites: SiteId[]
  is_active: boolean
  created_at: string
}
```

---

## Pipeline (5 workflows n8n)

| WF | Chức năng | Timeout |
|---|---|---|
| WF1 | Đọc File & Extract Spec | 60s |
| WF2 | Tạo Outline | 90s |
| WF3 | Viết Bài & Thông số | 180s |
| WF4 | Tạo Ảnh AI | 300s |
| WF5 | Merge & Finalize | 60s *(inactive)* |

**Webhook base URL**: `https://automation.tgdd.vn/webhook/aicps-wfN`

**Biến template trong prompt**: `{{ten_san_pham}}`, `{{spec_final_json}}`, `{{outline}}`, `{{site_id}}`, `{{nganh_hang}}`

---

## Roles & Quyền hạn

| Role | Jobs | Prompt Config | Webhook Config | Admin/Users |
|---|---|---|---|---|
| admin | Toàn quyền | ✓ | ✓ | ✓ |
| site_manager | Approve + Publish | ✓ | — | — |
| content_manager | Tạo + xem | — | — | — |
| viewer | Chỉ xem | — | — | — |

**Sidebar nav hiển thị theo role:**
- `canCreate` = admin / site_manager / content_manager → hiện "Tạo Job mới"
- `isManager` = admin / site_manager → hiện "Prompt Config"
- `isAdmin` = admin → hiện "Webhook Config" + "Quản lý Users"

---

## Job Status Flow & Progress Bar

`getWfStepStates(status)` trả về mảng 5 phần tử `done | running | error | pending` để render `JobProgressBar`:

```
draft / running / spec_incomplete / cancelled  → [P, P, P, P, P]
outline_pending  → [D, P, P, P, P]
outline_running  → [D, R, P, P, P]
writing_pending  → [D, D, P, P, P]
writing_running  → [D, D, R, P, P]
image_pending    → [D, D, D, P, P]
image_running    → [D, D, D, R, P]
merge_pending    → [D, D, D, D, P]
merge_running    → [D, D, D, D, R]
qc_pending / reviewing / approved / published / rejected  → [D, D, D, D, D]
error            → tính theo step_durations thực tế
```

**Action buttons theo status:**
- `canApprove`: `qc_pending | reviewing` + role admin/site_manager
- `canRerun`: `error | spec_incomplete | rejected`
- `canCancel`: bất kỳ status nào trừ `published | cancelled | approved`

---

## JobDetailPage — 7 Tabs

| Tab | Nội dung |
|---|---|
| HTML Preview | `<iframe srcDoc>` với toggle "Chèn ảnh theo H3" (inject slide_images vào sau thẻ H3 tương ứng), nút fullscreen |
| Gallery | Grid 2 cột, 4 ảnh gallery, xóa từng ảnh |
| Slide | Grid 3 cột, 3 ảnh slide, hiển thị section_h3 / source_image / selection_reason |
| Thông số | Bảng thong_so_ky_thuat + list dac_diem_noi_bat |
| Meta SEO | Title/Description có đếm ký tự (60/160), keywords badges, SERP preview |
| Spec JSON | JSON highlighted (syntax color) + copy button |
| Lỗi | ErrorLogTab: badge WF + timestamp + message |

**Output Fields sidebar** (cột trái): checklist 9 fields với trạng thái ✓/✗/spinner, preview ngắn, nút regen từng field.

**OpsNoteBanner**: hiển thị `ops_note` từ pipeline — màu amber nếu chứa từ "auto-reset/kẹt/timeout".

---

## Mock Data

### MOCK_JOBS (16 jobs)

| Job ID | Site | Sản phẩm | Status |
|---|---|---|---|
| JOB-0041 | avakids | Sữa Aptamil số 2 800g | qc_pending |
| JOB-0040 | avakids | Xe đẩy Joie Chrome DLX | image_running |
| JOB-0039 | tgdd | Samsung Galaxy S25 Ultra | writing_running |
| JOB-0038 | dmx | Tủ lạnh Samsung Bespoke 462L | published |
| JOB-0037 | topzone | MacBook Air M3 13 inch | error |
| JOB-0036 | ntak | Vitamin D3 K2 Nature Made | spec_incomplete |
| JOB-0035 | avakids | Bình sữa Philips Avent | rejected |
| JOB-0034 | avakids | Top 5 sữa bột tốt nhất 2026 *(blog)* | qc_pending |
| JOB-0033 | tgdd | iPhone 16 Pro Max 256GB | published |
| JOB-0032 | dmx | Máy giặt LG FV1412H3B 12kg | outline_running |
| JOB-0031 | topzone | iPad Pro M4 11 inch | merge_pending |
| JOB-0030 | ntak | Omeprazole 20mg Stada | published |
| JOB-0029 | avakids | Địu em bé Ergobaby OMNI | writing_pending |
| JOB-0028 | tgdd | So sánh S25 vs iPhone 16 *(blog)* | cancelled |
| JOB-0027 | dmx | Điều hòa Panasonic 1.5HP | approved |
| JOB-0026 | topzone | AirPods Pro 2nd Gen | image_pending |

### MOCK_STATS
```
{ today_total: 8, running: 3, qc_pending: 2, error: 1 }
```

### MOCK_PROMPT_CONFIGS (3 configs)
- AVAKids / Sữa bột / WF2 Outline — model: gpt-4o
- AVAKids / Sữa bột / WF3 Writing — model: gpt-4o
- TGDD / Điện thoại / WF3 Writing — model: gpt-4o

### MOCK_WEBHOOK_CONFIGS (5 webhooks)
- WF1–WF4: active
- WF5: **inactive**

### MOCK_USERS (7 users)

| Email | Role | Sites | Active |
|---|---|---|---|
| admin@mwg.vn | admin | all | ✓ |
| lan@avakids.vn | content_manager | avakids | ✓ |
| quan@mwg.vn | content_manager | avakids, ntak | ✓ |
| huong@tgdd.vn | site_manager | tgdd, topzone | ✓ |
| tung@tgdd.vn | content_manager | tgdd | ✓ |
| mai@dmx.vn | site_manager | dmx | ✓ |
| khanh@ntak.vn | content_manager | ntak | ✗ |

---

## Constants

### SITE_META
```typescript
avakids: { label: 'AVAKids', color: '#ec4899', bgClass: 'bg-pink-100 text-pink-800' }
tgdd:    { label: 'TGDD',    color: '#3b82f6', bgClass: 'bg-blue-100 text-blue-800' }
dmx:     { label: 'ĐMX',     color: '#10b981', bgClass: 'bg-green-100 text-green-800' }
topzone: { label: 'Topzone', color: '#8b5cf6', bgClass: 'bg-purple-100 text-purple-800' }
ntak:    { label: 'NTAK',    color: '#f59e0b', bgClass: 'bg-yellow-100 text-yellow-800' }
```

### NGANH_HANG_BY_SITE
```typescript
avakids: ['Sữa bột', 'Xe đẩy', 'Đồ chơi', 'Quần áo trẻ em', 'Máy hâm sữa', 'Bình sữa', 'Địu em bé']
tgdd:    ['Điện thoại', 'Máy tính bảng', 'Tai nghe', 'Phụ kiện', 'Smartwatch']
dmx:     ['Tủ lạnh', 'Máy giặt', 'Điều hòa', 'TV', 'Máy lọc không khí']
topzone: ['iPhone', 'iPad', 'Mac', 'AirPods', 'Apple Watch']
ntak:    ['Thuốc OTC', 'Thực phẩm chức năng', 'Thiết bị y tế', 'Vitamin']
```

---

## Các helper functions chính (`lib/utils.ts`)

| Function | Mô tả |
|---|---|
| `formatDateTime(iso)` | DD/MM HH:mm |
| `formatTimeAgo(iso)` | "X phút/giờ/ngày trước" |
| `formatDuration(seconds)` | "1p30s" |
| `formatTotalDuration(stepDurations)` | Tổng các bước |
| `getWfStepStates(status)` | Mảng 5 trạng thái cho progress bar |
| `isRunningStatus(status)` | `status.includes('running')` |
| `canApprove(status)` | qc_pending / reviewing |
| `canRerun(status)` | error / spec_incomplete / rejected |
| `canCancel(status)` | không phải published/cancelled/approved |
| `generateJobId()` | `JOB-0XXXX` random |

---

## UI Components

### Button variants
`primary` · `secondary` · `danger` · `warning` · `ghost` · `outline`

### Badge components
- `Badge` — generic, nhận className
- `SiteBadge` — màu theo SITE_META
- `StatusBadge` — màu + icon + animate-spin cho running states

### Toast
Context-based, 4 types: `success | error | warning | info`, auto-dismiss 4s, bottom-right.

### Dialog
Portal overlay với backdrop click to close, scroll lock body, max-height 90vh với overflow scroll.

### JobProgressBar
5 ô màu: xanh lá (done) · xanh dương + pulse (running) · đỏ (error) · xám (pending). Tooltip hiện WF name + duration.

---

## Lưu ý khi tiếp tục phát triển

- Không có backend — mọi action (approve, reject, rerun, cancel) chỉ update Zustand store trong memory
- FileDropZone dùng `react-dropzone`, file upload chỉ là UI, không gửi đi đâu
- `injectSectionImages()` trong JobDetailPage mô phỏng bước WF5 merge: tìm `<h3>` khớp với `section_h3` và chèn `<figure><img>` phía sau
- WF5 đang tắt (`is_active: false`) trong mock data — đây là intentional để demo trạng thái một webhook bị vô hiệu hóa
- `cursor_context.md` trong thư mục gốc dùng để chuyển ngữ cảnh giữa AI editors (hiện chưa có nội dung thực tế)
