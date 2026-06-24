import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle, XCircle, RefreshCw, Ban, ChevronLeft,
  Check, X, Loader2, Image, FileText, RotateCcw,
  Copy, AlertTriangle, Maximize2, Trash2, Info, ImagePlus
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { SiteBadge, StatusBadge, Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { JobProgressBar } from '../components/ui/JobProgressBar'
import { useJobStore } from '../store/jobStore'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/ui/Toast'
import {
  formatDateTime, formatTimeAgo, formatDuration, formatTotalDuration,
  canApprove, canRerun, canCancel, isRunningStatus
} from '../lib/utils'
import type { Job, ImageEntry } from '../types'

export function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { updateJobStatus, jobs } = useJobStore()
  const user = useAuthStore((s) => s.user)

  const job = jobs.find((j) => j.job_id === jobId)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const [regenFields, setRegenFields] = useState<Record<string, boolean>>({})

  if (!job) {
    return (
      <AppShell breadcrumb={['AICPS', 'Danh sách Jobs', jobId ?? '']}>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Job không tồn tại</p>
          <Link to="/jobs" className="mt-3 text-blue-500 text-sm hover:underline">← Quay lại danh sách</Link>
        </div>
      </AppShell>
    )
  }

  const canApp = canApprove(job.status) && (user?.role === 'admin' || user?.role === 'site_manager')
  const canRe = canRerun(job.status)
  const canCan = canCancel(job.status)

  const handleApprove = (_fields: string[]) => {
    updateJobStatus(job.job_id, 'published')
    setApproveOpen(false)
    toast(`✓ Đã publish Job ${job.job_id} thành công`, 'success')
  }

  const handleReject = (_reason: string) => {
    updateJobStatus(job.job_id, 'rejected')
    setRejectOpen(false)
    toast('Job đã được từ chối. Đội ngũ sẽ xử lý lại.', 'warning')
  }

  const handleRerun = async () => {
    if (!confirm('Chạy lại pipeline từ bước bị lỗi?')) return
    updateJobStatus(job.job_id, 'running')
    toast('Đang khởi động lại pipeline...', 'info')
    await new Promise((r) => setTimeout(r, 2000))
    updateJobStatus(job.job_id, 'outline_running')
  }

  const handleCancel = () => {
    if (!confirm('Bạn chắc chắn muốn hủy job này?')) return
    updateJobStatus(job.job_id, 'cancelled')
    toast(`Job ${job.job_id} đã được hủy`, 'warning')
  }

  const handleRegen = async (field: string) => {
    if (!confirm(`Tạo lại "${field}"?`)) return
    setRegenFields((f) => ({ ...f, [field]: true }))
    toast(`Đang tạo lại ${field}...`, 'info')
    await new Promise((r) => setTimeout(r, 2000))
    setRegenFields((f) => ({ ...f, [field]: false }))
    toast(`✓ Đã tạo lại ${field}`, 'success')
  }

  const totalDur = formatTotalDuration(job.step_durations)

  return (
    <AppShell breadcrumb={['AICPS', 'Danh sách Jobs', job.job_id]}>
      {/* Back */}
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ChevronLeft size={16} /> Danh sách Jobs
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{job.ten_san_pham}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <SiteBadge site={job.site_id} />
              <Badge className={job.job_type === 'blog_post' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                {job.job_type === 'blog_post' ? 'Blog Post' : 'Nội dung SP'}
              </Badge>
              <span className="text-xs text-gray-400">PIM: {job.pim_product_id}</span>
              <span className="text-xs text-gray-400">Ngành: {job.nganh_hang}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Tạo bởi <strong>{job.created_by}</strong> lúc {formatDateTime(job.created_at)}</span>
              <span>Cập nhật: {formatTimeAgo(job.updated_at)}</span>
              <span>Tổng thời gian: <strong>{totalDur}</strong></span>
              {job.run_id && (
                <span>Run ID: <code className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono text-[11px]">{job.run_id}</code></span>
              )}
              {job.last_run_at && <span>Chạy gần nhất: <strong>{formatDateTime(job.last_run_at)}</strong></span>}
            </div>
            {(job.emphasis || job.special_request) && (
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                {job.emphasis && <span>Nhấn mạnh: <strong className="text-gray-700">{job.emphasis}</strong></span>}
                {job.special_request && <span>Yêu cầu riêng: <strong className="text-gray-700">{job.special_request}</strong></span>}
              </div>
            )}
            {job.step_durations && (
              <div className="flex flex-wrap gap-3 mt-2">
                {Object.entries(job.step_durations).map(([k, v]) => (
                  v ? <span key={k} className="text-xs text-gray-400">{k.toUpperCase()}: {formatDuration(v)}</span> : null
                ))}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={job.status} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50">
          <JobProgressBar status={job.status} step_durations={job.step_durations} size="md" />
        </div>
      </div>

      {/* Ops note banner (từ pipeline n8n) */}
      {job.ops_note && <OpsNoteBanner note={job.ops_note} />}

      {/* Action bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={!canApp}
          onClick={() => setApproveOpen(true)}
        >
          <CheckCircle size={16} /> Approve & Publish
        </Button>
        <Button
          variant="danger"
          disabled={!canApp}
          onClick={() => setRejectOpen(true)}
        >
          <XCircle size={16} /> Từ chối
        </Button>
        <Button
          variant="warning"
          disabled={!canRe}
          onClick={handleRerun}
        >
          <RefreshCw size={16} /> Chạy lại WF
        </Button>
        <Button
          variant="outline"
          disabled={!canCan}
          onClick={handleCancel}
        >
          <Ban size={16} /> Hủy job
        </Button>
        {job.note && (
          <div className="flex-1 ml-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg flex items-center gap-1">
            <AlertTriangle size={12} /> {job.note}
          </div>
        )}
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-5 gap-4">
        {/* Left: Spec completeness + Output fields */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Spec completeness */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Độ hoàn thiện spec</span>
              <span className="text-sm font-bold text-gray-900">{job.spec_completeness}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  job.spec_completeness < 30 ? 'bg-red-500' :
                  job.spec_completeness < 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${job.spec_completeness}%` }}
              />
            </div>
            {job.spec_completeness < 70 && <SpecMissingFields job={job} />}
          </div>

          {/* Output fields */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Output Fields</h3>
            <div className="flex flex-col gap-1">
              <OutputFieldRow label="Tên sản phẩm" field="ten_san_pham" value={job.ten_san_pham} preview={job.ten_san_pham?.slice(0, 50)} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Meta SEO" field="meta_seo" value={job.meta_seo} preview={job.meta_seo ? `Title: ${job.meta_seo.title.slice(0, 40)}...` : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Thông số kỹ thuật" field="thong_so_ky_thuat" value={job.thong_so_ky_thuat} preview={job.thong_so_ky_thuat ? `${Object.keys(job.thong_so_ky_thuat).length} thông số` : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Đặc điểm nổi bật" field="dac_diem_noi_bat" value={job.dac_diem_noi_bat} preview={job.dac_diem_noi_bat ? `${job.dac_diem_noi_bat.length} điểm` : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Outline bài viết" field="outline" value={job.outline} preview={job.outline ? `${job.outline.split('\n').filter(l => l.startsWith('#')).length} sections` : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Nội dung HTML" field="content_html" value={job.content_html} preview={job.content_html ? `~${Math.round(job.content_html.replace(/<[^>]+>/g, ' ').split(' ').filter(Boolean).length)} từ` : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Ảnh Gallery (4 ảnh)" field="gallery_images" value={job.gallery_images?.length === 4 ? job.gallery_images : undefined} preview={job.gallery_images ? <ThumbnailRow images={job.gallery_images} /> : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Ảnh Slide (3 ảnh)" field="slide_images" value={job.slide_images?.length === 3 ? job.slide_images : undefined} preview={job.slide_images ? <ThumbnailRow images={job.slide_images} /> : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
              <OutputFieldRow label="Ảnh Thumbnail" field="thumb_url" value={job.thumb_url} preview={job.thumb_url ? <img src={job.thumb_url} className="w-10 h-10 rounded object-cover" /> : undefined} onRegen={handleRegen} regen={regenFields} running={isRunningStatus(job.status)} />
            </div>
          </div>
        </div>

        {/* Right: Content tabs */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {[
                { id: 'preview', label: 'HTML Preview' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'slide', label: 'Slide' },
                { id: 'thongso', label: 'Thông số' },
                { id: 'seo', label: 'Meta SEO' },
                { id: 'json', label: 'Spec JSON' },
                { id: 'errors', label: `Lỗi${job.error_log?.length ? ` (${job.error_log.length})` : ''}` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {activeTab === 'preview' && <HtmlPreviewTab job={job} />}
              {activeTab === 'gallery' && <GalleryTab images={job.gallery_images} />}
              {activeTab === 'slide' && <GalleryTab images={job.slide_images} cols={3} />}
              {activeTab === 'thongso' && <ThongSoTab job={job} />}
              {activeTab === 'seo' && <SeoTab job={job} />}
              {activeTab === 'json' && <JsonTab data={job.spec_final} />}
              {activeTab === 'errors' && <ErrorLogTab entries={job.error_log} />}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <ApproveDialog open={approveOpen} job={job} onClose={() => setApproveOpen(false)} onConfirm={handleApprove} />

      {/* Reject Dialog */}
      <RejectDialog open={rejectOpen} job={job} onClose={() => setRejectOpen(false)} onConfirm={handleReject} />
    </AppShell>
  )
}

// ─── Ops Note Banner ─────────────────────────────────────────────────────────
function OpsNoteBanner({ note }: { note: string }) {
  const isWarning = /auto-reset|kẹt|không phản hồi|timeout/i.test(note)
  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-4 flex items-start gap-2 text-sm ${
        isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}
    >
      {isWarning ? (
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      ) : (
        <Info size={16} className="mt-0.5 flex-shrink-0" />
      )}
      <div>
        <span className="font-semibold mr-1">{isWarning ? 'Cảnh báo vận hành:' : 'Ghi chú vận hành:'}</span>
        {note}
      </div>
    </div>
  )
}

// ─── Spec Missing Fields ─────────────────────────────────────────────────────
function SpecMissingFields({ job }: { job: Job }) {
  const missing = [
    !job.outline && 'Outline',
    !job.content_html && 'Nội dung HTML',
    !(job.gallery_images && job.gallery_images.length === 4) && 'Ảnh Gallery',
    !(job.slide_images && job.slide_images.length === 3) && 'Ảnh Slide',
    !job.thumb_url && 'Thumbnail',
    !job.meta_seo && 'Meta SEO',
    !job.thong_so_ky_thuat && 'Thông số KT',
    !job.dac_diem_noi_bat && 'Đặc điểm',
  ].filter(Boolean) as string[]
  if (missing.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {missing.map((f) => (
        <span key={f} className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{f}</span>
      ))}
    </div>
  )
}

// ─── Output Field Row ───────────────────────────────────────────────────────
function OutputFieldRow({
  label, field, value, preview, onRegen, regen, running,
}: {
  label: string; field: string; value: unknown; preview?: React.ReactNode; onRegen: (f: string) => void; regen: Record<string, boolean>; running: boolean
}) {
  const has = !!value && (Array.isArray(value) ? value.length > 0 : true)
  const isRegen = regen[field]
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <div className="flex-shrink-0">
        {isRegen ? (
          <Loader2 size={14} className="text-blue-500 animate-spin" />
        ) : has ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <X size={14} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {isRegen ? (
          <p className="text-xs text-blue-500">Đang tạo...</p>
        ) : has && preview ? (
          typeof preview === 'string' ? (
            <p className="text-xs text-gray-400 truncate">{preview}</p>
          ) : (
            <div className="mt-0.5">{preview}</div>
          )
        ) : (
          <p className="text-xs text-gray-300">Chưa có</p>
        )}
      </div>
      <button
        onClick={() => onRegen(field)}
        disabled={isRegen || running}
        title="Tạo lại"
        className="text-gray-300 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-30 transition-colors flex-shrink-0"
      >
        <RotateCcw size={13} />
      </button>
    </div>
  )
}

function ThumbnailRow({ images }: { images: { id: string; url: string }[] }) {
  return (
    <div className="flex gap-1 mt-0.5">
      {images.map((img) => (
        <img key={img.id} src={img.url} className="w-8 h-8 rounded object-cover" />
      ))}
    </div>
  )
}

// ─── Tab Components ──────────────────────────────────────────────────────────

/** Chèn ảnh slide vào ngay sau tiêu đề H3 tương ứng (mô phỏng bước merge WF5) */
function injectSectionImages(html: string, images?: ImageEntry[]): { html: string; injected: number } {
  if (!images?.length) return { html, injected: 0 }
  let out = html
  let injected = 0
  for (const img of images) {
    if (!img.section_h3 || out.includes(img.url)) continue
    const escaped = img.section_h3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(<h3[^>]*>\\s*${escaped}\\s*</h3>)`)
    if (re.test(out)) {
      out = out.replace(
        re,
        `$1<figure style="margin:12px 0"><img src="${img.url}" alt="${img.section_h3}" style="width:100%;border-radius:8px;display:block"/><figcaption style="font-size:11px;color:#94a3b8;margin-top:4px">Ảnh AI – gắn vào mục: ${img.section_h3}</figcaption></figure>`
      )
      injected++
    }
  }
  return { html: out, injected }
}

function HtmlPreviewTab({ job }: { job: Job }) {
  const baseHtml = job.final_html || job.content_html
  const [fullscreen, setFullscreen] = useState(false)
  const [showImages, setShowImages] = useState(true)
  if (!baseHtml) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300">
        <FileText size={40} className="mb-2" />
        <p>Bài viết chưa được tạo</p>
      </div>
    )
  }
  const { html, injected } = showImages
    ? injectSectionImages(baseHtml, job.slide_images)
    : { html: baseHtml, injected: 0 }
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showImages}
            onChange={(e) => setShowImages(e.target.checked)}
            className="accent-blue-600"
          />
          <ImagePlus size={12} />
          Chèn ảnh theo H3
          {showImages && injected > 0 && (
            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
              {injected} ảnh đã gắn
            </span>
          )}
        </label>
        <button
          onClick={() => setFullscreen(true)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Maximize2 size={12} /> Xem toàn màn hình
        </button>
      </div>
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        className="w-full rounded border border-gray-100"
        style={{ height: 480 }}
        title="HTML Preview"
      />
      {fullscreen && (
        <Dialog
          open={fullscreen}
          onClose={() => setFullscreen(false)}
          title="HTML Preview – Toàn màn hình"
          className="max-w-[85vw]"
        >
          <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            className="w-full rounded border border-gray-100"
            style={{ height: '75vh' }}
            title="HTML Preview Fullscreen"
          />
        </Dialog>
      )}
    </>
  )
}

