import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { PosmCampaignTable } from './PosmCampaignTable'
import { usePosmStore } from '../../store/posmStore'
import type { PosmCampaignStatus } from './posmMockData'

// Dashboard MKT chỉ hiện chiến dịch từ lúc chuyển sang MKT trở đi — ẩn "Mới/Đang cập nhật/Đủ sản phẩm" (còn ở NH)
// và "NH duyệt" (đang chờ NH, không phải việc của MKT); "Hoàn tất" vẫn hiện để MKT theo dõi phiếu đã xong.
const MKT_STATUSES: PosmCampaignStatus[] = ['transferred_mkt', 'mkt_proccessing', 'mkt_done', 'completed']

export function PosmMktDashboardPage() {
  const navigate = useNavigate()
  // .filter() phải nằm trong useMemo (không phải trực tiếp trong selector) — nếu không, mỗi lần đọc snapshot
  // sẽ tạo mảng mới khiến useSyncExternalStore tưởng store đổi liên tục -> lặp vô hạn.
  const allCampaigns = usePosmStore((s) => s.campaigns)
  const campaigns = useMemo(() => allCampaigns.filter((c) => MKT_STATUSES.includes(c.status)), [allCampaigns])

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
