import { cn } from '../../lib/utils'
import { getWfStepStates } from '../../lib/utils'
import type { JobStatus, StepDurations } from '../../types'
import { formatDuration } from '../../lib/utils'

const WF_LABELS = ['WF1\nĐọc File', 'WF2\nOutline', 'WF3\nViết bài', 'WF4\nTạo ảnh', 'WF5\nMerge']

interface Props {
  status: JobStatus
  step_durations?: StepDurations
  size?: 'sm' | 'md'
}

export function JobProgressBar({ status, step_durations, size = 'sm' }: Props) {
  let states = getWfStepStates(status)

  // For error jobs, determine the actual failed step from step_durations
  if (status === 'error') {
    const keys = ['wf1', 'wf2', 'wf3', 'wf4', 'wf5'] as const
    let completed = 0
    if (step_durations) {
      for (const k of keys) {
        if (step_durations[k] !== undefined) completed++
        else break
      }
    }
    states = ['pending', 'pending', 'pending', 'pending', 'pending']
    for (let i = 0; i < completed; i++) states[i] = 'done'
    if (completed < 5) states[completed] = 'error'
  }

  const durations = step_durations ? Object.values(step_durations) : []

  return (
    <div className="flex gap-1">
      {states.map((state, i) => {
        const dur = durations[i]
        const label = WF_LABELS[i]
        const title = `${label.replace('\n', ' ')}${dur ? ` – ${formatDuration(dur)}` : ''}`
        return (
          <div
            key={i}
            title={title}
            className={cn(
              'rounded cursor-default transition-colors',
              size === 'sm' ? 'h-2 w-8' : 'h-3 w-10',
              state === 'done'    && 'bg-green-500',
              state === 'running' && 'bg-blue-500 animate-pulse',
              state === 'error'   && 'bg-red-500',
              state === 'pending' && 'bg-gray-200',
            )}
          />
        )
      })}
    </div>
  )
}
