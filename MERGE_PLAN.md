# MERGE PLAN — Port OCPS (source B) vào aicps-combine (source A)

> Trạng thái: **CHỜ DUYỆT — chưa sửa dòng code nào.**
> Ngày phân tích: 2026-07-08. Source B nằm tại `_source_b_reference/` (tên gốc: OCPS — Online Content Production System).

---

## 1. Tổng quan cấu trúc hai bên

### Source A — `aicps-combine` (đích)
- Vite 8 + React 19 + **TypeScript** + Tailwind 3.4 + **zustand** + react-router-dom 7. Build: `tsc -b && vite build`.
- Cấu trúc: `src/pages/{admin,config,pim}/`, `src/components/{ui,layout,pim}/`, `src/store/` (7 zustand store: auth, job, product, prompt, user, webhook, filter), `src/types/index.ts`, `src/data/mockData.ts`, `src/lib/utils.ts` (`cn()`).
- Auth: `useAuthStore` (zustand), gate từng trang qua `AppShell` (không có ProtectedRoute ở router). Role: `admin | site_manager | content_manager | viewer`.
- Routes hiện có: `/login`, `/jobs`, `/jobs/new`, `/jobs/:jobId`, `/products`, `/products/:id`, `/products/:id/specs-demo`, `/config/prompts`, `/config/webhooks`, `/admin/users`, `/admin/users/new`, `/admin/users/:id`.
- Không dùng path alias (`@/`), import tương đối. Không strict TS. Không `.env`, không gọi API thật (mock + localStorage).

### Source B — `_source_b_reference` (OCPS)
- Vite 8 + React 19 + **JSX thuần (không TS)** + Tailwind 3.4 + **React Context** (AuthContext + DataContext). Không backend, không `.env`, không fetch/axios — 100% mock in-memory.
- Cấu trúc: `src/pages/{vendor,nh,content,marketing,admin}/` + `Login.jsx`, `NotificationsPage.jsx`; `src/components/` (Button, Badge, Card, StatCard, DocSlotZone, NotificationCenter); `src/layouts/AppLayout.jsx`; `src/context/{AuthContext,DataContext}.jsx`; `src/data/mockData.js`; `src/utils/docRules.js`.
- Auth: `AuthProvider` + `ProtectedRoute` trong `App.jsx`, gate theo segment đầu của path. Role: `vendor | nh | content | marketing | admin`.
- Routes: `/` (login), `/vendor/upload`, `/nh/dashboard`, `/nh/product/:id`, `/nh/report`, `/content/dashboard`, `/content/process/:id`, `/marketing/dashboard`, `/marketing/brief/:id`, `/admin/control-tower`, `/admin/god-view`, `/admin/config`, `/admin/reports`, `/admin/override/:id`, `/notifications`.
- File chết trong B (KHÔNG port): `src/App.css`, `src/assets/*` (hero.png, react.svg, vite.svg), `src/pages/admin/OverrideModal.jsx` (export nhưng không nơi nào import).

---

## 2. So sánh package.json

### Dependencies B có mà A CHƯA có
**Không có.** B chỉ dùng `react`, `react-dom`, `react-router-dom` — A đã có cả ba.
DevDependencies riêng của B: `oxlint` (B dùng thay eslint) — **không port**, A giữ eslint.

### Dependencies trùng nhưng khác version (đều tương thích caret, KHÔNG cần đổi)
| Package | A | B |
|---|---|---|
| react / react-dom | ^19.2.6 | ^19.2.7 |
| react-router-dom | ^7.17.0 | ^7.18.1 |
| @types/react | ^19.2.14 | ^19.2.17 |
| @vitejs/plugin-react | ^6.0.1 | ^6.0.3 |
| vite | ^8.0.12 | ^8.1.1 |
| autoprefixer | ^10.5.0 | ^10.5.2 |
| postcss | ^8.5.15 | ^8.5.16 |
| tailwindcss | ^3.4.19 | ^3.4.19 (trùng) |

➡️ **Kết luận: không phải cài thêm hay nâng version package nào.** Việc port thuần túy là chuyển code.

---

## 3. Các nhóm tính năng của B và file cấu thành

> Người dùng chưa chỉ định tính năng [X] cụ thể, nên liệt kê đủ 7 nhóm — khi duyệt hãy đánh dấu nhóm cần port.