function GalleryTab({ images, cols = 2 }: { images?: ImageEntry[]; cols?: number }) {
  const { toast } = useToast()
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-300">
        <Image size={40} className="mb-2" />
        <p>Ảnh chưa được tạo</p>
      </div>
    )
  }
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {images.map((img) => (
        <div key={img.id} className="border border-gray-100 rounded-lg overflow-hidden flex flex-col">
          <img src={img.url} alt={img.label} className="w-full object-cover" style={{ height: 140 }} />
          <div className="flex items-center gap-1 px-2 py-1.5">
            <p className="text-xs text-gray-500 truncate flex-1">{img.label}</p>
            <button
              onClick={() => { if (confirm(`Xóa ảnh "${img.label}"?`)) toast(`Đã xóa ảnh "${img.label}"`, 'success') }}
              title="Xóa ảnh"
              className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
          {(img.section_h3 || img.source_image || img.selection_reason) && (
            <div className="px-2 pb-2 space-y-1">
              {img.section_h3 && (
                <p className="text-[10px] text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 leading-snug">
                  → H3: {img.section_h3}
                </p>
              )}
              {img.source_image && (
                <p className="text-[10px] text-gray-500">
                  Ảnh gốc: <code className="bg-gray-100 px-1 rounded font-mono">{img.source_image}</code>
                </p>
              )}
              {img.selection_reason && (
                <details className="text-[10px] text-gray-500">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Lý do chọn ảnh</summary>
                  <p className="mt-1 bg-gray-50 rounded p-1.5 leading-relaxed text-gray-600">{img.selection_reason}</p>
                </details>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ThongSoTab({ job }: { job: Job }) {
  return (
    <div>
      {job.thong_so_ky_thuat && (
        <table className="w-full text-sm mb-4">
          <tbody>
            {Object.entries(job.thong_so_ky_thuat).map(([k, v]) => (
              <tr key={k} className="border-b border-gray-50">
                <td className="py-2 pr-4 text-xs font-medium text-gray-600 w-40">{k}</td>
                <td className="py-2 text-xs text-gray-800">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {job.dac_diem_noi_bat && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Đặc điểm nổi bật</p>
          <ul className="space-y-1">
            {job.dac_diem_noi_bat.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!job.thong_so_ky_thuat && !job.dac_diem_noi_bat && (
        <p className="text-sm text-gray-400 py-8 text-center">Chưa có thông số</p>
      )}
    </div>
  )
}

const SITE_DOMAINS: Record<string, string> = {
  avakids: 'avakids.vn',
  tgdd: 'thegioididong.com',
  dmx: 'dienmayxanh.com',
  topzone: 'topzone.vn',
  ntak: 'ntak.vn',
}

function SeoTab({ job }: { job: Job }) {
  if (!job.meta_seo) return <p className="text-sm text-gray-400 py-8 text-center">Meta SEO chưa được tạo</p>
  const { title, description, keywords } = job.meta_seo
  const titleLen = title.length
  const descLen = description.length
  const domain = SITE_DOMAINS[job.site_id] ?? `${job.site_id}.vn`
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Title ({titleLen}/60 ký tự)</label>
        <input readOnly value={title} className={`w-full border rounded-lg px-3 py-2 text-sm ${titleLen > 60 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`} />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Description ({descLen}/160 ký tự)</label>
        <textarea readOnly value={description} rows={3} className={`w-full border rounded-lg px-3 py-2 text-sm ${descLen > 160 ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`} />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Keywords</label>
        <div className="flex flex-wrap gap-1">
          {keywords.map((k, i) => <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{k}</span>)}
        </div>
      </div>
      {/* SERP Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <p className="text-[10px] text-gray-400 mb-2">SERP Preview</p>
        <p className="text-blue-700 text-sm font-medium truncate">{title}</p>
        <p className="text-green-700 text-xs">{domain} › san-pham</p>
        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{description}</p>
      </div>
    </div>
  )
}

function highlightJson(json: string): string {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        return /:$/.test(match)
          ? `<span class="text-blue-400">${match}</span>`
          : `<span class="text-green-400">${match}</span>`
      }
      if (/true|false|null/.test(match)) return `<span class="text-purple-400">${match}</span>`
      return `<span class="text-amber-400">${match}</span>`
    }
  )
}

function JsonTab({ data }: { data?: Record<string, unknown> }) {
  const { toast } = useToast()
  if (!data) return <p className="text-sm text-gray-400 py-8 text-center">Không có dữ liệu Spec</p>
  const json = JSON.stringify(data, null, 2)
  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => { navigator.clipboard.writeText(json); toast('Đã copy JSON', 'success') }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <Copy size={12} /> Copy JSON
        </button>
      </div>
      <pre
        className="bg-gray-900 rounded-lg p-4 text-xs overflow-auto max-h-96 font-mono"
        dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
      />
    </div>
  )
}

function ErrorLogTab({ entries }: { entries?: { wf: string; message: string; timestamp: string }[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-green-400">
        <CheckCircle size={40} className="mb-2" />
        <p className="text-sm">Không có lỗi</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={i} className="border border-red-100 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50">
            <Badge className="bg-red-200 text-red-700">{e.wf}</Badge>
            <span className="text-xs text-gray-500">{formatDateTime(e.timestamp)}</span>
          </div>
          <pre className="bg-red-50/50 px-3 py-2 text-xs text-red-800 font-mono whitespace-pre-wrap">{e.message}</pre>
        </div>
      ))}
    </div>
  )
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────
function ApproveDialog({ open, job, onClose, onConfirm }: { open: boolean; job: Job; onClose: () => void; onConfirm: (fields: string[]) => void }) {
  const fields = [
    { id: 'content_html', label: 'Nội dung HTML (final_html)' },
    { id: 'gallery_images', label: 'Ảnh Gallery (4 ảnh)' },
    { id: 'slide_images', label: 'Ảnh Slide (3 ảnh)' },
    { id: 'thumb_url', label: 'Ảnh Thumbnail' },
    { id: 'meta_seo', label: 'Meta SEO (title + description)' },
    { id: 'thong_so_ky_thuat', label: 'Thông số kỹ thuật' },
    { id: 'dac_diem_noi_bat', label: 'Đặc điểm nổi bật' },
  ]
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(fields.map((f) => [f.id, true]))
  )

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }))
  const selected = Object.entries(checked).filter(([, v]) => v).map(([k]) => k)

  return (
    <Dialog open={open} onClose={onClose} title={`Approve & Publish ${job.job_id}`} subtitle={`Chọn các field muốn ghi lên PIM Product ${job.pim_product_id}`}>
      <div className="space-y-2">
        {fields.map((f) => (
          <label key={f.id} className="flex items-center gap-3 cursor-pointer py-1 hover:bg-gray-50 rounded px-1">
            <input type="checkbox" checked={checked[f.id]} onChange={() => toggle(f.id)} className="accent-blue-600" />
            <span className="text-sm text-gray-700">{f.label}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
        <Button variant="primary" onClick={() => onConfirm(selected)} disabled={selected.length === 0}>
          <CheckCircle size={16} /> Confirm Publish
        </Button>
        <Button variant="outline" onClick={onClose}>Hủy</Button>
      </div>
    </Dialog>
  )
}

function RejectDialog({ open, onClose, onConfirm }: { open: boolean; job: Job; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  const regenOptions = [
    { id: 'content_html', label: 'Nội dung HTML (WF3)' },
    { id: 'gallery_images', label: 'Ảnh Gallery (WF4)' },
    { id: 'slide_images', label: 'Ảnh Slide (WF4)' },
    { id: 'outline', label: 'Outline (WF2)' },
  ]
  const [regenChecked, setRegenChecked] = useState<Record<string, boolean>>({})

  return (
    <Dialog open={open} onClose={onClose} title="Từ chối và yêu cầu chỉnh sửa">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do từ chối <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Mô tả vấn đề cần chỉnh sửa..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Field cần chạy lại:</p>
          <div className="space-y-1">
            {regenOptions.map((f) => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={regenChecked[f.id] ?? false}
                  onChange={() => setRegenChecked((c) => ({ ...c, [f.id]: !c[f.id] }))}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-600">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="danger" onClick={() => reason && onConfirm(reason)} disabled={!reason}>
            <XCircle size={16} /> Gửi từ chối
          </Button>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
        </div>
      </div>
    </Dialog>
  )
}
