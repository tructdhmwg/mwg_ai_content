import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { MOCK_USERS } from '../data/mockData'
import { useToast } from '../components/ui/Toast'

export function LoginPage() {
  const { user, login } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password && u.is_active
    )
    setLoading(false)
    if (found) {
      login(found)
      toast(`Chào mừng, ${found.name}!`, 'success')
      navigate('/')
    } else {
      setError('Email hoặc mật khẩu không đúng, hoặc tài khoản bị vô hiệu hóa')
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-[#0f1535] mb-1">
            AI<span className="text-cyan-500">CPS</span>
          </div>
          <div className="text-sm text-gray-500">AI Content Production System</div>
          <div className="text-xs text-gray-400 mt-0.5">MWG Internal Tool</div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h1 className="text-lg font-bold text-gray-800 mb-6">Đăng nhập</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@mwg.vn"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Tài khoản demo:</p>
            <div className="flex flex-col gap-1 text-xs text-gray-500">
              <div className="flex justify-between"><span>admin@mwg.vn</span><span className="font-mono">admin123</span></div>
              <div className="flex justify-between"><span>lan@avakids.vn</span><span className="font-mono">123456</span></div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">v1.0.0 · MWG 2026</p>
      </div>
    </div>
  )
}