### Hạ tầng dùng chung (BẮT BUỘC port trước, mọi tính năng đều phụ thuộc)
| Loại | File trong B | Ghi chú |
|---|---|---|
| Context | `src/context/AuthContext.jsx` | `AuthProvider`, `useAuth` — currentUser, login/logout, ROLES |
| Context | `src/context/DataContext.jsx` | `DataProvider`, `useData` — toàn bộ state + ~20 mutator (uploadFile, sendFlowRequest, adminOverride, notification, audit…) |
| Data | `src/data/mockData.js` | ~22 named export: ITEMS, USERS, ROLES, DOC_RULES, MKT_BRIEFS, FLOW_REQUESTS, DOCUMENT_SLOTS, NOTIFICATIONS, AUDIT_LOG, SLA_CONFIG, các map nhãn `*_LABEL`… |
| Utils | `src/utils/docRules.js` | `getDocRuleForItem`, `validateFile`, `formatImageRuleHint`, `getSpecTemplateUrl` — thuần JS, không React |
| Layout | `src/layouts/AppLayout.jsx` | Sidebar theo role (NAV_CONFIG, ROLE_META inline) + topbar + chuông notification |
| Components | `Button.jsx`, `Badge.jsx`, `Card.jsx`, `StatCard.jsx`, `DocSlotZone.jsx`, `NotificationCenter.jsx` | đều default export |

### F1 — Auth/Login (chọn role, SSO vs Email+OTP)
- `src/pages/Login.jsx` · phụ thuộc: AuthContext, mockData (USERS, ROLES). Route `/`.

### F2 — Vendor Upload
- `src/pages/vendor/VendorUpload.jsx` · dùng: Card, Button, Badge, DocSlotZone, useAuth, useData, docRules. Route `/vendor/upload`.

### F3 — NH (Ngành hàng): dashboard, chi tiết SP, báo cáo
- `src/pages/nh/NHDashboard.jsx`, `NHProductDetail.jsx` (trang workflow lõi: upload tài liệu, chọn luồng Content/MKT, gửi brief), `NHReport.jsx`.
- Dùng: đủ bộ component chung + docRules + hầu hết API của DataContext. Routes `/nh/dashboard`, `/nh/product/:id`, `/nh/report`.

### F4 — Content workflow
- `src/pages/content/ContentDashboard.jsx` (hàng đợi ưu tiên `getContentQueue`), `ContentProcess.jsx` (2 bước: link web → AI complete, báo thiếu file).
- Routes `/content/dashboard`, `/content/process/:id`.

### F5 — Marketing briefs
- `src/pages/marketing/MarketingDashboard.jsx`, `MarketingBriefDetail.jsx`.
- Routes `/marketing/dashboard`, `/marketing/brief/:id`.

### F6 — Admin (control tower, god view, config, reports, override)
- `src/pages/admin/AdminControlTower.jsx`, `AdminGodView.jsx`, `AdminConfig.jsx`, `AdminReports.jsx`, `AdminOverridePage.jsx`. (`OverrideModal.jsx` = orphan, bỏ.)
- Routes `/admin/control-tower`, `/admin/god-view`, `/admin/config`, `/admin/reports`, `/admin/override/:id`.

### F7 — Notifications
- `src/pages/NotificationsPage.jsx` + `src/components/NotificationCenter.jsx` (dropdown trong AppLayout). Route `/notifications`.

**Không có services/API layer** — B không gọi mạng; mọi "API" là mutator trong DataContext.

---

## 4. Xung đột phát hiện được

### 4.1 Tên component trùng
| Tên | A | B | Mức độ |
|---|---|---|---|
| `Button` | `src/components/ui/Button.tsx` — named export, variants `primary/secondary/danger/warning/ghost/outline` | `src/components/Button.jsx` — default export, variants `default/primary/success/danger/ghost/outline` | ⚠️ TRÙNG TÊN, KHÁC API (B có `success`, A có `secondary/warning`) |
| `Badge` | `src/components/ui/Badge.tsx` — `Badge` + `SiteBadge` + `StatusBadge`, prop `variant` | `src/components/Badge.jsx` — prop `status/label`, tự map màu theo trạng thái OCPS | ⚠️ TRÙNG TÊN, KHÁC HOÀN TOÀN về ngữ nghĩa |
| `Card` | không có | có | ✅ không trùng |
| `StatCard` | chỉ là hàm private trong `JobListPage.tsx` (không export) | component export | ✅ không trùng module-level |
| `AppLayout` vs `AppShell` | A: `AppShell` | B: `AppLayout` | ✅ khác tên, nhưng TRÙNG VAI TRÒ (2 shell/sidebar song song) |
| `AuthContext` vs `authStore` | A: zustand | B: Context | ⚠️ 2 nguồn auth cạnh tranh — phải hợp nhất |
| `DataContext` vs stores | A: 7 zustand store | B: 1 DataContext | ⚠️ 2 cơ chế state song song |
| `mockData` | `src/data/mockData.ts` | `src/data/mockData.js` | ⚠️ TRÙNG TÊN FILE — phải đổi tên khi port |

