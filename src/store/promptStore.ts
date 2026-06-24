import { create } from 'zustand'
import { MOCK_PROMPT_CONFIGS } from '../data/mockData'
import type { PromptConfig } from '../types'

interface PromptStore {
  prompts: PromptConfig[]
  updatePrompt: (id: string, partial: Partial<PromptConfig>, userName?: string) => void
  addPrompt: (prompt: Omit<PromptConfig, 'id' | 'updated_at' | 'updated_by'>, userName?: string) => void
  deletePrompt: (id: string) => void
}

export const usePromptStore = create<PromptStore>((set) => ({
  prompts: MOCK_PROMPT_CONFIGS,
  updatePrompt: (id, partial, userName) =>
    set((s) => ({
      prompts: s.prompts.map((p) =>
        p.id === id
          ? {
              ...p,
              ...partial,
              updated_at: new Date().toISOString(),
              updated_by: userName || p.updated_by,
            }
          : p
      ),
    })),
  addPrompt: (prompt, userName) =>
    set((s) => {
      const newPrompt: PromptConfig = {
        ...prompt,
        id: `pc-${Date.now()}`,
        updated_at: new Date().toISOString(),
        updated_by: userName || 'Nguyễn Văn Admin',
      }
      return { prompts: [newPrompt, ...s.prompts] }
    }),
  deletePrompt: (id) =>
    set((s) => ({
      prompts: s.prompts.filter((p) => p.id !== id),
    })),
}))
