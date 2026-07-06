import { Info, Save, SlidersHorizontal } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { PromptConfigEditor } from '../PromptConfigEditor'

interface PromptConfigDialogProps {
  open: boolean
  onClose: () => void
  onSave?: () => boolean | void
  workflowType: string
  activeCategory: string
  selectedSubCategoryId: string
  selectedOptionId: string
  bonusPrompt: string
  feedbackPrompt: string
  onCategoryChange: (categoryId: string) => void
  onSubCategoryChange: (subCatId: string) => void
  onOptionChange: (optionId: string) => void
  onPromptChoiceChange?: (subCategoryId: string, optionId: string) => void
  onBonusPromptChange: (val: string) => void
  onFeedbackPromptChange: (val: string) => void
}

export function PromptConfigDialog({ open, onClose, onSave, ...editorProps }: PromptConfigDialogProps) {
  const handleSave = () => {
    const shouldClose = onSave?.()
    if (shouldClose === false) return
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<SlidersHorizontal size={16} />}
      title="Cấu hình Prompt"
      subtitle="Chọn prompt và tuỳ chỉnh yêu cầu"
      className="max-w-2xl"
      footer={
        <>
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info size={13} />
            Thay đổi chỉ áp dụng cho lần trích xuất tiếp theo
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
      <PromptConfigEditor {...editorProps} />
    </Dialog>
  )
}
