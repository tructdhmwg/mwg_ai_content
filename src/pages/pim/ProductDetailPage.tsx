import { useState, useEffect, useMemo } from 'react'
import { PRODUCT_CONTENT_STATUS_META, getProductContentStatus } from '../../lib/productContentStatus'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Upload, Trash2, Plus, Sparkles, Save, FileText,
  Settings, AlertTriangle, Globe, File, Check, Info, Loader2, X, FileSpreadsheet,
  Link, History, CheckCircle2, Play, ExternalLink, Image, Video, LayoutList
} from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { SiteBadge, Badge, StatusBadge } from '../../components/ui/Badge'
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

export function ProductDetailPage() {
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

  const { categories: prompts } = usePromptStore()
  const jobs = useJobStore((s) => s.jobs)

  // Find current product
  const product = useMemo(() => products.find((p) => p.id === id), [products, id])

  // Query previous jobs run for this PIM product
  const productJobs = useMemo(() => {
    return jobs.filter((j) => j.pim_product_id === id)
  }, [jobs, id])

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
  const [extractingSpecs, setExtractingSpecs] = useState(false)
  const [, setHasExtractedSpecs] = useState(false)
  const [pendingSpecFiles, setPendingSpecFiles] = useState<File[]>([])
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
    const getVariantStatusDotClass = (statusClassName: string) => {
    const percent = parseInt(statusClassName.match(/w-\[(\d+)%\]/)?.[1] || '0')
    if (percent === 100) return 'bg-emerald-500'
    if (percent > 50) return 'bg-amber-400'
    if (percent > 0) return 'bg-orange-400'
    return 'bg-gray-300'
  }

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
      
      const category = prompts.find((c: any) => c.site_id === product.site_id && c.id === activePromptCategory)
      const subCategory = category?.sub_categories.find((s: any) => s.workflow_type === stepKey)
      const subCatId = product.selected_sub_categories?.[stepKey]
      const actualSubCategory = category?.sub_categories.find((s: any) => s.id === subCatId) || subCategory
      const optionId = product.selected_prompt_options?.[stepKey]
      const matchedOption = actualSubCategory?.options.find((o: any) => o.id === optionId) || actualSubCategory?.options[0]
      
      let promptText = matchedOption ? matchedOption.template_content : ''
      if (!promptText && product.custom_prompt_text?.[stepKey]) {
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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setPendingSpecFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const handleSaveSpecFile = () => {
    if (pendingSpecFiles.length === 0) return
    pendingSpecFiles.forEach((file) => uploadSpecFile(product.id, file.name, file.size, 'other'))
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
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold flex items-center gap-1 shadow-md border-0"
            onClick={handleRunFullWf}
            disabled={runningFullWf}
          >
            <Play size={14} fill="white" className="mr-1" />
            Chạy full Workflow
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
              <span className="text-xs font-bold text-gray-500 ml-1">Variant:</span>
              <span className="font-mono text-xs font-semibold bg-gray-50 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                {product.variantcode}
              </span>
              <SiteBadge site={product.site_id} />
              <Badge className="bg-gray-100 text-gray-600 border border-gray-200">{product.nganh_hang}</Badge>
              
              {/* Product PIM status select badge */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-400">Trạng thái:</span>
                <select
                  value={product.pim_status}
                  onChange={(e) => {
                    updateProductField(product.id, 'pim_status', e.target.value)
                    toast(`Đã cập nhật trạng thái sản phẩm: ${e.target.value}`, 'success')
                  }}
                  className={`border font-semibold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${PIM_STATUS_META[product.pim_status]?.bgClass}`}
                >
                  <option value="draft">Nháp PIM</option>
                  <option value="gen_completed">Đã gen xong</option>
                  <option value="pending_qc">Cần QC</option>
                  <option value="qc_passed">Đã QC</option>
                  <option value="published">Đã publish PIM</option>
                </select>
                {product.pim_status !== 'published' && (
                  <button 
                    onClick={() => {
                      updateProductField(product.id, 'pim_status', 'published')
                      toast('Đã xuất bản sản phẩm lên PIM lập tức!', 'success')
                    }}
                    className="ml-2 hover:bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                  >
                    Publish ngay
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mt-2">{product.name}</h1>
            
          </div>

          <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 min-w-[220px]">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span>Nội dung hoàn thành</span>
                <span>{product.completeness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(product.completeness)} transition-all duration-300`}
                  style={{ width: `${product.completeness}%` }}
                />
              </div>
            </div>
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

        {/* Section 1: Tên sản phẩm */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <Info size={16} className="text-cyan-600" /> Tên sản phẩm
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                variant="ghost" 
                className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                onClick={() => setShowPrompts(prev => ({ ...prev, wf_name: !prev.wf_name }))}
              >
                <Settings size={12} className="mr-1" />
                {showPrompts['wf_name'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                onClick={() => handleGenField('name')}
                disabled={generatingFields['name']}
              >
                {generatingFields['name'] ? (
                  <Loader2 size={12} className="animate-spin mr-1" />
                ) : (
                  <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                )}
                Tối ưu hóa (AI)
              </Button>
            </div>
          </div>

          {/* Prompt Config */}
          {showPrompts['wf_name'] && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
              <div className="flex justify-between items-center mb-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-semibold">Prompt AI cho Tên sản phẩm</span>
                  <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_name</code>
                </div>
                {product.custom_prompt_text?.['wf_name'] && (
                  <button
                    onClick={() => {
                      const nextPrompt = { ...product.custom_prompt_text }
                      delete nextPrompt['wf_name']
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
                value={getPromptText('wf_name')}
                onChange={(e) => handleUpdateCustomPrompt('wf_name', e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
              />
            </div>
          )}

          <input
            type="text"
            value={editName}
            onChange={(e) => handleUpdateName(e.target.value)}
            placeholder="Nhập tên sản phẩm..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium text-gray-800"
          />
        </div>


          {/* Section 2: Ảnh đại diện (Thumbnail) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Image size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Ảnh đại diện (Thumbnail)</h3>
                {isThumbDemo && (
                  <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded border border-amber-200">DEMO</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf4_thumb: !prev.wf4_thumb }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf4_thumb'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs py-1 flex items-center gap-1 border-0"
                  onClick={handleRegenThumb}
                  disabled={genMediaLoading.thumb}
                >
                  {genMediaLoading.thumb ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} fill="white" className="animate-pulse" />
                  )}
                  Gen Thumbnail
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf4_thumb'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Ảnh đại diện</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_thumb</code>
                   </div>
                  {product.custom_prompt_text?.['wf4_thumb'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf4_thumb']
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
                  value={getPromptText('wf4_thumb')}
                  onChange={(e) => handleUpdateCustomPrompt('wf4_thumb', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative group rounded-xl overflow-hidden border border-gray-100 w-full sm:w-56 aspect-[16/9] bg-gray-50/30 flex-shrink-0 shadow-xs">
                <img src={effectiveThumb} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={handleUploadThumb} className="bg-white/90 hover:bg-white text-gray-800 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors">
                    Đổi ảnh
                  </button>
                  {!isThumbDemo && (
                    <button onClick={handleRemoveThumb} className="bg-red-500/90 hover:bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-md transition-colors">
                      Xóa
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 text-xs text-gray-500 space-y-2">
                <p className="font-semibold text-gray-700">Thông tin ảnh:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>URL: <span className="font-mono text-[10px] bg-gray-50 px-1 py-0.5 rounded break-all">{effectiveThumb}</span></li>
                  <li>Trạng thái: {isThumbDemo ? <span className="text-amber-600 font-semibold">Demo mẫu</span> : <span className="text-green-600 font-semibold">Đã cấu hình</span>}</li>
                </ul>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" onClick={handleUploadThumb}>
                    <Upload size={12} className="mr-1" /> Tải ảnh lên
                  </Button>
                  {!isThumbDemo && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemoveThumb}>
                      <Trash2 size={12} className="mr-1" /> Xóa ảnh
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Video Review */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Video size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Video Review</h3>
                {isVideoDemo && (
                  <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded border border-amber-200">DEMO</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf4_video: !prev.wf4_video }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf4_video'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs py-1 flex items-center gap-1 border-0"
                  onClick={handleRegenVideo}
                  disabled={genMediaLoading.video}
                >
                  {genMediaLoading.video ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} fill="white" className="animate-pulse" />
                  )}
                  Tối ưu Video AI
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf4_video'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Video Review</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_video</code>
                   </div>
                  {product.custom_prompt_text?.['wf4_video'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf4_video']
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
                  value={getPromptText('wf4_video')}
                  onChange={(e) => handleUpdateCustomPrompt('wf4_video', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-[16/9] bg-gray-50/30 shadow-xs">
                <iframe
                  src={effectiveVideo}
                  title="Review Video"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {!isVideoDemo && (
                  <button
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 bg-red-500/95 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors shadow-sm"
                    title="Xóa video"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-2 text-xs">
                  <label className="block font-semibold text-gray-700">Đường dẫn Video nhúng (YouTube embed):</label>
                  <input
                    type="url"
                    value={product.video_url || ''}
                    onChange={(e) => updateProductField(product.id, 'video_url', e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Hãy dán link mã nhúng dạng <code>https://www.youtube.com/embed/VIDEO_ID</code> để hiển thị trình phát chính xác.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const url = window.prompt('Nhập URL video (YouTube embed):', effectiveVideo)
                    if (url) handleUpdateVideoUrl(url)
                  }}>
                    Đổi nhanh URL
                  </Button>
                  {!isVideoDemo && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemoveVideo}>
                      Xóa Video
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Gallery (Ảnh chi tiết) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Image size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Gallery (Ảnh chi tiết)</h3>
                {isGalleryDemo && (
                  <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded border border-amber-200">DEMO</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf4_gallery: !prev.wf4_gallery }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf4_gallery'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs py-1 flex items-center gap-1 border-0"
                  onClick={handleRegenGallery}
                  disabled={genMediaLoading.gallery}
                >
                  {genMediaLoading.gallery ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} fill="white" className="animate-pulse" />
                  )}
                  Gen Gallery AI
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf4_gallery'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Gallery</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_gallery</code>
                   </div>
                  {product.custom_prompt_text?.['wf4_gallery'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf4_gallery']
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
                  value={getPromptText('wf4_gallery')}
                  onChange={(e) => handleUpdateCustomPrompt('wf4_gallery', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {effectiveGallery.map((img) => (
                <div key={img.id} className="relative group border border-gray-100 hover:border-cyan-200 p-2 rounded-xl bg-gray-50/20 text-xs transition-colors flex flex-col justify-between">
                  <div className="rounded-lg overflow-hidden border border-gray-100 aspect-square mb-2 relative bg-white">
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    {isGalleryDemo && img.id.toString().startsWith('demo-') && (
                      <div className="absolute top-1 left-1 bg-amber-500/90 text-white text-[7px] font-bold px-1 py-0.5 rounded">DEMO</div>
                    )}
                  </div>
                  <div className="space-y-1.5 mt-auto">
                    <input
                      type="text"
                      value={img.label}
                      onChange={(e) => handleUpdateGalleryLabel(img.id, e.target.value)}
                      placeholder="Nhãn ảnh..."
                      className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium text-gray-800"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-gray-400 break-all truncate max-w-[80px]" title={img.id}>{img.id}</span>
                      <button
                        onClick={() => handleRemoveGalleryImage(img.id)}
                        className="text-red-500 hover:text-red-700 p-0.5 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upload Card */}
              <button
                onClick={handleUploadGalleryImages}
                className="rounded-xl border-2 border-dashed border-gray-200 hover:border-cyan-300 aspect-square bg-gray-50/20 hover:bg-cyan-50/10 flex flex-col items-center justify-center gap-1 transition-colors p-4"
              >
                <Plus size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 font-bold">Thêm ảnh</span>
                <span className="text-[8px] text-gray-400 text-center">Tải file từ máy tính</span>
              </button>
            </div>
          </div>

          {/* Section 5: Slide minh họa */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500 animate-pulse" />
                <h3 className="font-bold text-gray-800 text-sm">Slide minh họa (AI Vision)</h3>
                <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-full">
                  {product.slide_images?.length || 0} slide
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf4_slides: !prev.wf4_slides }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf4_slides'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs py-1 flex items-center gap-1 border-0"
                  onClick={handleRegenSlides}
                  disabled={genMediaLoading.slides}
                >
                  {genMediaLoading.slides ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} fill="white" className="animate-pulse" />
                  )}
                  Gen Slide AI
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf4_slides'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Slide minh họa</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_slides</code>
                   </div>
                  {product.custom_prompt_text?.['wf4_slides'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf4_slides']
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
                  value={getPromptText('wf4_slides')}
                  onChange={(e) => handleUpdateCustomPrompt('wf4_slides', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
                />
              </div>
            )}

            {product.slide_images && product.slide_images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {product.slide_images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-[16/10] bg-gray-50/30 flex shadow-xs">
                    <img src={img.url} alt={img.label || 'Slide'} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveSlideImage(img.id)}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-md transition-all shadow-sm opacity-0 group-hover:opacity-100 z-10"
                      title="Xóa slide này"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-5 text-center">
                <Sparkles size={20} className="mx-auto mb-2 text-amber-500 animate-pulse" />
                <p className="text-xs text-amber-700 font-semibold mb-1">Chưa có Slide AI</p>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                  Hãy chạy quy trình biên tập tự động hoặc bấm nút "Gen Slide AI" ở trên để sinh ảnh slide bằng AI Vision.
                </p>
                <Button
                  onClick={handleRegenSlides}
                  disabled={genMediaLoading.slides}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs py-1.5 border-0"
                >
                  {genMediaLoading.slides ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                  Tạo Slide AI ngay
                </Button>
              </div>
            )}
          </div>

          {/* Section 6: Thông số kỹ thuật */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Thông số kỹ thuật</h3>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Filter Tabs for Specs Status */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">Lọc trạng thái:</span>
              <button
                type="button"
                onClick={() => setSpecsStatusFilter('all')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                  specsStatusFilter === 'all'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-cyan-400'
                }`}
              >
                Tất cả ({(() => {
                  const categoryFields = SPEC_SCHEMAS[product.nganh_hang] || DEFAULT_SPEC_SCHEMA
                  return categoryFields.length
                })()})
              </button>
              <button
                type="button"
                onClick={() => setSpecsStatusFilter('verified')}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                  specsStatusFilter === 'verified'
                    ? 'bg-green-600 text-white border-green-600 shadow-xs'
                    : 'bg-white text-green-700 border-green-200 hover:border-green-400'
                }`}
              >
                <Check size={9} />
                Khớp 100% ({(() => {
                  const categoryFields = SPEC_SCHEMAS[product.nganh_hang] || DEFAULT_SPEC_SCHEMA
                  return categoryFields.filter(f => (confidenceFlags[f.name] || 'none') === 'verified').length
                })()})
              </button>
              <button
                type="button"
                onClick={() => setSpecsStatusFilter('review')}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                  specsStatusFilter === 'review'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-orange-700 border-orange-200 hover:border-orange-400'
                }`}
              >
                <AlertTriangle size={9} />
                Cần review ({(() => {
                  const categoryFields = SPEC_SCHEMAS[product.nganh_hang] || DEFAULT_SPEC_SCHEMA
                  return categoryFields.filter(f => (confidenceFlags[f.name] || 'none') === 'review').length
                })()})
              </button>
              <button
                type="button"
                onClick={() => setSpecsStatusFilter('none')}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                  specsStatusFilter === 'none'
                    ? 'bg-gray-600 text-white border-gray-600 shadow-xs'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                <X size={9} />
                Trống ({(() => {
                  const categoryFields = SPEC_SCHEMAS[product.nganh_hang] || DEFAULT_SPEC_SCHEMA
                  return categoryFields.filter(f => (confidenceFlags[f.name] || 'none') === 'none').length
                })()})
              </button>
            </div>

            {/* Form Spec inputs */}
            <div className="space-y-4">
              {(() => {
                const categoryFields = SPEC_SCHEMAS[product.nganh_hang] || DEFAULT_SPEC_SCHEMA
                const filteredFields = categoryFields.filter(f => {
                  const status = confidenceFlags[f.name] || 'none'
                  if (specsStatusFilter === 'all') return true
                  return status === specsStatusFilter
                })

                if (filteredFields.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      Không có thông số nào thuộc trạng thái này.
                    </div>
                  )
                }

                return filteredFields.map((field) => {
                  const val = product.thong_so_ky_thuat?.[field.name] || ''
                  const selected = val ? val.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                  
                  return (
                    <div key={field.name} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-gray-700 text-xs">{field.name}</span>
                        <button
                          onClick={() => toggleConfidence(field.name)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all shadow-xs border ${
                            confidenceFlags[field.name] === 'verified'
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : confidenceFlags[field.name] === 'none'
                              ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-150'
                              : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                          }`}
                        >
                          {confidenceFlags[field.name] === 'verified' ? (
                            <>
                              <Check size={9} />
                              <span>Khớp 100%</span>
                            </>
                          ) : confidenceFlags[field.name] === 'none' ? (
                            <>
                              <X size={9} />
                              <span>Trống</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={9} />
                              <span>Cần review</span>
                            </>
                          )}
                        </button>
                      </div>

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const nextSpecs = { ...product.thong_so_ky_thuat }
                            nextSpecs[field.name] = e.target.value
                            updateProductField(product.id, 'thong_so_ky_thuat', nextSpecs)
                          }}
                          placeholder={`Nhập ${field.name.toLowerCase()}...`}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800"
                        />
                      )}

                      {field.type === 'select' && (
                        <select
                          value={val}
                          onChange={(e) => {
                            const nextSpecs = { ...product.thong_so_ky_thuat }
                            nextSpecs[field.name] = e.target.value
                            updateProductField(product.id, 'thong_so_ky_thuat', nextSpecs)
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-gray-800 font-medium"
                        >
                          <option value="">-- Chọn {field.name} --</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'multi' && (
                        <div className="relative">
                          {/* Backdrop to close dropdown when clicking outside */}
                          {openDropdown === field.name && (
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                          )}
                          <div
                            onClick={() => setOpenDropdown(openDropdown === field.name ? null : field.name)}
                            className="w-full min-h-[34px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus-within:ring-2 focus-within:ring-cyan-500 bg-white text-gray-800 font-medium flex flex-wrap items-center gap-1 cursor-pointer select-none relative z-20"
                          >
                            {selected.length === 0 ? (
                              <span className="text-gray-400">-- Chọn nhiều {field.name.toLowerCase()} --</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {selected.map((opt) => (
                                  <span
                                    key={opt}
                                    className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-cyan-100 flex items-center gap-1 hover:bg-cyan-100"
                                    onClick={(e) => {
                                      e.stopPropagation(); // prevent opening/closing dropdown
                                      const nextSelected = selected.filter((s: string) => s !== opt)
                                      const nextSpecs = { ...product.thong_so_ky_thuat }
                                      nextSpecs[field.name] = nextSelected.join(', ')
                                      updateProductField(product.id, 'thong_so_ky_thuat', nextSpecs)
                                    }}
                                  >
                                    {opt}
                                    <X size={10} className="hover:text-cyan-900" />
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {openDropdown === field.name && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30 animate-fade-in p-1">
                              {field.options?.map((opt) => {
                                const isSelected = selected.includes(opt)
                                return (
                                  <div
                                    key={opt}
                                    onClick={() => {
                                      const nextSelected = isSelected
                                        ? selected.filter((s: string) => s !== opt)
                                        : [...selected, opt]
                                      const nextSpecs = { ...product.thong_so_ky_thuat }
                                      nextSpecs[field.name] = nextSelected.join(', ')
                                      updateProductField(product.id, 'thong_so_ky_thuat', nextSpecs)
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-cyan-50/50 rounded-md cursor-pointer transition-colors text-xs font-semibold text-gray-700 select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 h-3 w-3 cursor-pointer"
                                    />
                                    <span>{opt}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* Section 7: Đặc điểm nổi bật (Highlights) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Check size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Đặc điểm nổi bật (Highlights)</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-gray-500 hover:text-cyan-600 text-xs py-1"
                  onClick={() => setShowPrompts(prev => ({ ...prev, wf4_highlights: !prev.wf4_highlights }))}
                >
                  <Settings size={12} className="mr-1" />
                  {showPrompts['wf4_highlights'] ? 'Đóng prompt' : 'Cấu hình Prompt'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-xs py-1"
                  onClick={() => handleGenField('dac_diem_noi_bat')}
                  disabled={generatingFields['dac_diem_noi_bat']}
                >
                  {generatingFields['dac_diem_noi_bat'] ? (
                    <Loader2 size={12} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
                  )}
                  Gen Highlights (AI)
                </Button>
              </div>
            </div>

            {/* Prompt Config */}
            {showPrompts['wf4_highlights'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Đặc điểm nổi bật</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_highlights</code>
                   </div>
                  {product.custom_prompt_text?.['wf4_highlights'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf4_highlights']
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
                  value={getPromptText('wf4_highlights')}
                  onChange={(e) => handleUpdateCustomPrompt('wf4_highlights', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
                />
              </div>
            )}

            {/* HTML Editor Toolbar */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="flex items-center gap-1 bg-gray-50 p-2 border-b border-gray-200 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => insertHtmlTag('<strong>', '</strong>')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded font-bold transition-all text-gray-800"
                  title="In đậm (Bold)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlTag('<em>', '</em>')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded italic transition-all text-gray-800"
                  title="In nghiêng (Italic)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlTag('<u>', '</u>')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded underline transition-all text-gray-800"
                  title="Gạch chân (Underline)"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => insertHtmlTag('<ul>\n  <li>', '</li>\n</ul>')}
                  className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-all text-gray-800 font-semibold text-[10px]"
                  title="Danh sách (Bullet List)"
                >
                  • Danh sách
                </button>
              </div>

              {/* Textarea */}
              <textarea
                id="highlights-textarea"
                value={highlightsHtml}
                onChange={(e) => handleUpdateHighlights(e.target.value)}
                placeholder="Nhập mã HTML đặc điểm nổi bật..."
                rows={6}
                className="w-full p-3 text-xs focus:outline-none focus:ring-0 font-mono text-gray-700 bg-white border-0"
              />
            </div>

            {/* Live Preview */}
            <div className="mt-3 border border-gray-100 rounded-xl p-4 bg-cyan-50/20">
              <span className="block text-[10px] font-bold text-cyan-700 uppercase tracking-wider mb-2">Xem trước nội dung (Live Preview):</span>
              <div 
                className="prose prose-sm max-w-none text-xs text-gray-600 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: highlightsHtml || '<p className="text-gray-400 italic">Chưa có nội dung hiển thị.</p>' }}
              />
            </div>
          </div>

          {/* Section 8: Dàn bài (Outline) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <FileText size={16} className="text-cyan-600" />
                <h3 className="font-bold text-gray-800 text-sm">Dàn bài viết (Outline)</h3>
              </div>
              <div className="flex items-center gap-2">
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
                  disabled={generatingFields['outline']}
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
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Lập Dàn Bài</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf2_outline</code>
                   </div>
                  {product.custom_prompt_text?.['wf2_outline'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf2_outline']
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
                  value={getPromptText('wf2_outline')}
                  onChange={(e) => handleUpdateCustomPrompt('wf2_outline', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
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
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs py-1 flex items-center gap-1 border-0"
                  onClick={handleGenArticleImages}
                  disabled={generatingArticleImages}
                >
                  {generatingArticleImages ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} className="animate-pulse" />
                  )}
                  Gen Ảnh Bài Viết
                </Button>
              </div>
            </div>

            {showPrompts['wf4_article_images'] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Ảnh gắn bài viết</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf_article_images</code>
                   </div>
                  {product.custom_prompt_text?.['wf4_article_images'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf4_article_images']
                        updateProductField(product.id, 'custom_prompt_text', nextPrompt)
                        toast('Đã khôi phục prompt mặc định', 'info')
                      }}
                      className="text-red-500 hover:underline font-semibold"
                    >
                      Khôi phục mặc định
                    </button>
                  )}
                </div>
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

          {/* Section 10: Bài viết chi tiết (HTML Content) */}
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
                  disabled={generatingFields['content_html']}
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
                <div className="flex justify-between items-center mb-1 text-[10px]">
                   <div className="flex items-center gap-1.5">
                   <span className="text-gray-400 font-semibold">Prompt AI cho Viết Bài chi tiết</span>
                   <code className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-mono text-[9px] font-bold tracking-wide">wf3_writing</code>
                   </div>
                  {product.custom_prompt_text?.['wf3_writing'] && (
                    <button
                      onClick={() => {
                        const nextPrompt = { ...product.custom_prompt_text }
                        delete nextPrompt['wf3_writing']
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
                  value={getPromptText('wf3_writing')}
                  onChange={(e) => handleUpdateCustomPrompt('wf3_writing', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-white"
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

          {/* Section 10: SEO Meta */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Globe size={16} className="text-cyan-600" /> Cấu hình SEO Meta
              </h3>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <Upload size={16} className="text-cyan-600" /> Tải lên File Specs
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-semibold">Phân loại:</span>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="text-[11px] py-1 px-2 bg-white border border-gray-200 rounded text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                    >
                      <option value="product_image">Ảnh sản phẩm</option>
                      <option value="manufacturer_spec">Spec hãng</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
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
