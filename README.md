# mwg_aicps


---
## 🚀 Changelog & Cập Nhật Mới Nhất (Content Production System)

**1. Tái cấu trúc Hệ thống Quản lý Prompt (Prompt Management):**
- **Thay đổi phân cấp Prompt (3 cấp độ):** Thiết kế lại luồng cấu hình prompt theo cấu trúc mới:
  - **Cấp 1 (Ngành hàng):** Cho phép chọn ngành hàng (Category) áp dụng prompt.
  - **Cấp 2 (Phân loại Workflow):** Lọc lựa chọn theo các quy trình sinh nội dung (WF1-Specs, WF2-Outline, WF3-Article, WF4-Images, WF5-SEO).
  - **Cấp 3 (Tùy chọn Prompt - Options):** Thêm nhiều Option khác nhau (VD: phong cách gen ảnh Kiểu A, Kiểu B).
- Khóa chức năng sửa trực tiếp nội dung Prompt Template (để giữ form chuẩn của team).
- Bổ sung thêm 2 trường nhập liệu mới để tinh chỉnh kết quả AI: **Yêu cầu bổ sung (Bonus Prompt)** và **Feedback cho AI (Regen)**.
- Xây dựng component mới `PromptConfigEditor` để tái sử dụng form cấu hình prompt cho từng section.

**2. Tối ưu hóa UI/UX Trang Chi Tiết Sản Phẩm (Specs Demo Page):**
- **Loại bỏ các Section dư thừa/không dùng:** Đã gỡ bỏ Ảnh Thumb, Ảnh sản phẩm (chuyển đổi logic sang Upload), Đặc điểm nổi bật (Highlights), và Slide minh họa (AI Vision).
- **Tái cấu trúc mục Upload File:** Tách bạch hệ thống upload theo các phân loại rõ ràng: (1) Ảnh sản phẩm, (2) Spec tài liệu Hãng, (3) Khác.
- Đổi tên & đổi chức năng nút "Chạy Full Workflow" thành nút **"Xuất bản lên PIM"** (nằm ở vị trí nổi bật trên cùng bên phải). Lược bỏ các thông tin dư thừa như trạng thái Variants ở header.

**3. Đồng bộ chuẩn Layout cho toàn bộ các Section sinh nội dung (AI Generation Sections):**
- Áp dụng cấu trúc Header đồng nhất 100% cho 5 workflows: **Thông số kỹ thuật, Dàn bài (Outline), Viết bài chi tiết, Ảnh minh họa bài viết, và SEO Meta**.
- Quy chuẩn lại thứ tự sắp xếp và style các nút trên Header (từ trái qua phải):
  1. **Badge trạng thái AI:** Bổ sung nhãn `AI gen xong | tên_agent#id` (VD: image_agent#901, outline_agent#312) cho tất cả section.
  2. **Nút "Duyệt":** Đồng nhất màu Xanh lá cho trạng thái duyệt nội dung.
  3. **Nút "Cấu hình Prompt":** Nút cài đặt ẩn/hiện form tinh chỉnh prompt.
  4. **Nút "Gen AI" (Trích xuất / Tạo Outline / Viết bài / Tạo Ảnh / Gen SEO):** Đồng bộ tất cả về thiết kế chuẩn (Style Ghost, chữ Cyan, kèm hiệu ứng lấp lánh tia sét/sparkles màu vàng).

**4. Kỹ thuật & Sửa lỗi (Refactor & Bug fixes):**
- Xử lý các lỗi crash giao diện (Vite/React bị trắng trang) liên quan đến việc render biến trạng thái State.
- Bổ sung thêm **Error Boundary Component** để tự động bẫy và hiển thị chi tiết mã lỗi màu đỏ ngay trên màn hình, giúp team frontend dễ dàng bắt bệnh và debug trong tương lai.
- Cập nhật Data Mock và bổ sung các hàm Types (TypeScript) mới để hỗ trợ các trường lưu trữ Prompt Category, Options, Bonus & Feedback.
---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
