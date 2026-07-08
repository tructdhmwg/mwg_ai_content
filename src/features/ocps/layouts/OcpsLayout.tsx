// Layout cho nhánh /ocps/* — port từ _source_b_reference/src/layouts/AppLayout.jsx
// với các thay đổi theo quyết định duyệt MERGE_PLAN.md:
//   - Render BÊN TRONG AppShell của A (một sidebar duy nhất — sidebar tối riêng của B bỏ,
//     nav OCPS chuyển vào section "VẬN HÀNH OCPS" trong Sidebar của A).
//   - Topbar của B giữ lại nhưng gỡ chuông NotificationCenter (bỏ F7).
//   - Guard theo effectiveOcpsRole: không có vai trò OCPS → redirect /products + toast;
//     'admin' vào được MỌI /ocps/*; role khác chỉ vào đúng segment của mình
//     (giữ logic ROUTE_ROLES của B), sai segment → về route mặc định của role.
import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '../../../components/layout/AppShell'
import { useToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useOcpsAuth } from '../context/OcpsAuthContext'
import type { OcpsRole } from '../types'

export const OCPS_ROLE_DEFAULT: Record<OcpsRole, string> = {
  vendor: '/ocps/vendor/upload',
  nh: '/ocps/nh/dashboard',
  content: '/ocps/content/dashboard',
  marketing: '/ocps/marketing/dashboard',
  admin: '/ocps/admin/control-tower',
}

const ROUTE_ROLES: Record<string, OcpsRole[]> = {
  vendor: ['vendor'],
  nh: ['nh'],
  content: ['content'],
  marketing: ['marketing'],
  admin: ['admin'],
}

const ROLE_META: Record<OcpsRole, { label: string; abbr: string; color: string }> = {
  vendor:    { label: 'Vendor',        abbr: 'VD', color: '#7C3AED' },
  nh:        { label: 'Ngành hàng',    abbr: 'NH', color: '#0284C7' },
  content:   { label: 'Content / IT',  abbr: 'CT', color: '#0F766E' },
  marketing: { label: 'Marketing',     abbr: 'MK', color: '#EA580C' },
  admin:     { label: 'Admin',         abbr: 'AD', color: '#DC2626' },
}

export function OcpsLayout() {
  const user = useAuthStore((s) => s.user)
  const { currentUser, effectiveOcpsRole } = useOcpsAuth()
  const { toast } = useToast()
  const { pathname } = useLocation()

  const noAccess = !!user && !effectiveOcpsRole
  useEffect(() => {
    if (noAccess) toast('Bạn không có quyền truy cập khu vận hành OCPS', 'warning')
  }, [noAccess, toast])

  // Chưa đăng nhập → để AppShell xử lý (Navigate /login) cho đồng nhất với các trang A
  if (!user) return <Navigate to="/login" replace />
  if (!effectiveOcpsRole || !currentUser) return <Navigate to="/products" replace />

  // Guard theo segment đầu sau /ocps (logic ROUTE_ROLES của B, so bằng effectiveOcpsRole).
  // Admin vào được mọi nơi; role khác lạc segment → về route mặc định của role mình.
  const segment = pathname.split('/')[2]
  const allowed = ROUTE_ROLES[segment]
  if (allowed && effectiveOcpsRole !== 'admin' && !allowed.includes(effectiveOcpsRole)) {
    return <Navigate to={OCPS_ROLE_DEFAULT[effectiveOcpsRole]} replace />
  }

  const meta = ROLE_META[effectiveOcpsRole]

  return (
    <AppShell contentClassName="p-0">
      {/* Topbar OCPS (bản B đã gỡ chuông NotificationCenter) */}
      <header className="h-12 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#0F172A]">Vận hành OCPS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: meta.color }}>
            {meta.label}
          </span>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold cursor-default"
          style={{ background: meta.color }}
          title={currentUser.name}
        >
          {meta.abbr}
        </div>
      </header>

      {/* Page content — nền surface như app B */}
      <main className="min-h-[calc(100vh-3rem)] bg-[#F1F5F9] p-6">
        <Outlet />
      </main>
    </AppShell>
  )
}
