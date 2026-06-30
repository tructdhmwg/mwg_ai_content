import { ErrorBoundary } from '../../components/ErrorBoundary'
// @ts-nocheck

import { useState, useEffect, useMemo } from 'react'
import { PRODUCT_CONTENT_STATUS_META, getProductContentStatus } from '../../lib/productContentStatus'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Trash2, Plus, Sparkles, Save, FileText,
  Settings, AlertTriangle, Globe, File, Check, Info, Loader2, X, FileSpreadsheet,
  Link, History, CheckCircle2, Play, ExternalLink, Image, Video, LayoutList, Zap, List
} from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { SiteBadge, StatusBadge } from '../../components/ui/Badge'
import { PromptConfigEditor } from '../../components/PromptConfigEditor'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useProductStore } from '../../store/productStore'
import { usePromptStore } from '../../store/promptStore'
import { useJobStore } from '../../store/jobStore'
import { useToast } from '../../components/ui/Toast'
import { type ProductPimStatus, type Job } from '../../types'
import { formatDateTime, formatTimeAgo } from '../../lib/utils'

const PIM_STATUS_META: Record<ProductPimStatus, { label: string; bgClass: string }> = {
  draft: { label: 'Nháp PIM', bgClass: 'bg-gray-100 text-gray-700 border-gray-200' },
  gen_completed: { label: 'Đã gen xong', bgClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending_qc: { label: 'Cần QC', bgClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  qc_passed: { label: 'Đã QC', bgClass: 'bg-green-50 text-green-700 border-green-200' },
  published: { label: 'Đã publish PIM', bgClass: 'bg-emerald-600 text-white border-emerald-600' }
}

interface SpecSchemaField {
  name: string
  type: 'text' | 'select' | 'multi'
  options?: string[]
}

const SPEC_SCHEMAS: Record<string, SpecSchemaField[]> = {
  'Sữa bột': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Xuất xứ', type: 'select', options: ['Úc', 'Đức', 'Nhật Bản', 'Việt Nam', 'New Zealand', 'Pháp', 'Hoa Kỳ', 'Thụy Sĩ', 'Hàn Quốc'] },
    { name: 'Độ tuổi', type: 'select', options: ['0 - 6 tháng', '6 - 12 tháng', '12 - 24 tháng', 'Trên 2 tuổi'] },
    { name: 'Trọng lượng', type: 'text' },
    { name: 'Hạn sử dụng', type: 'text' },
    { name: 'Thành phần chính', type: 'text' },
    { name: 'Dưỡng chất bổ sung', type: 'multi', options: ['DHA', 'ARA', 'Vitamin D3', 'Canxi', 'Chất xơ (FOS)', 'Omega 3', 'Omega 6'] }
  ],
  'Điện thoại': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Hệ điều hành', type: 'select', options: ['iOS', 'Android', 'HarmonyOS', 'Khác'] },
    { name: 'RAM', type: 'select', options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '24 GB'] },
    { name: 'Bộ nhớ trong', type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
    { name: 'Dung lượng pin', type: 'text' },
    { name: 'Cổng kết nối', type: 'multi', options: ['Type-C', 'Lightning', 'Micro USB', 'Jack 3.5mm', 'NFC', 'Wi-Fi 6', 'Bluetooth 5.3', '5G'] },
    { name: 'Cổng sạc', type: 'multi', options: ['Type-C', 'Lightning', 'Sạc không dây MagSafe', 'Sạc không dây Qi', 'Sạc siêu nhanh SuperVOOC'] }
  ],
  'iPhone': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Hệ điều hành', type: 'select', options: ['iOS'] },
    { name: 'RAM', type: 'select', options: ['6 GB', '8 GB', '12 GB'] },
    { name: 'Bộ nhớ trong', type: 'select', options: ['128 GB', '256 GB', '512 GB', '1 TB'] },
    { name: 'Kích thước màn hình', type: 'text' },
    { name: 'Cổng kết nối', type: 'multi', options: ['Type-C', 'Lightning', '5G', 'Wi-Fi 6E', 'Wi-Fi 7', 'Bluetooth 5.3', 'NFC'] },
    { name: 'Cổng sạc', type: 'multi', options: ['Type-C', 'Lightning', 'Sạc không dây MagSafe', 'Sạc không dây Qi'] }
  ],
  'Mac': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Hệ điều hành', type: 'select', options: ['macOS'] },
    { name: 'RAM', type: 'select', options: ['8 GB', '16 GB', '18 GB', '24 GB', '32 GB', '36 GB', '48 GB', '64 GB', '96 GB', '128 GB'] },
    { name: 'Ổ cứng', type: 'select', options: ['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD', '4 TB SSD'] },
    { name: 'Kích thước màn hình', type: 'text' },
    { name: 'Cổng kết nối', type: 'multi', options: ['Thunderbolt 4', 'Type-C', 'USB-A', 'HDMI', 'SD Card Slot', 'Jack 3.5mm', 'MagSafe 3'] }
  ],
  'Máy tính bảng': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Hệ điều hành', type: 'select', options: ['iPadOS', 'Android'] },
    { name: 'RAM', type: 'select', options: ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'] },
    { name: 'Bộ nhớ trong', type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'] },
    { name: 'Dung lượng pin', type: 'text' },
    { name: 'Cổng kết nối', type: 'multi', options: ['Type-C', 'Lightning', 'Wi-Fi 6', 'Bluetooth 5.2'] }
  ],
  'Tủ lạnh': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Kiểu tủ', type: 'select', options: ['Ngăn đá trên', 'Ngăn đá dưới', 'Side by Side', 'Multi Door', 'Mini'] },
    { name: 'Dung tích sử dụng', type: 'text' },
    { name: 'Công nghệ tiết kiệm điện', type: 'text' },
    { name: 'Nơi sản xuất', type: 'text' },
    { name: 'Tiện ích', type: 'multi', options: ['Làm đá tự động', 'Lấy nước ngoài', 'Bảng điều khiển ngoài', 'Ngăn đông mềm', 'Chuông báo cửa mở'] }
  ],
  'Máy giặt': [
    { name: 'Thương hiệu', type: 'text' },
    { name: 'Loại máy', type: 'select', options: ['Cửa trước', 'Cửa trên', 'Lồng ngang', 'Lồng đứng'] },
    { name: 'Khối lượng giặt', type: 'text' },
    { name: 'Động cơ', type: 'text' },
    { name: 'Công nghệ giặt', type: 'text' },
    { name: 'Nơi sản xuất', type: 'text' },
    { name: 'Tiện ích', type: 'multi', options: ['Hẹn giờ giặt', 'Khóa trẻ em', 'Giặt nước nóng', 'Tự khởi động lại', 'Vệ sinh lồng giặt', 'Wifi Control'] }
  ]
}

const DEFAULT_SPEC_SCHEMA: SpecSchemaField[] = [
  { name: 'Thương hiệu', type: 'text' },
  { name: 'Xuất xứ', type: 'text' },
  { name: 'Kích thước', type: 'text' },
  { name: 'Chất liệu', type: 'text' },
  { name: 'Bảo hành', type: 'text' }
]

interface MappingValue {
  code: string | number | null
  name: string
  is_new_value?: boolean
}

interface MappingAttribute {
  attribute_name: string | null
  label: string | null
  is_new_atb?: boolean
  value: MappingValue[]
  type: string | null
  sort_order: number
  origin_atribute_name: string
  origin_atribute_value: string
  matching_level: string
  ghi_chu?: string | null
}

interface ProductMappingPayload {
  _meta?: {
    total_attributes?: number
    summary?: Record<string, number>
    [key: string]: unknown
  }
  attributes: Array<MappingAttribute | MappingSection>
}

interface MappingSection {
  section_type: string
  attribute_list: MappingAttribute[]
}

const VISIBLE_MAPPING_LEVELS = ['CHINH_XAC', 'CAN_KIEM_TRA', 'GIA_TRI_MOI', 'THUOC_TINH_MOI'] as const
type VisibleMappingLevel = typeof VISIBLE_MAPPING_LEVELS[number]

const MAPPING_LEVEL_LABEL: Record<string, string> = {
  'CHINH_XAC': 'Chính xác',
  'CAN_KIEM_TRA': 'Cần kiểm tra',
  'GIA_TRI_MOI': 'Giá trị mới',
  'THUOC_TINH_MOI': 'Thuộc tính mới'
}

type SpecsApprovalStatus = 'awaiting_approval' | 'approved' | 'synced'
type SpecsAiGenerationStatus = 'pending' | 'processing' | 'done' | 'failed'

const SPECS_APPROVAL_STATUS_META: Record<SpecsApprovalStatus, { label: string; className: string; dotClassName: string }> = {
  awaiting_approval: {
    label: 'Chờ duyệt',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
  },
  approved: {
    label: 'Đã duyệt',
    className: 'border-green-200 bg-green-50 text-green-700',
    dotClassName: 'bg-green-500',
  },
  synced: {
    label: 'Đã sync PIM',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClassName: 'bg-blue-500',
  },
}

const SPECS_AI_STATUS_META: Record<SpecsAiGenerationStatus, { label: string; className: string; dotClassName: string }> = {
  pending: {
    label: 'Chờ AI gen',
    className: 'border-gray-200 bg-gray-50 text-gray-600',
    dotClassName: 'bg-gray-400',
  },
  processing: {
    label: 'AI đang gen',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
    dotClassName: 'bg-violet-500',
  },
  done: {
    label: 'AI gen xong',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    dotClassName: 'bg-cyan-500',
  },
  failed: {
    label: 'AI gen lỗi',
    className: 'border-red-200 bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  },
}

const isMappingSection = (item: MappingAttribute | MappingSection): item is MappingSection => {
  return 'section_type' in item && Array.isArray(item.attribute_list)
}

const isMappingAttribute = (item: MappingAttribute | MappingSection): item is MappingAttribute => {
  return 'origin_atribute_name' in item && 'matching_level' in item
}

const getSpecsMappingRows = (payload: ProductMappingPayload): MappingAttribute[] => {
  const attributes = payload.attributes || []
  const specsSection = attributes.find(
    (item): item is MappingSection => isMappingSection(item) && item.section_type === 'specs_information'
  )

  if (specsSection) return specsSection.attribute_list || []

  return attributes.filter(isMappingAttribute)
}

const buildMappingMeta = (
  payload: ProductMappingPayload,
  rows: MappingAttribute[]
): ProductMappingPayload['_meta'] => {
  const summary = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.matching_level] = (acc[row.matching_level] || 0) + 1
    return acc
  }, {})

  return {
    ...(payload._meta || {}),
    total_attributes: rows.length,
    summary,
  }
}

