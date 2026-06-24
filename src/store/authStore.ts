import { create } from 'zustand'
import { MOCK_USERS } from '../data/mockData'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: MOCK_USERS.find((user) => user.role === 'admin') ?? MOCK_USERS[0] ?? null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
