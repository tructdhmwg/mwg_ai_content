import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { usePromptStore } from '../../store/promptStore'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'
import { SITE_META, type SiteId, type PromptCategoryLevel1, type PromptOption } from '../../types'
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Edit,
  Lock,
  Minus,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const WORKFLOWS = [
  { key: 'wf1_specs', label: 'S1 – Thông số kỹ thuật', shortLabel: 'S1' },
  { key: 'wf2_outline', label: 'S2 – Outline bài viết', shortLabel: 'S2' },
  { key: 'wf3_writing', label: 'S3 – Tạo bài viết sản phẩm', shortLabel: 'S3' },
  { key: 'wf4_article_images', label: 'S4 – Tạo ảnh (Bài viết - Slider)', shortLabel: 'S4' },
] as const

const LEGACY_WORKFLOW_FALLBACK: Record<string, string> = {
  wf5_seo: 'wf4_article_images',
}

const PAGE_SIZE = 5

type WorkflowKey = typeof WORKFLOWS[number]['key']
type ModalMode = 'create' | 'edit'
type PromptRecord = {
  subCategoryId: string
  subCategoryName: string
  workflowType: string
  option: PromptOption
  isLegacyWorkflow: boolean
}
type CategoryPanelMode = 'create_cat' | 'edit_cat' | null

const getInitialWorkflow = (tab: string | null): WorkflowKey => {
  const found = WORKFLOWS.find(workflow => workflow.key === tab || workflow.shortLabel.toLowerCase() === tab?.toLowerCase())
  return found?.key || 'wf1_specs'
}

const getPromptLabel = (option: PromptOption, categoryName: string) => {
  if (option.prompt_label?.trim()) return option.prompt_label.trim()
  const prefix = `${categoryName} - `
  return option.name.startsWith(prefix) ? option.name.slice(prefix.length).trim() : option.name.trim()
}

const formatUpdatedAt = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const findCategoryById = (cats: PromptCategoryLevel1[], id: string): PromptCategoryLevel1 | undefined => {
  for (const category of cats) {
    if (category.id === id) return category
    if (category.children) {
      const found = findCategoryById(category.children, id)
      if (found) return found
    }
  }
  return undefined
}

