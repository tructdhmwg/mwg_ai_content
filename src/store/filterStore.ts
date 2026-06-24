import { create } from 'zustand'

interface FilterState {
  site_id: string
  status: string
  job_type: string
  search: string
  page: number
  setFilter: (key: string, value: string) => void
  setPage: (p: number) => void
  reset: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  site_id: 'all',
  status: 'all',
  job_type: 'all',
  search: '',
  page: 1,
  setFilter: (key, value) => set((s) => ({ ...s, [key]: value, page: 1 })),
  setPage: (p) => set({ page: p }),
  reset: () => set({ site_id: 'all', status: 'all', job_type: 'all', search: '', page: 1 }),
}))
