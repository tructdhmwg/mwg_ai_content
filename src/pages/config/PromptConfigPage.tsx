import { useState, useMemo, useRef } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { usePromptStore } from '../../store/promptStore'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { SITE_META, type SiteId, type PromptConfig } from '../../types'
import { formatDateTime } from '../../lib/utils'
import { 
  Search, 
  Trash2, 
  Copy, 
  X, 
  Plus, 
  Sparkles, 
  Clock, 
  User, 
  Database
} from 'lucide-react'

const WF_LABELS: Record<string, string> = {
  wf_name:          'S1 – Tên Sản Phẩm',
  wf_thumb:         'S2 – Ảnh Đại Diện',
  wf_video:         'S3 – Video Review',
  wf_gallery:       'S4 – Gallery Ảnh Chi Tiết',
  wf_slides:        'S5 – Slide Minh Họa',
  wf1_specs:        'S6 – Thông Số Kỹ Thuật',
  wf_highlights:    'S7 – Đặc Điểm Nổi Bật',
  wf2_outline:      'S8 – Dàn Bài',
  wf_article_images:'S9 – Ảnh Bài Viết',
  wf3_writing:      'S10 – Viết Bài Chi Tiết',
  wf5_seo:          'S11 – Tối Ưu SEO',
}

const WF_DESCS: Record<string, string> = {
  wf_name:          'Chuẩn hóa tên sản phẩm',
  wf_thumb:         'Ảnh đại diện sản phẩm (thumbnail)',
  wf_video:         'Phân tích & gắn video review',
  wf_gallery:       'Bộ ảnh chi tiết sản phẩm',
  wf_slides:        'Slide minh họa từng section H3',
  wf1_specs:        'Trích xuất thông số kỹ thuật',
  wf_highlights:    'Viết đặc điểm nổi bật',
  wf2_outline:      'Tạo dàn bài bài viết',
  wf_article_images:'Ảnh gắn vào nội dung bài viết',
  wf3_writing:      'Viết bài HTML chi tiết',
  wf5_seo:          'Tối ưu SEO & hoàn thiện meta',
}

const VARIABLES = [
  { name: '{{ten_san_pham}}', desc: 'Tên sản phẩm' },
  { name: '{{spec_final_json}}', desc: 'JSON thông số kỹ thuật' },
  { name: '{{outline}}', desc: 'Dàn bài viết định dạng markdown' },
  { name: '{{site_id}}', desc: 'ID của website hiện tại' },
  { name: '{{nganh_hang}}', desc: 'Tên ngành hàng sản phẩm' },
]

