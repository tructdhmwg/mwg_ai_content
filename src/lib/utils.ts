import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { JobStatus, StepDurations } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}p${s}s` : `${m}p`
}

export function formatTotalDuration(durations?: StepDurations): string {
  if (!durations) return '–'
  const total = Object.values(durations).reduce((a, b) => a + (b ?? 0), 0)
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  return s > 0 ? `${m} phút ${s} giây` : `${m} phút`
}

export function getStepIndex(status: JobStatus): number {
  const map: Record<string, number> = {
    draft: 0, spec_incomplete: 0, running: 0,
    outline_pending: 0, outline_running: 1,
    writing_pending: 1, writing_running: 2,
    image_pending: 2, image_running: 3,
    merge_pending: 3, merge_running: 4,
    qc_pending: 5, reviewing: 5,
    approved: 5, published: 5,
    error: -1, rejected: 5, cancelled: 0,
  }
  return map[status] ?? 0
}

export function getWfStepStates(status: JobStatus): Array<'done' | 'running' | 'error' | 'pending'> {
  const steps: Array<'done' | 'running' | 'error' | 'pending'> = ['pending', 'pending', 'pending', 'pending', 'pending']

  const doneAndRun: Record<JobStatus, [number, number]> = {
    draft:            [-1, -1],
    running:          [-1, -1],
    spec_incomplete:  [-1, -1],
    cancelled:        [-1, -1],
    outline_pending:  [0, -1],
    outline_running:  [0, 1],
    writing_pending:  [1, -1],
    writing_running:  [1, 2],
    image_pending:    [2, -1],
    image_running:    [2, 3],
    merge_pending:    [3, -1],
    merge_running:    [3, 4],
    qc_pending:       [4, -1],
    reviewing:        [4, -1],
    approved:         [4, -1],
    published:        [4, -1],
    rejected:         [4, -1],
    error:            [-1, -1],
  }

  const [doneUntil, running] = doneAndRun[status] ?? [-1, -1]

  for (let i = 0; i <= doneUntil; i++) steps[i] = 'done'
  if (running >= 0) steps[running] = 'running'

  if (status === 'error') {
    let lastDone = -1
    for (let i = 0; i < 5; i++) if (steps[i] === 'done') lastDone = i
    if (lastDone >= 0 && lastDone < 4) steps[lastDone + 1] = 'error'
    else if (lastDone < 0) steps[0] = 'error'
  }

  return steps
}

export function isRunningStatus(status: JobStatus): boolean {
  return status.includes('running')
}

export function canApprove(status: JobStatus): boolean {
  return status === 'qc_pending' || status === 'reviewing'
}

export function canRerun(status: JobStatus): boolean {
  return status === 'error' || status === 'spec_incomplete' || status === 'rejected'
}

export function canCancel(status: JobStatus): boolean {
  return !['published', 'cancelled', 'approved'].includes(status)
}

export function generateJobId(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `JOB-0${num}`
}