### 4.2 Route trùng
- **Không có path trùng tuyệt đối**: A dùng `/admin/users*`; B dùng `/admin/control-tower|god-view|config|reports|override/:id` — chung namespace `/admin` nhưng không đè nhau.
- ⚠️ Xung đột **cơ chế guard**: B gate theo segment đầu (`ROUTE_ROLES` trong App.jsx) — nếu bê nguyên vào, segment `/admin` của A sẽ bị luật của B chặn theo role B. Xung đột **role model**: A `admin|site_manager|content_manager|viewer` vs B `vendor|nh|content|marketing|admin`.
- B dùng `/` làm login, A dùng `/login` và `/` fallback về `/products` — cần thống nhất.
- **Đề xuất: prefix toàn bộ route B thành `/ocps/*`** (vd `/ocps/nh/dashboard`, `/ocps/admin/control-tower`) để cô lập hoàn toàn, tránh mọi va chạm guard/namespace. Đổi lại dễ sau này nếu muốn URL ngắn.

### 4.3 CSS / Tailwind
- `tailwind.config.js`: A chỉ có màu `brand`; B thêm `surface`, `border`, `sidebar`, bộ token `ds-*`, font Inter, boxShadow `card/card-hover/dropdown`. **Merge được an toàn** (chỉ thêm key mới, không đè `brand`). Lưu ý: component B chủ yếu dùng hex trực tiếp (`bg-[#2563EB]`) nên phụ thuộc thật vào theme rất thấp.
- `index.css`: xung đột body style — A: font `'Segoe UI'`, bg `#f0f2f5`; B: font Inter (import Google Fonts), bg `#F1F5F9`, font-size 14px, custom scrollbar. **Không được đè body toàn cục** → giữ body của A; scope style B (font/bg) vào wrapper của layout OCPS nếu cần.
- `App.css` cả hai bên đều là rác Vite starter, không import — bỏ qua.

### 4.4 Biến env
- **Không có xung đột**: cả A và B đều không có `.env*` và không dùng `import.meta.env`.

### 4.5 Khác biệt kỹ thuật phải xử lý khi port
- B là `.jsx` không type; A build bằng `tsc -b` không bật `allowJs` → **file B phải đổi thành `.tsx`** (thêm type tối thiểu, chấp nhận `any` cục bộ vì A không strict).
- B dùng default export cho component; A quy ước named export → thống nhất theo A khi port.
- Provider ordering: A hiện chỉ có `ToastProvider`; thêm `AuthProvider`/`DataProvider` của B phải bọc đúng phạm vi (chỉ nhánh route OCPS, không bọc toàn app — xem Phase 3).

---

## 5. KẾ HOẠCH PORT theo phase

Chiến lược: **cô lập B trong `src/features/ocps/`**, giữ nguyên DataContext của B (không viết lại sang zustand ở giai đoạn này), mount dưới prefix route `/ocps/*` bên trong `AppShell` của A. Hợp nhất auth bằng cách mở rộng User của A.

### Phase 0 — Chuẩn bị nền (không thêm package)
**File A phải sửa:**
- `tailwind.config.js`: merge theme B (surface, border, sidebar, ds-*, boxShadow; thêm Inter vào fontFamily nếu quyết định dùng).
- `src/index.css`: thêm `@import` font Inter (hoặc bỏ nếu chấp nhận Segoe UI); KHÔNG đổi body.
**File tạo mới:** `src/features/ocps/` (thư mục gốc cho toàn bộ code port).
**Kiểm tra:** `npm run build` xanh, UI A không đổi.

### Phase 1 — Data + utils (thuần logic, không UI)
**Tạo mới:**
- `src/features/ocps/data/ocpsMockData.ts` ← port `mockData.js` (đổi tên tránh trùng `src/data/mockData.ts`; thêm interface: `OcpsItem`, `OcpsBrief`, `FlowRequest`, `OcpsNotification`, `AuditEntry`, `DocSlot`…).
- `src/features/ocps/types.ts` — gom các type/union trạng thái (docStatus, seoStatus, mktStatus, flow…).
- `src/features/ocps/utils/docRules.ts` ← port `docRules.js` (thuần hàm, dễ nhất).
**Sửa A:** không.
**Kiểm tra:** `tsc -b` xanh.

### Phase 2 — Component dùng chung của B (đổi tên tránh trùng A)
**Tạo mới trong `src/features/ocps/components/`:**
- `OcpsButton.tsx` ← Button.jsx, `OcpsBadge.tsx` ← Badge.jsx (đổi tên vì trùng A; giữ nguyên API của B để các trang port không phải sửa logic, chỉ sửa import).
- `Card.tsx`, `StatCard.tsx`, `DocSlotZone.tsx` (giữ tên — A không có).
- Chuyển sang named export theo quy ước A.
**Sửa A:** không.

