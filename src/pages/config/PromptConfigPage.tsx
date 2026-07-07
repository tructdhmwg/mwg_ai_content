import { useState, useMemo, useRef } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { usePromptStore } from '../../store/promptStore'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { SITE_META, type SiteId, type PromptCategoryLevel1 } from '../../types'
import {
  Trash2,
  X,
  Plus,
  Sparkles,
  Edit,
  ChevronRight,
  Database,
  Minus
} from 'lucide-react'

// Only the active workflows
const ACTIVE_WORKFLOWS: Record<string, string> = {
  wf1_specs: 'S1 – Thông Số Kỹ Thuật',
  wf2_outline: 'S2 – Dàn Bài',
  wf3_writing: 'S3 – Bài Viết Chi Tiết',
  wf5_seo: 'S4 – Tối Ưu SEO',
  wf4_article_images: 'S5 – Gen Ảnh Bài Viết',
}

const VARIABLES = [
  { name: '{{ten_san_pham}}', desc: 'Tên sản phẩm' },
  { name: '{{spec_final_json}}', desc: 'JSON thông số kỹ thuật' },
  { name: '{{outline}}', desc: 'Dàn bài viết định dạng markdown' },
  { name: '{{site_id}}', desc: 'ID của website hiện tại' },
  { name: '{{prompt_category}}', desc: 'Tên Category Prompt sản phẩm' },
]

