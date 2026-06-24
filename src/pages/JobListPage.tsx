import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutList, PlayCircle, Clock, AlertCircle, Plus, Eye, RefreshCw, Search, X
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { SiteBadge, StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { JobProgressBar } from '../components/ui/JobProgressBar'
import { useJobStore } from '../store/jobStore'
import { useFilterStore } from '../store/filterStore'
import { MOCK_STATS } from '../data/mockData'
import { SITE_META, type SiteId } from '../types'
import { formatDateTime, formatTimeAgo } from '../lib/utils'

const PAGE_SIZE = 10

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'running', label: 'Đang chạy' },
  { value: 'qc_pending', label: 'Chờ QC' },
  { value: 'reviewing', label: 'Đang QC' },
  { value: 'published', label: 'Đã publish' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'error', label: 'Lỗi' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'spec_incomplete', label: 'Spec thiếu' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export function JobListPage() {
  const navigate = useNavigate()
  const jobs = useJobStore((s) => s.jobs)
  const { site_id, status, search, page, setFilter, setPage, reset } = useFilterStore()
  const [searchInput, setSearchInput] = useState(search)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      // Only show blog jobs — product content is managed via PIM
      if (j.job_type !== 'blog_post') return false
      if (site_id !== 'all' && j.site_id !== site_id) return false
      if (status !== 'all') {
        if (status === 'running') {
          if (!j.status.includes('running')) return false
        } else {
          if (j.status !== status) return false
        }
      }
      if (search) {
        const q = search.toLowerCase()
        if (!j.ten_san_pham.toLowerCase().includes(q) && !j.job_id.toLowerCase().includes(q) && !j.pim_product_id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [jobs, site_id, status, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilter = site_id !== 'all' || status !== 'all' || search !== ''

  const handleSearch = (v: string) => {
    setSearchInput(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setFilter('search', v), 300)
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Danh sách Jobs']}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Danh sách Jobs (Blog)</h1>
        <Button onClick={() => navigate('/jobs/new')}>
          <Plus size={16} /> Tạo Job mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Tổng hôm nay" value={MOCK_STATS.today_total}
          icon={<LayoutList size={20} />} color="blue"
          onClick={() => { reset(); setFilter('status', 'all') }}
        />
        <StatCard
          label="Đang chạy" value={MOCK_STATS.running}
          icon={<PlayCircle size={20} />} color="blue" pulse
          onClick={() => { reset(); setFilter('status', 'running') }}
        />
        <StatCard
          label="Chờ QC" value={MOCK_STATS.qc_pending}
          icon={<Clock size={20} />} color="yellow"
          onClick={() => { reset(); setFilter('status', 'qc_pending') }}
        />
        <StatCard
          label="Lỗi" value={MOCK_STATS.error}
          icon={<AlertCircle size={20} />} color="red"
          onClick={() => { reset(); setFilter('status', 'error') }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Site */}
        <select
          value={site_id}
          onChange={(e) => setFilter('site_id', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">Tất cả sites</option>
          {(Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>



        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm theo Job ID, tiêu đề blog..."
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={() => { reset(); setSearchInput('') }}>
            <X size={14} /> Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Không tìm thấy job nào</p>
            <button onClick={() => { reset(); setSearchInput('') }} className="mt-2 text-sm text-blue-500 hover:underline">
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24">Job ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Site</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tiêu đề</th>

                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-36">Tiến độ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((job) => (
                  <tr
                    key={job.job_id}
                    onClick={() => navigate(`/jobs/${job.job_id}`)}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-600 text-xs font-semibold">{job.job_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SiteBadge site={job.site_id} />
                    </td>
                    <td className="px-4 py-3 max-w-0">
                      <p className="font-medium text-gray-800 truncate" title={job.ten_san_pham}>{job.ten_san_pham}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{job.nganh_hang} · {job.pim_product_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <JobProgressBar status={job.status} step_durations={job.step_durations} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{formatDateTime(job.created_at)}</p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(job.updated_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {(job.status === 'qc_pending' || job.status === 'reviewing') && (
                          <Button size="sm" variant="warning" onClick={() => navigate(`/jobs/${job.job_id}`)}>QC</Button>
                        )}
                        {job.status === 'spec_incomplete' && (
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate(`/jobs/${job.job_id}`)}>Xem</Button>
                        )}
                        {job.status === 'error' && (
                          <Button size="sm" variant="danger" onClick={() => navigate(`/jobs/${job.job_id}`)}>
                            <RefreshCw size={12} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/jobs/${job.job_id}`)}>
                          <Eye size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{filtered.length} kết quả</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p} size="sm"
                      variant={p === page ? 'primary' : 'outline'}
                      onClick={() => setPage(p)}
                    >{p}</Button>
                  ))}
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

function StatCard({
  label, value, icon, color, pulse, onClick,
}: {
  label: string; value: number; icon: React.ReactNode; color: string; pulse?: boolean; onClick: () => void
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    yellow: 'bg-yellow-50 border-yellow-100',
    red: value > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100',
  }
  const textColors: Record<string, string> = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: value > 0 ? 'text-red-600' : 'text-gray-400',
  }
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow cursor-pointer ${colors[color] ?? 'bg-white border-gray-100'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`${textColors[color] ?? 'text-gray-500'}`}>{icon}</span>
        {pulse && value > 0 && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </button>
  )
}
