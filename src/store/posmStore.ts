import { create } from 'zustand'
import { posmNhCampaigns, posmPromotionCampaigns, posmMktCampaigns } from '../pages/posm/posmMockData'
import type { PosmCampaign } from '../pages/posm/posmMockData'

interface PosmStore {
  campaigns: PosmCampaign[]
  addCampaign: (campaign: PosmCampaign) => void
  updateCampaign: (id: string, partial: Partial<PosmCampaign>) => void
}

export const usePosmStore = create<PosmStore>((set) => ({
  campaigns: [...posmNhCampaigns, ...posmPromotionCampaigns, ...posmMktCampaigns],
  addCampaign: (campaign) => set((s) => ({ campaigns: [campaign, ...s.campaigns] })),
  updateCampaign: (id, partial) =>
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...partial } : c)) })),
}))