export function PromptConfigPage() {
  const store = usePromptStore()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const currentUserName = user?.name || 'Nguyễn Văn Admin'

  // Tabs site
  const [activeSite, setActiveSite] = useState<SiteId>('tgdd')

  // Selection states
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [activeWorkflow, setActiveWorkflow] = useState<string>('wf2_outline')

  // Slide-over panel states
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'create_cat' | 'edit_cat' | 'create_sub' | 'edit_sub' | 'create_opt' | 'edit_opt' | null>(null)

  // Panel targets
  const [targetCatId, setTargetCatId] = useState<string | null>(null)
  const [targetSubId, setTargetSubId] = useState<string | null>(null)
  const [targetOptId, setTargetOptId] = useState<string | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formWorkflowType, setFormWorkflowType] = useState('wf2_outline')
  const [formTemplate, setFormTemplate] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Tree expand/collapse state — top-level categories start expanded, nested ones collapsed
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(store.categories.map(c => c.id)))

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const findCategoryById = (cats: PromptCategoryLevel1[], id: string): PromptCategoryLevel1 | undefined => {
    for (const c of cats) {
      if (c.id === id) return c
      if (c.children) {
        const found = findCategoryById(c.children, id)
        if (found) return found
      }
    }
    return undefined
  }

  const siteCategories = useMemo(() => {
    return store.categories.filter(c => c.site_id === activeSite)
  }, [store.categories, activeSite])

  const activeCategory = useMemo(() => {
    if (!activeCategoryId && siteCategories.length > 0) return siteCategories[0]
    return (activeCategoryId && findCategoryById(siteCategories, activeCategoryId)) || siteCategories[0]
  }, [siteCategories, activeCategoryId])

  const activeSubCategories = useMemo(() => {
    if (!activeCategory) return []
    return activeCategory.sub_categories.filter(s => s.workflow_type === activeWorkflow)
  }, [activeCategory, activeWorkflow])

  const openPanel = (mode: typeof panelMode, catId?: string, subId?: string, optId?: string) => {
    setPanelMode(mode)
    setTargetCatId(catId || null)
    setTargetSubId(subId || null)
    setTargetOptId(optId || null)
    setFormName('')
    setFormTemplate('')
    setFormIsActive(true)
    setFormWorkflowType(activeWorkflow)

    if (mode === 'edit_cat' && catId) {
      const cat = store.categories.find(c => c.id === catId)
      if (cat) setFormName(cat.name)
    } else if (mode === 'edit_sub' && catId && subId) {
      const cat = store.categories.find(c => c.id === catId)
      const sub = cat?.sub_categories.find(s => s.id === subId)
      if (sub) {
        setFormName(sub.name)
        setFormWorkflowType(sub.workflow_type)
      }
    } else if (mode === 'edit_opt' && catId && subId && optId) {
      const cat = store.categories.find(c => c.id === catId)
      const sub = cat?.sub_categories.find(s => s.id === subId)
      const opt = sub?.options.find(o => o.id === optId)
      if (opt) {
        setFormName(opt.name)
        setFormTemplate(opt.template_content)
      }
    }

    setIsPanelOpen(true)
  }

  const handleSave = () => {
    if (!formName.trim()) {
      toast('Vui lòng nhập tên', 'error')
      return
    }

    if (panelMode === 'create_cat') {
      store.addCategory({ name: formName, site_id: activeSite })
      toast('Tạo ngành hàng thành công', 'success')
    } else if (panelMode === 'edit_cat' && targetCatId) {
      store.updateCategory(targetCatId, { name: formName })
      toast('Cập nhật ngành hàng thành công', 'success')
    } else if (panelMode === 'create_sub' && activeCategory) {
      store.addSubCategory(activeCategory.id, { name: formName, workflow_type: formWorkflowType })
      toast('Tạo phân loại thành công', 'success')
    } else if (panelMode === 'edit_sub' && targetCatId && targetSubId) {
      store.updateSubCategory(targetCatId, targetSubId, { name: formName, workflow_type: formWorkflowType })
      toast('Cập nhật phân loại thành công', 'success')
    } else if (panelMode === 'create_opt' && activeCategory && targetSubId) {
      if (!formTemplate.trim()) {
        toast('Vui lòng nhập template', 'error')
        return
      }
      store.addOption(activeCategory.id, targetSubId, { name: formName, template_content: formTemplate, is_active: formIsActive, model: 'gpt-4o' }, currentUserName)
      toast('Tạo Option thành công', 'success')
    } else if (panelMode === 'edit_opt' && targetCatId && targetSubId && targetOptId) {
      if (!formTemplate.trim()) {
        toast('Vui lòng nhập template', 'error')
        return
      }
      store.updateOption(targetCatId, targetSubId, targetOptId, { name: formName, template_content: formTemplate, is_active: formIsActive }, currentUserName)
      toast('Cập nhật Option thành công', 'success')
    }

    setIsPanelOpen(false)
  }

  const handleDelete = (type: 'cat' | 'sub' | 'opt', catId: string, subId?: string, optId?: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa? Thao tác này không thể hoàn tác.')) return
    if (type === 'cat') store.deleteCategory(catId)
    if (type === 'sub' && subId) store.deleteSubCategory(catId, subId)
    if (type === 'opt' && subId && optId) store.deleteOption(catId, subId, optId)
    toast('Đã xóa thành công', 'warning')
  }

  // Recursively render a node in the "Ngành hàng" tree. Only top-level nodes expose
  // edit/delete controls — nested children are sample data for the tree, not wired to CRUD.
  const renderCategoryNode = (cat: PromptCategoryLevel1, isTopLevel: boolean) => {
    const hasChildren = !!cat.children && cat.children.length > 0
    const isExpanded = expandedIds.has(cat.id)
    const isActive = activeCategory?.id === cat.id

    return (
      <div key={cat.id}>
        <div
          onClick={() => (hasChildren ? toggleExpand(cat.id) : setActiveCategoryId(cat.id))}
          className="group relative flex items-center gap-1.5 pl-4 py-1 cursor-pointer"
        >
          <span className="absolute left-0 top-1/2 w-4 h-px bg-gray-200" />
          {hasChildren && (
            <span className="relative z-10 flex items-center justify-center w-3.5 h-3.5 border border-gray-300 rounded-[2px] text-gray-400 bg-white shrink-0">
              {isExpanded ? <Minus size={9} /> : <Plus size={9} />}
            </span>
          )}
          <span
            className={`truncate pr-1 ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-600 group-hover:text-gray-900'
              }`}
          >
            {cat.name}
          </span>
          {isTopLevel && (
            <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={(e) => { e.stopPropagation(); openPanel('edit_cat', cat.id) }} className="p-1 text-gray-400 hover:text-blue-600">
                <Edit size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete('cat', cat.id) }} className="p-1 text-gray-400 hover:text-red-600">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-[7px] border-l border-gray-200">
            {cat.children!.map(child => renderCategoryNode(child, false))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Cấu hình', 'Hệ quản trị Prompt']}>

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-blue-500 w-5 h-5" />
            Hệ quản trị Prompt Đa Cấp
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập kiến trúc prompt 3 cấp: Ngành hàng (Category) &gt; Phân loại sản phẩm (Sub-category) &gt; Kiểu (Option)
          </p>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-200px)]">

        {/* Site Tab Bar */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex flex-wrap gap-1.5">
          {(Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]).map(([k, v]) => {
            const isActive = activeSite === k
            return (
              <button
                key={k}
                onClick={() => {
                  setActiveSite(k)
                  setActiveCategoryId(null)
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${isActive ? 'bg-white text-gray-900 border-gray-200 shadow-sm scale-102 font-bold' : 'bg-transparent text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${k === 'tgdd' ? 'bg-yellow-500' : k === 'dmx' ? 'bg-blue-500' : 'bg-green-500'}`} />
                {v.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Level 1: Sidebar Categories */}
          <div className="w-64 border-r border-gray-100 bg-gray-50/30 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Ngành hàng (Cấp 1)</h3>
              <button onClick={() => openPanel('create_cat')} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                <Plus size={14} />
              </button>
            </div>

            {siteCategories.length === 0 && <p className="text-xs text-gray-400">Chưa có ngành hàng nào</p>}

            {siteCategories.length > 0 && (
              <div className="text-sm">
                {/* Root node: current site */}
                <div className="flex items-center gap-1.5 text-gray-700 font-semibold py-1">
                  <span className="flex items-center justify-center w-3.5 h-3.5 border border-gray-300 rounded-[2px] text-gray-400 shrink-0">
                    <Minus size={9} />
                  </span>
                  <Database size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{SITE_META[activeSite].label}</span>
                </div>

                {/* Ngành hàng tree (may include nested sample sub-groups) */}
                <div className="ml-[7px] border-l border-gray-200">
                  {siteCategories.map(cat => renderCategoryNode(cat, true))}
                </div>
              </div>
            )}
          </div>

          {/* Levels 2 & 3: Main Content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {!activeCategory ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Vui lòng chọn hoặc tạo Ngành hàng</div>
            ) : (
              <>
                {/* Workflow Tabs */}
                <div className="flex border-b border-gray-100 px-6 pt-4 gap-6 bg-white sticky top-0 z-10">
                  {(Object.entries(ACTIVE_WORKFLOWS)).map(([wf, label]) => (
                    <button
                      key={wf}
                      onClick={() => setActiveWorkflow(wf)}
                      className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeWorkflow === wf ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-800">Phân loại sản phẩm (Cấp 2)</h2>
                    <Button size="sm" onClick={() => openPanel('create_sub', activeCategory.id)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs py-1.5 h-auto">
                      <Plus size={14} className="mr-1" /> Thêm Phân loại
                    </Button>
                  </div>

                  {activeSubCategories.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-xs border-2 border-dashed border-gray-100 rounded-xl">
                      Chưa có phân loại nào cho Workflow này. Hãy tạo mới!
                    </div>
                  )}

                  <div className="space-y-6">
                    {activeSubCategories.map(sub => (
                      <div key={sub.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <ChevronRight size={16} className="text-gray-400" />
                            {sub.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openPanel('edit_sub', activeCategory.id, sub.id)} className="text-xs text-gray-500 hover:text-blue-600">Sửa</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => handleDelete('sub', activeCategory.id, sub.id)} className="text-xs text-gray-500 hover:text-red-600">Xóa</button>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50/50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Options (Cấp 3)</h4>
                            <button onClick={() => openPanel('create_opt', activeCategory.id, sub.id)} className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                              <Plus size={12} /> Thêm Option
                            </button>
                          </div>

                          {sub.options.length === 0 && <p className="text-xs text-gray-400">Chưa có option nào.</p>}

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {sub.options.map(opt => (
                              <div key={opt.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${opt.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className="font-semibold text-gray-800 text-xs">{opt.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => openPanel('edit_opt', activeCategory.id, sub.id, opt.id)} className="text-gray-400 hover:text-blue-600"><Edit size={12} /></button>
                                    <button onClick={() => handleDelete('opt', activeCategory.id, sub.id, opt.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                                <pre className="text-[10px] text-gray-600 font-mono bg-gray-50 p-2 rounded whitespace-pre-wrap line-clamp-3">
                                  {opt.template_content}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Sheet for Forms */}
      <div className={`fixed inset-0 bg-black/45 z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsPanelOpen(false)} />
      <div className={`fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">
            {panelMode?.includes('create') ? 'Thêm mới' : 'Chỉnh sửa'}
          </h2>
          <button onClick={() => setIsPanelOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Tên hiển thị</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500" placeholder="Nhập tên..." />
          </div>

          {(panelMode === 'create_sub' || panelMode === 'edit_sub') && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Thuộc Workflow</label>
              <select value={formWorkflowType} onChange={(e) => setFormWorkflowType(e.target.value)} disabled className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50">
                {Object.entries(ACTIVE_WORKFLOWS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          )}

          {(panelMode === 'create_opt' || panelMode === 'edit_opt') && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label className="text-xs font-semibold text-gray-700">Kích hoạt Option này</label>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nội dung Template</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {VARIABLES.map(v => (
                    <button key={v.name} onClick={() => {
                      const t = textareaRef.current
                      if (t) {
                        const start = t.selectionStart
                        const end = t.selectionEnd
                        setFormTemplate(formTemplate.substring(0, start) + v.name + formTemplate.substring(end))
                        setTimeout(() => { t.focus(); t.setSelectionRange(start + v.name.length, start + v.name.length) }, 0)
                      }
                    }} className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded hover:bg-yellow-100">
                      {v.name}
                    </button>
                  ))}
                </div>
                <textarea ref={textareaRef} value={formTemplate} onChange={(e) => setFormTemplate(e.target.value)} className="w-full h-80 border border-gray-200 rounded-lg p-3 text-xs font-mono focus:ring-1 focus:ring-blue-500" />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPanelOpen(false)}>Hủy</Button>
          <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">Lưu thay đổi</Button>
        </div>
      </div>

    </AppShell>
  )
}
