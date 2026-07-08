// Cây route cho nhánh /ocps/* — mount trong src/App.tsx qua <Route path="/ocps/*">.
// OcpsDataProvider chỉ bọc nhánh này (không bọc toàn app) nên state OCPS
// không ảnh hưởng phần còn lại của A.
import { Navigate, Route, Routes } from 'react-router-dom'
import { Card } from './components/Card'
import { OcpsDataProvider } from './context/OcpsDataContext'
import { useOcpsAuth } from './context/OcpsAuthContext'
import { OcpsLayout, OCPS_ROLE_DEFAULT } from './layouts/OcpsLayout'
import { VendorUpload, VendorUploadDetail } from './pages/vendor/VendorUpload'
import { NHDashboard } from './pages/nh/NHDashboard'
import { NHProductDetail } from './pages/nh/NHProductDetail'
import { NHReport } from './pages/nh/NHReport'
import { ContentDashboard } from './pages/content/ContentDashboard'
import { ContentProcess } from './pages/content/ContentProcess'
import { MarketingDashboard } from './pages/marketing/MarketingDashboard'
import { MarketingBriefDetail } from './pages/marketing/MarketingBriefDetail'
import { AdminControlTower } from './pages/admin/AdminControlTower'
import { AdminGodView } from './pages/admin/AdminGodView'
import { AdminConfig } from './pages/admin/AdminConfig'
import { AdminReports } from './pages/admin/AdminReports'
import { AdminOverridePage } from './pages/admin/AdminOverridePage'

// Trang tạm trong lúc các trang tính năng được port dần ở Phase 4 —
// KHÔNG redirect về OCPS_ROLE_DEFAULT ở catch-all để tránh vòng lặp Navigate
// khi route đích chưa tồn tại.
function OcpsComingSoon() {
  const { effectiveOcpsRole } = useOcpsAuth()
  return (
    <Card className="max-w-lg mx-auto mt-10 text-center">
      <p className="text-sm font-semibold text-[#0F172A]">Khu vận hành OCPS</p>
      <p className="text-xs text-[#475569] mt-2">
        Trang này đang được chuyển đổi từ hệ thống OCPS (Phase 4 của kế hoạch merge).
      </p>
      {effectiveOcpsRole && (
        <p className="text-xs text-[#94A3B8] mt-1">
          Trang mặc định của bạn: <code className="text-[#1D4ED8]">{OCPS_ROLE_DEFAULT[effectiveOcpsRole]}</code>
        </p>
      )}
    </Card>
  )
}

function OcpsIndexRedirect() {
  const { effectiveOcpsRole } = useOcpsAuth()
  if (!effectiveOcpsRole) return <Navigate to="/products" replace />
  return <Navigate to={OCPS_ROLE_DEFAULT[effectiveOcpsRole]} replace />
}

export function OcpsRoutes() {
  return (
    <OcpsDataProvider>
      <Routes>
        <Route element={<OcpsLayout />}>
          {/* Phase 4a — Vendor */}
          <Route path="vendor/upload" element={<VendorUpload />} />
          <Route path="vendor/upload/:id" element={<VendorUploadDetail />} />
          {/* Phase 4b — NH */}
          <Route path="nh/dashboard" element={<NHDashboard />} />
          <Route path="nh/product/:id" element={<NHProductDetail />} />
          <Route path="nh/report" element={<NHReport />} />
          {/* Phase 4c — Content */}
          <Route path="content/dashboard" element={<ContentDashboard />} />
          <Route path="content/process/:id" element={<ContentProcess />} />
          {/* Phase 4d — Marketing */}
          <Route path="marketing/dashboard" element={<MarketingDashboard />} />
          <Route path="marketing/brief/:id" element={<MarketingBriefDetail />} />
          {/* Phase 4e — Admin */}
          <Route path="admin/control-tower" element={<AdminControlTower />} />
          <Route path="admin/god-view" element={<AdminGodView />} />
          <Route path="admin/config" element={<AdminConfig />} />
          <Route path="admin/reports" element={<AdminReports />} />
          <Route path="admin/override/:id" element={<AdminOverridePage />} />
          {/* Route lạc trong /ocps/* → trang mặc định theo role */}
          <Route path="*" element={<OcpsComingSoon />} />
        </Route>
        <Route index element={<OcpsIndexRedirect />} />
      </Routes>
    </OcpsDataProvider>
  )
}
