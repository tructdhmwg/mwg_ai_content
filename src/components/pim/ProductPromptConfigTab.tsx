import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Save, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { usePromptStore } from '../../store/promptStore'
import { useProductStore } from '../../store/productStore'
import { useToast } from '../ui/Toast'
import type { Product, PromptCategoryLevel1, PromptOption } from '../../types'

/**
 * Tìm category prompt của sản phẩm: ưu tiên active_prompt_category, sau đó nganh_hang.
 * nganh_hang là tên hiển thị ('Điện thoại') trong khi category id là 'DIEN_THOAI',
 * nên phải so cả id lẫn name và duyệt đệ quy children (nhánh dmx dùng children).
 */
export function resolvePromptCategory(
  categories: PromptCategoryLevel1[],
  product: Pick<Product, 'active_prompt_category' | 'nganh_hang'>,
): PromptCategoryLevel1 | undefined {
  const keys = [product.active_prompt_category, product.nganh_hang].filter(Boolean) as string[]
  const walk = (cats: PromptCategoryLevel1[]): PromptCategoryLevel1 | undefined => {
    for (const cat of cats) {
      if (keys.some(key => cat.id === key || cat.name === key)) return cat
      if (cat.children) {
        const found = walk(cat.children)
        if (found) return found
      }
    }
    return undefined
  }
  return walk(categories)
}

type PromptEntry = { subCategoryId: string; option: PromptOption }
type WorkflowDraft = { subCategoryId: string; optionId: string; bonus: string; feedback: string; research: boolean }

const SECTION_DEFS = [
  {
    code: 'S1',
    anchor: 's2',
    workflowKey: 'wf2_outline',
    legacyWorkflowKeys: [] as string[],
    title: 'Outline bài viết',
    description: 'Prompt dàn bài cho bài viết sản phẩm',
    chipClass: 'bg-indigo-50 text-indigo-700',
    templateFields: (option?: PromptOption) => [
      { label: 'Prompt outline', value: option?.outline_prompt_content || option?.template_content || '' },
    ],
  },
  {
    code: 'S2',
    anchor: 's3',
    workflowKey: 'wf3_writing',
    legacyWorkflowKeys: [] as string[],
    title: 'Tạo bài viết sản phẩm',
    description: 'Prompt viết bài chi tiết theo outline',
    chipClass: 'bg-blue-50 text-blue-700',
    templateFields: (option?: PromptOption) => [
      { label: 'Prompt viết bài', value: option?.template_content || '' },
    ],
  },
  {
    code: 'S3',
    anchor: 's4',
    workflowKey: 'wf4_article_images',
    legacyWorkflowKeys: [] as string[],
    title: 'Tạo ảnh (Bài viết - Slider)',
    description: 'Prompt tạo ảnh bài viết và slider',
    chipClass: 'bg-emerald-50 text-emerald-700',
    templateFields: (option?: PromptOption) => [
      { label: 'Prompt tạo ảnh', value: option?.template_content || '' },
    ],
  },
] as const

type SectionDef = typeof SECTION_DEFS[number]

const entryKey = (entry: { subCategoryId: string; option: { id: string } }) => `${entry.subCategoryId}::${entry.option.id}`

function collectEntries(category: PromptCategoryLevel1 | undefined, section: SectionDef): PromptEntry[] {
  if (!category) return []
  const workflowKeys = [section.workflowKey, ...section.legacyWorkflowKeys]
  return category.sub_categories
    .filter(sub => workflowKeys.includes(sub.workflow_type))
    .flatMap(sub => sub.options.filter(opt => opt.is_active).map(option => ({ subCategoryId: sub.id, option })))
}

function buildDraft(product: Product, section: SectionDef, entries: PromptEntry[]): WorkflowDraft {
  const wf = section.workflowKey
  const savedSub = product.selected_sub_categories?.[wf] || section.legacyWorkflowKeys.map(k => product.selected_sub_categories?.[k]).find(Boolean) || ''
  const savedOpt = product.selected_prompt_options?.[wf] || section.legacyWorkflowKeys.map(k => product.selected_prompt_options?.[k]).find(Boolean) || ''
  const matched = entries.find(entry => entry.subCategoryId === savedSub && entry.option.id === savedOpt)
    || entries.find(entry => entry.option.id === savedOpt)
    || entries[0]
  return {
    subCategoryId: matched?.subCategoryId || '',
    optionId: matched?.option.id || '',
    bonus: product.bonus_prompts?.[wf] || '',
    feedback: product.feedback_prompts?.[wf] || '',
    research: product.external_research_by_workflow?.[wf] ?? false,
  }
}

