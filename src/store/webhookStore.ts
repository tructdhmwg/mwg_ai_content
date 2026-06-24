import { create } from 'zustand'
import { MOCK_WEBHOOK_CONFIGS } from '../data/mockData'
import type { WebhookConfig } from '../types'

interface WebhookStore {
  webhooks: WebhookConfig[]
  updateWebhook: (wf_key: string, partial: Partial<WebhookConfig>) => void
}

export const useWebhookStore = create<WebhookStore>((set) => ({
  webhooks: MOCK_WEBHOOK_CONFIGS,
  updateWebhook: (wf_key, partial) =>
    set((s) => ({
      webhooks: s.webhooks.map((w) => (w.wf_key === wf_key ? { ...w, ...partial } : w)),
    })),
}))