export function PromptConfigPage() {
  const store = usePromptStore()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUserName = user?.name || 'Nguyễn Văn Admin'

  const [activeSite, setActiveSite] = useState<SiteId>('tgdd')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey>(() => getInitialWorkflow(searchParams.get('tab')))
  const [searchByWorkflow, setSearchByWorkflow] = useState<Record<string, string>>({})
  const [debouncedSearchByWorkflow, setDebouncedSearchByWorkflow] = useState<Record<string, string>>({})
  const [pageByWorkflow, setPageByWorkflow] = useState<Record<string, number>>({})
  const [highlightedOptionId, setHighlightedOptionId] = useState<string | null>(null)

  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)
  const [categoryPanelMode, setCategoryPanelMode] = useState<CategoryPanelMode>(null)
  const [targetCatId, setTargetCatId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingRecord, setEditingRecord] = useState<PromptRecord | null>(null)
  const [promptLabel, setPromptLabel] = useState('')
  const [promptText, setPromptText] = useState('')
  const [promptIsActive, setPromptIsActive] = useState(true)
  const [hasTypedInModal, setHasTypedInModal] = useState(false)

  const addPromptButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(store.categories.map(c => c.id)))

  const closePromptModal = useCallback(() => {
    if (hasTypedInModal && !confirm('Bạn có thay đổi chưa lưu. Đóng modal?')) return
    setModalOpen(false)
  }, [hasTypedInModal])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchByWorkflow(prev => ({
        ...prev,
        [activeWorkflow]: searchByWorkflow[activeWorkflow] || '',
      }))
      setPageByWorkflow(prev => ({ ...prev, [activeWorkflow]: 1 }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [activeWorkflow, searchByWorkflow])

  useEffect(() => {
    if (!modalOpen) return

    const previousActiveElement = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => labelInputRef.current?.focus(), 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePromptModal()
        return
      }

      if (event.key !== 'Tab' || !modalRef.current) return
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )

      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousActiveElement?.focus()
    }
  }, [closePromptModal, modalOpen])

  useEffect(() => {
    if (!highlightedOptionId) return
    const timer = window.setTimeout(() => setHighlightedOptionId(null), 1800)
    return () => window.clearTimeout(timer)
  }, [highlightedOptionId])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const siteCategories = useMemo(() => {
    return store.categories.filter(category => category.site_id === activeSite)
  }, [store.categories, activeSite])

  const activeCategory = useMemo(() => {
    if (!activeCategoryId && siteCategories.length > 0) return siteCategories[0]
    return (activeCategoryId && findCategoryById(siteCategories, activeCategoryId)) || siteCategories[0]
  }, [siteCategories, activeCategoryId])

  const activeWorkflowMeta = WORKFLOWS.find(workflow => workflow.key === activeWorkflow) || WORKFLOWS[0]
  const promptTextLabel = activeWorkflow === 'wf2_outline'
    ? 'Prompt outline'
    : activeWorkflow === 'wf3_writing'
      ? 'Prompt viết bài'
      : activeWorkflow === 'wf4_article_images'
        ? 'Prompt tạo ảnh'
        : 'Text prompt'
  const promptTextPlaceholder = activeWorkflow === 'wf2_outline'
    ? 'Nhập prompt dùng để tạo dàn bài (outline)...'
    : activeWorkflow === 'wf3_writing'
      ? 'Nhập prompt dùng để viết bài sản phẩm...'
      : activeWorkflow === 'wf4_article_images'
        ? 'Nhập prompt dùng để tạo ảnh bài viết và slider...'
        : 'Nhập nội dung prompt...'
  const currentSearch = searchByWorkflow[activeWorkflow] || ''
  const debouncedSearch = (debouncedSearchByWorkflow[activeWorkflow] || '').trim().toLowerCase()
  const currentPage = pageByWorkflow[activeWorkflow] || 1

  const promptRecords = useMemo<PromptRecord[]>(() => {
    if (!activeCategory) return []

    return activeCategory.sub_categories.flatMap(subCategory => {
      const mappedWorkflow = LEGACY_WORKFLOW_FALLBACK[subCategory.workflow_type] || subCategory.workflow_type
      if (mappedWorkflow !== activeWorkflow) return []

      return subCategory.options.map(option => ({
        subCategoryId: subCategory.id,
        subCategoryName: subCategory.name,
        workflowType: subCategory.workflow_type,
        option,
        isLegacyWorkflow: subCategory.workflow_type !== activeWorkflow,
      }))
    })
  }, [activeCategory, activeWorkflow])

  const filteredRecords = useMemo(() => {
    if (!activeCategory || !debouncedSearch) return promptRecords

    return promptRecords.filter(record => {
      const label = getPromptLabel(record.option, activeCategory.name).toLowerCase()
      return record.option.name.toLowerCase().includes(debouncedSearch) || label.includes(debouncedSearch)
    })
  }, [activeCategory, debouncedSearch, promptRecords])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedRecords = filteredRecords.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE)

  const generatedPromptName = activeCategory ? `${activeCategory.name} - ${promptLabel.trim() || '...'}` : ''
  const trimmedPromptLabel = promptLabel.trim()
  const duplicateLabel = useMemo(() => {
    if (!activeCategory || !trimmedPromptLabel) return false
    return promptRecords.some(record => {
      if (modalMode === 'edit' && record.option.id === editingRecord?.option.id) return false
      return getPromptLabel(record.option, activeCategory.name).toLowerCase() === trimmedPromptLabel.toLowerCase()
    })
  }, [activeCategory, editingRecord, modalMode, promptRecords, trimmedPromptLabel])

  const setWorkflowPage = (page: number) => {
    setPageByWorkflow(prev => ({ ...prev, [activeWorkflow]: page }))
  }

  const openCategoryPanel = (mode: CategoryPanelMode, catId?: string) => {
    setCategoryPanelMode(mode)
    setTargetCatId(catId || null)
    setCategoryName('')

    if (mode === 'edit_cat' && catId) {
      const category = store.categories.find(item => item.id === catId)
      if (category) setCategoryName(category.name)
    }

    setCategoryPanelOpen(true)
  }

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      toast('Vui lòng nhập tên ngành hàng', 'error')
      return
    }

    if (categoryPanelMode === 'create_cat') {
      store.addCategory({ name: categoryName.trim(), site_id: activeSite })
      toast('Tạo ngành hàng thành công', 'success')
    } else if (categoryPanelMode === 'edit_cat' && targetCatId) {
      store.updateCategory(targetCatId, { name: categoryName.trim() })
      toast('Cập nhật ngành hàng thành công', 'success')
    }

    setCategoryPanelOpen(false)
  }

  const handleDeleteCategory = (catId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa? Thao tác này không thể hoàn tác.')) return
    store.deleteCategory(catId)
    toast('Đã xóa ngành hàng', 'warning')
  }

  const openCreatePromptModal = () => {
    setModalMode('create')
    setEditingRecord(null)
    setPromptLabel('')
    setPromptText('')
    setPromptIsActive(true)
    setHasTypedInModal(false)
    setModalOpen(true)
  }

  const openEditPromptModal = (record: PromptRecord) => {
    if (!activeCategory) return
    setModalMode('edit')
    setEditingRecord(record)
    setPromptLabel(record.option.prompt_label || '')
    setPromptText(activeWorkflow === 'wf2_outline' ? (record.option.outline_prompt_content || record.option.template_content || '') : (record.option.template_content || ''))
    setPromptIsActive(record.option.is_active)
    setHasTypedInModal(false)
    setModalOpen(true)
  }

  const handleLabelChange = (value: string) => {
    setHasTypedInModal(true)
    setPromptLabel(value.replace(/\r?\n/g, ' '))
  }

  const handlePromptTextChange = (value: string) => {
    setHasTypedInModal(true)
    setPromptText(value)
  }

  const handleWorkflowChange = (workflow: WorkflowKey) => {
    setActiveWorkflow(workflow)
    const params = new URLSearchParams(searchParams)
    params.set('tab', workflow)
    setSearchParams(params, { replace: true })
  }

  const ensureWorkflowSubCategory = () => {
    if (!activeCategory) return null
    const existing = activeCategory.sub_categories.find(subCategory => subCategory.workflow_type === activeWorkflow)
    if (existing) return existing.id

    const subCategoryName = `${activeWorkflowMeta.label} prompt`
    const subCategoryId = `sub-${Date.now()}`
    store.addSubCategory(activeCategory.id, { id: subCategoryId, name: subCategoryName, workflow_type: activeWorkflow })
    return subCategoryId
  }

  const handleSavePrompt = () => {
    if (!activeCategory || !trimmedPromptLabel || duplicateLabel) return

    const nextName = `${activeCategory.name} - ${trimmedPromptLabel}`
    if (modalMode === 'create') {
      const subCategoryId = ensureWorkflowSubCategory()
      if (!subCategoryId) return

      const newOptionId = `opt-${Date.now()}`
      store.addOption(activeCategory.id, subCategoryId, {
        id: newOptionId,
        name: nextName,
        prompt_label: trimmedPromptLabel,
        image_analysis_prompt: undefined,
        outline_prompt_content: undefined,
        template_content: promptText,
        is_active: promptIsActive,
        model: 'gpt-4o',
      }, currentUserName)
      setHighlightedOptionId(newOptionId)
      toast('Tạo prompt thành công', 'success')
    } else if (editingRecord) {
      store.updateOption(activeCategory.id, editingRecord.subCategoryId, editingRecord.option.id, {
        name: nextName,
        prompt_label: trimmedPromptLabel,
        image_analysis_prompt: undefined,
        outline_prompt_content: undefined,
        template_content: promptText,
        is_active: promptIsActive,
      }, currentUserName)
      setHighlightedOptionId(editingRecord.option.id)
      toast('Cập nhật prompt thành công', 'success')
    }

    setHasTypedInModal(false)
    setModalOpen(false)
  }

  const handleTogglePrompt = (record: PromptRecord) => {
    if (!activeCategory) return
    const nextActive = !record.option.is_active
    try {
      store.updateOption(activeCategory.id, record.subCategoryId, record.option.id, { is_active: nextActive }, currentUserName)
      toast(nextActive ? 'Đã bật prompt' : 'Đã tắt prompt', 'success')
    } catch {
      store.updateOption(activeCategory.id, record.subCategoryId, record.option.id, { is_active: record.option.is_active }, currentUserName)
      toast('Không thể cập nhật trạng thái prompt', 'error')
    }
  }

  const handleDeletePrompt = (record: PromptRecord) => {
    if (!activeCategory) return
    if (!confirm('Bạn có chắc chắn muốn xóa prompt này?')) return
    store.deleteOption(activeCategory.id, record.subCategoryId, record.option.id)
    toast('Đã xóa prompt', 'warning')
  }

  const renderToggle = (checked: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2',
        checked ? 'bg-green-600' : 'bg-gray-300',
      )}
    >
      <span className={cn('h-5 w-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )

  const renderCategoryNode = (cat: PromptCategoryLevel1, isTopLevel: boolean) => {
    const hasChildren = !!cat.children && cat.children.length > 0
    const isExpanded = expandedIds.has(cat.id)
    const isActive = activeCategory?.id === cat.id

    return (
      <div key={cat.id}>
        <div
          onClick={() => (hasChildren ? toggleExpand(cat.id) : setActiveCategoryId(cat.id))}
          className="group relative flex items-center gap-1.5 py-1 pl-4 cursor-pointer"
        >
          <span className={cn('absolute left-0 top-1/2 h-px bg-gray-200', hasChildren ? 'w-[23px]' : 'w-4')} />
          {hasChildren && (
            <span className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border border-gray-300 bg-white text-gray-400">
              {isExpanded ? <Minus size={9} /> : <Plus size={9} />}
            </span>
          )}
          <span className={cn('truncate pr-1', isActive ? 'font-semibold text-blue-700' : 'text-gray-600 group-hover:text-gray-900')}>
            {cat.name}
          </span>
          {isTopLevel && (
            <div className="ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={(event) => { event.stopPropagation(); openCategoryPanel('edit_cat', cat.id) }} className="p-1 text-gray-400 hover:text-blue-600" aria-label={`Sửa ${cat.name}`}>
                <Edit size={12} />
              </button>
              <button onClick={(event) => { event.stopPropagation(); handleDeleteCategory(cat.id) }} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Xóa ${cat.name}`}>
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="-mt-1 ml-[23px] border-l border-gray-200 pt-1">
            {cat.children!.map(child => renderCategoryNode(child, false))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Cấu hình', 'Hệ quản trị Prompt']}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Hệ quản trị Prompt Đa Cấp
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Thiết lập prompt theo site, ngành hàng và từng bước workflow.
          </p>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-200px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1.5 border-b border-gray-100 bg-gray-50/50 p-4">
          {(Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]).map(([siteId, meta]) => {
            const isActive = activeSite === siteId
            return (
              <button
                key={siteId}
                onClick={() => {
                  setActiveSite(siteId)
                  setActiveCategoryId(null)
                }}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all',
                  isActive ? 'scale-102 border-gray-200 bg-white font-bold text-gray-900 shadow-sm' : 'border-transparent bg-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600',
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', siteId === 'tgdd' ? 'bg-yellow-500' : siteId === 'dmx' ? 'bg-blue-500' : 'bg-green-500')} />
                {meta.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/30 p-4">
            {siteCategories.length === 0 && <p className="text-xs text-gray-400">Chưa có ngành hàng nào</p>}

            {siteCategories.length > 0 && (
              <div className="text-sm">
                <div className="flex items-center gap-1.5 py-1 font-semibold text-gray-700">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border border-gray-300 text-gray-400">
                    <Minus size={9} />
                  </span>
                  <Database size={13} className="shrink-0 text-gray-400" />
                  <span className="truncate">{SITE_META[activeSite].label}</span>
                </div>

                <div className="ml-[7px] border-l border-gray-200">
                  {siteCategories.map(category => renderCategoryNode(category, true))}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-gray-50/40 p-4 sm:p-6">
            {!activeCategory ? (
              <div className="flex flex-1 items-center justify-center text-gray-400">Vui lòng chọn hoặc tạo Ngành hàng</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="px-6 pb-4 pt-5">
                  <h2 className="text-[17px] font-semibold leading-6 text-gray-900">Khai báo Prompt System</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Ngành hàng: <span className="font-semibold text-gray-900">{activeCategory.name}</span> · Quản lý prompt theo từng bước workflow
                  </p>
                </div>

                <div className="flex gap-2 overflow-x-auto border-b border-gray-200 px-6">
                  {WORKFLOWS.map(workflow => (
                    <button
                      key={workflow.key}
                      onClick={() => handleWorkflowChange(workflow.key)}
                      className={cn(
                        'shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors',
                        activeWorkflow === workflow.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800',
                      )}
                    >
                      {workflow.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-[340px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={currentSearch}
                      onChange={(event) => setSearchByWorkflow(prev => ({ ...prev, [activeWorkflow]: event.target.value }))}
                      placeholder="Tìm kiếm prompt theo tên hoặc label..."
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>
                  <Button
                    ref={addPromptButtonRef}
                    onClick={openCreatePromptModal}
                    className="h-10 justify-center rounded-lg bg-gray-900 px-4 text-white hover:bg-gray-800"
                  >
                    <Plus size={18} />
                    Thêm prompt
                  </Button>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                      <Sparkles className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">Chưa có prompt nào trong {activeWorkflowMeta.label}</p>
                    <p className="mt-1 text-sm text-gray-500">Tạo prompt đầu tiên cho ngành hàng {activeCategory.name}.</p>
                    <Button onClick={openCreatePromptModal} className="mt-5 rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                      <Plus size={18} />
                      Thêm prompt
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full table-fixed">
                        <thead className="bg-gray-50">
                          <tr className="border-b border-gray-200 text-left text-[11.5px] font-bold uppercase tracking-wide text-gray-500">
                            <th className="w-[36%] px-6 py-3">Tên prompt</th>
                            <th className="w-[16%] px-6 py-3">Prompt label</th>
                            <th className="w-[16%] px-6 py-3">Kích hoạt</th>
                            <th className="w-[22%] px-6 py-3">Cập nhật</th>
                            <th className="w-[10%] px-6 py-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRecords.map(record => {
                            const label = getPromptLabel(record.option, activeCategory.name)
                            return (
                              <tr
                                key={record.option.id}
                                className={cn(
                                  'border-b border-gray-100 transition-colors last:border-b-0',
                                  highlightedOptionId === record.option.id ? 'bg-green-50' : 'bg-white',
                                )}
                              >
                                <td className={cn('px-6 py-5 text-[13.5px] font-medium', record.option.is_active ? 'text-gray-900' : 'text-gray-400')}>
                                  <div className="flex items-center gap-2">
                                    <span>{record.option.name}</span>
                                    {record.isLegacyWorkflow && (
                                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Workflow cũ</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <span className={cn('inline-flex max-w-full rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium', record.option.is_active ? 'text-gray-700' : 'text-gray-400')}>
                                    <span className="truncate">{label}</span>
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <div className={cn('flex items-center gap-2 text-sm', record.option.is_active ? 'text-gray-600' : 'text-gray-400')}>
                                    {renderToggle(record.option.is_active, () => handleTogglePrompt(record), `Kích hoạt ${record.option.name}`)}
                                    <span>{record.option.is_active ? 'Đang bật' : 'Đang tắt'}</span>
                                  </div>
                                </td>
                                <td className={cn('px-6 py-5 text-sm', record.option.is_active ? 'text-gray-500' : 'text-gray-400')}>
                                  <span className="font-mono">{formatUpdatedAt(record.option.updated_at)}</span>
                                  <span> · bởi {record.option.updated_by}</span>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center justify-end gap-3">
                                    <button onClick={() => openEditPromptModal(record)} className="text-gray-500 hover:text-gray-900" aria-label={`Sửa ${record.option.name}`}>
                                      <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDeletePrompt(record)} className="text-red-500 hover:text-red-600" aria-label={`Xóa ${record.option.name}`}>
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-3 p-4 md:hidden">
                      {paginatedRecords.map(record => {
                        const label = getPromptLabel(record.option, activeCategory.name)
                        return (
                          <div key={record.option.id} className={cn('rounded-lg border border-gray-200 bg-white p-4', highlightedOptionId === record.option.id && 'bg-green-50')}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className={cn('text-sm font-semibold', record.option.is_active ? 'text-gray-900' : 'text-gray-400')}>{record.option.name}</p>
                                <span className="mt-2 inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEditPromptModal(record)} className="text-gray-500" aria-label={`Sửa ${record.option.name}`}><Edit size={17} /></button>
                                <button onClick={() => handleDeletePrompt(record)} className="text-red-500" aria-label={`Xóa ${record.option.name}`}><Trash2 size={17} /></button>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="text-xs text-gray-500">
                                <span className="font-mono">{formatUpdatedAt(record.option.updated_at)}</span>
                                <span> · bởi {record.option.updated_by}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {renderToggle(record.option.is_active, () => handleTogglePrompt(record), `Kích hoạt ${record.option.name}`)}
                                {record.option.is_active ? 'Đang bật' : 'Đang tắt'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>Hiển thị {filteredRecords.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(safeCurrentPage * PAGE_SIZE, filteredRecords.length)} / {promptRecords.length} prompt trong {activeWorkflowMeta.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setWorkflowPage(Math.max(1, safeCurrentPage - 1))}
                          disabled={safeCurrentPage === 1}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Trang trước"
                        >
                          <ChevronLeft size={17} />
                        </button>
                        <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-gray-900 px-3 font-semibold text-white">{safeCurrentPage}</span>
                        <button
                          onClick={() => setWorkflowPage(Math.min(totalPages, safeCurrentPage + 1))}
                          disabled={safeCurrentPage === totalPages}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Trang sau"
                        >
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {categoryPanelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/45" onClick={() => setCategoryPanelOpen(false)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{categoryPanelMode === 'create_cat' ? 'Thêm ngành hàng' : 'Chỉnh sửa ngành hàng'}</h2>
              <button onClick={() => setCategoryPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Đóng">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-6">
              <label className="mb-1.5 block text-xs font-bold text-gray-700">Tên ngành hàng</label>
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập tên ngành hàng..."
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <Button variant="outline" size="sm" onClick={() => setCategoryPanelOpen(false)}>Hủy</Button>
              <Button size="sm" onClick={handleSaveCategory}>Lưu thay đổi</Button>
            </div>
          </div>
        </>
      )}

      {modalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gray-900/50" onClick={closePromptModal} />
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-modal-title"
            className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 id="prompt-modal-title" className="text-xl font-bold text-gray-900">
                  {modalMode === 'create' ? 'Thêm prompt mới' : 'Chỉnh sửa prompt'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Workflow: <span className="font-semibold text-gray-900">{activeWorkflowMeta.label}</span> · Ngành hàng: <span className="font-semibold text-gray-900">{activeCategory.name}</span>
                </p>
              </div>
              <button onClick={closePromptModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Đóng modal">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div>
                <label htmlFor="prompt-label" className="mb-2 block text-sm font-bold text-gray-700">
                  Prompt Label <span className="text-red-500">*</span>
                </label>
                <input
                  ref={labelInputRef}
                  id="prompt-label"
                  value={promptLabel}
                  onChange={(event) => handleLabelChange(event.target.value)}
                  placeholder="Trung cấp/ Cao cấp/..."
                  aria-invalid={duplicateLabel}
                  aria-describedby={duplicateLabel ? 'prompt-label-error' : 'prompt-label-help'}
                  className={cn(
                    'h-12 w-full rounded-lg border bg-white px-4 text-base text-gray-900 outline-none transition focus:ring-2',
                    duplicateLabel ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-300 focus:border-gray-900 focus:ring-gray-900/10',
                  )}
                />
                {duplicateLabel ? (
                  <p id="prompt-label-error" className="mt-2 text-sm text-red-600">Label này đã tồn tại trong {activeWorkflowMeta.label}</p>
                ) : (
                  <p id="prompt-label-help" className="mt-2 text-sm text-gray-400">Label phân biệt các prompt trong cùng workflow, ví dụ theo phân khúc sản phẩm.</p>
                )}
              </div>

              <div>
                <label htmlFor="prompt-name" className="mb-2 block text-sm font-bold text-gray-700">
                  Tên prompt <span className="font-normal text-gray-400">(tự động tạo)</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="prompt-name"
                    value={generatedPromptName}
                    disabled
                    className="h-12 w-full rounded-lg border border-gray-200 bg-gray-100 pl-11 pr-4 text-base font-medium text-gray-600"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Tự động ghép theo cấu trúc <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-500">Tên ngành hàng - {'{prompt_label}'}</code>, không chỉnh sửa được.
                </p>
                {modalMode === 'edit' && !editingRecord?.option.prompt_label && (
                  <p className="mt-2 text-sm text-amber-600">Prompt cũ chưa có label riêng. Nhập label để hệ thống tạo lại tên theo cấu trúc mới.</p>
                )}
              </div>

              <div>
                <label htmlFor="prompt-text" className="mb-2 block text-sm font-bold text-gray-700">
                  {promptTextLabel}
                </label>
                <textarea
                  id="prompt-text"
                  value={promptText}
                  onChange={(event) => handlePromptTextChange(event.target.value)}
                  placeholder={promptTextPlaceholder}
                  className="min-h-44 w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4">
                <div>
                  <p className="text-base font-bold text-gray-900">Kích hoạt</p>
                  <p className="mt-1 text-sm text-gray-500">Prompt đang bật sẽ được dùng khi chạy workflow {activeWorkflowMeta.shortLabel}</p>
                </div>
                {renderToggle(promptIsActive, () => { setHasTypedInModal(true); setPromptIsActive(prev => !prev) }, 'Kích hoạt prompt')}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
              <Button variant="outline" onClick={closePromptModal} className="h-10 rounded-lg px-5 text-sm">Hủy bỏ</Button>
              <Button
                onClick={handleSavePrompt}
                disabled={!trimmedPromptLabel || duplicateLabel}
                className="h-10 rounded-lg bg-gray-900 px-5 text-sm text-white hover:bg-gray-800 disabled:bg-gray-300"
              >
                <Save size={17} />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
