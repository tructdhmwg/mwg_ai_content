import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { SiteBadge, Badge } from '../../components/ui/Badge'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'
import { SITE_META, type SiteId } from '../../types'

const ROLE_COLORS: Record<string, string> = {
  admin:           'bg-red-100 text-red-700',
  site_manager:    'bg-yellow-100 text-yellow-700',
  content_manager: 'bg-green-100 text-green-700',
  viewer:          'bg-blue-100 text-blue-700',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', site_manager: 'Site Manager', content_manager: 'Content', viewer: 'Viewer',
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-cyan-500', 'bg-pink-500']

function getAvatarColor(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()
}

export function UserListPage() {
  const navigate = useNavigate()
  const { users, deleteUser, toggleActive } = useUserStore()
  const currentUser = useAuthStore((s) => s.user)
  const { toast } = useToast()

  const [filterRole, setFilterRole] = useState('all')
  const [filterSite, setFilterSite] = useState('all')
  const [search, setSearch] = useState('')

  if (currentUser?.role !== 'admin') {
    return (
      <AppShell breadcrumb={['AICPS', 'Quản lý Users']}>
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Không có quyền truy cập</p>
          <p className="text-sm mt-1">Chỉ Admin mới có thể vào trang này</p>
        </div>
      </AppShell>
    )
  }

  const filtered = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (filterSite !== 'all' && !u.sites.includes(filterSite as SiteId)) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser?.id) { toast('Không thể xóa tài khoản đang dùng', 'error'); return }
    if (!confirm(`Bạn chắc chắn muốn xóa user "${name}"?`)) return
    deleteUser(id)
    toast(`Đã xóa user ${name}`, 'warning')
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Quản lý Users']}>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Users</h1>
        <Button onClick={() => navigate('/admin/users/new')}>
          <Plus size={16} /> Thêm user
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="all">Tất cả role</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="all">Tất cả sites</option>
          {(Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Người dùng</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Sites được gán</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24">Trạng thái</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(u.id)}`}>
                      {getInitials(u.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}{u.id === currentUser?.id && <span className="ml-1 text-xs text-blue-500">(bạn)</span>}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {u.role === 'admin' ? (
                    <Badge className="bg-gray-100 text-gray-500">Tất cả sites</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.sites.map((s) => <SiteBadge key={s} site={s} />)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div
                    onClick={() => toggleActive(u.id)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${u.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={u.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${u.is_active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={u.id === currentUser?.id}
                      title={u.id === currentUser?.id ? 'Không thể xóa tài khoản đang dùng' : 'Xóa user'}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Không tìm thấy user</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
