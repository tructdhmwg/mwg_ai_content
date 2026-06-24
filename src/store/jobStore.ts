import { create } from 'zustand'
import { MOCK_JOBS } from '../data/mockData'
import type { Job, JobStatus } from '../types'

interface JobStore {
  jobs: Job[]
  updateJobStatus: (jobId: string, status: JobStatus) => void
  updateJob: (jobId: string, partial: Partial<Job>) => void
  addJob: (job: Job) => void
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: MOCK_JOBS,
  updateJobStatus: (jobId, status) =>
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.job_id === jobId ? { ...j, status, updated_at: new Date().toISOString() } : j
      ),
    })),
  updateJob: (jobId, partial) =>
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.job_id === jobId ? { ...j, ...partial, updated_at: new Date().toISOString() } : j
      ),
    })),
  addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
}))