### Phase 3 — Context + Layout + khung route
**Tạo mới:**
- `src/features/ocps/context/OcpsAuthContext.tsx` ← AuthContext.jsx, **bridge với `useAuthStore` của A**: mở rộng type `User` của A (Phase này sửa `src/types/index.ts`: thêm role `'vendor'|'nh'|'content'|'marketing'` vào union + field optional `vendorId?`, `nganhhang?`) hoặc giữ OcpsAuth độc lập bước đầu — *quyết định khi duyệt*.
- `src/features/ocps/context/OcpsDataContext.tsx` ← DataContext.jsx (giữ nguyên toàn bộ mutator).
- `src/features/ocps/layouts/OcpsLayout.tsx` ← AppLayout.jsx (sidebar OCPS render BÊN TRONG AppShell của A, hoặc thay AppShell trên nhánh `/ocps` — mặc định: dùng làm nested layout riêng cho `/ocps/*`).
- `src/features/ocps/components/NotificationCenter.tsx`.
- `src/features/ocps/routes.tsx` — khai báo cây route `/ocps/*` (nested `<Route element={<OcpsProviders/>}>` bọc AuthContext OCPS + DataProvider + OcpsLayout).
**Sửa A:**
- `src/App.tsx`: import và mount nhánh `/ocps/*`.
- `src/types/index.ts`: mở rộng `User` (nếu chọn hướng hợp nhất auth).
- `src/components/layout/Sidebar.tsx`: thêm mục điều hướng sang khu OCPS.

### Phase 4 — Tính năng theo role (mỗi bước một PR nhỏ, độc lập nhau)
Tạo mới trong `src/features/ocps/pages/`, mỗi file port từ trang tương ứng của B, sửa import sang component/context đã port, route theo prefix `/ocps/...`:
1. **4a — Vendor:** `vendor/VendorUpload.tsx` → `/ocps/vendor/upload`.
2. **4b — NH:** `nh/NHDashboard.tsx`, `nh/NHProductDetail.tsx`, `nh/NHReport.tsx`.
3. **4c — Content:** `content/ContentDashboard.tsx`, `content/ContentProcess.tsx`.
4. **4d — Marketing:** `marketing/MarketingDashboard.tsx`, `marketing/MarketingBriefDetail.tsx`.
5. **4e — Admin:** `admin/AdminControlTower.tsx`, `admin/AdminGodView.tsx`, `admin/AdminConfig.tsx`, `admin/AdminReports.tsx`, `admin/AdminOverridePage.tsx` (bỏ OverrideModal orphan).
6. **4f — Notifications:** `pages/NotificationsPage.tsx` → `/ocps/notifications`.
**Sửa A mỗi bước:** chỉ `src/features/ocps/routes.tsx` (thêm route) — không đụng file lõi của A.

### Phase 5 — Hợp nhất & dọn dẹp (sau khi mọi tính năng chạy)
- Hợp nhất login: gộp màn chọn role của B vào `LoginPage` của A hoặc ngược lại; một nguồn user duy nhất.
- Quyết định có chuyển `OcpsDataContext` → zustand store (`ocpsStore.ts`) cho đồng nhất kiến trúc A hay không.
- Cân nhắc thay `OcpsButton/OcpsBadge` bằng primitives của A để giảm trùng lặp UI.
- Xoá `_source_b_reference/` khỏi repo (hoặc giữ làm tài liệu — *quyết định khi duyệt*).

### Rủi ro chính
1. **Hai role model** — nếu hợp nhất User quá sớm sẽ lan sửa vào UserListPage/UserFormPage của A; nên giữ OcpsAuth độc lập ở Phase 3, hợp nhất ở Phase 5.
2. **JSX→TSX**: các trang B lớn (NHProductDetail, AdminConfig) có nhiều state cục bộ, type hoá tối thiểu để tránh sa lầy.
3. **DataContext của B seed notification SLA lúc init** (`withSlaAlerts`) — chỉ chạy trong provider OCPS, không ảnh hưởng A nếu scope đúng.

---

## Câu hỏi chờ bạn quyết khi duyệt
1. Port **tất cả 7 nhóm tính năng** hay chỉ một phần? (Kế hoạch trên cho phép cắt bất kỳ bước 4a–4f.)
2. Đồng ý **prefix `/ocps/*`** hay muốn giữ nguyên path gốc của B (`/nh/...`, `/vendor/...`)?
3. Auth: giữ **OcpsAuthContext độc lập** trước (đề xuất) hay hợp nhất vào `useAuthStore` ngay từ Phase 3?
4. Font: thêm Inter cho khu OCPS hay dùng Segoe UI chung của A?
