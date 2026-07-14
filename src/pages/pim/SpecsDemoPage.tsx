import { ErrorBoundary } from '../../components/ErrorBoundary'
// @ts-nocheck

import { useState, useEffect, useMemo, useRef } from 'react'
import { PRODUCT_CONTENT_STATUS_META, getProductContentStatus } from '../../lib/productContentStatus'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import {
  ArrowLeft, Upload, Trash2, Plus, Sparkles, Save, FileText,
  Settings, AlertTriangle, Globe, File, Info, Loader2, X, FileSpreadsheet,
  Link, History, CheckCircle2, ExternalLink, Image, LayoutList, Zap, ChevronDown,
  ChevronLeft, ChevronRight, SlidersHorizontal, ImagePlus
} from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { SiteBadge, StatusBadge } from '../../components/ui/Badge'
import { SectionHeaderCard } from '../../components/pim/SectionHeaderCard'
import { PromptConfigDialog } from '../../components/pim/PromptConfigDialog'
import { ProductPromptConfigTab } from '../../components/pim/ProductPromptConfigTab'
import { ProductPromptWorkflowDialog } from '../../components/pim/ProductPromptWorkflowDialog'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useProductStore } from '../../store/productStore'
import { usePromptStore } from '../../store/promptStore'
import { useJobStore } from '../../store/jobStore'
import { useToast } from '../../components/ui/Toast'
import { type Job, type ImageEntry } from '../../types'
import { formatDateTime, formatTimeAgo } from '../../lib/utils'

const SHOW_SPECS_SECTION = false
const SHOW_SEO_SECTION = false

