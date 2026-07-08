import { useMemo, useState } from 'react'
import { Info, Save, SlidersHorizontal } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { usePromptStore } from '../../store/promptStore'
import type { Product, PromptCategoryLevel1, PromptOption } from '../../types'

type WorkflowKey = 'wf2_outline' | 'wf3_writing' | 'wf4_article_images'

interface ProductPromptWorkflowDialogProps {
  open: boolean
  onClose: () => void
  product: Product
  workflowKey: WorkflowKey
  onUpdateProductField: (field: keyof Product, value: Product[keyof Product]) => void
}

type PromptEntry = { subCategoryId: string; option: PromptOption }

const WORKFLOW_META: Record<WorkflowKey, {
  title: string
  sectionCode: string
  description: string
  promptLabel: string
  emptyText: string
  getPromptText: (option?: PromptOption) => string
}> = {
  wf2_outline: {
    title: 'Outline bài viết',
    sectionCode: 'S1',
    description: 'Prompt dàn bài cho bài viết sản phẩm',
    promptLabel: 'Prompt outline',
    emptyText: 'Chưa có prompt outline',
    getPromptText: (option) => option?.outline_prompt_content || option?.template_content || '',
  },
  wf3_writing: {
    title: 'Tạo bài viết sản phẩm',
    sectionCode: 'S2',
    description: 'Prompt viết bài chi tiết theo outline',
    promptLabel: 'Prompt viết bài',
    emptyText: 'Chưa có prompt viết bài',
    getPromptText: (option) => option?.template_content || '',
  },
  wf4_article_images: {
    title: 'Tạo ảnh (Bài viết - Slider)',
    sectionCode: 'S3',
    description: 'Prompt tạo ảnh bài viết và slider',
    promptLabel: 'Prompt tạo ảnh',
    emptyText: 'Chưa có prompt tạo ảnh',
    getPromptText: (option) => option?.template_content || '',
  },
}

const entryKey = (entry: PromptEntry) => `${entry.subCategoryId}::${entry.option.id}`

function resolvePromptCategory(categories: PromptCategoryLevel1[], product: Product) {
  const keys = [product.active_prompt_category, product.nganh_hang].filter(Boolean) as string[]
  const walk = (items: PromptCategoryLevel1[]): PromptCategoryLevel1 | undefined => {
    for (const item of items) {
      if (keys.some(key => item.id === key || item.name === key)) return item
      if (item.children) {
        const found = walk(item.children)
        if (found) return found
      }
    }
    return undefined
  }
  return walk(categories)
}

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

export function ProductPromptWorkflowDialog({
  open,
  onClose,
  product,
  workflowKey,
  onUpdateProductField,
}: ProductPromptWorkflowDialogProps) {
  const categories = usePromptStore((state) => state.categories)
  const meta = WORKFLOW_META[workflowKey]
  const category = useMemo(() => resolvePromptCategory(categories, product), [categories, product])
  const entries = useMemo<PromptEntry[]>(() => {
    if (!category) return []
    return category.sub_categories
      .filter(subCategory => subCategory.workflow_type === workflowKey)
      .flatMap(subCategory => subCategory.options
        .filter(option => option.is_active)
        .map(option => ({ subCategoryId: subCategory.id, option })))
  }, [category, workflowKey])

  const initialEntry = useMemo(() => {
    const selectedSub = product.selected_sub_categories?.[workflowKey] || ''
    const selectedOption = product.selected_prompt_options?.[workflowKey] || ''
    return entries.find(entry => entry.subCategoryId === selectedSub && entry.option.id === selectedOption)
      || entries.find(entry => entry.option.id === selectedOption)
      || entries[0]
  }, [entries, product.selected_prompt_options, product.selected_sub_categories, workflowKey])

  const [selectedKey, setSelectedKey] = useState(() => initialEntry ? entryKey(initialEntry) : '')
  const [bonus, setBonus] = useState(() => product.bonus_prompts?.[workflowKey] || '')
  const [feedback, setFeedback] = useState(() => product.feedback_prompts?.[workflowKey] || '')
  const [research, setResearch] = useState(() => product.external_research_by_workflow?.[workflowKey] || false)
  const showFeedback = workflowKey !== 'wf4_article_images'

  const selectedEntry = entries.find(entry => entryKey(entry) === selectedKey)
  const promptText = meta.getPromptText(selectedEntry?.option)

  const handleSave = () => {
    const [subCategoryId = '', optionId = ''] = selectedKey.split('::')
    onUpdateProductField('selected_sub_categories', {
      ...(product.selected_sub_categories || {}),
      [workflowKey]: subCategoryId,
    })
    onUpdateProductField('selected_prompt_options', {
      ...(product.selected_prompt_options || {}),
      [workflowKey]: optionId,
    })
    onUpdateProductField('bonus_prompts', {
      ...(product.bonus_prompts || {}),
      [workflowKey]: bonus,
    })
    if (showFeedback) {
      onUpdateProductField('feedback_prompts', {
        ...(product.feedback_prompts || {}),
        [workflowKey]: feedback,
      })
    }
    onUpdateProductField('external_research_by_workflow', {
      ...(product.external_research_by_workflow || {}),
      [workflowKey]: research,
    })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<SlidersHorizontal size={16} />}
      title="Cấu hình prompt"
      subtitle={`${meta.title} · ${category?.name || product.nganh_hang}`}
      className="max-w-4xl"
      footer={
        <>
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info size={13} />
            Thay đổi chỉ áp dụng cho lần gen tiếp theo
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Thoát</Button>
            <Button className="bg-gray-900 text-white hover:bg-gray-800" onClick={handleSave}>
              <Save size={14} className="mr-1" />
              Lưu thay đổi
            </Button>
          </div>
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
              {meta.sectionCode}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900">{meta.title}</h3>
              <p className="truncate text-xs text-gray-400">{meta.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600">
              <ResearchSwitch checked={research} onChange={setResearch} />
              Research bằng AI
            </div>
            {selectedEntry && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Kích hoạt
              </span>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Chưa có prompt kích hoạt cho {meta.title}
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">Tên prompt</label>
              <select
                value={selectedKey}
                onChange={(event) => setSelectedKey(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              >
                {entries.map(entry => (
                  <option key={entryKey(entry)} value={entryKey(entry)}>{entry.option.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                {meta.promptLabel} <span className="font-normal text-gray-400">(Read-only)</span>
              </label>
              <div className="max-h-[260px] min-h-[130px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-700">
                {promptText || <span className="text-gray-400">{meta.emptyText}</span>}
              </div>
            </div>

            <div className={showFeedback ? 'grid gap-4 lg:grid-cols-2' : ''}>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Yêu cầu bổ sung <span className="font-normal text-gray-400">(Bonus Prompt)</span>
                </label>
                <textarea
                  value={bonus}
                  onChange={(event) => setBonus(event.target.value)}
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
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    placeholder="Nhập feedback để AI gen lại..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-amber-300 bg-amber-50/50 px-3.5 py-2.5 text-[13px] text-gray-800 outline-none transition focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
