import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { useUserStore } from '../../store/userStore'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/ui/Toast'
import { SITE_META, type SiteId } from '../../types'

const ROLE_OPTIONS = [
  { value: 'admin',           label: 'Admin – Toàn quyền' },
  { value: 'site_manager',    label: 'Site Manager – Quản lý site' },
  { value: 'content_manager', label: 'Content Manager – Tạo & xem job' },
  { value: 'viewer',          label: 'Viewer – Chỉ xem' },
]

export function UserFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { users, addUser, updateUser } = useUserStore()
  const currentUser = useAuthStore((s) => s.user)
  const { toast } = useToast()

  const isEdit = !!id && id !== 'new'
  const existing = isEdit ? users.find((u) => u.id === id) : null

  const [name, setName] = useState(existing?.name ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'site_manager' | 'content_manager' | 'viewer'>(existing?.role ?? 'content_manager')
  const [selectedSites, setSelectedSites] = useState<SiteId[]>(existing?.sites ?? [])
  const [isActive, setIsActive] = useState(existing?.is_active ?? true)
  const [saving, setSaving] = useState(false)

  const sites = Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]

  const toggleSite = (s: SiteId) => {
    setSelectedSites((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { toast('Vui lòng điền đầy đủ thông tin', 'error'); return }
    if (!isEdit && !password) { toast('Cần nhập mật khẩu khi tạo mới', 'error'); return }
    if (role !== 'admin' && selectedSites.length === 0) { toast('Cần chọn ít nhất 1 site', 'error'); return }

    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))

    if (isEdit && existing) {
      updateUser(existing.id, {
        name, email, role: role as any,
        sites: role === 'admin' ? ['avakids', 'tgdd', 'dmx', 'topzone', 'ntak'] : selectedSites,
        is_active: isActive,
        ...(password ? { password } : {}),
      })
    } else {
      addUser({
        id: 'u' + Date.now(),
        name, email, password,
        role: role as any,
        sites: role === 'admin' ? ['avakids', 'tgdd', 'dmx', 'topzone', 'ntak'] : selectedSites,
        is_active: isActive,
        created_at: new Date().toISOString(),
      })
    }

    setSaving(false)
    toast(`Đã ${isEdit ? 'cập nhật' : 'tạo'} user thành công`, 'success')
    navigate('/admin/users')
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Quản lý Users', isEdit ? 'Chỉnh sửa' : 'Tạo mới']}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Chỉnh sửa User' : 'Tạo User mới'}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A" required minLength={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@mwg.vn" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mật khẩu {isEdit ? '(để trống = không đổi)' : <span className="text-red-500">*</span>}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••' : 'Tối thiểu 6 ký tự'} minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
            <select
              value={role}
              disabled={isEdit && id === currentUser?.id}
              onChange={(e) => setRole(e.target.value as 'admin' | 'site_manager' | 'content_manager' | 'viewer')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50"
            >
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Sites */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sites được gán</label>
            {role === 'admin' ? (
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
                Admin có quyền truy cập tất cả sites
              </div>
            ) : (
              <div className="space-y-2">
                {sites.map(([k, v]) => (
                  <label key={k} className={`flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${selectedSites.includes(k) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedSites.includes(k)} onChange={() => toggleSite(k)} className="accent-blue-600" />
                    <div className="w-3 h-3 rounded-full" style={{ background: v.color }} />
                    <span className="text-sm text-gray-700 font-medium">{v.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Trạng thái tài khoản</span>
            <div className="flex items-center gap-2">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isActive ? 'left-6' : 'left-1'}`} />
              </div>
              <span className="text-sm text-gray-600">{isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Tạo User'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/users')}>Hủy</Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
