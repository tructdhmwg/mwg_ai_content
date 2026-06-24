import { NavLink, useNavigate } from 'react-router-dom'
import {
  LogOut, Database, FileText, PlusCircle, Settings, Webhook, Users
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/Toast'

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

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
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
  const { toast } = useToast()
  const navigate = useNavigate()

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
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex min-h-screen w-[var(--sidebar-width)] flex-col bg-[#0f1535] shadow-xl">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-white font-bold text-lg">
          AI<span className="text-cyan-400">CPS</span>
        </div>
        <div className="text-white/40 text-[10px] mt-0.5">AI Content Production</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        <div className="px-2 mb-1 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Sản phẩm</div>
        <NavItem to="/products" icon={Database} label="Sản phẩm PIM" />

        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Jobs</div>
        <NavItem to="/jobs" icon={FileText} label="Danh sách Job" />
        <NavItem to="/jobs/new" icon={PlusCircle} label="Tạo Job mới" />

        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Cấu hình</div>
        <NavItem to="/config/prompts" icon={Settings} label="Prompt" />
        <NavItem to="/config/webhooks" icon={Webhook} label="Webhook" />

        <div className="px-2 mb-1 mt-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Quản trị</div>
        <NavItem to="/admin/users" icon={Users} label="Người dùng" />
      </nav>


      {/* User info */}
      {user && (
        <div className="px-3 py-4 border-t border-white/10">
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
