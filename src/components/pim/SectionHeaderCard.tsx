import type { LucideIcon } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

export type SectionApprovalState = 'pending' | 'approved' | 'rejected'

const APPROVAL_BADGE_META: Record<SectionApprovalState, { label: string; className: string; dotClassName: string }> = {
  pending: { label: 'Chờ duyệt', className: 'border-amber-200 bg-amber-50 text-amber-700', dotClassName: 'bg-amber-500' },
  approved: { label: 'Đã duyệt', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', dotClassName: 'bg-emerald-500' },
  rejected: { label: 'Từ chối', className: 'border-red-200 bg-red-50 text-red-700', dotClassName: 'bg-red-500' },
}

export interface SectionHeaderAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  title?: string // tooltip
}

export interface SectionHeaderToolbarItem extends SectionHeaderAction {
  tag?: string
}

export interface SectionHeaderApproval {
  state: SectionApprovalState
  onToggle: () => void
}

export interface SectionHeaderAi {
  label: string
  agentId: string
  isGenerating?: boolean
}

export interface SectionHeaderCardProps {
  icon?: LucideIcon
  title: string
  titleExtra?: ReactNode
  className?: string
  approval?: SectionHeaderApproval
  ai?: SectionHeaderAi
  primaryAction?: SectionHeaderAction
  secondaryAction?: SectionHeaderAction
  toolbarLeft?: SectionHeaderToolbarItem[]
  toolbarRight?: SectionHeaderToolbarItem[]
  children?: ReactNode
}

function GhostButton({ label, icon: Icon, onClick, disabled, title, tag }: SectionHeaderToolbarItem) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
    >
      {Icon && <Icon size={14} className="text-blue-500" />}
      {label}
      {tag && (
        <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
          {tag}
        </span>
      )}
    </button>
  )
}

export function SectionHeaderCard({
  icon: Icon,
  title,
  titleExtra,
  className = '',
  approval,
  ai,
  primaryAction,
  secondaryAction,
  toolbarLeft = [],
  toolbarRight = [],
  children,
}: SectionHeaderCardProps) {
  const approvalMeta = approval ? APPROVAL_BADGE_META[approval.state] : null
  const hasToolbar = toolbarLeft.length > 0 || toolbarRight.length > 0

  return (
    <div className={`rounded-[14px] border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`}>
      {/* Top row: title, status badges, primary/secondary actions */}
      <div className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:px-7 sm:pt-[22px] sm:pb-[18px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {Icon && <Icon size={16} className="shrink-0 text-cyan-600" />}
          <h3 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{title}</h3>
          {titleExtra}

          {approvalMeta && (
            <button
              type="button"
              onClick={approval!.onToggle}
              className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${approvalMeta.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${approvalMeta.dotClassName}`} />
              Duyệt: {approvalMeta.label}
            </button>
          )}

          {ai && (
            <span className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[12.5px] font-semibold text-cyan-700">
              {ai.isGenerating ? (
                <Loader2 size={11} className="animate-spin text-cyan-600" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              )}
              <span className="flex items-center gap-2 leading-tight">
                <span>{ai.isGenerating ? 'Đang gen...' : ai.label}</span>
                <span className="border-l border-cyan-200 pl-2 font-mono text-[11.5px] font-semibold text-[#55869C]">{ai.agentId}</span>
              </span>
            </span>
          )}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex shrink-0 flex-col-reverse gap-2.5 sm:flex-row sm:items-center lg:w-auto">
            {secondaryAction && (
              <Button
                variant="outline"
                title={secondaryAction.title}
                disabled={secondaryAction.disabled}
                onClick={secondaryAction.onClick}
                className="h-10 w-full rounded-[9px] border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 sm:w-auto"
              >
                {secondaryAction.icon && <secondaryAction.icon size={14} className="mr-1" />}
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                title={primaryAction.title}
                disabled={primaryAction.disabled}
                onClick={primaryAction.onClick}
                className="h-10 w-full rounded-[9px] bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 sm:w-auto"
              >
                {primaryAction.icon && <primaryAction.icon size={14} className="mr-1" />}
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar: tertiary ghost actions */}
      {hasToolbar && (
        <div className="flex items-center gap-3 overflow-x-auto border-t border-gray-100 bg-gray-50 px-4 py-[10px] sm:px-5">
          <div className="flex shrink-0 items-center gap-1">
            {toolbarLeft.map((item, i) => (
              <div key={item.label} className="flex shrink-0 items-center gap-1">
                {i > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-gray-200" />}
                <GhostButton {...item} />
              </div>
            ))}
          </div>
          {toolbarRight.length > 0 && (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {toolbarRight.map(item => (
                <GhostButton key={item.label} {...item} />
              ))}
            </div>
          )}
        </div>
      )}

      {children && <div className="px-5 pt-4 pb-5">{children}</div>}
    </div>
  )
}
