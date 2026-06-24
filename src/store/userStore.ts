import { create } from 'zustand'
import { MOCK_USERS } from '../data/mockData'
import type { User } from '../types'

interface UserStore {
  users: User[]
  addUser: (user: User) => void
  updateUser: (id: string, partial: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleActive: (id: string) => void
}

export const useUserStore = create<UserStore>((set) => ({
  users: MOCK_USERS,
  addUser: (user) => set((s) => ({ users: [...s.users, user] })),
  updateUser: (id, partial) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...partial } : u)) })),
  deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
  toggleActive: (id) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)),
    })),
}))
