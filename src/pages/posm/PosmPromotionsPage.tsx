import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { PosmCampaignTable } from './PosmCampaignTable'
import { usePosmStore } from '../../store/posmStore'

export function PosmPromotionsPage() {
  const navigate = useNavigate()
  // Chung 1 danh sách với 2 tab còn lại — chiến dịch lưu ở đây sẽ hiện ở cả 3 tab
  const campaigns = usePosmStore((s) => s.campaigns)

  return (
    <AppShell breadcrumb={['AICPS', 'Chiến dịch POSM', 'Chiến dịch POSM']}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#0F172A]">Chiến dịch POSM</h1>
          <p className="text-sm text-[#94A3B8]">Chiến dịch POSM gắn với các chương trình khuyến mãi</p>
        </div>
        <OcpsButton variant="primary" onClick={() => navigate('/posm/promotions/new')}>
          <Plus size={14} /> Tạo chiến dịch
        </OcpsButton>
      </div>
      <PosmCampaignTable rows={campaigns} onRowClick={(row) => navigate(`/posm/promotions/${row.id}`)} />
    </AppShell>
  )
}