const emptyDraft: WorkflowDraft = { subCategoryId: '', optionId: '', bonus: '', feedback: '', research: false }

function ResearchSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-2 ${
        checked ? 'bg-cyan-600' : 'bg-gray-300'
      }`}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

interface PromptSectionProps {
  section: SectionDef
  entries: PromptEntry[]
  draft: WorkflowDraft
  onDraftChange: (partial: Partial<WorkflowDraft>) => void
}

function PromptSection({ section, entries, draft, onDraftChange }: PromptSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const showFeedback = section.workflowKey !== 'wf4_article_images'
  const selectedEntry = entries.find(entry => entry.subCategoryId === draft.subCategoryId && entry.option.id === draft.optionId)
  const templateFields = section.templateFields(selectedEntry?.option)

  return (
    <div id={`prompt-section-${section.anchor}`} className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${section.chipClass}`}>
            {section.code}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
            <p className="truncate text-xs text-gray-400">{section.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="mr-1 hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 sm:flex">
            <ResearchSwitch checked={draft.research} onChange={(research) => onDraftChange({ research })} />
            Research bằng AI
          </div>
          {selectedEntry && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Kích hoạt
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(prev => !prev)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={collapsed ? `Mở rộng ${section.title}` : `Thu gọn ${section.title}`}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
            <Sparkles className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-500">Chưa có prompt kích hoạt cho {section.title}</p>
            <Link to={`/config/prompts?tab=${section.workflowKey}`} className="text-sm font-semibold text-cyan-600 hover:underline">
              Khai báo prompt
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3.5 py-3 sm:hidden">
              <span className="text-xs font-semibold text-gray-700">Research bằng AI</span>
              <ResearchSwitch checked={draft.research} onChange={(research) => onDraftChange({ research })} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">Tên prompt</label>
              <select
                value={selectedEntry ? entryKey(selectedEntry) : ''}
                onChange={(event) => {
                  const [subCategoryId, optionId] = event.target.value.split('::')
                  onDraftChange({ subCategoryId, optionId })
                }}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              >
                {entries.map(entry => (
                  <option key={entryKey(entry)} value={entryKey(entry)}>{entry.option.name}</option>
                ))}
              </select>
            </div>

            <div className={templateFields.length > 1 ? 'grid gap-4 lg:grid-cols-2' : ''}>
              {templateFields.map(field => (
                <div key={field.label}>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    {field.label} <span className="font-normal text-gray-400">(Read-only)</span>
                  </label>
                  <div className="max-h-[200px] min-h-[90px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-700">
                    {field.value || <span className="text-gray-400">Chưa có nội dung</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className={showFeedback ? 'grid gap-4 lg:grid-cols-2' : ''}>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Yêu cầu bổ sung <span className="font-normal text-gray-400">(Bonus Prompt)</span>
                </label>
                <textarea
                  value={draft.bonus}
                  onChange={(event) => onDraftChange({ bonus: event.target.value })}
                  placeholder="Thêm yêu cầu riêng..."
                  rows={3}
                  className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-gray-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>
              {showFeedback && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-amber-700">
                    Feedback cho AI <span className="font-normal text-amber-500">(Regen)</span>
                  </label>
                  <textarea
                    value={draft.feedback}
                    onChange={(event) => onDraftChange({ feedback: event.target.value })}
                    placeholder="Nhập feedback để AI gen lại..."
                    rows={3}
                    className={`w-full resize-y rounded-lg border px-3.5 py-2.5 text-[13px] text-gray-800 outline-none transition focus:ring-2 focus:ring-amber-500/10 ${
                      draft.feedback ? 'border-amber-400 bg-amber-50' : 'border-amber-300 bg-amber-50/50'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}

interface ProductPromptConfigTabProps {
  product: Product
  onDirtyChange?: (dirty: boolean) => void
}

export function ProductPromptConfigTab({ product, onDirtyChange }: ProductPromptConfigTabProps) {
  const categories = usePromptStore((s) => s.categories)
  const updateProductField = useProductStore((s) => s.updateProductField)
  const { toast } = useToast()

  const category = useMemo(() => resolvePromptCategory(categories, product), [categories, product])
  const entriesBySection = useMemo(
    () => SECTION_DEFS.map(section => ({ section, entries: collectEntries(category, section) })),
    [category],
  )

  const initialDrafts = useMemo(() => {
    const drafts: Record<string, WorkflowDraft> = {}
    entriesBySection.forEach(({ section, entries }) => {
      drafts[section.workflowKey] = buildDraft(product, section, entries)
    })
    return drafts
  }, [entriesBySection, product])

  const [drafts, setDrafts] = useState(initialDrafts)
  useEffect(() => {
    setDrafts(initialDrafts)
    // Chỉ re-init khi đổi sản phẩm; sau khi Lưu, drafts đã trùng initialDrafts nên không cần reset
  }, [product.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => JSON.stringify(drafts) !== JSON.stringify(initialDrafts), [drafts, initialDrafts])
  useEffect(() => {
    onDirtyChange?.(dirty)
    return () => onDirtyChange?.(false)
  }, [dirty, onDirtyChange])

  const handleDraftChange = (workflowKey: string, partial: Partial<WorkflowDraft>) => {
    setDrafts(prev => ({ ...prev, [workflowKey]: { ...prev[workflowKey], ...partial } }))
  }

  const handleSave = () => {
    const outline = drafts['wf2_outline'] || emptyDraft
    const writing = drafts['wf3_writing'] || emptyDraft
    const image = drafts['wf4_article_images'] || emptyDraft
    updateProductField(product.id, 'selected_sub_categories', {
      ...(product.selected_sub_categories || {}),
      wf2_outline: outline.subCategoryId,
      wf3_writing: writing.subCategoryId,
      wf4_article_images: image.subCategoryId,
    })
    updateProductField(product.id, 'selected_prompt_options', {
      ...(product.selected_prompt_options || {}),
      wf2_outline: outline.optionId,
      wf3_writing: writing.optionId,
      wf4_article_images: image.optionId,
    })
    updateProductField(product.id, 'bonus_prompts', {
      ...(product.bonus_prompts || {}),
      wf2_outline: outline.bonus,
      wf3_writing: writing.bonus,
      wf4_article_images: image.bonus,
    })
    updateProductField(product.id, 'feedback_prompts', {
      ...(product.feedback_prompts || {}),
      wf2_outline: outline.feedback,
      wf3_writing: writing.feedback,
    })
    updateProductField(product.id, 'external_research_by_workflow', {
      ...(product.external_research_by_workflow || {}),
      wf2_outline: outline.research,
      wf3_writing: writing.research,
      wf4_article_images: image.research,
    })
    toast('Đã lưu cấu hình prompt', 'success')
  }

  return (
    <div>
      <div className="sticky top-16 z-20 mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-gray-200/70 bg-[#f0f2f5]/95 px-0 py-3 backdrop-blur supports-[backdrop-filter]:bg-[#f0f2f5]/80">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Cấu hình prompt cho sản phẩm</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Lấy theo ngành hàng <span className="font-semibold text-gray-700">{category?.name || product.nganh_hang}</span>
            {' '}· chỉ hiển thị prompt đang kích hoạt · sắp xếp theo thứ tự workflow
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty}
          className="bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300"
        >
          <Save size={15} className="mr-1.5" />
          Lưu cấu hình
        </Button>
      </div>

      {!category ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm">
          <Sparkles className="h-7 w-7 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">Chưa có ngành hàng prompt cho "{product.nganh_hang}"</p>
          <Link to="/config/prompts" className="text-sm font-semibold text-cyan-600 hover:underline">
            Khai báo ngành hàng & prompt
          </Link>
        </div>
      ) : (
        entriesBySection.map(({ section, entries }) => (
          <PromptSection
            key={section.code}
            section={section}
            entries={entries}
            draft={drafts[section.workflowKey] || emptyDraft}
            onDraftChange={(partial) => handleDraftChange(section.workflowKey, partial)}
          />
        ))
      )}
    </div>
  )
}
