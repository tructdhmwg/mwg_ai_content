import React, { useMemo } from 'react'
import { usePromptStore } from '../store/promptStore'

interface PromptConfigEditorProps {
  workflowType: string
  activeCategory: string
  selectedSubCategoryId: string // New prop
  selectedOptionId: string
  bonusPrompt: string
  feedbackPrompt: string
  onCategoryChange: (categoryId: string) => void
  onSubCategoryChange: (subCatId: string) => void // New prop
  onOptionChange: (optionId: string) => void
  onBonusPromptChange: (val: string) => void
  onFeedbackPromptChange: (val: string) => void
}

export function PromptConfigEditor({
  workflowType,
  activeCategory,
  selectedSubCategoryId,
  selectedOptionId,
  bonusPrompt,
  feedbackPrompt,
  onCategoryChange,
  onSubCategoryChange,
  onOptionChange,
  onBonusPromptChange,
  onFeedbackPromptChange,
}: PromptConfigEditorProps) {
  const store = usePromptStore()
  
  // 1. Get current category level 1
  const categoryLevel1 = useMemo(() => {
    return store.categories.find(c => c.id === activeCategory) || store.categories[0]
  }, [store.categories, activeCategory])

  // 2. Get available sub-categories for this workflow
  const availableSubCategories = useMemo(() => {
    if (!categoryLevel1) return []
    return categoryLevel1.sub_categories.filter(sub => sub.workflow_type === workflowType)
  }, [categoryLevel1, workflowType])

  // 3. Get currently selected subcategory (or fallback to first available)
  const currentSubCategory = useMemo(() => {
    return availableSubCategories.find(sub => sub.id === selectedSubCategoryId) || availableSubCategories[0]
  }, [availableSubCategories, selectedSubCategoryId])

  // 4. Get options for the selected subcategory
  const options = currentSubCategory?.options || []

  // 5. Get selected option template
  const selectedOption = useMemo(() => {
    return options.find(o => o.id === selectedOptionId) || options[0]
  }, [options, selectedOptionId])

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs mb-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-gray-500 font-semibold mb-1 block">1. Ngành hàng (Category)</label>
          <select 
            value={categoryLevel1?.id || ''}
            onChange={(e) => {
              onCategoryChange(e.target.value)
            }}
            className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-cyan-500 bg-white"
          >
            {store.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-semibold mb-1 block">2. Phân loại Prompt</label>
          <select 
            value={currentSubCategory?.id || ''}
            onChange={(e) => onSubCategoryChange(e.target.value)}
            disabled={availableSubCategories.length === 0}
            className="w-full border border-gray-200 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-cyan-500"
          >
            {availableSubCategories.length > 0 ? (
              availableSubCategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))
            ) : (
              <option value="">Không có phân loại</option>
            )}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-semibold mb-1 block">3. Option Template</label>
          <select 
            value={selectedOption?.id || ''}
            onChange={(e) => onOptionChange(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-cyan-500 bg-white"
            disabled={options.length === 0}
          >
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Template Prompt (Read-only)</label>
        <textarea
          disabled
          value={selectedOption?.template_content || 'Không có template cho tùy chọn này.'}
          rows={3}
          className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-gray-100 text-gray-500 font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Yêu cầu bổ sung (Bonus Prompt)</label>
          <textarea
            value={bonusPrompt}
            onChange={(e) => onBonusPromptChange(e.target.value)}
            rows={2}
            placeholder="Thêm yêu cầu riêng..."
            className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-orange-500 font-semibold mb-1 block">Feedback cho AI (Regen)</label>
          <textarea
            value={feedbackPrompt}
            onChange={(e) => onFeedbackPromptChange(e.target.value)}
            rows={2}
            placeholder="Nhập feedback để AI gen lại..."
            className="w-full border border-orange-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 bg-orange-50"
          />
        </div>
      </div>
    </div>
  )
}
