import type { Product } from '../types'

export type ProductContentStatus = 'partial' | 'processing' | 'ai_generated' | 'approved'

export const PRODUCT_CONTENT_STATUS_LABELS: Record<ProductContentStatus, string> = {
  partial: 'Đã sync từ PIM',
  processing: 'AI đang gen nội dung',
  ai_generated: 'AI gen xong',
  approved: 'Đã duyệt',
}

export const PRODUCT_CONTENT_STATUS_DESCRIPTIONS: Record<ProductContentStatus, string> = {
  partial: 'Có sẵn dữ liệu PIM, cần gen bổ sung section còn thiếu',
  processing: 'AI đang gen nội dung',
  ai_generated: 'Sẵn sàng cho content review',
  approved: 'Sẵn sàng push lên PIM',
}

export const PRODUCT_CONTENT_STATUS_CLASSES: Record<ProductContentStatus, string> = {
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  ai_generated: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
}

export const PRODUCT_CONTENT_STATUS_META: Record<ProductContentStatus, {
  label: string
  description: string
  className: string
}> = {
  partial: {
    label: PRODUCT_CONTENT_STATUS_LABELS.partial,
    description: PRODUCT_CONTENT_STATUS_DESCRIPTIONS.partial,
    className: PRODUCT_CONTENT_STATUS_CLASSES.partial,
  },
  processing: {
    label: PRODUCT_CONTENT_STATUS_LABELS.processing,
    description: PRODUCT_CONTENT_STATUS_DESCRIPTIONS.processing,
    className: PRODUCT_CONTENT_STATUS_CLASSES.processing,
  },
  ai_generated: {
    label: PRODUCT_CONTENT_STATUS_LABELS.ai_generated,
    description: PRODUCT_CONTENT_STATUS_DESCRIPTIONS.ai_generated,
    className: PRODUCT_CONTENT_STATUS_CLASSES.ai_generated,
  },
  approved: {
    label: PRODUCT_CONTENT_STATUS_LABELS.approved,
    description: PRODUCT_CONTENT_STATUS_DESCRIPTIONS.approved,
    className: PRODUCT_CONTENT_STATUS_CLASSES.approved,
  },
}

export const getProductContentStatus = (product: Product): ProductContentStatus => {
  if (product.id === 'PIM-TEST-01') return 'processing'
  if (product.pim_status === 'qc_passed' || product.pim_status === 'published') return 'approved'
  if (product.status === 'complete') return 'ai_generated'
  return 'partial'
}