const TOC_SECTIONS = [
  ...(SHOW_SPECS_SECTION ? [{ id: 'section-specs', label: 'Thông số kỹ thuật', icon: FileSpreadsheet }] : []),
  { id: 'section-outline', label: 'Dàn bài (Outline)', icon: FileText },
  { id: 'section-article-content', label: 'Bài viết chi tiết', icon: Globe },
  { id: 'section-highlights', label: 'Đặc điểm nổi bật', icon: Sparkles },
  { id: 'section-article-images', label: 'Ảnh bài viết', icon: Image },
  ...(SHOW_SEO_SECTION ? [{ id: 'section-seo', label: 'SEO Meta', icon: Globe }] : []),
]

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [, setEditorVersion] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      TiptapImage.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'mx-auto min-h-[360px] w-full max-w-[960px] border border-gray-300 bg-white px-8 py-10 text-sm leading-7 text-gray-900 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:px-14 sm:py-16',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor || editor.getHTML() === (value || '')) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    const refreshToolbar = () => setEditorVersion(version => version + 1)
    editor.on('selectionUpdate', refreshToolbar)
    editor.on('transaction', refreshToolbar)
    return () => {
      editor.off('selectionUpdate', refreshToolbar)
      editor.off('transaction', refreshToolbar)
    }
  }, [editor])

  useEffect(() => {
    if (!isFullscreen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isFullscreen])

  const runLinkPrompt = () => {
    if (!editor) return
    const href = window.prompt('Nhập URL', editor.getAttributes('link').href || '')
    if (href === null) return
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }

  const runImagePrompt = () => {
    if (!editor) return
    const src = window.prompt('Nhập URL ảnh')
    if (!src?.trim()) return
    editor.chain().focus().setImage({ src }).run()
  }

  const runVideoPlaceholder = () => {
    editor?.chain().focus().insertContent('<p>[VIDEO]</p>').run()
  }

  const toolbarButtonClass = 'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
  const activeButtonClass = 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
  const separatorClass = 'mx-1 h-7 w-px bg-gray-200'
  const shellClass = isFullscreen
    ? 'fixed inset-4 z-50 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl'
    : 'overflow-hidden rounded-lg border border-gray-200 bg-white'
  const canvasClass = isFullscreen
    ? 'flex-1 overflow-y-auto bg-[#F6F7F8] px-4 py-6 sm:px-8'
    : 'max-h-[560px] overflow-y-auto bg-[#F6F7F8] px-4 py-8 sm:px-8'

  const headingValue = editor?.isActive('heading', { level: 2 })
    ? 'h2'
    : editor?.isActive('heading', { level: 3 })
      ? 'h3'
      : editor?.isActive('blockquote')
        ? 'blockquote'
        : 'p'

  return (
    <>
      {isFullscreen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsFullscreen(false)} />}
      <div className={shellClass}>
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 text-gray-700">
        <select
          aria-label="Kiểu đoạn văn"
          value={headingValue}
          disabled={!editor}
          onChange={(e) => {
            const nextValue = e.target.value
            if (nextValue === 'h2') editor?.chain().focus().toggleHeading({ level: 2 }).run()
            else if (nextValue === 'h3') editor?.chain().focus().toggleHeading({ level: 3 }).run()
            else if (nextValue === 'blockquote') editor?.chain().focus().toggleBlockquote().run()
            else editor?.chain().focus().setParagraph().run()
          }}
          className="h-9 min-w-[170px] rounded-md border-0 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className={separatorClass} />
        <button type="button" className={`${toolbarButtonClass} ${editor?.isActive('bold') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold">B</button>
        <button type="button" className={`${toolbarButtonClass} italic ${editor?.isActive('italic') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic">I</button>
        <button type="button" className={`${toolbarButtonClass} underline ${editor?.isActive('underline') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline">U</button>
        <button type="button" className={`${toolbarButtonClass} line-through ${editor?.isActive('strike') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough">S</button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear format">Tx</button>
        <span className={separatorClass} />
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Align left">Left</button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Align center">Center</button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Align right">Right</button>
        <span className={separatorClass} />
        <button type="button" className={`${toolbarButtonClass} ${editor?.isActive('blockquote') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote">Quote</button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()} title="Table">Table</button>
        <button type="button" className={`${toolbarButtonClass} ${editor?.isActive('codeBlock') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Code">Code</button>
        <button type="button" className={`${toolbarButtonClass} ${editor?.isActive('bulletList') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bulleted list">List</button>
        <button type="button" className={`${toolbarButtonClass} ${editor?.isActive('orderedList') ? activeButtonClass : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list">1.</button>
        <span className={separatorClass} />
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().undo().run()} title="Undo">Undo</button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().redo().run()} title="Redo">Redo</button>
        <button type="button" className={toolbarButtonClass} onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Horizontal line">Line</button>
        <button type="button" className={toolbarButtonClass} onClick={runImagePrompt} title="Image">Image</button>
        <button type="button" className={toolbarButtonClass} onClick={runVideoPlaceholder} title="Video placeholder">Video</button>
        <button type="button" className={`${toolbarButtonClass} ${editor?.isActive('link') ? activeButtonClass : ''}`} onClick={runLinkPrompt} title="Link">Link</button>
        <span className={separatorClass} />
        <button type="button" className={`${toolbarButtonClass} ml-auto border border-gray-200 bg-gray-50`} onClick={() => setIsFullscreen(prev => !prev)} title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình'}>
          {isFullscreen ? 'Exit' : 'Full'}
        </button>
      </div>

      <div className={canvasClass}>
        <EditorContent
          editor={editor}
          className="tiptap-editor [&_.ProseMirror]:min-h-[360px] [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-gray-600 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_table]:my-4 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:bg-gray-50 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
        />
      </div>
      </div>
    </>
  )
}

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

type SpecsAiGenerationStatus = 'pending' | 'processing' | 'done' | 'failed'

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
    runWf1ExtractSpecs
  } = useProductStore()

  const { categories } = usePromptStore()
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

  // Right side panel tab: prompts | content | specs | jobs
  const [mainTab, setMainTab] = useState<'prompts' | 'content' | 'specs' | 'jobs'>('content')
  // Dirty-check khi rời tab Cấu hình prompt chưa lưu
  const [promptTabDirty, setPromptTabDirty] = useState(false)
  const handleTabChange = (tab: 'prompts' | 'content' | 'specs' | 'jobs') => {
    if (mainTab === 'prompts' && tab !== 'prompts' && promptTabDirty) {
      if (!confirm('Cấu hình prompt chưa lưu. Rời tab?')) return
    }
    setMainTab(tab)
  }
  const goToPromptSection = (anchor: 's1' | 's2' | 's3') => {
    setMainTab('prompts')
    window.setTimeout(() => {
      document.getElementById(`prompt-section-${anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }
  const [promptWorkflowDialog, setPromptWorkflowDialog] = useState<'wf2_outline' | 'wf3_writing' | 'wf4_article_images' | null>(null)
  // Pin the tab bar to the top of the viewport once scrolled past the Outline section
  const outlineSentinelRef = useRef<HTMLDivElement>(null)
  const [isTabsPinned, setIsTabsPinned] = useState(false)
  const pinnedTabsBarRef = useRef<HTMLDivElement>(null)
  const [pinnedTabsBarHeight, setPinnedTabsBarHeight] = useState(0)

  useEffect(() => {
    const el = outlineSentinelRef.current
    if (!el || mainTab !== 'content') {
      setIsTabsPinned(false)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsTabsPinned(entry.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mainTab])

  // Measure the pinned tab bar so the TOC panel can sit right below it, never under it
  useEffect(() => {
    if (!isTabsPinned) return
    const el = pinnedTabsBarRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setPinnedTabsBarHeight(entry.contentRect.height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [isTabsPinned])

  // Section quick-nav (Table of Contents) panel
  const [tocCollapsed, setTocCollapsed] = useState(false)
  const [activeTocId, setActiveTocId] = useState(TOC_SECTIONS[0]?.id)
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const offset = (isTabsPinned ? pinnedTabsBarHeight : 0) + 20
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  useEffect(() => {
    if (mainTab !== 'content') return
    const elements = TOC_SECTIONS
      .map(section => document.getElementById(section.id))
      .filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          setActiveTocId(visible[0].target.id)
        }
      },
      { rootMargin: '-100px 0px -70% 0px' }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [mainTab])

  // Selected job details popup states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [popupTab, setPopupTab] = useState<'preview' | 'outline_specs' | 'seo' | 'logs'>('preview')
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  
  // Loading states for individual AI gens
  const [generatingFields, setGeneratingFields] = useState<Record<string, boolean>>({})
  // Track if name has changed to show dependency alert
  const [nameChangedAlert, setNameChangedAlert] = useState(false)
  const [newKeywordText, setNewKeywordText] = useState('')

  const [hasExtractedSpecs, setHasExtractedSpecs] = useState(false)
  const [extractingSpecs, setExtractingSpecs] = useState(false)
  const [pendingSpecFiles, setPendingSpecFiles] = useState<{file: File, type: 'product_image' | 'manufacturer_spec' | 'other'}[]>([])
  const [uploadCategory, setUploadCategory] = useState<'product_image' | 'manufacturer_spec' | 'other'>('manufacturer_spec')
  const [referenceInputMode, setReferenceInputMode] = useState<'file' | 'url'>('file')
  const [referenceUrlDraft, setReferenceUrlDraft] = useState('')
  const [referenceUrlLabelDraft, setReferenceUrlLabelDraft] = useState('')
  const [showMissingInputAlert, setShowMissingInputAlert] = useState(false)

  // Prompts visibility toggle
  const [showPrompts, setShowPrompts] = useState<Record<string, boolean>>({})

  // Extra reference links (dynamic list in Specs tab)
  const [extraLinks, setExtraLinks] = useState<{ id: string; label: string; url: string }[]>([
    { id: 'link-1', label: '', url: '' }
  ])

  // Open multi-select dropdown field name
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Article images generation loading state
  const [generatingArticleImages, setGeneratingArticleImages] = useState(false)
  const [selectedArticleImageId, setSelectedArticleImageId] = useState<string | null>(null)
  const [editingArticleFileId, setEditingArticleFileId] = useState<string | null>(null)
  const [articleFileDrafts, setArticleFileDrafts] = useState<Record<string, string>>({})
  const [articleAltDrafts, setArticleAltDrafts] = useState<Record<string, string>>({})
  const [articleFeedbackDrafts, setArticleFeedbackDrafts] = useState<Record<string, string>>({})
  const [articleImageErrors, setArticleImageErrors] = useState<Record<string, string>>({})

  // Highlights HTML editor state
  const [highlightsHtml, setHighlightsHtml] = useState('')

  // Initialize highlights HTML
  useEffect(() => {
    if (product) {
      if (product.dac_diem_noi_bat && product.dac_diem_noi_bat.length > 0) {
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
  }, [product?.id, product?.dac_diem_noi_bat])

  // Update highlights HTML in store
  const handleUpdateHighlights = (htmlVal: string) => {
    if (!product) return
    setHighlightsHtml(htmlVal)
    updateProductField(product.id, 'dac_diem_noi_bat', [htmlVal])
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

  const handleGenField = async (field: 'name' | 'thong_so_ky_thuat' | 'dac_diem_noi_bat' | 'outline' | 'content_html' | 'meta_seo') => {
    setGeneratingFields((prev) => ({ ...prev, [field]: true }))
    try {
      const fieldStepMap: Record<string, string> = {
        name: 'wf1_specs',
        thong_so_ky_thuat: 'wf1_specs',
        dac_diem_noi_bat: 'wf4_highlights',
        outline: 'wf2_outline',
        // Workflow gộp Outline & Bài viết: prompt viết bài nằm trong template_content của option wf2_outline
        content_html: 'wf2_outline',
        meta_seo: 'wf5_finalize'
      }
      const stepKey = fieldStepMap[field] || 'wf2_outline'

      const categoryLevel1 = categories.find((c) => c.id === activePromptCategory)
      const matchedSubCategory =
        categoryLevel1?.sub_categories.find(
          (s) => s.workflow_type === stepKey && s.id === (product.selected_sub_categories?.[stepKey] || '')
        ) || categoryLevel1?.sub_categories.find((s) => s.workflow_type === stepKey)
      const matchedOption =
        matchedSubCategory?.options.find(
          (o) => o.id === (product.selected_prompt_options?.[stepKey] || '')
        ) || matchedSubCategory?.options[0]

      let promptText = ''
      if (matchedOption) {
        promptText = field === 'outline'
          ? matchedOption.outline_prompt_content ?? matchedOption.template_content
          : matchedOption.template_content
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

  // Chèn bộ ảnh bài viết hiện có vào ngay dưới các thẻ H3 trong content_html (không gen lại ảnh)
  const handleInsertArticleImages = () => {
    if (!product) return
    const images = product.article_images || []
    if (images.length === 0) {
      toast('Chưa có ảnh bài viết — hãy Gen ảnh bài viết trước', 'info')
      return
    }
    if (!product.content_html) {
      toast('Chưa có nội dung bài viết để chèn ảnh', 'info')
      return
    }
    let h3Index = 0
    const nextHtml = product.content_html.replace(/(<h3[^>]*>.*?<\/h3>)([\s\S]*?)(?=<h3>|<\/div>|$)/gi, (match, h3Tag, rest) => {
      const img = images[h3Index]
      h3Index++
      if (img?.url) {
        const cleanRest = rest.replace(/<img[^>]*>/gi, '')
        return `${h3Tag}\n  <img src="${img.url}" alt="${img.label || ''}" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" />${cleanRest}`
      }
      return match
    })
    updateProductField(product.id, 'content_html', nextHtml)
    toast('Đã chèn ảnh vào bài viết dưới các thẻ H3!', 'success')
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

  const getImageExtension = (fileName: string) => {
    const match = fileName.match(/(\.[a-zA-Z0-9]{2,8})$/)
    return match?.[1] || '.jpg'
  }

  const stripImageExtension = (fileName: string) => {
    return fileName.replace(/(\.[a-zA-Z0-9]{2,8})$/, '')
  }

  const slugifyFileName = (value: string) => {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return normalized || 'article-image'
  }

  const getArticleImageFileName = (img: ImageEntry, index: number) => {
    return img.file_name || img.source_image || `${slugifyFileName(img.label || articleH3s[index] || `article-image-${index + 1}`)}.jpg`
  }

  const truncateMiddle = (value: string, maxLength = 34) => {
    if (value.length <= maxLength) return value
    const ext = getImageExtension(value)
    const base = stripImageExtension(value)
    const keep = Math.max(8, maxLength - ext.length - 3)
    const left = Math.ceil(keep * 0.55)
    const right = Math.floor(keep * 0.45)
    return `${base.slice(0, left)}...${base.slice(-right)}${ext}`
  }

  const updateArticleImage = (imgId: string, updates: Partial<ImageEntry>) => {
    if (!product) return
    const currentImages = product.article_images && product.article_images.length > 0
      ? product.article_images
      : Array.from({ length: 4 }, (_, i) => ({
          id: `demo-art-${i}`,
          url: `https://picsum.photos/seed/${product.id}-art${i}/800/600`,
          label: articleH3s[i] || `Ảnh minh họa bài viết ${i + 1}`,
          section_h3: articleH3s[i],
          file_name: `${slugifyFileName(articleH3s[i] || `article-image-${i + 1}`)}.jpg`
        }))
    updateProductField(product.id, 'article_images', currentImages.map((img) => (
      img.id === imgId ? { ...img, ...updates } : img
    )))
  }

  const getCurrentArticleImages = () => {
    if (!product) return []
    return product.article_images && product.article_images.length > 0
      ? product.article_images
      : Array.from({ length: 4 }, (_, i) => ({
          id: `demo-art-${i}`,
          url: `https://picsum.photos/seed/${product.id}-art${i}/800/600`,
          label: articleH3s[i] || `Ảnh minh họa bài viết ${i + 1}`,
          section_h3: articleH3s[i],
          file_name: `${slugifyFileName(articleH3s[i] || `article-image-${i + 1}`)}.jpg`
        }))
  }

  const saveArticleImageAlt = (img: ImageEntry, index: number) => {
    const nextAlt = (articleAltDrafts[img.id] ?? img.label ?? articleH3s[index] ?? '').trim()
    if (!nextAlt) return
    updateArticleImage(img.id, { label: nextAlt })
  }

  const hasArticleFeedbackChanges = Object.values(articleFeedbackDrafts).some(value => value.trim().length > 0)

  const handleSaveAllArticleImageFeedback = () => {
    if (!product || !hasArticleFeedbackChanges) return
    const currentImages = getCurrentArticleImages()
    updateProductField(product.id, 'article_images', currentImages.map((img) => {
      const feedback = (articleFeedbackDrafts[img.id] || '').trim()
      return feedback ? { ...img, ai_feedback: feedback } : img
    }))
    setArticleFeedbackDrafts({})
    toast('Đã lưu feedback cho ảnh bài viết', 'success')
  }

  const beginRenameArticleImage = (img: ImageEntry, index: number) => {
    const fileName = getArticleImageFileName(img, index)
    setEditingArticleFileId(img.id)
    setArticleFileDrafts((prev) => ({ ...prev, [img.id]: stripImageExtension(fileName) }))
    setArticleImageErrors((prev) => ({ ...prev, [img.id]: '' }))
  }

  const cancelRenameArticleImage = (imgId: string) => {
    setEditingArticleFileId((current) => (current === imgId ? null : current))
    setArticleFileDrafts((prev) => {
      const next = { ...prev }
      delete next[imgId]
      return next
    })
  }

  const saveArticleImageFileName = (img: ImageEntry, index: number) => {
    const draft = (articleFileDrafts[img.id] || '').trim()
    if (!draft) {
      setArticleImageErrors((prev) => ({ ...prev, [img.id]: 'Tên file không được để trống.' }))
      return
    }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(draft)) {
      setArticleImageErrors((prev) => ({ ...prev, [img.id]: 'Tên file có ký tự không hợp lệ.' }))
      return
    }

    const extension = getImageExtension(getArticleImageFileName(img, index))
    const nextFileName = `${draft.replace(/\.+$/g, '')}${extension}`
    updateArticleImage(img.id, { file_name: nextFileName, source_image: nextFileName })
    cancelRenameArticleImage(img.id)
    setArticleImageErrors((prev) => ({ ...prev, [img.id]: '' }))
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

  const handleAddReferenceToList = () => {
    if (referenceInputMode === 'file') {
      handleSaveSpecFile()
      return
    }

    const url = referenceUrlDraft.trim()
    if (!url) {
      toast('Vui lòng nhập URL tài liệu tham khảo', 'warning')
      return
    }

    setExtraLinks(prev => [
      ...prev.filter(link => link.url.trim() || link.label.trim()),
      {
        id: `link-${Date.now()}`,
        label: referenceUrlLabelDraft.trim() || 'Trang sản phẩm',
        url
      }
    ])
    setReferenceUrlDraft('')
    setReferenceUrlLabelDraft('')
    toast('Đã thêm link tham khảo', 'success')
  }

  // Save changes explicitly
  const handleSaveAll = () => {
    toast('Đã lưu toàn bộ thay đổi thành công!', 'success')
  }

  const specsAiStatus = hasExtractedSpecs ? 'done' : extractingSpecs ? 'processing' : 'pending'
  const specsAiStatusMeta = SPECS_AI_STATUS_META[specsAiStatus]


  const handleExportExcel = () => {
    toast('Đã xuất file Excel thông số kỹ thuật!', 'success')
  }

  const saveSectionAction = { label: 'Lưu thay đổi', icon: Save, onClick: handleSaveAll }
  const publishToPimAction = {
    label: 'Xuất bản lên PIM',
    icon: Upload,
    onClick: () => {
      updateProductField(product.id, 'pim_status', 'published')
      toast('Đã xuất bản lên PIM!', 'success')
    },
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Sản phẩm', `${product.model_code} / ${product.variantcode}`]}>
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
    {isTabsPinned && (
      <div ref={pinnedTabsBarRef} className="fixed top-0 left-0 right-0 md:left-[var(--sidebar-width)] z-40 bg-[#f0f2f5]/95 backdrop-blur-sm border-b border-gray-200 shadow-md py-2 px-6 animate-fade-in">
        <div className="mx-auto flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1.5 shadow-sm">
          <button
            onClick={() => handleTabChange('prompts')}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'prompts' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
          >
            <SlidersHorizontal size={16} className={mainTab === 'prompts' ? 'text-blue-500' : 'text-gray-400'} /> Cấu hình prompt
          </button>
          <button
            onClick={() => handleTabChange('content')}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'content' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
          >
            <LayoutList size={16} className={mainTab === 'content' ? 'text-blue-500' : 'text-gray-400'} /> Thông tin sản phẩm
          </button>
          <button
            onClick={() => handleTabChange('specs')}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'specs' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
          >
            <FileText size={16} className={mainTab === 'specs' ? 'text-blue-500' : 'text-gray-400'} /> Tài liệu & Links Tham Khảo
          </button>
          {/* Tạm ẩn tab Lịch sử Jobs
          <button
            onClick={() => handleTabChange('jobs')}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'jobs' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
          >
            <History size={16} className={mainTab === 'jobs' ? 'text-blue-500' : 'text-gray-400'} /> Lịch sử Jobs
          </button> */}
        </div>
      </div>
    )}
    <div className="mx-auto mb-5 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-gray-100/80 p-1.5 shadow-sm">
      <button
        onClick={() => handleTabChange('prompts')}
        className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'prompts' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
      >
        <SlidersHorizontal size={16} className={mainTab === 'prompts' ? 'text-blue-500' : 'text-gray-400'} /> Cấu hình prompt
      </button>
      <button
        onClick={() => handleTabChange('content')}
        className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'content' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
      >
        <LayoutList size={16} className={mainTab === 'content' ? 'text-blue-500' : 'text-gray-400'} /> Thông tin sản phẩm
      </button>
      <button
        onClick={() => handleTabChange('specs')}
        className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'specs' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
      >
        <FileText size={16} className={mainTab === 'specs' ? 'text-blue-500' : 'text-gray-400'} /> Tài liệu & Links Tham Khảo
      </button>
      {/* Tạm ẩn tab Lịch sử Jobs
      <button
        onClick={() => handleTabChange('jobs')}
        className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${mainTab === 'jobs' ? 'bg-white text-gray-900 shadow-md shadow-gray-200/70 ring-1 ring-gray-200/70' : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'}`}
      >
        <History size={16} className={mainTab === 'jobs' ? 'text-blue-500' : 'text-gray-400'} /> Lịch sử Jobs
      </button> */}
    </div>

    {promptWorkflowDialog && (
      <ProductPromptWorkflowDialog
        open={!!promptWorkflowDialog}
        onClose={() => setPromptWorkflowDialog(null)}
        product={product}
        workflowKey={promptWorkflowDialog}
        onUpdateProductField={(field, value) => updateProductField(product.id, field, value)}
      />
    )}

    {/* Main Content Area */}
    <div className="w-full">

      {/* Tab: Cấu hình prompt */}
      {mainTab === 'prompts' && (
        <div className="max-w-5xl mx-auto w-full">
          <ProductPromptConfigTab product={product} onDirtyChange={setPromptTabDirty} />
        </div>
      )}

      {/* Left Column: Interactive Field Editors (Now Full Width) */}
      <div className={mainTab === 'content' ? "flex items-start gap-5" : "hidden"}>

        {/* Section quick-nav (Table of Contents) */}
        <div
          className="sticky shrink-0 z-30 hidden lg:block"
          style={{ top: (isTabsPinned ? pinnedTabsBarHeight : 0) + 16 }}
        >
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all overflow-hidden ${tocCollapsed ? 'w-11' : 'w-56'}`}>
            <div className={`flex items-center border-b border-gray-100 px-2 py-2 ${tocCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!tocCollapsed && <span className="text-xs font-bold text-gray-700 pl-1.5">Mục lục</span>}
              <button
                onClick={() => setTocCollapsed(prev => !prev)}
                className="p-1 rounded-md text-gray-400 hover:text-cyan-600 hover:bg-gray-50"
                title={tocCollapsed ? 'Mở rộng mục lục' : 'Thu gọn mục lục'}
              >
                {tocCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>
            {!tocCollapsed && (
              <nav className="flex flex-col p-1.5 max-h-[70vh] overflow-y-auto">
                {TOC_SECTIONS.map(section => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${activeTocId === section.id ? 'bg-cyan-50 text-cyan-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                  >
                    <section.icon size={13} className="shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          {/* Section 6: Thông số kỹ thuật */}
          {SHOW_SPECS_SECTION && (
          <div id="section-specs">
          <SectionHeaderCard
            className="!rounded-b-none"
            title="Thông số kỹ thuật"
            approval={{
              state: product.approval_status?.specs_approved ? 'approved' : 'pending',
              onToggle: () => {
                const nextStatus = { ...product.approval_status };
                nextStatus.specs_approved = !nextStatus.specs_approved;
                updateProductField(product.id, 'approval_status', nextStatus);
                if (nextStatus.specs_approved) toast('Duyệt Specs thành công!', 'success');
              },
            }}
            ai={{
              label: specsAiStatusMeta?.label || 'AI gen xong',
              agentId: 'specs_agent#289',
              isGenerating: extractingSpecs,
            }}
            secondaryAction={saveSectionAction}
            primaryAction={publishToPimAction}
            toolbarLeft={[
              { label: 'Trích xuất specs AI', icon: Zap, tag: 'WF1', onClick: handleExtractSpecs, disabled: extractingSpecs },
              { label: 'Cấu hình prompt', icon: Settings, onClick: () => goToPromptSection('s1') },
            ]}
            toolbarRight={[
              { label: 'Xuất file excel', icon: FileSpreadsheet, onClick: handleExportExcel },
            ]}
          />

          <div className="mb-5 bg-white rounded-xl !rounded-t-none border !border-t-0 border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
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
          </div>
          )}

          {/* Section 7: Dàn bài (Outline) */}
          <div id="section-outline">
          <SectionHeaderCard
            className="!rounded-b-none"
            icon={FileText}
            title="Dàn bài viết (Outline)"
            approval={{
              state: product.approval_status?.outline_approved ? 'approved' : 'pending',
              onToggle: () => {
                const nextStatus = { ...product.approval_status };
                nextStatus.outline_approved = !nextStatus.outline_approved;
                updateProductField(product.id, 'approval_status', nextStatus);
                if (nextStatus.outline_approved) toast('Duyệt Outline thành công!', 'success');
              },
            }}
            ai={{
              label: specsAiStatusMeta?.label || 'AI gen xong',
              agentId: 'outline_agent#312',
              isGenerating: generatingFields['outline'],
            }}
            secondaryAction={saveSectionAction}
            toolbarLeft={[
              { label: 'Tạo outline (AI)', icon: Sparkles, onClick: () => handleGenField('outline'), disabled: generatingFields['outline'] || product.approval_status?.outline_approved },
              { label: 'Cấu hình prompt', icon: Settings, onClick: () => setPromptWorkflowDialog('wf2_outline') },
            ]}
          />

          <div className="mb-5 bg-white rounded-xl !rounded-t-none border !border-t-0 border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">

            <textarea
              value={product.outline || ''}
              onChange={(e) => updateProductField(product.id, 'outline', e.target.value)}
              placeholder="Nhập outline chi tiết hoặc bấm nút AI tạo tự động ở trên..."
              rows={6}
              className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-gray-700 bg-gray-50/50"
            />
          </div>
          </div>
          <div ref={outlineSentinelRef} />

          {/* Section 8: Bài viết chi tiết (HTML Content) */}
          <div id="section-article-content">
          <SectionHeaderCard
            className="!rounded-b-none"
            icon={Globe}
            title="Bài viết chi tiết"
            approval={{
              state: product.approval_status?.article_approved ? 'approved' : 'pending',
              onToggle: () => {
                const nextStatus = { ...product.approval_status };
                nextStatus.article_approved = !nextStatus.article_approved;
                updateProductField(product.id, 'approval_status', nextStatus);
                if (nextStatus.article_approved) toast('Duyệt Bài Viết thành công!', 'success');
              },
            }}
            ai={{
              label: specsAiStatusMeta?.label || 'AI gen xong',
              agentId: 'writing_agent#124',
              isGenerating: generatingFields['content_html'],
            }}
            secondaryAction={saveSectionAction}
            primaryAction={publishToPimAction}
            toolbarLeft={[
              { label: 'Viết bài (AI)', icon: Sparkles, onClick: () => handleGenField('content_html'), disabled: generatingFields['content_html'] || !product.approval_status?.outline_approved || product.approval_status?.article_approved },
              { label: 'Cấu hình prompt', icon: Settings, onClick: () => setPromptWorkflowDialog('wf3_writing') },
            ]}
          />

          <div className="mb-5 bg-white rounded-xl !rounded-t-none border !border-t-0 border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">

            <RichTextEditor
              value={product.content_html || ''}
              onChange={(value) => updateProductField(product.id, 'content_html', value)}
              placeholder="Nhập nội dung bài viết hoặc bấm Viết bài AI..."
            />
          </div>
          </div>

          {/* Section 8: Đặc điểm nổi bật */}
          <div id="section-highlights">
          <SectionHeaderCard
            className="!rounded-b-none"
            icon={Sparkles}
            title="Đặc điểm nổi bật"
            approval={{
              state: product.approval_status?.highlights_approved ? 'approved' : 'pending',
              onToggle: () => {
                const nextStatus = { ...product.approval_status };
                nextStatus.highlights_approved = !nextStatus.highlights_approved;
                updateProductField(product.id, 'approval_status', nextStatus);
                if (nextStatus.highlights_approved) toast('Duyệt Đặc điểm nổi bật thành công!', 'success');
              },
            }}
            ai={{
              label: specsAiStatusMeta?.label || 'AI gen xong',
              agentId: 'highlights_agent#417',
              isGenerating: generatingFields['dac_diem_noi_bat'],
            }}
            secondaryAction={saveSectionAction}
            primaryAction={publishToPimAction}
            toolbarLeft={[
              { label: 'Gen đặc điểm nổi bật', icon: Sparkles, onClick: () => handleGenField('dac_diem_noi_bat'), disabled: generatingFields['dac_diem_noi_bat'] || product.approval_status?.highlights_approved },
            ]}
          />

          <div className="mb-5 bg-white rounded-xl !rounded-t-none border !border-t-0 border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <PromptConfigDialog
              open={!!showPrompts['wf4_highlights']}
              onClose={() => setShowPrompts(prev => ({ ...prev, wf4_highlights: false }))}
              workflowType="wf4_highlights"
              activeCategory={product.active_prompt_category || product.nganh_hang}
              selectedSubCategoryId={product.selected_sub_categories?.['wf4_highlights'] || ''}
              selectedOptionId={product.selected_prompt_options?.['wf4_highlights'] || ''}
              bonusPrompt={product.bonus_prompts?.['wf4_highlights'] || ''}
              feedbackPrompt={product.feedback_prompts?.['wf4_highlights'] || ''}
              onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
              onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf4_highlights: sub })}
              onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf4_highlights: opt })}
              onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf4_highlights: val })}
              onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf4_highlights: val })}
            />

            <RichTextEditor
              value={highlightsHtml}
              onChange={handleUpdateHighlights}
              placeholder="Nhập các đặc điểm nổi bật hoặc bấm Gen đặc điểm nổi bật..."
            />
          </div>
          </div>

          {/* Section 9: Hình ảnh gắn vào bài viết */}
          <div id="section-article-images">
          <SectionHeaderCard
            className="!rounded-b-none"
            icon={Image}
            title="Hình ảnh gắn vào bài viết"
            approval={{
              state: product.approval_status?.final_approved ? 'approved' : 'pending',
              onToggle: () => {
                const nextStatus = { ...product.approval_status };
                nextStatus.final_approved = !nextStatus.final_approved;
                updateProductField(product.id, 'approval_status', nextStatus);
                if (nextStatus.final_approved) toast('Duyệt Bài Viết Hoàn Chỉnh thành công!', 'success');
              },
            }}
            ai={{
              label: specsAiStatusMeta?.label || 'AI gen xong',
              agentId: 'image_agent#901',
              isGenerating: generatingArticleImages,
            }}
            secondaryAction={saveSectionAction}
            primaryAction={publishToPimAction}
            toolbarLeft={[
              { label: 'Gen ảnh bài viết', icon: Sparkles, onClick: handleGenArticleImages, disabled: generatingArticleImages || !product.approval_status?.slider_approved || product.approval_status?.final_approved },
              { label: 'Cấu hình prompt', icon: Settings, onClick: () => setPromptWorkflowDialog('wf4_article_images') },
              { label: 'Chèn ảnh vào bài viết', icon: ImagePlus, onClick: handleInsertArticleImages, disabled: generatingArticleImages },
            ]}
          />

          <div className="mb-5 bg-white rounded-xl !rounded-t-none border !border-t-0 border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">

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
                      const fileName = getArticleImageFileName(img, index)
                      const isSelected = selectedArticleImageId === img.id
                      const isEditingName = editingArticleFileId === img.id
                      const feedbackValue = articleFeedbackDrafts[img.id] || ''
                      const hasFeedback = feedbackValue.trim().length > 0
                      const errorMessage = articleImageErrors[img.id]

                      return (
                        <div
                          key={img.id}
                          onClick={() => setSelectedArticleImageId(img.id)}
                          className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white text-left shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-cyan-300 ring-[3px] ring-cyan-200/70'
                              : errorMessage
                                ? 'border-red-200'
                                : 'border-gray-200'
                          }`}
                        >
                          <div className="relative h-[150px] overflow-hidden bg-gray-100">
                            <img src={img.url} alt={computedLabel} className="h-full w-full object-cover" />

                            <span className="absolute bottom-3 left-3 rounded-md bg-gray-900/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white backdrop-blur-sm">
                              Vị trí · H3 #{index + 1}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveArticleImage(img.id)
                              }}
                              className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-[#DC4C4C] opacity-100 shadow-sm transition-all hover:bg-white md:opacity-0 md:group-hover:opacity-100"
                              title="Xóa ảnh này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="flex flex-1 flex-col gap-2.5 px-3.5 pb-3.5 pt-3">
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
                                Tên file
                              </label>
                              {isEditingName ? (
                                <div className="flex h-8 items-center rounded-lg border border-cyan-300 bg-white px-2 focus-within:ring-2 focus-within:ring-cyan-200">
                                  <Image size={14} className="mr-2 shrink-0 text-gray-400" />
                                  <input
                                    autoFocus
                                    value={articleFileDrafts[img.id] || ''}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setArticleFileDrafts((prev) => ({ ...prev, [img.id]: e.target.value }))}
                                    onBlur={() => saveArticleImageFileName(img, index)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveArticleImageFileName(img, index)
                                      if (e.key === 'Escape') cancelRenameArticleImage(img.id)
                                    }}
                                    className="min-w-0 flex-1 bg-transparent font-mono text-[11.5px] text-gray-700 outline-none"
                                    aria-label={`Đổi tên file ảnh H3 ${index + 1}`}
                                  />
                                  <span className="ml-1 shrink-0 font-mono text-[11.5px] text-gray-400">
                                    {getImageExtension(fileName)}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    beginRenameArticleImage(img, index)
                                  }}
                                  className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-gray-50 px-2 text-left font-mono text-[11.5px] text-gray-600 transition-colors hover:border-cyan-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                                  title={fileName}
                                >
                                  <Image size={14} className="mr-2 shrink-0 text-gray-400" />
                                  <span className="min-w-0 flex-1 truncate">{truncateMiddle(fileName)}</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
                                File ALT
                              </label>
                              <input
                                value={articleAltDrafts[img.id] ?? img.label ?? computedLabel}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setArticleAltDrafts((prev) => ({ ...prev, [img.id]: e.target.value }))}
                                onBlur={() => saveArticleImageAlt(img, index)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveArticleImageAlt(img, index)
                                }}
                                placeholder="Nhập nội dung alt ảnh..."
                                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-[12px] text-gray-700 outline-none transition-colors focus:border-cyan-300 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                                aria-label={`ALT ảnh H3 ${index + 1}`}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#C2660A]">
                                Feedback cho AI
                              </label>
                              <div className={`flex h-[34px] items-center rounded-lg border px-2 transition-colors ${
                                hasFeedback ? 'border-[#E9A23B] bg-[#FFF6E6]' : 'border-[#F0D9AE] bg-[#FFFAF1]'
                              }`}>
                                <input
                                  value={feedbackValue}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setArticleFeedbackDrafts((prev) => ({ ...prev, [img.id]: e.target.value }))}
                                  placeholder="Nhập feedback để gen lại ảnh..."
                                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#8A5A16] placeholder:text-[#B9853A] outline-none"
                                  aria-label={`Feedback cho ảnh H3 ${index + 1}`}
                                />
                              </div>
                              {errorMessage && (
                                <p className="text-[11px] font-medium text-red-500">{errorMessage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-end border-t border-gray-100 pt-4">
                    <Button
                      size="sm"
                      onClick={handleSaveAllArticleImageFeedback}
                      disabled={!hasArticleFeedbackChanges}
                      className="bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300"
                    >
                      <Save size={14} className="mr-1.5" />
                      Lưu feedback
                    </Button>
                  </div>
                </div>
              )
            })()}
          </div>
          </div>

          {/* Section 11: SEO Meta */}
          {SHOW_SEO_SECTION && (
          <div id="section-seo">
          <SectionHeaderCard
            className="!rounded-b-none"
            icon={Globe}
            title="Cấu hình SEO Meta"
            approval={{
              state: product.approval_status?.seo_meta_approved ? 'approved' : 'pending',
              onToggle: () => {
                const nextStatus = { ...product.approval_status };
                nextStatus.seo_meta_approved = !nextStatus.seo_meta_approved;
                updateProductField(product.id, 'approval_status', nextStatus);
                if (nextStatus.seo_meta_approved) toast('Duyệt SEO Meta thành công!', 'success');
              },
            }}
            ai={{
              label: specsAiStatusMeta?.label || 'AI gen xong',
              agentId: 'seo_agent#501',
              isGenerating: generatingFields['meta_seo'],
            }}
            secondaryAction={saveSectionAction}
            primaryAction={publishToPimAction}
            toolbarLeft={[
              { label: 'Gen SEO meta (AI)', icon: Sparkles, onClick: () => handleGenField('meta_seo'), disabled: generatingFields['meta_seo'] },
              { label: 'Cấu hình prompt', icon: Settings, onClick: () => setShowPrompts(prev => ({ ...prev, wf5_seo: true })) },
            ]}
          />

          <div className="mb-5 bg-white rounded-xl !rounded-t-none border !border-t-0 border-gray-100 p-5 shadow-sm transition-all hover:shadow-md">
            <PromptConfigDialog
              open={!!showPrompts['wf5_seo']}
              onClose={() => setShowPrompts(prev => ({ ...prev, wf5_seo: false }))}
              workflowType="wf5_seo"
              activeCategory={product.active_prompt_category || product.nganh_hang}
              selectedSubCategoryId={product.selected_sub_categories?.['wf5_seo'] || ''}
              selectedOptionId={product.selected_prompt_options?.['wf5_seo'] || ''}
              bonusPrompt={product.bonus_prompts?.['wf5_seo'] || ''}
              feedbackPrompt={product.feedback_prompts?.['wf5_seo'] || ''}
              onCategoryChange={(cat) => updateProductField(product.id, 'active_prompt_category', cat)}
              onSubCategoryChange={(sub) => updateProductField(product.id, 'selected_sub_categories', { ...(product.selected_sub_categories || {}), wf5_seo: sub })}
              onOptionChange={(opt) => updateProductField(product.id, 'selected_prompt_options', { ...(product.selected_prompt_options || {}), wf5_seo: opt })}
              onBonusPromptChange={(val) => updateProductField(product.id, 'bonus_prompts', { ...(product.bonus_prompts || {}), wf5_seo: val })}
              onFeedbackPromptChange={(val) => updateProductField(product.id, 'feedback_prompts', { ...(product.feedback_prompts || {}), wf5_seo: val })}
            />

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
          )}
        </div>
        </div>

        {/* Tab 2: Specs Reference Files */}
        {mainTab === 'specs' && (
          <div className="max-w-4xl mx-auto w-full">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Link size={15} className="text-cyan-600" />
                  Tài liệu & Links tham khảo
                </h3>
                <p className="mt-1 text-xs text-gray-500">Liên kết tài liệu gốc để phục vụ việc trích xuất và tra cứu dữ liệu.</p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1">
                    <span className="mb-1 block text-[11px] font-semibold text-gray-700">Nhóm tài liệu</span>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as 'product_image' | 'manufacturer_spec' | 'other')}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="product_image">Ảnh sản phẩm</option>
                      <option value="manufacturer_spec">File tài liệu TSKT</option>
                      <option value="other">Khác</option>
                    </select>
                  </label>

                  <div className="flex-1">
                    <span className="mb-1 block text-[11px] font-semibold text-gray-700">Hình thức</span>
                    <div className="inline-flex rounded-lg bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() => setReferenceInputMode('file')}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${referenceInputMode === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        <Upload size={13} /> Tải file
                      </button>
                      <button
                        type="button"
                        onClick={() => setReferenceInputMode('url')}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${referenceInputMode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        <Link size={13} /> Nhập URL
                      </button>
                    </div>
                  </div>
                </div>

                {referenceInputMode === 'file' ? (
                  <label className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center transition-colors hover:border-cyan-300 hover:bg-cyan-50/40">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, uploadCategory)}
                      className="hidden"
                      accept={uploadCategory === 'product_image' ? '.png,.jpg,.jpeg' : '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'}
                    />
                    <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                      {uploadCategory === 'product_image' ? <Image size={19} /> : <FileText size={19} />}
                    </span>
                    <span className="text-xs font-bold text-gray-900">Kéo thả hoặc chọn file để tải lên</span>
                    <span className="mt-1 text-[11px] text-gray-400">PNG, JPG - tối đa 20MB/file, chọn được nhiều file</span>
                  </label>
                ) : (
                  <div className="grid gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-4 sm:grid-cols-[1fr_2fr]">
                    <input
                      type="text"
                      value={referenceUrlLabelDraft}
                      onChange={(e) => setReferenceUrlLabelDraft(e.target.value)}
                      placeholder="Tên link"
                      className="h-10 rounded-lg border border-gray-200 px-3 text-xs outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                    <input
                      type="url"
                      value={referenceUrlDraft}
                      onChange={(e) => setReferenceUrlDraft(e.target.value)}
                      placeholder="https://..."
                      className="h-10 rounded-lg border border-gray-200 px-3 text-xs outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>
                )}

                {pendingSpecFiles.length > 0 && referenceInputMode === 'file' && (
                  <div className="mt-3 space-y-2">
                    {pendingSpecFiles.map((item, index) => (
                      <div key={`${item.file.name}-${item.file.size}-${index}`} className="flex items-center justify-between rounded-lg border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <File size={14} className="shrink-0 text-cyan-600" />
                          <span className="truncate font-semibold text-gray-700">{item.file.name}</span>
                          <span className="shrink-0 text-[10px] text-gray-400">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        <button type="button" onClick={() => setPendingSpecFiles(prev => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={referenceInputMode === 'file' ? pendingSpecFiles.length === 0 : !referenceUrlDraft.trim()}
                    onClick={handleAddReferenceToList}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                    <Plus size={14} />
                    Thêm vào danh sách
                  </button>
                </div>
              </div>

              {(() => {
                const productImageFiles = (product.specs_files || []).filter(file => file.file_type === 'product_image')
                const specFiles = (product.specs_files || []).filter(file => file.file_type !== 'product_image')
                const referenceLinks = extraLinks.filter(link => link.url.trim())
                const totalItems = productImageFiles.length + specFiles.length + referenceLinks.length
                const activeGroups = [
                  productImageFiles.length > 0,
                  specFiles.length > 0,
                  referenceLinks.length > 0
                ].filter(Boolean).length

                const groupHeaderClass = 'flex items-center justify-between py-2 text-xs font-bold text-gray-700'
                const countClass = 'ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500'
                const rowClass = 'flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-[0_1px_1px_rgba(16,24,40,.02)]'

                return (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900">Tài liệu đính kèm</h4>
                      <span className="text-xs font-medium text-gray-500">{totalItems} mục · {activeGroups} nhóm</span>
                    </div>

                    <div className="space-y-2">
                      <section>
                        <div className={groupHeaderClass}>
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-cyan-50 text-cyan-600"><Image size={13} /></span>
                            Ảnh sản phẩm <span className={countClass}>{productImageFiles.length}</span>
                          </span>
                          <button type="button" className="text-gray-400"><ChevronDown size={14} /></button>
                        </div>
                        <div className="space-y-2">
                          {productImageFiles.map((file, index) => (
                            <div key={file.id} className={rowClass}>
                              <div className="flex min-w-0 items-center gap-3">
                                <div className={`h-9 w-9 shrink-0 rounded-lg ${index % 2 === 0 ? 'bg-gradient-to-br from-cyan-400 to-blue-700' : 'bg-gradient-to-br from-amber-300 to-orange-600'}`} />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-gray-800">{file.name}</p>
                                  <p className="text-[10px] text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB · {formatDateTime(file.uploaded_at)}</p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-gray-400">
                                <button type="button" className="hover:text-cyan-600" title="Xem trước"><Info size={13} /></button>
                                <button type="button" onClick={() => setFileToDelete(file.id)} className="hover:text-red-500" title="Xóa"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <div className={groupHeaderClass}>
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><FileText size={13} /></span>
                            File tài liệu TSKT <span className={countClass}>{specFiles.length}</span>
                          </span>
                          <button type="button" className="text-gray-400"><ChevronDown size={14} /></button>
                        </div>
                        <div className="space-y-2">
                          {specFiles.map((file) => (
                            <div key={file.id} className={rowClass}>
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><FileText size={16} /></span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-gray-800">{file.name}</p>
                                  <p className="text-[10px] text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB · {formatDateTime(file.uploaded_at)}</p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-gray-400">
                                <button type="button" className="hover:text-cyan-600" title="Tải xuống"><Upload size={13} /></button>
                                <button type="button" onClick={() => setFileToDelete(file.id)} className="hover:text-red-500" title="Xóa"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <div className={groupHeaderClass}>
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600"><Link size={13} /></span>
                            Link tài liệu hãng <span className={countClass}>{referenceLinks.length}</span>
                          </span>
                          <button type="button" className="text-gray-400"><ChevronDown size={14} /></button>
                        </div>
                        <div className="space-y-2">
                          {referenceLinks.map((link) => (
                            <div key={link.id} className={rowClass}>
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Link size={15} /></span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-gray-800">{link.label || 'Trang sản phẩm'}</p>
                                  <a href={link.url} target="_blank" rel="noreferrer" className="block truncate text-[10px] font-medium text-blue-500 hover:underline">{link.url}</a>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 text-gray-400">
                                <a href={link.url} target="_blank" rel="noreferrer" className="hover:text-cyan-600" title="Mở link"><ExternalLink size={13} /></a>
                                <button type="button" onClick={() => setExtraLinks(prev => prev.filter(item => item.id !== link.id))} className="hover:text-red-500" title="Xóa"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {totalItems === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-xs font-medium text-gray-400">
                          Chưa có tài liệu hoặc link tham khảo.
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
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
