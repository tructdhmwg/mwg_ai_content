import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Trash2, Plus, Sparkles, Save, FileText,
  Settings, AlertTriangle, File, Loader2, X, FileSpreadsheet,
  Link, History, ExternalLink, LayoutList, UploadCloud
} from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { SiteBadge, Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useProductStore } from '../../store/productStore'
import { useJobStore } from '../../store/jobStore'
import { useToast } from '../../components/ui/Toast'
import { type Job } from '../../types'
import { PRODUCT_CONTENT_STATUS_META, getProductContentStatus } from '../../lib/productContentStatus'
import { formatDateTime, formatTimeAgo } from '../../lib/utils'

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

export function SpecsDemoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    products,
    updateProductField,
    uploadSpecFile,
    deleteSpecFile,
    runWf1ExtractSpecs
  } = useProductStore()

  const jobs = useJobStore((s) => s.jobs)

  // Find current product
  const product = useMemo(() => products.find((p) => p.id === id), [products, id])

  const modelVariants = useMemo(() => {
    if (!product) return []
    return products
      .filter((item) => item.model_code === product.model_code)
      .sort((a, b) => a.variantcode.localeCompare(b.variantcode))
  }, [products, product?.model_code])

  // Query previous jobs run for this PIM product
  const productJobs = useMemo(() => {
    return jobs.filter((j) => j.pim_product_id === id)
  }, [jobs, id])

  // Right side panel tab: specs | prompts | jobs
  const [mainTab, setMainTab] = useState<'content' | 'specs' | 'jobs'>('content')

  // Selected job details popup states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [popupTab, setPopupTab] = useState<'preview' | 'outline_specs' | 'seo' | 'logs'>('preview')
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [showMissingInputAlert, setShowMissingInputAlert] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  const [extractingSpecs, setExtractingSpecs] = useState(false)
  const [hasExtractedSpecs, setHasExtractedSpecs] = useState(false)
  const [pendingSpecFiles, setPendingSpecFiles] = useState<File[]>([])

  // Prompts visibility toggle
  const [showPrompts, setShowPrompts] = useState<Record<string, boolean>>({})

  // Extra reference links (dynamic list in Specs tab)
  const [extraLinks, setExtraLinks] = useState<{ id: string; label: string; url: string }[]>([
    { id: 'link-1', label: '', url: '' }
  ])
  const [initialLinksString, setInitialLinksString] = useState(JSON.stringify([{ id: 'link-1', label: '', url: '' }]))
  const hasLinkChanges = JSON.stringify(extraLinks) !== initialLinksString
  const hasTab2Changes = pendingSpecFiles.length > 0 || hasLinkChanges

  const [mappingRows, setMappingRows] = useState<MappingAttribute[]>([])
  const [mappingMeta, setMappingMeta] = useState<ProductMappingPayload['_meta'] | null>(null)
  const [mappingLoading, setMappingLoading] = useState(false)
  const [mappingError, setMappingError] = useState('')
  const [mappingLevelFilter, setMappingLevelFilter] = useState<'all' | VisibleMappingLevel>('all')
  const [selectedMappingRows, setSelectedMappingRows] = useState<Record<string, boolean>>({})

  // Open multi-select dropdown field key
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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

  // Spec File Upload Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setPendingSpecFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const handleSaveSpecFile = () => {
    if (pendingSpecFiles.length === 0) return
    pendingSpecFiles.forEach((file) => uploadSpecFile(product.id, file.name, file.size))
    toast(`Đã tải lên ${pendingSpecFiles.length} tài liệu specs`, 'success')
    toast('Đã nhận diện specs mới. Bạn có thể bấm "Trích xuất Specs" để AI phân tích tự động.', 'info')
    setPendingSpecFiles([])
  }

  // Save changes explicitly
  const handleSaveAll = () => {
    toast('Đã lưu toàn bộ thay đổi thành công!', 'success')
  }

  const handleExportSpecsExcel = () => {
    toast('Đang chuẩn bị xuất file Excel thông số kỹ thuật.', 'info')
  }

  const navigateToVariant = (productId: string) => {
    navigate(productId === 'PIM-TEST-01' ? `/products/${productId}/specs-demo` : `/products/${productId}/specs-demo`)
  }

  const visibleMappingTotal = mappingRows.filter((row) =>
    VISIBLE_MAPPING_LEVELS.includes(row.matching_level as VisibleMappingLevel)
  ).length
  const activeContentStatus = getProductContentStatus(product)
  const activeStatusMeta = PRODUCT_CONTENT_STATUS_META[activeContentStatus]
  const specsApprovalStatus: SpecsApprovalStatus = 'awaiting_approval'
  const specsAiStatus: SpecsAiGenerationStatus = hasExtractedSpecs ? 'done' : extractingSpecs ? 'processing' : 'pending'
  const specsApprovalStatusMeta = SPECS_APPROVAL_STATUS_META[specsApprovalStatus]
  const specsAiStatusMeta = SPECS_AI_STATUS_META[specsAiStatus]
  const bentoTileClass = 'rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]'

  return (
    <AppShell
      breadcrumb={['AICPS', 'Sản phẩm', `${product.model_code} / ${product.variantcode}`]}
      contentClassName="w-full max-w-none px-6 py-6 sm:px-[50px]"
    >
      <div className="min-w-0 rounded-[32px] bg-[#F5F5F7] p-2 text-[#1D1D1F] sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] transition-colors hover:text-[#0071E3]"
          >
            <ArrowLeft size={14} /> Quay lại danh sách
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:gap-5">
          <section className={`${bentoTileClass} min-w-0 p-6 xl:px-8 xl:py-7`}>
            <div className="mb-7 flex items-center gap-2 text-xs text-[#6E6E73]">
              <span>Model</span>
              <span className="font-mono font-bold text-[#0071E3]">{product.model_code}</span>
            </div>
            <h1 className="max-w-5xl text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-[#1D1D1F] md:text-4xl xl:text-[44px]">
              {product.name}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <SiteBadge site={product.site_id} />
              <Badge className="border-0 bg-[#F5F5F7] text-[#6E6E73]">{product.nganh_hang}</Badge>
            </div>
          </section>

          <section className={`${bentoTileClass} min-w-0 p-5 xl:p-6`}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6E6E73]">Biến thể</p>
                <p className="mt-1 text-sm font-bold text-[#1D1D1F]">Đang chọn</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-semibold text-[#6E6E73]">
                <span className={`h-1.5 w-1.5 rounded-full ${getVariantStatusDotClass(activeStatusMeta.className)}`} />
                {activeStatusMeta.label}
              </span>
            </div>

            <div className="min-w-0 rounded-[22px] bg-[#F5F5F7] p-2">
              <div className="flex min-w-0 gap-2 overflow-x-auto p-1">
                {modelVariants.map((variant) => {
                  const isActive = variant.id === product.id
                  const contentStatus = getProductContentStatus(variant)
                  const statusMeta = PRODUCT_CONTENT_STATUS_META[contentStatus]
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => navigateToVariant(variant.id)}
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
          </section>
        </div>

      <div className={`${bentoTileClass} mt-4 min-w-0 overflow-hidden xl:mt-5`}>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between xl:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <FileSpreadsheet size={17} className="text-[#0071E3]" />
            <h3 className="text-base font-bold text-[#1D1D1F]">Thông số kỹ thuật</h3>
            <span className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold ${specsApprovalStatusMeta.className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${specsApprovalStatusMeta.dotClassName}`} />
              Duyệt: {specsApprovalStatusMeta.label}
            </span>
            <span className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold ${specsAiStatusMeta.className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${specsAiStatusMeta.dotClassName}`} />
              <span className="flex flex-col leading-tight">
                <span>AI: {specsAiStatusMeta.label}</span>
                <span className="mt-0.5 font-mono text-[9px] font-semibold text-gray-400">Ai Agent: specs_agent#238</span>
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={`w-fit rounded-full text-xs transition-all ${
                extractingSpecs
                  ? 'bg-[#E6F1FB] text-[#185FA5] border border-[#B5D4F4] hover:bg-[#E6F1FB] cursor-not-allowed'
                  : 'text-[#0071E3] hover:bg-[#0071E3]/5 hover:text-[#0071E3]'
              }`}
              onClick={handleExtractSpecs}
              disabled={extractingSpecs}
            >
              <Loader2 size={12} className={`mr-1 ${extractingSpecs ? 'animate-spin' : 'hidden'}`} />
              <Sparkles size={12} className={`mr-1 text-[#0071E3] ${extractingSpecs ? 'hidden' : ''}`} />
              {extractingSpecs ? 'AI đang trích xuất…' : 'Trích xuất Specs AI (WF1)'}
            </Button>
            <Button
              size="sm"
              className="w-fit rounded-full border-0 bg-[#1D1D1F] px-4 text-xs text-white shadow-none hover:bg-black"
              onClick={handleSaveAll}
            >
              <Save size={13} />
              Lưu thay đổi
            </Button>
            <Button
              size="sm"
              className="w-fit rounded-full border-0 bg-[#1D1D1F] px-4 text-xs text-white shadow-none hover:bg-black disabled:bg-gray-100 disabled:text-gray-400"
              onClick={() => setShowPublishConfirm(true)}
              disabled
            >
              <UploadCloud size={13} />
              Xuất bản lên PIM
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-fit rounded-full border-green-200 bg-white px-4 text-xs text-green-700 shadow-none hover:bg-green-50"
              onClick={handleExportSpecsExcel}
            >
              <FileSpreadsheet size={13} />
              Xuất file excel
            </Button>
          </div>
        </div>

        {/* Page-level Tabs Navigation */}
        <div className="flex border-y border-black/[0.06] bg-[#FAFAFB]">
          <button
            onClick={() => setMainTab('content')}
            className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 border-b-2 ${mainTab === 'content' ? 'bg-white text-[#0071E3] border-[#0071E3]' : 'text-[#6E6E73] hover:text-[#1D1D1F] border-transparent'}`}
          >
            <LayoutList size={16} /> Nội dung sản phẩm
          </button>
          <button
            onClick={() => setMainTab('specs')}
            className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 border-b-2 ${mainTab === 'specs' ? 'bg-white text-[#0071E3] border-[#0071E3]' : 'text-[#6E6E73] hover:text-[#1D1D1F] border-transparent'}`}
          >
            <FileText size={16} /> Tài liệu & Links Tham Khảo
          </button>
        </div>

      {/* Main Content Area */}
      <div className="w-full p-5">

        {/* Left Column: Interactive Field Editors (Now Full Width) */}
        <div className={mainTab === 'content' ? "flex flex-col gap-5" : "hidden"}>

          {/* Section 6: Thông số kỹ thuật */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setShowPrompts(prev => ({ ...prev, wf1_specs: !prev.wf1_specs }))}
                className="hidden rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[#6E6E73] transition-colors hover:text-[#0071E3]"
              >
                <Settings size={12} className="mr-1 inline" />
                {showPrompts['wf1_specs'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
              </button>
              <button
                type="button"
                onClick={() => setMappingLevelFilter('all')}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  mappingLevelFilter === 'all'
                    ? 'bg-[#1D1D1F] text-white'
                    : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Tất cả: {visibleMappingTotal}
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
                <div className="flex justify-between items-center mb-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-semibold">Prompt AI cho Trích xuất Specs</span>
                    <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf1_specs</code>
                  </div>
                  {product.custom_prompt_text?.['wf1_specs'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf1_specs']
                        updateProductField(product.id, 'custom_prompt_text', nextPrompt)
                        toast('Đã khôi phục prompt mặc định', 'info')
                      }}
                      className="text-red-500 hover:underline font-semibold"
                    >
                      Khôi phục mặc định
                    </button>
                  )}
                </div>
                <textarea
                  value={getPromptText('wf1_specs')}
                  onChange={(e) => handleUpdateCustomPrompt('wf1_specs', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
                />
              </div>
            )}

            {!hasExtractedSpecs && (
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
                            {hasExtractedSpecs ? renderMappingValueEditor(row, sourceRowIndex) : (
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

        </div>

        {/* Tab 2: Specs Reference Files */}
        {mainTab === 'specs' && (
          <div className="w-full">
            <div className="flex flex-col gap-5">
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
                <h3 className="font-bold text-gray-800 text-sm mb-1.5 flex items-center gap-1.5">
                  <Upload size={16} className="text-cyan-600" /> Tải lên File Specs
                </h3>
                {/* Upload input */}
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center block cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/10 transition-all mb-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  />
                  <Upload className="text-gray-400 mx-auto mb-1.5" size={22} />
                  <span className="block text-xs font-semibold text-gray-700">Click chọn file specs</span>
                  <span className="block text-[9px] text-gray-400 mt-0.5">PDF, PNG, JPG, DOC, XLS, XLSX (Max 20MB)</span>
                </label>

                {pendingSpecFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {pendingSpecFiles.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${index}`} className="relative flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50/60 p-2.5 pr-10">
                        <File size={15} className="text-cyan-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-700" title={file.name}>{file.name}</p>
                          <p className="text-[9px] text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
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
          <div className="w-full">
            <div>
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
      </div>
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

      {showPublishConfirm && (
        <Dialog
          open={showPublishConfirm}
          onClose={() => setShowPublishConfirm(false)}
          title="Xác nhận xuất bản lên PIM"
          subtitle={`${product.model_code} / ${product.variantcode}`}
          className="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-gray-600">
              Bạn có chắc chắn muốn xuất bản thông số kỹ thuật đã chọn của sản phẩm này lên PIM không?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPublishConfirm(false)}>Hủy</Button>
              <Button
                size="sm"
                className="border-0 bg-[#1D1D1F] text-white hover:bg-black"
                onClick={() => {
                  setShowPublishConfirm(false)
                  toast('Đã gửi yêu cầu xuất bản lên PIM', 'success')
                }}
              >
                Xác nhận xuất bản
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
            )}

            {/* Highlights */}
            {job.dac_diem_noi_bat && job.dac_diem_noi_bat.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-1.5 border-b border-gray-50 pb-1">Đặc điểm nổi bật:</h4>
                <ul className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {job.dac_diem_noi_bat.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 flex-shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
