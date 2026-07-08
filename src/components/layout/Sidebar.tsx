import { NavLink, useNavigate } from 'react-router-dom'
import {
  LogOut, Database, FileText, PlusCircle, Settings, Webhook, Users,
  Upload, LayoutDashboard, BarChart3, ListChecks, Megaphone, Activity, Eye, Home
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useOcpsAuth } from '../../features/ocps/context/OcpsAuthContext'
import { useToast } from '../ui/Toast'

// Nav khu OCPS theo vai trò OCPS hiệu lực (bridge từ user A — xem OcpsAuthContext).
// Admin thấy tất cả items của các role + nhóm giám sát/cấu hình riêng.
const OCPS_NAV: Record<string, Array<{ to: string; label: string; icon: React.ElementType }>> = {
  vendor: [{ to: '/ocps/vendor/upload', label: 'Upload tài liệu', icon: Upload }],
  nh: [
    { to: '/ocps/nh/dashboard', label: 'Dashboard NH', icon: LayoutDashboard },
    { to: '/ocps/nh/report', label: 'Báo cáo NH', icon: BarChart3 },
  ],
  content: [{ to: '/ocps/content/dashboard', label: 'Hàng đợi Content', icon: ListChecks }],
  marketing: [{ to: '/ocps/marketing/dashboard', label: 'Brief Marketing', icon: Megaphone }],
}
const OCPS_ADMIN_NAV: Array<{ to: string; label: string; icon: React.ElementType }> = [
  { to: '/ocps/admin/control-tower', label: 'Control Tower', icon: Activity },
  { to: '/ocps/admin/god-view', label: 'God View', icon: Eye },
  { to: '/ocps/admin/config', label: 'Cấu hình OCPS', icon: Settings },
  { to: '/ocps/admin/reports', label: 'Báo cáo OCPS', icon: FileText },
]

const ROLE_BADGE: Record<string, string> = {
  admin:           'bg-red-500/20 text-red-300',
  site_manager:    'bg-yellow-500/20 text-yellow-300',
  content_manager: 'bg-green-500/20 text-green-300',
  viewer:          'bg-blue-500/20 text-blue-300',
}
const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  site_manager: 'Site Manager',
  content_manager: 'Content',
  viewer: 'Viewer',
}

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: React.ElementType; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all',
          isActive
            ? 'bg-white/10 text-white border-l-[3px] border-cyan-400 pl-3.5'
            : 'text-white/65 hover:text-white hover:bg-white/6'
        )
      }
    >
      <Icon size={15} />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { effectiveOcpsRole } = useOcpsAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Chức năng theo vai trò OCPS (vendor/nh/content/marketing) — admin thấy tất cả.
  const ocpsRoleItems = effectiveOcpsRole === 'admin'
    ? Object.values(OCPS_NAV).flat()
    : OCPS_NAV[effectiveOcpsRole ?? ''] ?? []
  // Chức năng quản trị OCPS gộp vào nhóm "Quản trị" chung, chỉ hiện với admin.
  const ocpsAdminItems = effectiveOcpsRole === 'admin' ? OCPS_ADMIN_NAV : []

  const handleLogout = () => {
    if (confirm('Đăng xuất khỏi hệ thống?')) {
      logout()
      navigate('/login')
      toast('Đã đăng xuất', 'info')
    }
  }

  const initials = user?.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? 'U'

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex h-screen w-[var(--sidebar-width)] flex-col bg-[#0f1535] shadow-xl">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0">
        <div className="text-white font-bold text-lg">
          AI<span className="text-cyan-400">CPS</span>
        </div>
        <div className="text-white/40 text-[10px] mt-0.5">AI Content Production</div>
      </div>

      {/* Nav — scroll nội bộ khi vượt chiều cao, để footer logout luôn cố định ở chân */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-4 flex flex-col gap-1">
        <NavItem to="/" icon={Home} label="Trang chủ" end />

        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Sản phẩm</div>
        <NavItem to="/products" icon={Database} label="Sản phẩm PIM" />

        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Jobs</div>
        <NavItem to="/jobs" icon={FileText} label="Danh sách Job" />
        <NavItem to="/jobs/new" icon={PlusCircle} label="Tạo Job mới" />

        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Cấu hình</div>
        <NavItem to="/config/prompts" icon={Settings} label="Prompt" />
        <NavItem to="/config/webhooks" icon={Webhook} label="Webhook" />

        {ocpsRoleItems.length > 0 && (
          <>
            <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Vận hành OCPS</div>
            {ocpsRoleItems.map((item) => (
              <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </>
        )}

        {/* Quản trị luôn ở cuối — gồm quản lý người dùng + chức năng quản trị OCPS (chỉ admin) */}
        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Quản trị</div>
        <NavItem to="/admin/users" icon={Users} label="Người dùng" />
        {ocpsAdminItems.map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}
      </nav>

      {/* User info — sticky ở chân sidebar */}
      {user && (
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user.name}</div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', ROLE_BADGE[user.role])}>
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="text-white/40 hover:text-white transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