function SpecsDemoPageContent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    products,
    updateProductField,
    uploadSpecFile,
    deleteSpecFile,
    generateFieldWithAI,
    runFullWorkflow,
    runWf1ExtractSpecs
  } = useProductStore()

  const { prompts } = usePromptStore()
  const jobs = useJobStore((s) => s.jobs)

  // Find current product
  const product = useMemo(() => products.find((p) => p.id === id), [products, id])

  // Query previous jobs run for this PIM product
  const productJobs = useMemo(() => {
    return jobs.filter((j) => j.pim_product_id === id)
  }, [jobs, id])


  const [mappingRows, setMappingRows] = useState<MappingAttribute[]>([])
  const [mappingMeta, setMappingMeta] = useState<ProductMappingPayload['_meta'] | null>(null)
  const [mappingLoading, setMappingLoading] = useState(false)
  const [mappingError, setMappingError] = useState('')
  const [mappingLevelFilter, setMappingLevelFilter] = useState<'all' | VisibleMappingLevel>('all')
  const [selectedMappingRows, setSelectedMappingRows] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    const loadMapping = async () => {
      setMappingLoading(true)
      setMappingError('')
      try {
        const res = await fetch('/product_mapping_test.json')
        if (!res.ok) throw new Error('Không thể tải file product_mapping_test.json')
        const data = (await res.json()) as ProductMappingPayload
        const specsRows = getSpecsMappingRows(data)
        if (cancelled) return
        setMappingRows(specsRows)
        setMappingMeta(buildMappingMeta(data, specsRows))
        setHasExtractedSpecs(specsRows.length > 0)
      } catch (err) {
        if (cancelled) return
        setMappingError(err instanceof Error ? err.message : 'Không thể tải dữ liệu mapping')
      } finally {
        if (!cancelled) setMappingLoading(false)
      }
    }
    loadMapping()
    return () => {
      cancelled = true
    }
  }, [])
  const getMappingStatusClass = (level: string) => {
    if (level === 'CHINH_XAC') return 'bg-green-50 text-green-700 border-green-200'
    if (level === 'CAN_KIEM_TRA') return 'bg-orange-50 text-orange-700 border-orange-200'
    if (level === 'GIA_TRI_MOI' || level === 'THUOC_TINH_MOI') return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }

  const getMappingStatusDotClass = (level: string) => {
    if (level === 'CHINH_XAC') return 'bg-[#1FAA59]'
    if (level === 'CAN_KIEM_TRA') return 'bg-[#E8A33D]'
    if (level === 'GIA_TRI_MOI' || level === 'THUOC_TINH_MOI') return 'bg-[#E0473C]'
    return 'bg-gray-400'
  }

  const getVariantStatusDotClass = (statusClassName: string) => {
    if (statusClassName.includes('violet')) return 'bg-violet-500'
    if (statusClassName.includes('green')) return 'bg-green-500'
    if (statusClassName.includes('blue')) return 'bg-blue-500'
    if (statusClassName.includes('amber')) return 'bg-amber-500'
    return 'bg-gray-400'
  }

  const hasMappingFiles = product?.specs_files && product.specs_files.length > 0;
  const visibleMappingRows = useMemo(() => {
    return mappingRows.filter((row) => {
      if (!VISIBLE_MAPPING_LEVELS.includes(row.matching_level as VisibleMappingLevel)) return false
      if (mappingLevelFilter === 'all') return true
      return row.matching_level === mappingLevelFilter
    })
  }, [mappingRows, mappingLevelFilter])

  const getMappingLevelCount = (level: VisibleMappingLevel) => {
    return mappingRows.filter((row) => row.matching_level === level).length
  }

  const getMappingRowKey = (row: MappingAttribute, rowIndex: number) => {
    return `${row.sort_order}-${row.attribute_name || row.origin_atribute_name}-${row.origin_atribute_name}-${rowIndex}`
  }

  const getMappingOptions = (row: MappingAttribute) => {
    const values = row.value || []
    if (values.length > 0) return values
    if (row.origin_atribute_value) {
      return [{ code: null, name: row.origin_atribute_value, is_new_value: true }]
    }
    return []
  }

  const updateMappingValue = (rowIndex: number, nextValue: MappingValue[]) => {
    setMappingRows((prev) =>
      prev.map((row, index) => (index === rowIndex ? { ...row, value: nextValue } : row))
    )
  }

  const renderMappingValueEditor = (row: MappingAttribute, rowIndex: number) => {
    const normalizedType = (row.type || '').toLowerCase()
    const values = row.value || []
    const options = getMappingOptions(row)
    const selectedNames = values.map((item) => item.name).filter(Boolean)
    const dropdownKey = `${row.attribute_name || row.origin_atribute_name}-${rowIndex}`

    if (normalizedType === 'simple select') {
      return (
        <select
          value={selectedNames[0] || ''}
          onChange={(e) => {
            const selected = options.find((option) => option.name === e.target.value)
            updateMappingValue(rowIndex, selected ? [selected] : [])
          }}
          className="w-full min-w-[180px] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">-- Chọn giá trị --</option>
          {options.map((option, index) => (
            <option key={`${option.name}-${option.code ?? index}`} value={option.name}>{option.name}</option>
          ))}
        </select>
      )
    }

    if (normalizedType === 'multi select') {
      // Shared dropdown rendered once; individual value rows call this to get the panel
      return (
        <div className="relative min-w-[220px]">
          {openDropdown === dropdownKey && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                {options.length === 0 ? (
                  <div className="px-2.5 py-2 text-xs text-gray-400">Chưa có option</div>
                ) : (
                  options.map((option, optionIndex) => {
                    const isSelected = selectedNames.includes(option.name)
                    return (
                      <button
                        key={`${option.name}-${option.code ?? optionIndex}`}
                        type="button"
                        onClick={() => {
                          const nextValue = isSelected
                            ? values.filter((value) => value.name !== option.name)
                            : [...values, option]
                          updateMappingValue(rowIndex, nextValue)
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-cyan-50/60"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-3 w-3 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>{option.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
            className="relative z-20 flex min-h-[34px] w-full items-center rounded-lg border border-cyan-400 bg-cyan-50 px-2.5 py-1.5 text-left text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {selectedNames.length === 0 ? (
              <span className="text-gray-400">-- Chọn nhiều giá trị --</span>
            ) : (
              <span className="text-cyan-700 font-semibold">{selectedNames.length} giá trị đã chọn</span>
            )}
          </button>
        </div>
      )
    }

    if (normalizedType === 'text area') {
      return (
        <textarea
          value={selectedNames[0] || ''}
          onChange={(e) => updateMappingValue(rowIndex, [{ code: null, name: e.target.value }])}
          rows={2}
          className="w-full min-w-[220px] rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Nhập giá trị..."
        />
      )
    }

    return (
      <input
        type="text"
        value={selectedNames[0] || ''}
        onChange={(e) => updateMappingValue(rowIndex, [{ code: null, name: e.target.value }])}
        className="w-full min-w-[180px] rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        placeholder="Nhập giá trị..."
      />
    )
  }


  const articleH3s = useMemo(() => {
    if (!product || !product.content_html) return []
    const matches = [...product.content_html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)]
    return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean)
  }, [product?.content_html])

  // Right side panel tab: specs | prompts | jobs
  const [mainTab, setMainTab] = useState<'content' | 'specs' | 'jobs'>('content')
  // HTML Content view tab
  const [contentTab, setContentTab] = useState<'edit' | 'preview'>('preview')
  
  // Selected job details popup states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [popupTab, setPopupTab] = useState<'preview' | 'outline_specs' | 'seo' | 'logs'>('preview')
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  
  // Loading states for individual AI gens
  const [generatingFields, setGeneratingFields] = useState<Record<string, boolean>>({})
  // Track if name has changed to show dependency alert
  const [nameChangedAlert, setNameChangedAlert] = useState(false)
  // Local edit states to prevent store update lags
  const [editName, setEditName] = useState('')
  const [newKeywordText, setNewKeywordText] = useState('')

  // Full workflow running states
  const [runningFullWf, setRunningFullWf] = useState(false)
  const [currentWfStep, setCurrentWfStep] = useState(0)
  const [hasExtractedSpecs, setHasExtractedSpecs] = useState(false)
  const [extractingSpecs, setExtractingSpecs] = useState(false)
  const [pendingSpecFiles, setPendingSpecFiles] = useState<{file: File, type: 'product_image' | 'manufacturer_spec' | 'other'}[]>([])
  const [uploadCategory, setUploadCategory] = useState<'product_image' | 'manufacturer_spec' | 'other'>('manufacturer_spec')
  const [showMissingInputAlert, setShowMissingInputAlert] = useState(false)

  // Prompts visibility toggle
  const [showPrompts, setShowPrompts] = useState<Record<string, boolean>>({})

  // Extra reference links (dynamic list in Specs tab)
  const [extraLinks, setExtraLinks] = useState<{ id: string; label: string; url: string }[]>([
    { id: 'link-1', label: '', url: '' }
  ])
  const [initialLinksString, setInitialLinksString] = useState(JSON.stringify([{ id: 'link-1', label: '', url: '' }]))
  const hasLinkChanges = JSON.stringify(extraLinks) !== initialLinksString
  const hasTab2Changes = pendingSpecFiles.length > 0 || hasLinkChanges

  // AI Confidence flags state (mocked on load)
  const [confidenceFlags, setConfidenceFlags] = useState<Record<string, 'verified' | 'review' | 'none'>>({})

  // Tech Specs status filter
  const [specsStatusFilter, setSpecsStatusFilter] = useState<'all' | 'verified' | 'review' | 'none'>('all')

  // Open multi-select dropdown field name
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Article images generation loading state
  const [generatingArticleImages, setGeneratingArticleImages] = useState(false)

  // Highlights HTML editor state
  const [highlightsHtml, setHighlightsHtml] = useState('')

  // Sync store name to local state on load
  useEffect(() => {
    if (product) {
      setEditName(product.name)
    }
  }, [product?.id])

  // Initialize confidence flags and highlights HTML
  useEffect(() => {
    if (product) {
      const categoryFields = SPEC_SCHEMAS[product.nganh_hang] || DEFAULT_SPEC_SCHEMA
      const initialFlags: Record<string, 'verified' | 'review' | 'none'> = {}
      categoryFields.forEach((field, index) => {
        const val = product.thong_so_ky_thuat?.[field.name]
        if (!val || val.toString().trim() === '') {
          initialFlags[field.name] = 'none'
        } else {
          initialFlags[field.name] = index % 2 === 0 ? 'verified' : 'review'
        }
      })
      setConfidenceFlags(initialFlags)
      
      if (product.dac_diem_noi_bat) {
        const isHtml = product.dac_diem_noi_bat.some(s => s.trim().startsWith('<') && s.trim().endsWith('>'))
        if (isHtml) {
          setHighlightsHtml(product.dac_diem_noi_bat.join('\n'))
        } else {
          setHighlightsHtml(`<ul>\n${product.dac_diem_noi_bat.map(item => `  <li>${item}</li>`).join('\n')}\n</ul>`)
        }
      } else {
        setHighlightsHtml('')
      }
    }
  }, [product?.id])

  // Custom prompt update handler
  const handleUpdateCustomPrompt = (stepKey: string, val: string) => {
    if (!product) return
    const nextCustom = product.custom_prompt_text ? { ...product.custom_prompt_text } : {}
    nextCustom[stepKey] = val
    updateProductField(product.id, 'custom_prompt_text', nextCustom)
  }

  // Helper to get custom or default prompt
  const getPromptText = (stepKey: string) => {
    if (!product) return ''
    if (product.custom_prompt_text?.[stepKey]) {
      return product.custom_prompt_text[stepKey]
    }
    const defaults: Record<string, string> = {
      wf4_thumb: `Tạo ảnh đại diện sản phẩm ${product.name} phong cách tối giản, nền trắng.`,
      wf4_video: `Phân tích video review và sinh tóm tắt nội dung chính cho sản phẩm ${product.name}.`,
      wf4_gallery: `Sinh bộ 6 ảnh chi tiết cho sản phẩm ${product.name} chất lượng cao, các góc cạnh khác nhau.`,
      wf4_slides: `Phân tích ảnh hãng và sinh 3 ảnh slide tính năng nổi bật cho ${product.name} gắn với thẻ H3.`,
      wf4_article_images: `Tạo bộ 4 ảnh minh họa chất lượng cao để chèn vào nội dung bài viết cho ${product.name}.`,
      wf1_specs: `Đọc tài liệu specs đính kèm và trích xuất thông tin kỹ thuật của ${product.name} thành JSON.`,
      wf4_highlights: `Sinh 4-5 đặc điểm nổi bật chính dạng danh sách HTML của sản phẩm ${product.name}.`,
      wf2_outline: `Tạo dàn ý bài viết chi tiết chuẩn SEO cho sản phẩm ${product.name}.`,
      wf3_writing: `Viết bài mô tả sản phẩm chi tiết bằng HTML dựa trên dàn ý và thông số kỹ thuật của ${product.name}.`
    }
    return defaults[stepKey] || ''
  }

  // Update highlights HTML in store
  const handleUpdateHighlights = (htmlVal: string) => {
    if (!product) return
    setHighlightsHtml(htmlVal)
    updateProductField(product.id, 'dac_diem_noi_bat', [htmlVal])
  }

  // Helper to insert HTML tags at textarea cursor
  const insertHtmlTag = (startTag: string, endTag: string) => {
    const textarea = document.getElementById('highlights-textarea') as HTMLTextAreaElement
    if (!textarea) return
    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(startPos, endPos)
    const replacement = startTag + selectedText + endTag
    const newText = text.substring(0, startPos) + replacement + text.substring(endPos)
    handleUpdateHighlights(newText)
    
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = startPos + startTag.length
      textarea.selectionEnd = startPos + startTag.length + selectedText.length
    }, 0)
  }

  const toggleConfidence = (fieldName: string) => {
    if (!product) return
    setConfidenceFlags((prev) => {
      const current = prev[fieldName] || 'review'
      let next: 'verified' | 'review' | 'none'
      if (current === 'verified') next = 'review'
      else if (current === 'review') next = 'none'
      else next = 'verified'
      
      return {
        ...prev,
        [fieldName]: next,
      }
    })
    toast(`Đã đổi trạng thái duyệt thông số "${fieldName}"`, 'info')
  }

  const handleUpdateGalleryLabel = (imgId: string, nextLabel: string) => {
    if (!product) return
    const updated = (product.gallery_images || []).map((g) =>
      g.id === imgId ? { ...g, label: nextLabel } : g
    )
    updateProductField(product.id, 'gallery_images', updated)
  }

  const handleRegenThumb = async () => {
    if (!product) return
    setGenMediaLoading((p) => ({ ...p, thumb: true }))
    await new Promise((r) => setTimeout(r, 1500))
    const newUrl = `https://picsum.photos/seed/thumb-${Date.now()}/800/450`
    updateProductField(product.id, 'thumb_url', newUrl)
    setGenMediaLoading((p) => ({ ...p, thumb: false }))
    toast('Đã gen ảnh đại diện mới bằng AI', 'success')
  }

  const handleRegenVideo = async () => {
    if (!product) return
    setGenMediaLoading((p) => ({ ...p, video: true }))
    await new Promise((r) => setTimeout(r, 1500))
    const demoVideo = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    updateProductField(product.id, 'video_url', demoVideo)
    setGenMediaLoading((p) => ({ ...p, video: false }))
    toast('Đã trích xuất & tối ưu video review bằng AI', 'success')
  }

  if (!product) {
    return (
      <AppShell breadcrumb={['AICPS', 'Sản phẩm', 'Lỗi']}>
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
          <AlertTriangle className="text-red-500 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-bold text-gray-800">Không tìm thấy sản phẩm</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4">Sản phẩm với mã model {id} không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => navigate('/products')}>Quay lại danh sách</Button>
        </div>
      </AppShell>
    )
  }

  // Load appropriate prompt based on override or product category
  const activePromptCategory = product.active_prompt_category || product.nganh_hang

  // Handlers
  const handleUpdateName = (val: string) => {
    setEditName(val)
    updateProductField(product.id, 'name', val)
    setNameChangedAlert(true)
  }

  const handleGenField = async (field: 'name' | 'thong_so_ky_thuat' | 'dac_diem_noi_bat' | 'outline' | 'content_html' | 'meta_seo') => {
    setGeneratingFields((prev) => ({ ...prev, [field]: true }))
    try {
      const fieldStepMap: Record<string, string> = {
        name: 'wf1_specs',
        thong_so_ky_thuat: 'wf1_specs',
        dac_diem_noi_bat: 'wf4_highlights',
        outline: 'wf2_outline',
        content_html: 'wf3_writing',
        meta_seo: 'wf5_finalize'
      }
      const stepKey = fieldStepMap[field] || 'wf2_outline'
      
      const matched = prompts.find(
        (pr) => pr.site_id === product.site_id && pr.prompt_category === activePromptCategory && pr.wf_step === stepKey
      )
      
      let promptText = ''
      if (matched) {
        promptText = matched.prompt_text
      } else if (product.custom_prompt_text?.[stepKey]) {
        promptText = product.custom_prompt_text[stepKey]
      } else {
        const defaults: Record<string, string> = {
          wf4_thumb: `Tạo ảnh đại diện sản phẩm ${product.name} phong cách tối giản, nền trắng.`,
          wf4_video: `Phân tích video review và sinh tóm tắt nội dung chính cho sản phẩm ${product.name}.`,
          wf4_gallery: `Sinh bộ 6 ảnh chi tiết cho sản phẩm ${product.name} chất lượng cao, các góc cạnh khác nhau.`,
          wf4_slides: `Phân tích ảnh hãng và sinh 3 ảnh slide tính năng nổi bật cho ${product.name} gắn với thẻ H3.`,
          wf4_article_images: `Tạo bộ 4 ảnh minh họa chất lượng cao để chèn vào nội dung bài viết cho ${product.name}.`,
          wf1_specs: `Đọc tài liệu specs đính kèm và trích xuất thông tin kỹ thuật của ${product.name} thành JSON.`,
          wf4_highlights: `Sinh 4-5 đặc điểm nổi bật chính dạng danh sách HTML của sản phẩm ${product.name}.`,
          wf2_outline: `Tạo outline bài viết cho sản phẩm ${product.name} thuộc ngành hàng ${activePromptCategory}.\nYêu cầu cấu trúc rõ ràng, chuẩn SEO.`,
          wf3_writing: `Viết bài mô tả chi tiết sản phẩm ${product.name} chuẩn SEO dựa vào outline và đặc tả thông số.`,
          wf5_finalize: `Kiểm tra chất lượng bài viết của ${product.name}. Tối ưu mật độ từ khóa SEO, chuẩn hóa định dạng HTML và tạo thẻ meta description.`
        }
        promptText = defaults[stepKey] || ''
      }

      await generateFieldWithAI(product.id, field, promptText)
      toast(`Đã tự động sinh nội dung trường ${field === 'name' ? 'Tên' : field.toUpperCase()} bằng AI`, 'success')
      if (field === 'name') {
        setNameChangedAlert(true)
      }
    } catch (e) {
      toast('Sinh nội dung AI thất bại', 'error')
    } finally {
      setGeneratingFields((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleExtractSpecs = async () => {
    const hasFiles = product.specs_files && product.specs_files.length > 0;
    const hasLinks = extraLinks.some(link => link.url.trim() !== '');
    
    if (!hasFiles && !hasLinks) {
      setShowMissingInputAlert(true);
      return;
    }

    setExtractingSpecs(true)
    try {
      await runWf1ExtractSpecs(product.id)
      setHasExtractedSpecs(true)
      toast('WF1: Đã đọc và trích xuất thành công Specs hãng từ tài liệu vào bảng thông số!', 'success')
    } catch (e) {
      toast('Trích xuất Specs thất bại', 'error')
    } finally {
      setExtractingSpecs(false)
    }
  }

  const handleRunFullWf = async () => {
    setRunningFullWf(true)
    setCurrentWfStep(1)
    try {
      await runFullWorkflow(product.id, (step) => {
        setCurrentWfStep(step)
      })
      toast('Đã hoàn thành toàn bộ quy trình biên tập tự động 5 bước!', 'success')
      setNameChangedAlert(false)
    } catch (err) {
      toast('Chạy workflow thất bại', 'error')
    } finally {
      setRunningFullWf(false)
      setCurrentWfStep(0)
    }
  }

  const handleRegenDependentFields = async () => {
    setNameChangedAlert(false)
    setGeneratingFields((prev) => ({ ...prev, outline: true, content_html: true }))
    try {
      await generateFieldWithAI(product.id, 'outline')
      await generateFieldWithAI(product.id, 'content_html')
      toast('Đã đồng bộ sinh lại Dàn bài và Bài viết chi tiết theo tên sản phẩm mới!', 'success')
    } catch (e) {
      toast('Đồng bộ thất bại', 'error')
    } finally {
      setGeneratingFields((prev) => ({ ...prev, outline: false, content_html: false }))
    }
  }

  // ──── Media Handlers ────
  const [genMediaLoading, setGenMediaLoading] = useState<Record<string, boolean>>({})

  // Demo fallback images (picsum.photos) for empty media slots
  const DEMO_THUMB = `https://picsum.photos/seed/${product.id}-thumb/800/450`
  const DEMO_GALLERY = Array.from({ length: 6 }, (_, i) => ({
    id: `demo-gal-${i}`,
    url: `https://picsum.photos/seed/${product.id}-gal${i}/600/400`,
    label: `Ảnh demo ${i + 1}`,
  }))
  const DEMO_VIDEO = 'https://www.youtube.com/embed/dQw4w9WgXcQ'

  const effectiveThumb = product.thumb_url || DEMO_THUMB
  const effectiveGallery = (product.gallery_images && product.gallery_images.length > 0)
    ? product.gallery_images : DEMO_GALLERY
  const effectiveVideo = product.video_url || DEMO_VIDEO
  const isThumbDemo = !product.thumb_url
  const isGalleryDemo = !product.gallery_images || product.gallery_images.length === 0
  const isVideoDemo = !product.video_url

  const handleRemoveThumb = () => {
    updateProductField(product.id, 'thumb_url', '')
    toast('Đã xóa ảnh đại diện', 'info')
  }

  const handleUploadThumb = () => {
    // Simulate upload by assigning a new random picsum image
    const newUrl = `https://picsum.photos/seed/${Date.now()}/800/450`
    updateProductField(product.id, 'thumb_url', newUrl)
    toast('Đã upload ảnh đại diện mới', 'success')
  }

  const handleRemoveGalleryImage = (imgId: string) => {
    const updated = (product.gallery_images || []).filter((g) => g.id !== imgId)
    updateProductField(product.id, 'gallery_images', updated)
    toast('Đã xóa ảnh khỏi Gallery', 'info')
  }

  const handleUploadGalleryImages = () => {
    // Simulate uploading 1-2 random images
    const current = product.gallery_images || []
    const newImgs = Array.from({ length: 2 }, (_, i) => ({
      id: `upl-${Date.now()}-${i}`,
      url: `https://picsum.photos/seed/upl${Date.now()}${i}/600/400`,
      label: `Upload ${current.length + i + 1}`,
    }))
    updateProductField(product.id, 'gallery_images', [...current, ...newImgs])
    toast(`Đã thêm ${newImgs.length} ảnh vào Gallery`, 'success')
  }

  const handleRegenGallery = async () => {
    setGenMediaLoading((p) => ({ ...p, gallery: true }))
    await new Promise((r) => setTimeout(r, 1500))
    const newGallery = Array.from({ length: 6 }, (_, i) => ({
      id: `regen-gal-${Date.now()}-${i}`,
      url: `https://picsum.photos/seed/regen${Date.now()}${i}/600/400`,
      label: `Gallery ảnh ${i + 1} (AI regen)`,
    }))
    updateProductField(product.id, 'gallery_images', newGallery)
    setGenMediaLoading((p) => ({ ...p, gallery: false }))
    toast('Đã gen lại toàn bộ Gallery bằng AI', 'success')
  }

  const handleRemoveSlideImage = (imgId: string) => {
    const updated = (product.slide_images || []).filter((s) => s.id !== imgId)
    updateProductField(product.id, 'slide_images', updated)
    toast('Đã xóa slide AI', 'info')
  }

  const handleRegenSlides = async () => {
    setGenMediaLoading((p) => ({ ...p, slides: true }))
    await new Promise((r) => setTimeout(r, 2000))
    const sections = ['Tổng quan tính năng', 'Công nghệ tiết kiệm điện', 'Thiết kế sang trọng']
    const newSlides = sections.map((sec, i) => ({
      id: `slide-regen-${Date.now()}-${i}`,
      url: `https://picsum.photos/seed/slide${Date.now()}${i}/800/500`,
      label: `Slide AI ${i + 1} – ${sec}`,
      section_h3: sec,
      selection_reason: `AI Vision đã chọn ảnh phù hợp nhất cho section "${sec}" dựa trên phân tích nội dung.`,
    }))
    updateProductField(product.id, 'slide_images', newSlides)
    setGenMediaLoading((p) => ({ ...p, slides: false }))
    toast('Đã gen lại Slide minh họa bằng AI Vision', 'success')
  }

  const handleUpdateVideoUrl = (url: string) => {
    updateProductField(product.id, 'video_url', url)
    toast('Đã cập nhật Video URL', 'success')
  }

  const handleRemoveVideo = () => {
    updateProductField(product.id, 'video_url', '')
    toast('Đã xóa video', 'info')
  }

  const handleGenArticleImages = async () => {
    if (!product) return
    setGeneratingArticleImages(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Parse H3 headings
    const currentH3s = [...(product.content_html || '').matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)

    const newImages = Array.from({ length: 4 }, (_, i) => {
      const labelText = currentH3s[i] || `Ảnh minh họa bài viết ${i + 1}`
      return {
        id: `art-${Date.now()}-${i}`,
        url: `https://picsum.photos/seed/art-regen-${Date.now()}-${i}/800/600`,
        label: labelText
      }
    })
    updateProductField(product.id, 'article_images', newImages)
    
    // Inject images directly under H3 tags in content_html
    if (product.content_html) {
      let nextHtml = product.content_html
      let h3Index = 0
      nextHtml = nextHtml.replace(/(<h3[^>]*>.*?<\/h3>)([\s\S]*?)(?=<h3>|<\/div>|$)/gi, (match, h3Tag, rest) => {
        const imgUrl = newImages[h3Index]?.url
        const imgLabel = newImages[h3Index]?.label || ''
        h3Index++
        
        if (imgUrl) {
          const cleanRest = rest.replace(/<img[^>]*>/gi, '')
          return `${h3Tag}\n  <img src="${imgUrl}" alt="${imgLabel}" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" />${cleanRest}`
        }
        return match
      })
      updateProductField(product.id, 'content_html', nextHtml)
      toast('Đã tạo bộ ảnh bài viết và gắn trực tiếp vào các thẻ H3!', 'success')
    } else {
      toast('Đã tạo thành công bộ ảnh bài viết bằng AI!', 'success')
    }
    setGeneratingArticleImages(false)
  }

  const handleRemoveArticleImage = (imgId: string) => {
    if (!product) return
    const currentImages = product.article_images || []
    const toRemove = currentImages.find(g => g.id === imgId)
    const updated = currentImages.filter((g) => g.id !== imgId)
    updateProductField(product.id, 'article_images', updated)
    
    if (toRemove && product.content_html) {
      const escapedUrl = toRemove.url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const imgRegex = new RegExp(`<img[^>]*src=["']${escapedUrl}["'][^>]*>`, 'gi')
      const nextHtml = product.content_html.replace(imgRegex, '')
      updateProductField(product.id, 'content_html', nextHtml)
    }
    toast('Đã xóa ảnh bài viết', 'info')
  }

  const handleUploadArticleImage = () => {
    if (!product) return
    const currentImages = product.article_images || []
    const nextIndex = currentImages.length
    const label = articleH3s[nextIndex] || `Ảnh tải lên ${nextIndex + 1}`
    const newImgUrl = `https://picsum.photos/seed/upl-art-${Date.now()}/800/600`
    
    const nextImages = [
      ...currentImages,
      {
        id: `upl-art-${Date.now()}`,
        url: newImgUrl,
        label: label
      }
    ]
    updateProductField(product.id, 'article_images', nextImages)
    
    // Inject image under the corresponding H3 tag in content_html
    if (product.content_html) {
      let h3Index = 0
      let injected = false
      const nextHtml = product.content_html.replace(/(<h3[^>]*>.*?<\/h3>)/gi, (match) => {
        if (h3Index === nextIndex) {
          injected = true
          h3Index++
          return `${match}\n  <img src="${newImgUrl}" alt="${label}" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" />`
        }
        h3Index++
        return match
      })
      if (injected) {
        updateProductField(product.id, 'content_html', nextHtml)
      }
    }
    toast('Đã tải ảnh lên và gắn vào bài viết!', 'success')
  }



  // SEO Keywords Handlers
  const handleAddKeyword = () => {
    if (!newKeywordText.trim()) return
    const currentMeta = product.meta_seo ? { ...product.meta_seo } : { title: '', description: '', keywords: [] }
    const currentKeywords = currentMeta.keywords ? [...currentMeta.keywords] : []
    if (!currentKeywords.includes(newKeywordText.trim())) {
      currentKeywords.push(newKeywordText.trim())
    }
    currentMeta.keywords = currentKeywords
    updateProductField(product.id, 'meta_seo', currentMeta)
    setNewKeywordText('')
  }

  const handleRemoveKeyword = (kw: string) => {
    const currentMeta = product.meta_seo ? { ...product.meta_seo } : { title: '', description: '', keywords: [] }
    currentMeta.keywords = currentMeta.keywords?.filter((k) => k !== kw) || []
    updateProductField(product.id, 'meta_seo', currentMeta)
  }

  const handleUpdateMetaField = (key: 'title' | 'description', val: string) => {
    const currentMeta = product.meta_seo ? { ...product.meta_seo } : { title: '', description: '', keywords: [] }
    currentMeta[key] = val
    updateProductField(product.id, 'meta_seo', currentMeta)
  }

  // Spec File Upload Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product_image' | 'manufacturer_spec' | 'other') => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files).map(f => ({ file: f, type }))
    setPendingSpecFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const handleSaveSpecFile = () => {
    if (pendingSpecFiles.length === 0) return
    pendingSpecFiles.forEach(({file, type}) => uploadSpecFile(product.id, file.name, file.size, type))
    toast(`Đã tải lên ${pendingSpecFiles.length} tài liệu specs`, 'success')
    toast('Đã nhận diện specs mới. Bạn có thể bấm "Trích xuất Specs" để AI phân tích tự động.', 'info')
    setPendingSpecFiles([])
  }

  // Save changes explicitly
  const handleSaveAll = () => {
    toast('Đã lưu toàn bộ thay đổi thành công!', 'success')
  }

  // Completeness style helper
  const getProgressColor = (percent: number) => {
    if (percent === 100) return 'bg-green-500'
    if (percent >= 50) return 'bg-amber-500'
    if (percent > 0) return 'bg-orange-400'
    return 'bg-gray-300'
  }

  const specsAiStatus = hasExtractedSpecs ? 'done' : extractingSpecs ? 'processing' : 'pending'
  const specsAiStatusMeta = SPECS_AI_STATUS_META[specsAiStatus]

  return (
    <AppShell breadcrumb={['AICPS', 'Sản phẩm', `${product.model_code} / ${product.variantcode}`]}>
      {/* Run full workflow progress overlay */}
      {runningFullWf && (
        <div className="fixed inset-0 z-50 bg-[#0f1535]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/20 text-center animate-scale-up">
            <Loader2 className="animate-spin text-cyan-600 mx-auto mb-4" size={40} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Đang thực thi quy trình biên tập tự động</h3>
            <p className="text-xs text-gray-500 mb-6">Trình sinh thông minh AI đang phân tích tài liệu và cấu trúc toàn bộ nội dung sản phẩm...</p>
            
            {/* Step statuses */}
            <div className="flex flex-col gap-3 text-left max-w-xs mx-auto mb-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className={currentWfStep >= 1 ? 'text-cyan-600 font-bold' : 'text-gray-400'}>Bước 1: WF1 – Trích xuất Specs Hãng</span>
                {currentWfStep > 1 ? <CheckCircle2 className="text-green-500" size={16} /> : currentWfStep === 1 ? <Loader2 className="animate-spin text-cyan-600" size={16} /> : <div className="w-4 h-4 rounded-full border border-gray-200" />}
              </div>
              <div className="flex items-center justify-between">
                <span className={currentWfStep >= 2 ? 'text-cyan-600 font-bold' : 'text-gray-400'}>Bước 2: WF2 – Dàn ý & Ý tưởng Media</span>
                {currentWfStep > 2 ? <CheckCircle2 className="text-green-500" size={16} /> : currentWfStep === 2 ? <Loader2 className="animate-spin text-cyan-600" size={16} /> : <div className="w-4 h-4 rounded-full border border-gray-200" />}
              </div>
              <div className="flex items-center justify-between">
                <span className={currentWfStep >= 3 ? 'text-cyan-600 font-bold' : 'text-gray-400'}>Bước 3: WF3 – Viết Bài & Meta SEO</span>
                {currentWfStep > 3 ? <CheckCircle2 className="text-green-500" size={16} /> : currentWfStep === 3 ? <Loader2 className="animate-spin text-cyan-600" size={16} /> : <div className="w-4 h-4 rounded-full border border-gray-200" />}
              </div>
              <div className="flex items-center justify-between">
                <span className={currentWfStep >= 4 ? 'text-cyan-600 font-bold' : 'text-gray-400'}>Bước 4: WF4 – Sinh bộ ảnh & Video AI</span>
                {currentWfStep > 4 ? <CheckCircle2 className="text-green-500" size={16} /> : currentWfStep === 4 ? <Loader2 className="animate-spin text-cyan-600" size={16} /> : <div className="w-4 h-4 rounded-full border border-gray-200" />}
              </div>
              <div className="flex items-center justify-between">
                <span className={currentWfStep >= 5 ? 'text-cyan-600 font-bold' : 'text-gray-400'}>Bước 5: WF5 – n8n Merge & Đồng bộ PIM</span>
                {currentWfStep > 5 ? <CheckCircle2 className="text-green-500" size={16} /> : currentWfStep === 5 ? <Loader2 className="animate-spin text-cyan-600" size={16} /> : <div className="w-4 h-4 rounded-full border border-gray-200" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-600 transition-colors font-semibold"
        >
          <ArrowLeft size={14} /> Quay lại danh sách
        </button>
        <div className="flex gap-2">
          {/* RUN FULL WF BUTTON */}
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-md border-0"
            onClick={() => {
              updateProductField(product.id, 'pim_status', 'published')
              toast('Đã xuất bản sản phẩm lên PIM lập tức!', 'success')
            }}
          >
            <CheckCircle2 size={16} className="mr-1" />
            Xuất bản lên PIM
          </Button>
          <Button variant="outline" className="bg-white border-gray-200 text-gray-700" onClick={handleSaveAll}>
            <Save size={14} className="mr-1" /> Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* Product Info Block & Status dropdowns */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-500">Model:</span>
              <span className="font-mono text-xs font-bold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded border border-cyan-100">
                {product.model_code}
              </span>
              <SiteBadge site={product.site_id} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mt-2">{product.name}</h1>
            
          </div>
      </div>

      {/* Dependency Alert Banner */}
      {nameChangedAlert && (
        <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg flex items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
            <span className="text-xs font-medium">
              Tên sản phẩm đã thay đổi! Bạn nên cập nhật lại <strong>Dàn bài</strong> & <strong>Bài viết chi tiết</strong> để đồng bộ nội dung.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRegenDependentFields}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors flex items-center gap-1"
            >
              <Sparkles size={12} /> Cập nhật liên đới
            </button>
            <button
              onClick={() => setNameChangedAlert(false)}
              className="text-amber-700 hover:text-amber-900 text-xs font-semibold px-2 py-1.5 transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Variant Tabs Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Biến thể cùng Model</h3>
        <div className="min-w-0 rounded-[22px] bg-[#F5F5F7] p-2">
              <div className="flex min-w-0 gap-2 overflow-x-auto p-1">
                {products
                  .filter(p => p.model_code === product.model_code && p.site_id === product.site_id)
                  .map((variant) => {
                  const isActive = variant.id === product.id
                  const contentStatus = getProductContentStatus(variant)
                  const statusMeta = PRODUCT_CONTENT_STATUS_META[contentStatus]
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        const isSpecs = window.location.pathname.includes('specs-demo');
                        navigate(`/products/${variant.id}${isSpecs ? '/specs-demo' : ''}`);
                      }}
                      className={`group flex min-h-[72px] min-w-[260px] flex-1 flex-col gap-1.5 rounded-[18px] border-2 px-3.5 py-2.5 text-left transition-all duration-200 motion-reduce:transition-none ${
                        isActive
                          ? 'border-[#0071E3] bg-white text-[#1D1D1F] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_18px_rgba(0,113,227,0.14)]'
                          : 'border-black/[0.08] bg-white text-[#6E6E73] shadow-sm hover:border-black/[0.16] hover:text-[#1D1D1F]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold">
                          <span className={`h-1.5 w-1.5 rounded-full ${getVariantStatusDotClass(statusMeta.className)}`} />
                          <span className="truncate">{statusMeta.label}</span>
                        </span>
                      </div>
                      <div className="flex w-full flex-wrap gap-x-4 gap-y-0.5 text-[10px]">
                        <span className="text-[#6E6E73]">ERP: <span className="font-mono font-semibold text-[#1D1D1F]">{variant.product_code_erp || '—'}</span></span>
                        <span className="text-[#6E6E73]">Variant: <span className="font-mono font-semibold text-[#1D1D1F]">{variant.variantcode}</span></span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
      </div>

    {/* Page-level Tabs Navigation */}
    <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 mb-5 max-w-3xl mx-auto shadow-sm">
      <button
        onClick={() => setMainTab('content')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mainTab === 'content' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
      >
        <LayoutList size={16} /> Thông tin & Thông số kỹ thuật
      </button>
      <button
        onClick={() => setMainTab('specs')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mainTab === 'specs' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
      >
        <FileText size={16} /> Tài liệu & Links Tham Khảo
      </button>
      <button
        onClick={() => setMainTab('jobs')}
        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mainTab === 'jobs' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
      >
        <History size={16} /> Lịch sử Jobs
      </button>
    </div>

    {/* Main Content Area */}
    <div className="w-full">
      
      {/* Left Column: Interactive Field Editors (Now Full Width) */}
      <div className={mainTab === 'content' ? "flex flex-col gap-5" : "hidden"}>
          {/* Section 6: Thông số kỹ thuật */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <List size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Thông số kỹ thuật</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${specsAiStatusMeta?.className || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${specsAiStatusMeta?.dotClassName || 'bg-blue-600'}`} />
                  <span className="flex items-center gap-2 leading-tight">
                    <span>{specsAiStatusMeta?.label || 'AI gen xong'}</span>
                    <span className="border-l pl-2 font-mono text-[10px] font-semibold text-gray-400">specs_agent#289</span>
                  </span>
                </span>

                <Button 
                  size="sm" 
                  variant={product.approval_status?.specs_approved ? "outline" : "primary"} 
                  className={product.approval_status?.specs_approved ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"}
                  onClick={() => {
                    const nextStatus = { ...product.approval_status };
                    nextStatus.specs_approved = !nextStatus.specs_approved;
                    updateProductField(product.id, 'approval_status', nextStatus);
                    if (nextStatus.specs_approved) toast('Duyệt Specs thành công!', 'success');
                  }}
                >
                  {product.approval_status?.specs_approved ? <><CheckCircle2 size={12} className="mr-1" /> Đã duyệt</> : 'Duyệt'}
                </Button>

                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf1_specs: !prev.wf1_specs }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf1_specs'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs py-1"
                  onClick={handleExtractSpecs}
                  disabled={extractingSpecs}
                >
                  {extractingSpecs ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                  )}
                  Trích xuất Specs AI (WF1)
                </Button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMappingLevelFilter('all')}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  mappingLevelFilter === 'all'
                    ? 'bg-[#1D1D1F] text-white'
                    : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Tất cả: {visibleMappingRows.length}
              </button>
              {VISIBLE_MAPPING_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setMappingLevelFilter(level)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    mappingLevelFilter === level
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${getMappingStatusDotClass(level)}`} />
                  {MAPPING_LEVEL_LABEL[level] || level}: {mappingMeta?.summary?.[level] ?? getMappingLevelCount(level)}
                </button>
              ))}
            </div>

            {/* Prompt Config */}
            {showPrompts['wf1_specs'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <PromptConfigEditor
                  workflowType="wf1_specs"
                  activeCategory={product.active_prompt_category || product.nganh_hang}
                  selectedSubCategoryId={product.selected_sub_categories?.['wf1_specs'] || ''}
                  selectedOptionId={product.selected_prompt_options?.['wf1_specs'] || ''}
                  bonusPrompt={product.bonus_prompts?.['wf1_specs'] || ''}
                  feedbackPrompt={product.feedback_prompts?.['wf1_specs'] || ''}
                  onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
                  onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf1_specs: sub })}
                  onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf1_specs: opt })}
                  onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf1_specs: val })}
                  onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf1_specs: val })}
                />
              </div>
            )}

            {!hasMappingFiles && (
              <div className="mb-4 bg-cyan-50/50 border border-cyan-100 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="text-cyan-600 mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-cyan-800">Sản phẩm chưa có dữ liệu thông số từ hãng</h4>
                  <p className="text-xs text-cyan-700 mt-1">
                    Vui lòng thêm tài liệu hoặc đường link ở tab bên cạnh và chọn <strong>Trích xuất Specs AI</strong> để hệ thống tự động đọc và điền các giá trị PIM.
                  </p>
                </div>
              </div>
            )}

            {extractingSpecs && (
              <div className="mb-3 flex items-center gap-2 rounded-full bg-[#E6F1FB] px-3 py-1.5 text-[11px] font-semibold text-[#185FA5] w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-[#378ADD] animate-pulse" />
                specs_agent#238 đang xử lý
              </div>
            )}

            <div className="max-w-full overflow-x-auto rounded-[24px] bg-[#FAFAFB] p-2">
              {extractingSpecs ? (
                <table className="w-full min-w-[1120px] overflow-hidden rounded-[20px] bg-white text-xs">
                  <thead className="bg-[#F5F5F7] text-[10px] uppercase tracking-[0.14em] text-[#6E6E73]">
                    <tr>
                      <th className="w-[170px] px-4 py-3 text-left font-bold">Thuộc tính gốc</th>
                      <th className="w-[210px] px-4 py-3 text-left font-bold">Giá trị gốc</th>
                      <th className="w-[220px] px-4 py-3 text-left font-bold">Thuộc tính PIM</th>
                      <th className="w-[330px] px-4 py-3 text-left font-bold">Giá trị PIM</th>
                      <th className="w-[180px] px-4 py-3 text-left font-bold">Trạng thái mapping</th>
                      <th className="w-[90px] px-4 py-3 text-center font-bold">Chọn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] bg-white">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-3 rounded-md bg-gray-100" style={{ width: `${55 + (i % 3) * 15}%` }} /></td>
                        <td className="px-4 py-3"><div className="h-3 rounded-md bg-gray-100" style={{ width: `${45 + (i % 4) * 10}%` }} /></td>
                        <td className="px-4 py-3">
                          <div className="h-3 rounded-md bg-gray-100 mb-1.5" style={{ width: '70%' }} />
                          <div className="h-2.5 rounded-md bg-gray-100" style={{ width: '50%' }} />
                        </td>
                        <td className="px-4 py-3"><div className="h-8 rounded-lg bg-gray-100 w-full" /></td>
                        <td className="px-4 py-3"><div className="h-6 rounded-full bg-gray-100" style={{ width: `${i % 2 === 0 ? 70 : 80}px` }} /></td>
                        <td className="px-4 py-3 text-center"><div className="h-4 w-4 rounded bg-gray-100 mx-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : mappingLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải dữ liệu mapping...
                </div>
              ) : mappingError ? (
                <div className="py-10 text-center text-xs font-semibold text-red-500">{mappingError}</div>
              ) : (
                <table className="w-full min-w-[1120px] overflow-hidden rounded-[20px] bg-white text-xs">
                  <thead className="bg-[#F5F5F7] text-[10px] uppercase tracking-[0.14em] text-[#6E6E73]">
                    <tr>
                      <th className="w-[170px] px-4 py-3 text-left font-bold">Thuộc tính gốc</th>
                      <th className="w-[210px] px-4 py-3 text-left font-bold">Giá trị gốc</th>
                      <th className="w-[220px] px-4 py-3 text-left font-bold">Thuộc tính PIM</th>
                      <th className="w-[330px] px-4 py-3 text-left font-bold">Giá trị PIM</th>
                      <th className="w-[180px] px-4 py-3 text-left font-bold">Trạng thái mapping</th>
                      <th className="w-[90px] px-4 py-3 text-center font-bold">Chọn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] bg-white">
                    {visibleMappingRows.flatMap((row) => {
                      const sourceRowIndex = mappingRows.indexOf(row)
                      const rowKey = getMappingRowKey(row, sourceRowIndex)
                      const normalizedType = (row.type || '').toLowerCase()
                      const isMultiSelect = normalizedType === 'multi select'
                      const values = row.value || []
                      const dropdownKey = `${row.attribute_name || row.origin_atribute_name}-${sourceRowIndex}`

                      if (isMultiSelect && hasExtractedSpecs && values.length > 0) {
                        const options = getMappingOptions(row)
                        const selectedNames = values.map((v) => v.name).filter(Boolean)

                        const getValueStatus = (val: MappingValue) => {
                          if (val.is_new_value) return 'GIA_TRI_MOI'
                          return 'CHINH_XAC'
                        }

                        return values.map((val, valIndex) => {
                          const isFirst = valIndex === 0
                          const subRowKey = `${rowKey}-val-${valIndex}`
                          const valStatus = getValueStatus(val)

                          return (
                            <tr key={subRowKey} className="align-middle transition-colors hover:bg-[#FAFAFB]">
                              {isFirst && (
                                <>
                                  <td rowSpan={values.length} className="px-4 py-3 font-semibold text-[#1D1D1F] align-top border-r border-black/[0.04]">{row.origin_atribute_name}</td>
                                  <td rowSpan={values.length} className="px-4 py-3 leading-relaxed text-[#6E6E73] align-top border-r border-black/[0.04]">{row.origin_atribute_value || '-'}</td>
                                  <td rowSpan={values.length} className="px-4 py-3 align-top border-r border-black/[0.04]">
                                    <div className="font-semibold text-[#1D1D1F]">{row.label || '-'}</div>
                                    {row.attribute_name && (
                                      <div className="mt-1 break-all font-mono text-[10px] text-[#6E6E73]">{row.attribute_name}</div>
                                    )}
                                  </td>
                                </>
                              )}
                              <td className="px-4 py-3">
                                <div className="relative min-w-[220px]">
                                  {isFirst && openDropdown === dropdownKey && (
                                    <>
                                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                                      <div className="absolute left-0 z-30 mt-1 w-72 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg" style={{ top: '100%' }}>
                                        {options.length === 0 ? (
                                          <div className="px-2.5 py-2 text-xs text-gray-400">Chưa có option</div>
                                        ) : (
                                          options.map((option, optIdx) => {
                                            const isSelected = selectedNames.includes(option.name)
                                            return (
                                              <button
                                                key={`${option.name}-${option.code ?? optIdx}`}
                                                type="button"
                                                onClick={() => {
                                                  const nextValue = isSelected
                                                    ? values.filter((v) => v.name !== option.name)
                                                    : [...values, option]
                                                  updateMappingValue(sourceRowIndex, nextValue)
                                                }}
                                                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-cyan-50/60"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  readOnly
                                                  className="h-3 w-3 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                                />
                                                <span>{option.name}</span>
                                              </button>
                                            )
                                          })
                                        )}
                                      </div>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
                                    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-gray-800 hover:border-cyan-400 hover:bg-cyan-50/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                                  >
                                    <span className="flex-1 truncate">{val.name}</span>
                                    <svg className="h-3 w-3 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${getMappingStatusClass(valStatus)}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${getMappingStatusDotClass(valStatus)}`} />
                                  {MAPPING_LEVEL_LABEL[valStatus]}
                                </span>
                                {isFirst && row.ghi_chu && (
                                  <p className="mt-2 text-[10px] leading-relaxed text-[#6E6E73]">{row.ghi_chu}</p>
                                )}
                              </td>
                              {isFirst && (
                                <td rowSpan={values.length} className="px-4 py-3 text-center align-top">
                                  <input
                                    type="checkbox"
                                    checked={selectedMappingRows[rowKey] ?? true}
                                    onChange={(e) => setSelectedMappingRows((prev) => ({ ...prev, [rowKey]: e.target.checked }))}
                                    aria-label={`Chọn ${row.origin_atribute_name}`}
                                    className="h-4 w-4 rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]"
                                  />
                                </td>
                              )}
                            </tr>
                          )
                        })
                      }

                      return [(
                        <tr key={rowKey} className="align-top transition-colors hover:bg-[#FAFAFB]">
                          <td className="px-4 py-3 font-semibold text-[#1D1D1F]">{row.origin_atribute_name}</td>
                          <td className="px-4 py-3 leading-relaxed text-[#6E6E73]">{row.origin_atribute_value || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#1D1D1F]">{row.label || '-'}</div>
                            {row.attribute_name && (
                              <div className="mt-1 break-all font-mono text-[#6E6E73] font-mono text-[10px]">{row.attribute_name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {hasMappingFiles ? renderMappingValueEditor(row, sourceRowIndex) : (
                              <div className="rounded-2xl bg-[#F5F5F7] px-3 py-2 text-[11px] italic text-[#6E6E73]">[ Chờ AI trích xuất... ]</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${getMappingStatusClass(row.matching_level)}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${getMappingStatusDotClass(row.matching_level)}`} />
                              {MAPPING_LEVEL_LABEL[row.matching_level] || row.matching_level}
                            </span>
                            {row.ghi_chu && (
                              <p className="mt-2 text-[10px] leading-relaxed text-[#6E6E73]">{row.ghi_chu}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedMappingRows[rowKey] ?? true}
                              onChange={(e) => setSelectedMappingRows((prev) => ({ ...prev, [rowKey]: e.target.checked }))}
                              aria-label={`Chọn ${row.origin_atribute_name}`}
                              className="h-4 w-4 rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]"
                            />
                          </td>
                        </tr>
                      )]
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>


          {/* Section 7: Dàn bài (Outline) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Dàn bài viết (Outline)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${specsAiStatusMeta?.className || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${specsAiStatusMeta?.dotClassName || 'bg-blue-600'}`} />
                  <span className="flex items-center gap-2 leading-tight">
                    <span>{specsAiStatusMeta?.label || 'AI gen xong'}</span>
                    <span className="border-l pl-2 font-mono text-[10px] font-semibold text-gray-400">outline_agent#312</span>
                  </span>
                </span>
                
                <Button 
                  size="sm" 
                  variant={product.approval_status?.outline_approved ? "outline" : "primary"} 
                  className={product.approval_status?.outline_approved ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"}
                  onClick={() => {
                    const nextStatus = { ...product.approval_status };
                    nextStatus.outline_approved = !nextStatus.outline_approved;
                    updateProductField(product.id, 'approval_status', nextStatus);
                    if (nextStatus.outline_approved) toast('Duyệt Outline thành công!', 'success');
                  }}
                >
                  {product.approval_status?.outline_approved ? <><CheckCircle2 size={12} className="mr-1" /> Đã duyệt</> : 'Duyệt'}
                </Button>

                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf2_outline: !prev.wf2_outline }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf2_outline'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs py-1"
                  onClick={() => handleGenField('outline')}
                  disabled={generatingFields['outline'] || product.approval_status?.outline_approved}
                >
                  {generatingFields['outline'] ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                  )}
                  Tạo Outline (AI)
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf2_outline'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <PromptConfigEditor
                  workflowType="wf2_outline"
                  activeCategory={product.active_prompt_category || product.nganh_hang}
                  selectedSubCategoryId={product.selected_sub_categories?.['wf2_outline'] || ''}
                  selectedOptionId={product.selected_prompt_options?.['wf2_outline'] || ''}
                  bonusPrompt={product.bonus_prompts?.['wf2_outline'] || ''}
                  feedbackPrompt={product.feedback_prompts?.['wf2_outline'] || ''}
                  onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
                  onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf2_outline: sub })}
                  onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf2_outline: opt })}
                  onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf2_outline: val })}
                  onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf2_outline: val })}
                />
              </div>
            )}

            <textarea
              value={product.outline || ''}
              onChange={(e) => updateProductField(product.id, 'outline', e.target.value)}
              placeholder="Nhập outline chi tiết hoặc bấm nút AI tạo tự động ở trên..."
              rows={6}
              className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-gray-50/50"
            />
          </div>

          {/* Section 8: Bài viết chi tiết (HTML Content) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-50 pb-3 mb-4 gap-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Globe size={16} className="text-cyan-600" />
                  <h3 className="font-bold text-gray-800 text-sm">Bài viết chi tiết</h3>
                </div>
                {/* Tabs for HTML preview */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs bg-gray-50">
                  <button
                    onClick={() => setContentTab('preview')}
                    className={`px-2.5 py-1 transition-colors ${contentTab === 'preview' ? 'bg-cyan-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Xem trước
                  </button>
                  <button
                    onClick={() => setContentTab('edit')}
                    className={`px-2.5 py-1 transition-colors ${contentTab === 'edit' ? 'bg-cyan-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    HTML Source
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${specsAiStatusMeta?.className || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${specsAiStatusMeta?.dotClassName || 'bg-blue-600'}`} />
                  <span className="flex items-center gap-2 leading-tight">
                    <span>{specsAiStatusMeta?.label || 'AI gen xong'}</span>
                    <span className="border-l pl-2 font-mono text-[10px] font-semibold text-gray-400">writing_agent#124</span>
                  </span>
                </span>

                <Button 
                  size="sm" 
                  variant={product.approval_status?.article_approved ? "outline" : "primary"} 
                  className={product.approval_status?.article_approved ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"}
                  onClick={() => {
                    const nextStatus = { ...product.approval_status };
                    nextStatus.article_approved = !nextStatus.article_approved;
                    updateProductField(product.id, 'approval_status', nextStatus);
                    if (nextStatus.article_approved) toast('Duyệt Bài Viết thành công!', 'success');
                  }}
                >
                  {product.approval_status?.article_approved ? <><CheckCircle2 size={12} className="mr-1" /> Đã duyệt</> : 'Duyệt'}
                </Button>

                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf3_writing: !prev.wf3_writing }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf3_writing'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs py-1"
                  onClick={() => handleGenField('content_html')}
                  disabled={generatingFields['content_html'] || !product.approval_status?.outline_approved || product.approval_status?.article_approved}
                >
                  {generatingFields['content_html'] ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                  )}
                  Viết bài (AI)
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf3_writing'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <PromptConfigEditor
                  workflowType="wf3_writing"
                  activeCategory={product.active_prompt_category || product.nganh_hang}
                  selectedSubCategoryId={product.selected_sub_categories?.['wf3_writing'] || ''}
                  selectedOptionId={product.selected_prompt_options?.['wf3_writing'] || ''}
                  bonusPrompt={product.bonus_prompts?.['wf3_writing'] || ''}
                  feedbackPrompt={product.feedback_prompts?.['wf3_writing'] || ''}
                  onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
                  onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf3_writing: sub })}
                  onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf3_writing: opt })}
                  onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf3_writing: val })}
                  onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf3_writing: val })}
                />
              </div>
            )}

            {contentTab === 'edit' ? (
              <textarea
                id="article-textarea"
                value={product.content_html || ''}
                onChange={(e) => updateProductField(product.id, 'content_html', e.target.value)}
                placeholder="Nhập mã nguồn HTML bài viết hoặc bấm Viết bài AI..."
                rows={10}
                className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-gray-900 text-cyan-400"
              />
            ) : (
              <div className="border border-gray-200 rounded-lg min-h-[300px] overflow-hidden bg-white">
                {product.content_html ? (
                  <iframe
                    title="Content Preview"
                    srcDoc={`
                      <html>
                        <head>
                          <style>
                            body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; margin: 0; line-height: 1.6; color: #334155; }
                            h2 { color: #0f172a; font-size: 1.3em; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
                            h3 { color: #1e293b; font-size: 1.1em; margin-top: 18px; }
                            ul, ol { padding-left: 20px; }
                            p { margin-bottom: 12px; }
                            strong { color: #0f172a; }
                          </style>
                        </head>
                        <body>
                          ${product.content_html}
                        </body>
                      </html>
                    `}
                    className="w-full h-[350px] border-0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-gray-50 text-xs">
                    <FileText size={30} className="mb-2 opacity-30" />
                    Chưa có nội dung bài viết. Hãy bấm nút "Viết bài AI" để tự sinh.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 9: Hình ảnh gắn vào bài viết */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Image size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Hình ảnh gắn vào bài viết</h3>
                {(!product.article_images || product.article_images.length === 0) && (
                  <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded border border-amber-200">DEMO</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${specsAiStatusMeta?.className || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${specsAiStatusMeta?.dotClassName || 'bg-blue-600'}`} />
                  <span className="flex items-center gap-2 leading-tight">
                    <span>{specsAiStatusMeta?.label || 'AI gen xong'}</span>
                    <span className="border-l pl-2 font-mono text-[10px] font-semibold text-gray-400">image_agent#901</span>
                  </span>
                </span>

                <Button 
                  size="sm" 
                  variant={product.approval_status?.final_approved ? "outline" : "primary"} 
                  className={product.approval_status?.final_approved ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"}
                  onClick={() => {
                    const nextStatus = { ...product.approval_status };
                    nextStatus.final_approved = !nextStatus.final_approved;
                    updateProductField(product.id, 'approval_status', nextStatus);
                    if (nextStatus.final_approved) toast('Duyệt Bài Viết Hoàn Chỉnh thành công!', 'success');
                  }}
                >
                  {product.approval_status?.final_approved ? <><CheckCircle2 size={12} className="mr-1" /> Đã duyệt</> : 'Duyệt'}
                </Button>

                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf4_article_images: !prev.wf4_article_images }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf4_article_images'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs py-1"
                  onClick={handleGenArticleImages}
                  disabled={generatingArticleImages || !product.approval_status?.slider_approved || product.approval_status?.final_approved}
                >
                  {generatingArticleImages ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                  )}
                  Gen Ảnh Bài Viết
                </Button>
              </div>
            </div>

            {showPrompts['wf4_article_images'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <PromptConfigEditor
                  workflowType="wf4_article_images"
                  activeCategory={product.active_prompt_category || product.nganh_hang}
                  selectedSubCategoryId={product.selected_sub_categories?.['wf4_article_images'] || ''}
                  selectedOptionId={product.selected_prompt_options?.['wf4_article_images'] || ''}
                  bonusPrompt={product.bonus_prompts?.['wf4_article_images'] || ''}
                  feedbackPrompt={product.feedback_prompts?.['wf4_article_images'] || ''}
                  onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
                  onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf4_article_images: sub })}
                  onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf4_article_images: opt })}
                  onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf4_article_images: val })}
                  onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf4_article_images: val })}
                />
              </div>
            )}

            {/* Grid of article images */}
            {(() => {
              const demoImages = Array.from({ length: 4 }, (_, i) => ({
                id: `demo-art-${i}`,
                url: `https://picsum.photos/seed/${product.id}-art${i}/800/600`,
                label: `Ảnh minh họa bài viết ${i + 1}`
              }))
              const imagesList = product.article_images && product.article_images.length > 0
                ? product.article_images
                : demoImages

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagesList.map((img, index) => {
                      const computedLabel = articleH3s[index] || `Ảnh minh họa bài viết ${index + 1}`
                      return (
                        <div key={img.id} className="relative group border border-gray-100 hover:border-cyan-200 p-2 rounded-xl bg-gray-50/20 text-xs transition-colors flex flex-col justify-between">
                          <div className="rounded-lg overflow-hidden border border-gray-100 aspect-[4/3] mb-2 relative bg-white">
                            <img src={img.url} alt={computedLabel} className="w-full h-full object-cover" />
                            {!product.article_images && (
                              <div className="absolute top-1 left-1 bg-amber-500/90 text-white text-[7px] font-bold px-1 py-0.5 rounded">DEMO</div>
                            )}
                            <button
                              onClick={() => handleRemoveArticleImage(img.id)}
                              className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded-md transition-colors shadow-sm opacity-0 group-hover:opacity-100 z-10"
                              title="Xóa ảnh này"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <div className="space-y-1.5 mt-auto">
                            <div className="text-[11px] font-semibold text-gray-700 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                              <span className="text-[9px] text-cyan-600 block uppercase font-bold tracking-wider mb-0.5">Vị trí: H3 #{index + 1}</span>
                              <span className="truncate block text-gray-800" title={computedLabel}>{computedLabel}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Add custom image trigger */}
                    <button
                      type="button"
                      onClick={handleUploadArticleImage}
                      className="rounded-xl border-2 border-dashed border-gray-200 hover:border-cyan-300 aspect-[4/3] bg-gray-50/20 hover:bg-cyan-50/10 flex flex-col items-center justify-center gap-1 transition-colors p-4"
                    >
                      <Plus size={20} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-bold">Thêm ảnh</span>
                      <span className="text-[8px] text-gray-400 text-center">Tải file từ máy tính</span>
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Section 11: SEO Meta */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Globe size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Cấu hình SEO Meta</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${specsAiStatusMeta?.className || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${specsAiStatusMeta?.dotClassName || 'bg-blue-600'}`} />
                  <span className="flex items-center gap-2 leading-tight">
                    <span>{specsAiStatusMeta?.label || 'AI gen xong'}</span>
                    <span className="border-l pl-2 font-mono text-[10px] font-semibold text-gray-400">seo_agent#501</span>
                  </span>
                </span>

                <Button 
                  size="sm" 
                  variant={product.approval_status?.seo_meta_approved ? "outline" : "primary"} 
                  className={product.approval_status?.seo_meta_approved ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"}
                  onClick={() => {
                    const nextStatus = { ...product.approval_status };
                    nextStatus.seo_meta_approved = !nextStatus.seo_meta_approved;
                    updateProductField(product.id, 'approval_status', nextStatus);
                    if (nextStatus.seo_meta_approved) toast('Duyệt SEO Meta thành công!', 'success');
                  }}
                >
                  {product.approval_status?.seo_meta_approved ? <><CheckCircle2 size={12} className="mr-1" /> Đã duyệt</> : 'Duyệt'}
                </Button>

                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf5_seo: !prev.wf5_seo }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf5_seo'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>

                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs py-1"
                  onClick={() => handleGenField('meta_seo')}
                  disabled={generatingFields['meta_seo']}
                >
                  {generatingFields['meta_seo'] ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                  )}
                  Gen SEO Meta (AI)
                </Button>
              </div>
            </div>

            {showPrompts['wf5_seo'] && (
              <div className="mb-4">
                <PromptConfigEditor 
                  product={product}
                  workflowKey="wf5_seo"
                  onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
                  onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf5_seo: sub })}
                  onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf5_seo: opt })}
                  onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf5_seo: val })}
                  onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf5_seo: val })}
                />
              </div>
            )}

            {/* Inputs */}
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-600">Meta Title</span>
                  <span className={`font-mono text-[10px] ${((product.meta_seo?.title.length || 0) > 60) ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {product.meta_seo?.title.length || 0}/60 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  value={product.meta_seo?.title || ''}
                  onChange={(e) => handleUpdateMetaField('title', e.target.value)}
                  placeholder="Nhập Meta Title..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-600">Meta Description</span>
                  <span className={`font-mono text-[10px] ${(product.meta_seo?.description.length || 0) > 160 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {product.meta_seo?.description.length || 0}/160 ký tự
                  </span>
                </div>
                <textarea
                  value={product.meta_seo?.description || ''}
                  onChange={(e) => handleUpdateMetaField('description', e.target.value)}
                  placeholder="Nhập Meta Description..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-850"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-600 mb-1">Từ khóa (Keywords)</span>
                <div className="flex flex-wrap gap-1.5 mb-2 bg-gray-50 p-2 rounded-lg border border-gray-100 min-h-[40px]">
                  {!product.meta_seo?.keywords || product.meta_seo.keywords.length === 0 ? (
                    <span className="text-gray-400 text-xs my-auto">Chưa có từ khóa</span>
                  ) : (
                    product.meta_seo.keywords.map((kw) => (
                      <span key={kw} className="bg-cyan-50 border border-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                        {kw}
                        <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-red-500">
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập từ khóa mới..."
                    value={newKeywordText}
                    onChange={(e) => setNewKeywordText(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800"
                  />
                  <Button size="sm" variant="secondary" onClick={handleAddKeyword}>
                    <Plus size={12} className="mr-1" /> Thêm từ khóa
                  </Button>
                </div>
              </div>
            </div>

            {/* Google Preview */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <span className="block text-xs font-semibold text-gray-500 mb-2">Xem trước giao diện tìm kiếm Google (SERP)</span>
              <div className="font-sans">
                <span className="text-[11px] text-gray-500 block truncate">https://www.thegioididong.com › products › {product.id}</span>
                <span className="text-blue-800 hover:underline text-base font-medium block truncate leading-tight mt-0.5">
                  {product.meta_seo?.title || `${product.name} - Giá tốt nhất`}
                </span>
                <span className="text-gray-600 text-xs mt-1 leading-normal block">
                  {product.meta_seo?.description || 'Chưa cấu hình Meta Description. Google sẽ tự hiển thị phần nội dung ngẫu nhiên trong bài viết.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 2: Specs Reference Files */}
        {mainTab === 'specs' && (
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col gap-5">
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                  <Link size={16} className="text-cyan-600" /> Tài liệu & Links Tham Khảo
                </h3>
                <p className="text-xs text-gray-400 mb-3">Liên kết tài liệu gốc để phục vụ việc trích xuất và tra cứu dữ liệu.</p>
                
                <div className="flex flex-col gap-3">
                  {/* Extra dynamic links */}
                  {extraLinks.map((link) => (
                    <div key={link.id}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => setExtraLinks(prev => prev.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))}
                          placeholder="Tên link (vd: Trang Lazada)..."
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-gray-50"
                        />
                        {link.url && (
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-cyan-600 hover:text-cyan-700 p-1">
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => setExtraLinks(prev => prev.filter(l => l.id !== link.id))}
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          title="Xóa link"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => setExtraLinks(prev => prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  ))}

                  {/* Add link button */}
                  <button
                    onClick={() => setExtraLinks(prev => [...prev, { id: `link-${Date.now()}`, label: '', url: '' }])}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 border border-dashed border-cyan-300 rounded-lg px-3 py-2 transition-all w-full justify-center"
                  >
                    <Plus size={13} />
                    Thêm link tham khảo
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
                  <Upload size={16} className="text-cyan-600" /> Tải lên File Specs
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {/* Upload Ảnh sản phẩm */}
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center block cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-all">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'product_image')}
                      className="hidden"
                      accept=".png,.jpg,.jpeg"
                    />
                    <Image className="text-cyan-500 mx-auto mb-2" size={24} />
                    <span className="block text-xs font-semibold text-gray-700 mb-0.5">Tải lên Ảnh sản phẩm</span>
                    <span className="block text-[10px] text-gray-400">PNG, JPG (Max 20MB)</span>
                  </label>

                  {/* Upload Spec hãng */}
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center block cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition-all">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'manufacturer_spec')}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <FileText className="text-cyan-500 mx-auto mb-2" size={24} />
                    <span className="block text-xs font-semibold text-gray-700 mb-0.5">Tải lên Spec hãng</span>
                    <span className="block text-[10px] text-gray-400">PDF, DOC, XLS (Max 20MB)</span>
                  </label>
                </div>

                {pendingSpecFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {pendingSpecFiles.map((item, index) => (
                      <div key={`${item.file.name}-${item.file.size}-${index}`} className="relative flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50/60 p-2.5 pr-10">
                        <File size={15} className="text-cyan-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-700" title={item.file.name}>{item.file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[9px] text-gray-400">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <select
                              value={item.type}
                              onChange={(e) => {
                                const newType = e.target.value as any;
                                setPendingSpecFiles(prev => prev.map((p, i) => i === index ? { ...p, type: newType } : p))
                              }}
                              className="text-[10px] py-0.5 px-1 bg-white border border-gray-200 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            >
                              <option value="product_image">Ảnh sản phẩm</option>
                              <option value="manufacturer_spec">Spec hãng</option>
                              <option value="other">Khác</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingSpecFiles((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-gray-400 shadow-sm backdrop-blur hover:text-red-500"
                          title="Bỏ file tạm"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save Button for Tab 2 */}
                <button
                  type="button"
                  disabled={!hasTab2Changes}
                  onClick={() => {
                    if (pendingSpecFiles.length > 0) {
                      handleSaveSpecFile()
                    }
                    if (hasLinkChanges) {
                      setInitialLinksString(JSON.stringify(extraLinks))
                      if (pendingSpecFiles.length === 0) {
                        toast('Đã lưu các link tham khảo', 'success')
                      }
                    }
                  }}
                  className={`mb-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold transition-colors ${
                    hasTab2Changes 
                      ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save size={16} />
                  Lưu thay đổi
                </button>

                {/* Uploaded files list */}
                <div>
                  <span className="block text-xs font-semibold text-gray-600 mb-2 border-b border-gray-50 pb-1">File specs đính kèm ({product.specs_files?.length || 0})</span>
                  {!product.specs_files || product.specs_files.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-xs">
                      Chưa có tài liệu specs đính kèm.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {product.specs_files.map((f) => (
                        <div key={f.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <File size={15} className="text-cyan-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-700 truncate" title={f.name}>{f.name}</p>
                              <p className="text-[9px] text-gray-400">
                                {(f.size / (1024 * 1024)).toFixed(2)} MB · {formatDateTime(f.uploaded_at)}
                                {f.file_type && <span className="ml-1 px-1 py-0.5 bg-gray-200 text-gray-600 rounded">
                                  {f.file_type === 'product_image' ? 'Ảnh sản phẩm' : f.file_type === 'manufacturer_spec' ? 'Spec hãng' : 'Khác'}
                                </span>}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFileToDelete(f.id)}
                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Jobs History associated with this PIM product */}
        {mainTab === 'jobs' && (
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                <History size={16} className="text-cyan-600" /> Lịch sử Jobs Gen Nội Dung
              </h3>
              <p className="text-xs text-gray-400 mb-4">Các phiên làm việc hoặc lần sinh nội dung hàng loạt trước đó liên kết với sản phẩm này.</p>

              {productJobs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  Sản phẩm này chưa từng được chạy quy trình Jobs tạo bài viết.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {productJobs.map((j) => {
                    const taskName = j.ten_san_pham.includes('[') && j.ten_san_pham.includes(']')
                      ? j.ten_san_pham.substring(j.ten_san_pham.lastIndexOf('[') + 1, j.ten_san_pham.length - 1)
                      : (j.note && !j.note.includes('QC từ chối') ? j.note : 'Quy trình Full 5 Bước');
                      
                    return (
                      <div 
                        key={j.job_id} 
                        onClick={() => {
                          setSelectedJob(j)
                          setPopupTab('preview')
                        }}
                        className="border border-gray-100 hover:border-cyan-200 p-3 rounded-xl cursor-pointer hover:shadow-sm transition-all bg-gray-50/30 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded">
                            {j.job_id}
                          </span>
                          <span className="text-[10px] text-gray-400">{formatTimeAgo(j.updated_at)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-gray-600 mb-1">
                          <span className="font-medium text-gray-500">Quy trình / Tác vụ:</span>
                          <span className="font-bold text-cyan-700 text-right">{taskName}</span>
                        </div>

                        <div className="flex items-center justify-between text-gray-600">
                          <span>Trạng thái Job:</span>
                          <span className="font-semibold text-gray-700 capitalize">
                            {j.status === 'published' ? 'Đã publish' : j.status === 'approved' ? 'Đã duyệt' : j.status === 'error' ? 'Có lỗi' : j.status === 'rejected' ? 'Bị từ chối' : 'Đang chạy'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 text-gray-600">
                          <span>Người chạy:</span>
                          <span className="font-medium">{j.created_by}</span>
                        </div>

                        {j.note && j.status === 'rejected' && (
                          <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-800 leading-relaxed">
                            <strong>Lý do QC từ chối:</strong> {j.note}
                          </div>
                        )}

                        {j.status === 'error' && j.error_log && j.error_log.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-800 leading-relaxed">
                            <strong>Lỗi hệ thống:</strong> {j.error_log[0].message}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {selectedJob && (
        <Dialog
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={`Chi tiết Job: ${selectedJob.job_id}`}
          subtitle={`${selectedJob.ten_san_pham}`}
          className="max-w-3xl"
        >
          <JobDetailsPopupContent job={selectedJob} activeTab={popupTab} setActiveTab={setPopupTab} />
        </Dialog>
      )}

      {fileToDelete && (
        <Dialog
          open={!!fileToDelete}
          onClose={() => setFileToDelete(null)}
          title="Xác nhận xoá file"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xoá tài liệu này không? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setFileToDelete(null)}>Hủy</Button>
              <Button 
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white border-0" 
                onClick={() => {
                  deleteSpecFile(product.id, fileToDelete)
                  setFileToDelete(null)
                  toast('Đã xoá file thành công', 'success')
                }}
              >
                Xác nhận xoá
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {showMissingInputAlert && (
        <Dialog
          open={showMissingInputAlert}
          onClose={() => setShowMissingInputAlert(false)}
          title="Thiếu dữ liệu đầu vào"
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Bạn chưa có tài liệu đính kèm (File specs) hoặc đường link tham khảo nào. Vui lòng thêm dữ liệu đầu vào để AI có thể trích xuất thông tin.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowMissingInputAlert(false)}>Hủy</Button>
              <Button 
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white border-0" 
                onClick={() => {
                  setShowMissingInputAlert(false)
                  setMainTab('specs')
                }}
              >
                Thêm dữ liệu
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppShell>
  )
}

interface JobDetailsPopupContentProps {
  job: Job
  activeTab: 'preview' | 'outline_specs' | 'seo' | 'logs'
  setActiveTab: (t: 'preview' | 'outline_specs' | 'seo' | 'logs') => void
}

function JobDetailsPopupContent({ job, activeTab, setActiveTab }: JobDetailsPopupContentProps) {
  const totalDurationSeconds = Object.values(job.step_durations || {}).reduce((acc, curr) => acc + (curr || 0), 0)
  const formatSecs = (s: number) => {
    if (s < 60) return `${s} giây`
    const m = Math.floor(s / 60)
    const rem = s % 60
    return rem > 0 ? `${m} phút ${rem} giây` : `${m} phút`
  }

  const taskName = job.ten_san_pham.includes('[') && job.ten_san_pham.includes(']')
    ? job.ten_san_pham.substring(job.ten_san_pham.lastIndexOf('[') + 1, job.ten_san_pham.length - 1)
    : (job.note && !job.note.includes('QC từ chối') ? job.note : 'Quy trình Full 5 Bước')

  return (
    <div className="space-y-4">
      {/* Header Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs">
        <div>
          <span className="text-gray-400 block mb-0.5">Trạng thái:</span>
          <StatusBadge status={job.status} />
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Quy trình/Tác vụ:</span>
          <span className="font-bold text-gray-800">{taskName}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Người chạy:</span>
          <span className="font-semibold text-gray-800">{job.created_by}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Tổng thời gian:</span>
          <span className="font-semibold text-gray-800">{totalDurationSeconds > 0 ? formatSecs(totalDurationSeconds) : 'Chưa cập nhật'}</span>
        </div>
      </div>

      {/* QC Rejection Warning banner if rejected */}
      {job.note && job.status === 'rejected' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <strong className="block font-bold mb-0.5 text-amber-950">QC Từ chối yêu cầu sửa đổi:</strong>
            {job.note}
          </div>
        </div>
      )}

      {/* Step durations bar */}
      {job.step_durations && Object.keys(job.step_durations).length > 0 && (
        <div className="border border-gray-100 rounded-xl p-3 bg-white">
          <span className="text-xs font-semibold text-gray-500 block mb-2 font-medium">Thời gian chạy chi tiết các bước:</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
            {job.step_durations.wf1 && <span><strong>WF1:</strong> {formatSecs(job.step_durations.wf1)}</span>}
            {job.step_durations.wf2 && <span><strong>WF2:</strong> {formatSecs(job.step_durations.wf2)}</span>}
            {job.step_durations.wf3 && <span><strong>WF3:</strong> {formatSecs(job.step_durations.wf3)}</span>}
            {job.step_durations.wf4 && <span><strong>WF4:</strong> {formatSecs(job.step_durations.wf4)}</span>}
            {job.step_durations.wf5 && <span><strong>WF5:</strong> {formatSecs(job.step_durations.wf5)}</span>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-2 px-3 border-b-2 transition-all ${activeTab === 'preview' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          HTML Preview
        </button>
        <button
          onClick={() => setActiveTab('outline_specs')}
          className={`pb-2 px-3 border-b-2 transition-all ${activeTab === 'outline_specs' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Dàn bài & Thông số
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`pb-2 px-3 border-b-2 transition-all ${activeTab === 'seo' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Meta SEO
        </button>
        {job.error_log && job.error_log.length > 0 && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 px-3 border-b-2 transition-all ${activeTab === 'logs' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Nhật ký Lỗi ({job.error_log.length})
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[250px] max-h-[450px] overflow-y-auto pr-1">
        {activeTab === 'preview' && (
          <div>
            {job.content_html ? (
              <iframe
                title="Job Content Preview"
                srcDoc={`
                  <html>
                    <head>
                      <style>
                        body { font-family: system-ui, -apple-system, sans-serif; padding: 12px; margin: 0; line-height: 1.5; color: #334155; font-size: 13px; }
                        h2 { color: #0f172a; font-size: 1.25em; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 18px; }
                        h3 { color: #1e293b; font-size: 1.1em; margin-top: 14px; }
                        ul, ol { padding-left: 20px; }
                        p { margin-bottom: 10px; }
                      </style>
                    </head>
                    <body>
                      ${job.content_html}
                    </body>
                  </html>
                `}
                className="w-full h-[300px] border border-gray-200 rounded-xl bg-white shadow-inner"
              />
            ) : (
              <p className="text-gray-400 text-xs text-center py-12">Không có nội dung bài viết HTML trong phiên chạy này.</p>
            )}
          </div>
        )}

        {activeTab === 'outline_specs' && (
          <div className="space-y-4 text-xs text-gray-700">
            {/* Outline */}
            <div>
              <h4 className="font-bold text-gray-800 mb-1 border-b border-gray-50 pb-1">Dàn bài (Outline):</h4>
              {job.outline ? (
                <pre className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{job.outline}</pre>
              ) : (
                <p className="text-gray-400 italic">Không có outline.</p>
              )}
            </div>

            {/* Specifications table */}
            {job.thong_so_ky_thuat && Object.keys(job.thong_so_ky_thuat).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-1.5 border-b border-gray-50 pb-1">Bảng thông số kỹ thuật đã trích xuất:</h4>
                <div className="border border-gray-100 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <th className="px-3 py-2">Thuộc tính</th>
                        <th className="px-3 py-2">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(job.thong_so_ky_thuat).map(([k, v]) => (
                        <tr key={k} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-3 py-1.5 font-medium text-gray-600">{k}</td>
                          <td className="px-3 py-1.5 text-gray-700">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-3 text-xs">
            {job.meta_seo ? (
              <>
                <div>
                  <span className="text-gray-400 font-medium block mb-1">Meta Title:</span>
                  <input readOnly value={job.meta_seo.title} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800" />
                </div>
                <div>
                  <span className="text-gray-400 font-medium block mb-1">Meta Description:</span>
                  <textarea readOnly value={job.meta_seo.description} rows={3} className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-800" />
                </div>
                {job.meta_seo.keywords && job.meta_seo.keywords.length > 0 && (
                  <div>
                    <span className="text-gray-400 font-medium block mb-1">Từ khóa (Keywords):</span>
                    <div className="flex flex-wrap gap-1">
                      {job.meta_seo.keywords.map((kw, i) => (
                        <span key={i} className="bg-cyan-50 text-cyan-700 border border-cyan-100 rounded px-2 py-0.5 font-semibold text-[10px]">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-center py-12">Chưa cấu hình Meta SEO.</p>
            )}
          </div>
        )}

        {activeTab === 'logs' && job.error_log && job.error_log.length > 0 && (
          <div className="space-y-2.5 text-xs">
            {job.error_log.map((log, i) => (
              <div key={i} className="border border-red-100 rounded-xl overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-red-50 text-red-900 border-b border-red-100">
                  <span className="font-bold">Lỗi tại phân hệ: {log.wf}</span>
                  <span className="text-[10px] text-red-600">{formatDateTime(log.timestamp)}</span>
                </div>
                <pre className="bg-red-50/20 p-3 text-red-700 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{log.message}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function SpecsDemoPage() {
  return (
    <ErrorBoundary>
      <SpecsDemoPageContent />
    </ErrorBoundary>
  )
}
