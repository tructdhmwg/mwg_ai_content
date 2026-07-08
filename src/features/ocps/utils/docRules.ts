// Pure logic cho DocRule — không phụ thuộc React.
// Port từ _source_b_reference/src/utils/docRules.js.
import { DOC_RULES, SPEC_TEMPLATE_URLS } from '../data/ocpsMockData'
import type { DocRule, OcpsItem } from '../types'

export function getDocRuleForItem(item?: Pick<OcpsItem, 'nganhhang'> | null): DocRule {
  return DOC_RULES[item?.nganhhang ?? ''] ?? DOC_RULES.DEFAULT
}

// Link Google Drive chứa file template Excel Spec theo ngành hàng — NH/Vendor tải về điền rồi upload lại
export function getSpecTemplateUrl(item?: Pick<OcpsItem, 'nganhhang'> | null): string {
  return SPEC_TEMPLATE_URLS[item?.nganhhang ?? ''] ?? SPEC_TEMPLATE_URLS.DEFAULT
}

export interface FileValidationResult {
  ok: boolean
  violations: string[]
}

// Kiểm tra 1 file vừa upload so với DocRule của ngành hàng.
// Chỉ validate được những gì đọc trực tiếp từ File object (tên/đuôi file, dung lượng byte).
// Kích thước ảnh thật (px) và rule nền trắng cần đọc nội dung ảnh — để lại làm warning
// hiển thị thủ công ở tầng UI (DocSlotZone), không tự động hoá ở đây.
export function validateFile(file: { name?: string; size?: number } | null | undefined, rule: DocRule | null | undefined): FileValidationResult {
  const violations: string[] = []
  const name = file?.name ?? ''
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''

  if (rule?.dinhDangChoPhep?.length && ext && !rule.dinhDangChoPhep.includes(ext)) {
    violations.push(`Định dạng .${ext} không hợp lệ (chỉ chấp nhận ${rule.dinhDangChoPhep.join('/').toUpperCase()})`)
  }

  if (rule?.sizeMaxMB && typeof file?.size === 'number') {
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > rule.sizeMaxMB) {
      violations.push(`Dung lượng ${sizeMB.toFixed(1)}MB vượt quá giới hạn ${rule.sizeMaxMB}MB`)
    }
  }

  return { ok: violations.length === 0, violations }
}

// Tóm tắt rule ảnh để hiển thị chủ động cho Vendor/NH trước khi upload (chỉ áp dụng slot "hinhanh")
export function formatImageRuleHint(rule?: DocRule | null): string {
  if (!rule) return ''
  const dinhDang = rule.dinhDangChoPhep?.join('/').toUpperCase()
  return `Tối thiểu ${rule.soAnhToiThieu} ảnh · ${dinhDang} · < ${rule.sizeMaxMB}MB · ngang ≥ ${rule.minWidthPx}px · ảnh sản phẩm nền trắng`
}
