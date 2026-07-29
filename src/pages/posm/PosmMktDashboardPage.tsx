import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { PosmCampaignTable } from './PosmCampaignTable'
import { usePosmStore } from '../../store/posmStore'

export function PosmMktDashboardPage() {
  const navigate = useNavigate()
  // Chung 1 danh sách với 2 tab còn lại — chiến dịch lưu ở tab Chiến dịch POSM sẽ hiện ở cả 3 tab
  const campaigns = usePosmStore((s) => s.campaigns)

  return (
    <AppShell breadcrumb={['AICPS', 'Chiến dịch POSM', 'Dashboard MKT']}>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard MKT</h1>
        <p className="text-sm text-[#94A3B8]">Chiến dịch POSM do Marketing quản lý</p>
      </div>
      <PosmCampaignTable rows={campaigns} onRowClick={(row) => navigate(`/posm/marketing/dashboard/${row.id}`)} />
    </AppShell>
  )
}