export function PromptConfigPage() {
  const { prompts, updatePrompt, addPrompt, deletePrompt } = usePromptStore()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const currentUserName = user?.name || 'Nguyễn Văn Admin'

  // Tabs site
  const [activeSite, setActiveSite] = useState<SiteId>('tgdd')
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Control Slide-over Panel
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'create' | 'edit'>('create')
  
  // Current editing prompt or form fields
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  
  // Form fields
  const [formSiteId, setFormSiteId] = useState<SiteId>('tgdd')
  const [formNganhHang, setFormNganhHang] = useState('')
  const [formWfStep, setFormWfStep] = useState<PromptConfig['wf_step']>('wf2_outline')
  const [formPromptText, setFormPromptText] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get all unique industries for the active site
  const uniqueIndustries = useMemo(() => {
    const activePrompts = prompts.filter(p => p.site_id === activeSite)
    return [...new Set(activePrompts.map(p => p.nganh_hang))]
  }, [prompts, activeSite])

  // Filtered industries based on search query
  const filteredIndustries = useMemo(() => {
    return uniqueIndustries.filter(n => 
      n.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [uniqueIndustries, searchQuery])

  // Count active / total prompts for current site
  const stats = useMemo(() => {
    const sitePrompts = prompts.filter(p => p.site_id === activeSite)
    const active = sitePrompts.filter(p => p.is_active).length
    const industriesCount = new Set(sitePrompts.map(p => p.nganh_hang)).size
    return {
      active,
      total: sitePrompts.length,
      industries: industriesCount
    }
  }, [prompts, activeSite])

  // Open panel in Edit mode
  const handleEdit = (prompt: PromptConfig) => {
    setPanelMode('edit')
    setSelectedPromptId(prompt.id)
    setFormSiteId(prompt.site_id)
    setFormNganhHang(prompt.nganh_hang)
    setFormWfStep(prompt.wf_step)
    setFormPromptText(prompt.prompt_text)
    setFormIsActive(prompt.is_active)
    setIsPanelOpen(true)
  }

  // Open panel in Create mode pre-filled with site, industry, step
  const handleCreateNew = (siteId: SiteId, nganhHang = '', wfStep?: PromptConfig['wf_step']) => {
    setPanelMode('create')
    setSelectedPromptId(null)
    setFormSiteId(siteId)
    setFormNganhHang(nganhHang)
    setFormWfStep(wfStep || 'wf2_outline')
    setFormPromptText('')
    setFormIsActive(true)
    setIsPanelOpen(true)
  }

  // Open panel in Clone mode (creates a new prompt prefilled with selected prompt data)
  const handleClone = (prompt: PromptConfig) => {
    setPanelMode('create') // cloning is a create action
    setSelectedPromptId(null)
    setFormSiteId(prompt.site_id)
    setFormNganhHang(`${prompt.nganh_hang} (Nhân bản)`)
    setFormWfStep(prompt.wf_step)
    setFormPromptText(prompt.prompt_text)
    setFormIsActive(prompt.is_active)
    toast('Đã nạp dữ liệu nhân bản. Hãy điền ngành hàng/site mới để lưu.', 'info')
  }

  // Delete specific prompt config
  const handleDelete = (id: string, nganhHang: string, step: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa cấu hình prompt ${WF_LABELS[step]} của ngành hàng "${nganhHang}"?`)) {
      deletePrompt(id)
      toast('Đã xóa cấu hình prompt thành công', 'warning')
      if (isPanelOpen && selectedPromptId === id) {
        setIsPanelOpen(false)
      }
    }
  }

  // Delete all prompts for an industry under active site
  const handleDeleteIndustry = (nganhHang: string) => {
    if (confirm(`Xóa toàn bộ các prompt của ngành hàng "${nganhHang}" trên trang ${SITE_META[activeSite].label}?`)) {
      const targetPrompts = prompts.filter(p => p.site_id === activeSite && p.nganh_hang === nganhHang)
      targetPrompts.forEach(p => deletePrompt(p.id))
      toast(`Đã xóa toàn bộ cấu hình ngành hàng "${nganhHang}"`, 'warning')
      setIsPanelOpen(false)
    }
  }

  // Save form (either create or edit)
  const handleSave = () => {
    if (!formNganhHang.trim()) {
      toast('Vui lòng điền tên ngành hàng', 'error')
      return
    }
    if (!formPromptText.trim()) {
      toast('Vui lòng điền nội dung prompt', 'error')
      return
    }

    // Check if configuration already exists (for create mode)
    if (panelMode === 'create') {
      const exists = prompts.find(
        p => p.site_id === formSiteId && p.nganh_hang === formNganhHang.trim() && p.wf_step === formWfStep
      )
      if (exists) {
        toast(`Đã tồn tại cấu hình cho ${WF_LABELS[formWfStep]} của ngành hàng "${formNganhHang}"`, 'error')
        return
      }

      addPrompt({
        site_id: formSiteId,
        nganh_hang: formNganhHang.trim(),
        wf_step: formWfStep,
        prompt_text: formPromptText,
        is_active: formIsActive,
        model: 'gpt-4o' // hidden model field
      }, currentUserName)

      toast(`Đã tạo cấu hình prompt mới thành công!`, 'success')
    } else {
      // Edit mode
      if (!selectedPromptId) return

      // Check duplicate if step or industry name changed
      const duplicate = prompts.find(
        p => p.id !== selectedPromptId && p.site_id === formSiteId && p.nganh_hang === formNganhHang.trim() && p.wf_step === formWfStep
      )
      if (duplicate) {
        toast(`Trùng lặp cấu hình với một prompt hiện có khác!`, 'error')
        return
      }

      updatePrompt(selectedPromptId, {
        site_id: formSiteId,
        nganh_hang: formNganhHang.trim(),
        wf_step: formWfStep,
        prompt_text: formPromptText,
        is_active: formIsActive
      }, currentUserName)

      toast('Cập nhật cấu hình prompt thành công!', 'success')
    }

    setIsPanelOpen(false)
  }

  // Insert variable tag at current text area cursor location
  const handleInsertVariable = (varName: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const newText = text.substring(0, start) + varName + text.substring(end)
    
    setFormPromptText(newText)

    // Reset cursor focus
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + varName.length, start + varName.length)
    }, 0)

    // Copy to clipboard
    navigator.clipboard.writeText(varName)
    toast(`Đã chèn ${varName} & copy vào clipboard`, 'success')
  }

  // Get current editing prompt to show static history logs
  const activePromptObj = useMemo(() => {
    if (panelMode === 'edit' && selectedPromptId) {
      return prompts.find(p => p.id === selectedPromptId)
    }
    return null
  }, [prompts, selectedPromptId, panelMode])

  return (
    <AppShell breadcrumb={['AICPS', 'Cấu hình', 'Prompt Config']}>
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-blue-500 w-5 h-5" />
            Quản lý Cấu hình Prompt
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập prompt hệ thống tối ưu theo từng ngành hàng và các bước trong luồng xử lý AI.
          </p>
        </div>
        <button
          onClick={() => handleCreateNew(activeSite)}
          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-100"
        >
          <Plus size={16} />
          <span>Thêm prompt mới</span>
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-200px)]">
        
        {/* Site Tab Bar & Search Section */}
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex flex-col gap-4">
          
          {/* Sites Tab Selector */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]).map(([k, v]) => {
              const isActive = activeSite === k
              return (
                <button
                  key={k}
                  onClick={() => {
                    setActiveSite(k)
                    setIsPanelOpen(false) // Close panel if changing site
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-white text-gray-900 border-gray-200 shadow-sm scale-102 font-bold' 
                      : 'bg-transparent text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${k === 'avakids' ? 'bg-pink-500' : k === 'tgdd' ? 'bg-yellow-500' : k === 'dmx' ? 'bg-blue-500' : k === 'topzone' ? 'bg-slate-900' : 'bg-green-500'}`} />
                  {v.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 font-normal ${
                    isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-100/70 text-gray-400'
                  }`}>
                    {new Set(prompts.filter(p => p.site_id === k).map(p => p.nganh_hang)).size}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Filtering and statistics panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm ngành hàng..."
                className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 self-end sm:self-auto bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="flex items-center gap-1">
                Ngành hàng: <strong>{stats.industries}</strong>
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Prompt đang bật: <strong>{stats.active}/{stats.total}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Grid Table */}
        <div className="flex-1 overflow-x-auto">
          {filteredIndustries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-gray-50 p-4 rounded-full text-gray-400 mb-3">
                <Database size={32} />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Chưa tìm thấy cấu hình</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                {searchQuery 
                  ? 'Không có ngành hàng nào khớp với từ khóa tìm kiếm.' 
                  : 'Site này chưa có cấu hình prompt nào. Hãy tạo ngành hàng đầu tiên!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => handleCreateNew(activeSite)}
                  className="mt-4 flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                >
                  <Plus size={14} />
                  <span>Cấu hình ngành hàng đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/20">
                  <th className="py-4 px-6 w-48 font-semibold">Ngành hàng</th>
                  {(Object.keys(WF_LABELS) as Array<PromptConfig['wf_step']>).map(k => (
                    <th key={k} className="py-3 px-4 font-semibold text-center whitespace-nowrap">
                      <div>{WF_LABELS[k]}</div>
                      <div className="text-[9px] font-normal text-gray-300 normal-case tracking-normal mt-0.5">{WF_DESCS[k]}</div>
                    </th>
                  ))}
                  <th className="py-4 px-6 w-20 text-center font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredIndustries.map((industry) => (
                  <tr key={industry} className="hover:bg-gray-50/40 transition-colors group/row">
                    
                    {/* Industry Name */}
                    <td className="py-4 px-6 font-semibold text-gray-900 border-r border-gray-50">
                      <div className="flex items-center justify-between">
                        <span>{industry}</span>
                      </div>
                    </td>

                    {/* Step Cells */}
                    {(Object.keys(WF_LABELS) as Array<PromptConfig['wf_step']>).map((stepKey) => {
                      const p = prompts.find(
                        (x) => x.site_id === activeSite && x.nganh_hang === industry && x.wf_step === stepKey
                      )

                      return (
                        <td key={stepKey} className="py-4 px-6 border-r border-gray-50">
                          {p ? (
                            <div 
                              onClick={() => handleEdit(p)}
                              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                p.is_active 
                                  ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300' 
                                  : 'bg-gray-50/70 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className={`text-[11px] font-semibold truncate ${p.is_active ? 'text-emerald-800' : 'text-gray-500'}`}>
                                  {p.is_active ? 'Đang bật' : 'Đang tắt'}
                                </span>
                              </div>
                              <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Sửa</span>
                              
                              {/* Hover Tooltip Box */}
                              <div className="absolute left-1/2 -bottom-2 translate-y-full -translate-x-1/2 hidden group-hover:block z-30 w-72 bg-slate-900 text-white text-[11px] p-3.5 rounded-xl shadow-xl border border-slate-800 font-normal">
                                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
                                  <span className="font-bold text-yellow-400">{WF_LABELS[p.wf_step]}</span>
                                  <span className="text-slate-400 text-[9px]">{formatDateTime(p.updated_at)}</span>
                                </div>
                                <p className="line-clamp-5 font-mono text-slate-300 whitespace-pre-line leading-normal">
                                  {p.prompt_text}
                                </p>
                                <div className="mt-2 text-[9px] text-slate-400 flex items-center justify-between">
                                  <span>Bởi: {p.updated_by}</span>
                                  <span className="text-blue-400 font-semibold">Click để cấu hình →</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCreateNew(activeSite, industry, stepKey)}
                              className="w-full flex items-center justify-center gap-1 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 transition-all font-semibold"
                            >
                              <Plus size={12} />
                              <span>Cấu hình</span>
                            </button>
                          )}
                        </td>
                      )
                    })}

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteIndustry(industry)}
                          title="Xóa tất cả cấu hình ngành hàng này"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-over Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/45 z-40 transition-opacity duration-300 ${
          isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* Slide-over Edit/Create Sheet */}
      <div 
        className={`fixed top-0 right-0 h-full w-[620px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        {/* Slide-over Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-md">
              {panelMode === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-1">
              {panelMode === 'create' ? 'Thêm Cấu hình Prompt Mới' : 'Chi tiết Cấu hình Prompt'}
            </h2>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide-over Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Metadata Block (Site, Step) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Site select */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Website</label>
              <select
                value={formSiteId}
                onChange={(e) => setFormSiteId(e.target.value as SiteId)}
                disabled={panelMode === 'edit'}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              >
                {Object.entries(SITE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Step Select */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Quy trình (Workflow Step)</label>
              <select
                value={formWfStep}
                onChange={(e) => setFormWfStep(e.target.value as any)}
                disabled={panelMode === 'edit'}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              >
                {Object.entries(WF_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v} – {WF_DESCS[k]}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Industry & Switch Toggle row */}
          <div className="flex items-end justify-between gap-4">
            
            {/* Industry Input */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ngành hàng</label>
              <input
                type="text"
                value={formNganhHang}
                onChange={(e) => setFormNganhHang(e.target.value)}
                placeholder="Ví dụ: Tủ lạnh, Smartwatch, Tã bỉm..."
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Active Switch */}
            <div className="pb-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Trạng thái:</span>
              <button
                onClick={() => setFormIsActive(!formIsActive)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  formIsActive ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <div 
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    formIsActive ? 'left-5.5' : 'left-0.5'
                  }`} 
                />
              </button>
              <span className={`text-xs font-bold ${formIsActive ? 'text-green-600' : 'text-gray-400'}`}>
                {formIsActive ? 'Active' : 'Inactive'}
              </span>
            </div>

          </div>

          {/* Prompt Editor & Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Nội dung Prompt
              </label>
              <span className="text-[10px] text-gray-400">
                Kích thước: {formPromptText.length} ký tự
              </span>
            </div>

            {/* Click to insert dynamic variables */}
            <div className="bg-yellow-50/40 border border-yellow-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-800">
                <Sparkles size={11} className="text-yellow-600" />
                <span>Biến động sẵn có (Click để chèn nhanh vào vị trí con trỏ):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => handleInsertVariable(v.name)}
                    title={v.desc}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200/80 px-2 py-1 rounded-lg text-[10px] font-mono transition-colors shadow-2xs font-semibold"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea prompt content */}
            <textarea
              ref={textareaRef}
              value={formPromptText}
              onChange={(e) => setFormPromptText(e.target.value)}
              placeholder="Nhập prompt chỉ dẫn cho mô hình ngôn ngữ lớn..."
              className="w-full h-80 p-4 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none shadow-xs bg-slate-50/30"
            />
          </div>

          {/* Mock Update History Timeline */}
          {panelMode === 'edit' && activePromptObj && (
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Clock size={12} className="text-gray-400" />
                Lịch sử chỉnh sửa
              </h4>
              <div className="relative pl-4 border-l-2 border-gray-100 space-y-4 text-[11px] text-gray-500">
                
                {/* 1. Latest log */}
                <div className="relative">
                  <div className="absolute -left-5 top-0.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">{formatDateTime(activePromptObj.updated_at)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <User size={10} /> {activePromptObj.updated_by}
                    </span>
                  </div>
                  <p className="mt-0.5 text-gray-400">Lưu thay đổi nội dung prompt.</p>
                </div>

                {/* 2. Mock log 1 */}
                <div className="relative">
                  <div className="absolute -left-5 top-0.5 w-2 h-2 rounded-full bg-gray-300 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">05/06/2026 14:30</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                      <User size={10} /> Nguyễn Thị Lan
                    </span>
                  </div>
                  <p className="mt-0.5 text-gray-400">Điều chỉnh giọng điệu và chèn biến `spec_final_json`.</p>
                </div>

                {/* 3. Original config log */}
                <div className="relative">
                  <div className="absolute -left-5 top-0.5 w-2 h-2 rounded-full bg-gray-200 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">01/06/2026 09:00</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1">
                      <User size={10} /> Hệ thống
                    </span>
                  </div>
                  <p className="mt-0.5 text-gray-400">Khởi tạo prompt gốc mặc định.</p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Slide-over Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex gap-2">
            {panelMode === 'edit' && activePromptObj && (
              <>
                <button
                  onClick={() => handleClone(activePromptObj)}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Copy size={13} />
                  <span>Nhân bản</span>
                </button>
                <button
                  onClick={() => handleDelete(activePromptObj.id, activePromptObj.nganh_hang, activePromptObj.wf_step)}
                  className="flex items-center gap-1 text-red-600 hover:text-white bg-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <Trash2 size={13} />
                  <span>Xóa prompt</span>
                </button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPanelOpen(false)}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              {panelMode === 'create' ? 'Tạo prompt' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>

      </div>

    </AppShell>
  )
}
