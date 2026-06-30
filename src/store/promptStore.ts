import { create } from 'zustand'
import { MOCK_PROMPT_CATEGORIES } from '../data/mockCategories'
import type { PromptCategoryLevel1, PromptSubCategory, PromptOption, SiteId } from '../types'

interface PromptStore {
  categories: PromptCategoryLevel1[]
  
  // Level 1: Category
  addCategory: (category: Omit<PromptCategoryLevel1, 'id' | 'sub_categories'>) => void
  updateCategory: (id: string, partial: Partial<Omit<PromptCategoryLevel1, 'id' | 'sub_categories'>>) => void
  deleteCategory: (id: string) => void
  
  // Level 2: Sub-category
  addSubCategory: (categoryId: string, subCategory: Omit<PromptSubCategory, 'id' | 'options'>) => void
  updateSubCategory: (categoryId: string, subCategoryId: string, partial: Partial<Omit<PromptSubCategory, 'id' | 'options'>>) => void
  deleteSubCategory: (categoryId: string, subCategoryId: string) => void
  
  // Level 3: Option
  addOption: (categoryId: string, subCategoryId: string, option: Omit<PromptOption, 'id' | 'updated_at' | 'updated_by'>, userName?: string) => void
  updateOption: (categoryId: string, subCategoryId: string, optionId: string, partial: Partial<PromptOption>, userName?: string) => void
  deleteOption: (categoryId: string, subCategoryId: string, optionId: string) => void
}

export const usePromptStore = create<PromptStore>((set) => ({
  categories: MOCK_PROMPT_CATEGORIES as any,
  
  // LEVEL 1
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, { ...category, id: `cat-${Date.now()}`, sub_categories: [] }]
  })),
  
  updateCategory: (id, partial) => set((state) => ({
    categories: state.categories.map(c => c.id === id ? { ...c, ...partial } : c)
  })),
  
  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id)
  })),
  
  // LEVEL 2
  addSubCategory: (categoryId, subCategory) => set((state) => ({
    categories: state.categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          sub_categories: [...c.sub_categories, { ...subCategory, id: `sub-${Date.now()}`, options: [] }]
        }
      }
      return c
    })
  })),
  
  updateSubCategory: (categoryId, subCategoryId, partial) => set((state) => ({
    categories: state.categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          sub_categories: c.sub_categories.map(s => s.id === subCategoryId ? { ...s, ...partial } : s)
        }
      }
      return c
    })
  })),
  
  deleteSubCategory: (categoryId, subCategoryId) => set((state) => ({
    categories: state.categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          sub_categories: c.sub_categories.filter(s => s.id !== subCategoryId)
        }
      }
      return c
    })
  })),
  
  // LEVEL 3
  addOption: (categoryId, subCategoryId, option, userName) => set((state) => ({
    categories: state.categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          sub_categories: c.sub_categories.map(s => {
            if (s.id === subCategoryId) {
              return {
                ...s,
                options: [...s.options, {
                  ...option,
                  id: `opt-${Date.now()}`,
                  updated_at: new Date().toISOString(),
                  updated_by: userName || 'Admin'
                }]
              }
            }
            return s
          })
        }
      }
      return c
    })
  })),
  
  updateOption: (categoryId, subCategoryId, optionId, partial, userName) => set((state) => ({
    categories: state.categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          sub_categories: c.sub_categories.map(s => {
            if (s.id === subCategoryId) {
              return {
                ...s,
                options: s.options.map(o => {
                  if (o.id === optionId) {
                    return {
                      ...o,
                      ...partial,
                      updated_at: new Date().toISOString(),
                      updated_by: userName || o.updated_by
                    }
                  }
                  return o
                })
              }
            }
            return s
          })
        }
      }
      return c
    })
  })),
  
  deleteOption: (categoryId, subCategoryId, optionId) => set((state) => ({
    categories: state.categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          sub_categories: c.sub_categories.map(s => {
            if (s.id === subCategoryId) {
              return {
                ...s,
                options: s.options.filter(o => o.id !== optionId)
              }
            }
            return s
          })
        }
      }
      return c
    })
  }))
}))
