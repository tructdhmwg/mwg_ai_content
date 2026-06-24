import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Check, Upload, X, FileText, Image, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { SiteBadge } from '../components/ui/Badge'
import { useJobStore } from '../store/jobStore'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/ui/Toast'
import { SITE_META, NGANH_HANG_BY_SITE, type SiteId } from '../types'
import { generateJobId } from '../lib/utils'

const STEPS = ['Thông tin cơ bản', 'Nguồn dữ liệu', 'Xem lại & Tạo']

export function CreateJobPage() {
  const navigate = useNavigate()
  const { addJob } = useJobStore()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 state
  const [site, setSite] = useState<SiteId | ''>('')

  const [nganh, setNganh] = useState('')
  const [pimId, setPimId] = useState('')
  const [tenSP, setTenSP] = useState('')
  const [note, setNote] = useState('')
  const [emphasis, setEmphasis] = useState('')
  const [specialRequest, setSpecialRequest] = useState('')
  const [useResearch, setUseResearch] = useState(false)

  // Step 2 state
  const [linkWeb, setLinkWeb] = useState('')
  const [linkExtra, setLinkExtra] = useState('')
  const [specFiles, setSpecFiles] = useState<File[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const step1Valid = site && nganh && pimId.trim() && tenSP.trim().length >= 5
  const step2Valid = linkWeb || linkExtra || specFiles.length > 0 || imageFiles.length > 0

  const handleNext = () => {
    if (step === 0 && !step1Valid) { toast('Vui lòng điền đủ thông tin', 'error'); return }
    if (step === 1 && !step2Valid) { toast('Cần ít nhất 1 nguồn dữ liệu (link hoặc file)', 'error'); return }
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    const newId = generateJobId()
    addJob({
      job_id: newId,
      site_id: site as SiteId,
      job_type: 'blog_post',
      pim_product_id: pimId,
      ten_san_pham: tenSP,
      nganh_hang: nganh,
      status: 'running',
      spec_completeness: 0,
      created_by: user?.name ?? 'Unknown',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      note: note || undefined,
      emphasis: emphasis || undefined,
      special_request: specialRequest || undefined,
      use_external_research: useResearch,
      reference_url: linkWeb || undefined,
    })
    setSubmitting(false)
    toast(`Đã tạo ${newId} và bắt đầu pipeline`, 'success')
    navigate(`/jobs/${newId}`)
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Tạo Job mới']}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Tạo Job Blog mới</h1>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i < step ? 'bg-blue-600 border-blue-600 text-white' :
                  i === step ? 'border-blue-600 text-blue-600' :
                  'border-gray-300 text-gray-400'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? 'text-blue-600' : ''}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {step === 0 && (
            <Step1
              site={site} setSite={(s) => { setSite(s); setNganh('') }}
              nganh={nganh} setNganh={setNganh}
              pimId={pimId} setPimId={setPimId}
              tenSP={tenSP} setTenSP={setTenSP}
              note={note} setNote={setNote}
              emphasis={emphasis} setEmphasis={setEmphasis}
              specialRequest={specialRequest} setSpecialRequest={setSpecialRequest}
            />
          )}
          {step === 1 && (
            <Step2
              linkWeb={linkWeb} setLinkWeb={setLinkWeb}
              linkExtra={linkExtra} setLinkExtra={setLinkExtra}
              specFiles={specFiles} setSpecFiles={setSpecFiles}
              imageFiles={imageFiles} setImageFiles={setImageFiles}
              useResearch={useResearch} setUseResearch={setUseResearch}
            />
          )}
          {step === 2 && (
            <Step3
              site={site as SiteId} nganh={nganh}
              pimId={pimId} tenSP={tenSP} note={note}
              emphasis={emphasis} specialRequest={specialRequest} useResearch={useResearch}
              linkWeb={linkWeb} linkExtra={linkExtra}
              specFiles={specFiles} imageFiles={imageFiles}
            />
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  <ChevronLeft size={16} /> Quay lại
                </Button>
              )}
            </div>
            <div>
              {step < 2 ? (
                <Button onClick={handleNext}>
                  Tiếp theo <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} size="lg">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  🚀 Tạo Job & Bắt đầu Pipeline
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────
function Step1({
  site, setSite, nganh, setNganh,
  pimId, setPimId, tenSP, setTenSP, note, setNote,
  emphasis, setEmphasis, specialRequest, setSpecialRequest,
}: {
  site: SiteId | ''; setSite: (s: SiteId) => void
  nganh: string; setNganh: (n: string) => void
  pimId: string; setPimId: (v: string) => void
  tenSP: string; setTenSP: (v: string) => void
  note: string; setNote: (v: string) => void
  emphasis: string; setEmphasis: (v: string) => void
  specialRequest: string; setSpecialRequest: (v: string) => void
}) {
  const sites = Object.entries(SITE_META) as [SiteId, typeof SITE_META[SiteId]][]
  const nganhOptions = site ? NGANH_HANG_BY_SITE[site] : []

  return (
    <div className="space-y-5">
      {/* Site selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn Site <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-5 gap-2">
          {sites.map(([k, v]) => (
            <button
              key={k}
              onClick={() => setSite(k)}
              className={`border-2 rounded-xl p-3 text-center text-xs font-semibold transition-all ${
                site === k
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
              style={site === k ? { borderColor: v.color } : {}}
            >
              <div className="w-5 h-5 rounded-full mx-auto mb-1" style={{ background: v.color }} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job type — fixed to Blog Post */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Loại job</label>
        <div className="border-2 border-purple-500 bg-purple-50 rounded-xl p-4 text-left">
          <p className="text-sm font-semibold text-gray-800">Blog Post</p>
          <p className="text-xs text-gray-500 mt-0.5">Bài viết blog, review, so sánh. Nội dung sản phẩm được quản lý tại mục Sản phẩm PIM.</p>
        </div>
      </div>

      {/* Nganh hang */}
      {site && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ngành hàng <span className="text-red-500">*</span></label>
          <select
            value={nganh}
            onChange={(e) => setNganh(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Chọn ngành hàng</option>
            {nganhOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      {/* PIM ID */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIM Product ID <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={pimId}
          onChange={(e) => setPimId(e.target.value)}
          placeholder="Nhập mã sản phẩm từ PIM..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Ten SP */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={tenSP}
          onChange={(e) => setTenSP(e.target.value)}
          placeholder="Tên hiển thị trong hệ thống AICPS"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {tenSP && tenSP.length < 5 && <p className="text-xs text-red-500 mt-1">Tối thiểu 5 ký tự</p>}
      </div>

      {/* Emphasis */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yếu tố muốn nhấn mạnh <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
        <input
          type="text"
          value={emphasis}
          onChange={(e) => setEmphasis(e.target.value)}
          placeholder="VD: Kích thước, công nghệ, camera, pin..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-xs text-gray-400 mt-1">AI sẽ ưu tiên triển khai các yếu tố này khi lên outline</p>
      </div>

      {/* Special request */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Yêu cầu riêng <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
        <textarea
          value={specialRequest}
          onChange={(e) => setSpecialRequest(e.target.value)}
          rows={2}
          placeholder="VD: Đưa phần kết nối, chơi game lên đầu bài..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-xs text-gray-400 mt-1">Yêu cầu về bố cục, thứ tự section, nội dung bắt buộc có/không có</p>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ghi chú cho AI <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Lưu ý đặc biệt về sản phẩm, giọng văn..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  )
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────
function Step2({
  linkWeb, setLinkWeb, linkExtra, setLinkExtra,
  specFiles, setSpecFiles, imageFiles, setImageFiles,
  useResearch, setUseResearch,
}: {
  linkWeb: string; setLinkWeb: (v: string) => void
  linkExtra: string; setLinkExtra: (v: string) => void
  specFiles: File[]; setSpecFiles: (f: File[]) => void
  imageFiles: File[]; setImageFiles: (f: File[]) => void
  useResearch: boolean; setUseResearch: (v: boolean) => void
}) {
  return (
    <div className="space-y-6">
      {/* Links */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Link web</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Link tham khảo trang hãng</label>
            <input type="url" value={linkWeb} onChange={(e) => setLinkWeb(e.target.value)}
              placeholder="https://manufacturer.com/product..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <p className="text-xs text-gray-400 mt-1">AI dùng trang sản phẩm chính hãng để đối chiếu spec và bổ sung thông tin</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Link bổ sung</label>
            <input type="url" value={linkExtra} onChange={(e) => setLinkExtra(e.target.value)}
              placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
      </div>

      {/* External research toggle */}
      <div className="flex items-start justify-between gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Dùng research ngoài</p>
          <p className="text-xs text-gray-400 mt-0.5">Cho phép AI tìm kiếm thêm thông tin trên internet ngoài spec và link đã cung cấp</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useResearch}
          onClick={() => setUseResearch(!useResearch)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            useResearch ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            useResearch ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Spec files */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">File spec hãng</h3>
        <p className="text-xs text-gray-400 mb-3">PDF, DOCX, XLSX · tối đa 5 file, 20MB/file</p>
        <FileDropZone
          accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }}
          maxFiles={5} maxSize={20 * 1024 * 1024}
          files={specFiles} onFilesChange={setSpecFiles}
          label="Kéo thả file spec vào đây"
          icon={<FileText size={24} className="text-gray-400" />}
        />
      </div>

      {/* Image files */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Ảnh sản phẩm gốc</h3>
        <p className="text-xs text-gray-400 mb-3">JPG, PNG, WEBP · tối đa 10 ảnh, 10MB/ảnh</p>
        <FileDropZone
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
          maxFiles={10} maxSize={10 * 1024 * 1024}
          files={imageFiles} onFilesChange={setImageFiles}
          label="Kéo thả ảnh vào đây"
          icon={<Image size={24} className="text-gray-400" />}
          showPreviews
        />
      </div>
    </div>
  )
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────
function Step3({
  site, nganh, pimId, tenSP, note,
  emphasis, specialRequest, useResearch,
  linkWeb, linkExtra, specFiles, imageFiles,
}: {
  site: SiteId; nganh: string; pimId: string; tenSP: string; note: string
  emphasis: string; specialRequest: string; useResearch: boolean
  linkWeb: string; linkExtra: string; specFiles: File[]; imageFiles: File[]
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 mb-4">Xem lại thông tin</h3>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <Row label="Site"><SiteBadge site={site} /></Row>
        <Row label="Loại job"><span className="text-sm text-purple-700 font-medium">Blog Post</span></Row>
        <Row label="Ngành hàng"><span className="text-sm text-gray-700">{nganh}</span></Row>
        <Row label="PIM ID"><span className="text-sm font-mono text-blue-600">{pimId}</span></Row>
        <Row label="Tên sản phẩm"><span className="text-sm text-gray-700 font-medium">{tenSP}</span></Row>
        {emphasis && <Row label="Yếu tố nhấn mạnh"><span className="text-sm text-gray-600">{emphasis}</span></Row>}
        {specialRequest && <Row label="Yêu cầu riêng"><span className="text-sm text-gray-600">{specialRequest}</span></Row>}
        <Row label="Research ngoài">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${useResearch ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
            {useResearch ? 'Bật' : 'Tắt'}
          </span>
        </Row>
        {note && <Row label="Ghi chú AI"><span className="text-sm text-gray-600">{note}</span></Row>}
        {linkWeb && <Row label="Link tham khảo hãng"><span className="text-xs text-blue-500 break-all">{linkWeb}</span></Row>}
        {linkExtra && <Row label="Link bổ sung"><span className="text-xs text-blue-500 break-all">{linkExtra}</span></Row>}
      </div>

      {(specFiles.length > 0 || imageFiles.length > 0) && (
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Files đính kèm</p>
          <div className="space-y-1">
            {specFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <FileText size={12} className="text-blue-500 flex-shrink-0" />
                {f.name} <span className="text-gray-400">({(f.size / 1024).toFixed(0)}KB)</span>
              </div>
            ))}
            {imageFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Image size={12} className="text-green-500 flex-shrink-0" />
                {f.name} <span className="text-gray-400">({(f.size / 1024).toFixed(0)}KB)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        Sau khi tạo, job sẽ tự động chạy qua 5 bước pipeline (WF1 → WF5). Thời gian ước tính: 15-30 phút.
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <div>{children}</div>
    </div>
  )
}

// ─── FileDropZone ─────────────────────────────────────────────────────────────
function FileDropZone({
  accept, maxFiles, maxSize, files, onFilesChange, label, icon, showPreviews,
}: {
  accept: Record<string, string[]>; maxFiles: number; maxSize: number
  files: File[]; onFilesChange: (f: File[]) => void
  label: string; icon: React.ReactNode; showPreviews?: boolean
}) {
  const { toast } = useToast()

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    if (rejected.length > 0) {
      toast('Có file không hợp lệ (sai loại hoặc vượt kích thước)', 'error')
    }
    const combined = [...files, ...accepted].slice(0, maxFiles)
    onFilesChange(combined)
  }, [files, maxFiles, onFilesChange, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, maxFiles: maxFiles - files.length, maxSize,
  })

  const remove = (i: number) => onFilesChange(files.filter((_, idx) => idx !== i))

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {icon}
          <div className="flex items-center gap-1 text-gray-400">
            <Upload size={14} />
            <span className="text-sm">{isDragActive ? 'Thả file vào đây...' : label}</span>
          </div>
          <p className="text-xs text-gray-300">hoặc click để chọn file</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              {showPreviews && f.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(f)} className="w-8 h-8 rounded object-cover" alt="" />
              ) : (
                <FileText size={14} className="text-blue-500 flex-shrink-0" />
              )}
              <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
              <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
              <div className="h-1 w-16 bg-green-500 rounded-full" />
              <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
