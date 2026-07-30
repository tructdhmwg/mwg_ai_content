import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { useToast } from '../../components/ui/Toast'
import { usePosmStore } from '../../store/posmStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime } from '../../lib/utils'
import { PosmFlyerSketch } from './PosmFlyerSketch'
import { PosmDotBadge } from './PosmDotBadge'
import { PosmFlyerWireframe } from './PosmFlyerWireframe'
import { PosmMktArtworkSection } from './PosmMktArtworkSection'
import { PosmNhReviewSection } from './PosmNhReviewSection'
import { PosmSectionCard } from './PosmSectionCard'
import { allNhApproved, artworkSlots, campaignNganhHangs, FLYER_TIER_LIMITS, isFullyRegistered, LAYOUT_TYPES, SLOT_LAYOUT_TYPES, STATUS_META, WF_STATUS_META, wfTierResults, type PosmCampaign, type PosmCampaignGroup, type PosmCampaignStatus, type PosmMktArtwork, type PosmTier } from './posmMockData'

// editable: sửa thông tin/cấu trúc chiến dịch + duyệt chốt phiếu (chỉ tab Chiến dịch POSM)
// canRegister: ngành hàng đăng ký sản phẩm vào slot có sẵn + feedback/duyệt phần ngành hàng của mình (chỉ tab Dashboard NH)
// canUploadArtwork: MKT upload/upload lại thành phẩm, tự chuyển trạng thái "MKT done" + chạy AI Workflow check (chỉ tab Dashboard MKT)
// — 3 quyền tách biệt nhau; riêng nút chạy AI Workflow kiểm tra thành phẩm có ở CẢ 3 tab, và phần thành phẩm/kết quả
// AI Workflow + danh sách duyệt của các NH thì hiển thị (đọc) ở cả 3 tab.
const GROUP_CONFIG: Record<PosmCampaignGroup, { editable: boolean; canRegister: boolean; canUploadArtwork: boolean; backTo: string; tabLabel: string }> = {
  nh:          { editable: false, canRegister: true,  canUploadArtwork: false, backTo: '/posm/nh/dashboard',       tabLabel: 'Dashboard NH' },
  promotions:  { editable: true,  canRegister: false, canUploadArtwork: false, backTo: '/posm/promotions',         tabLabel: 'Chiến dịch POSM' },
  mkt:         { editable: false, canRegister: false, canUploadArtwork: true,  backTo: '/posm/marketing/dashboard', tabLabel: 'Dashboard MKT' },
}

function resolveGroup(pathname: string): PosmCampaignGroup {
  if (pathname.startsWith('/posm/nh/dashboard')) return 'nh'
  if (pathname.startsWith('/posm/marketing/dashboard')) return 'mkt'
  return 'promotions'
}

// Số tầng + cap slot mỗi tầng theo FLYER_TIER_LIMITS (mặt trước 2 tầng, mặt sau 3 tầng) — chỉ dùng nhãn "Tầng N" trơn lúc khởi tạo,
// cap thật (2/10 hoặc 4/5/8) được PosmFlyerSketch tính lại theo vị trí tầng khi hiển thị.
function defaultTiers(side: 'front' | 'back'): PosmTier[] {
  return FLYER_TIER_LIMITS[side].map((_, i) => ({ id: crypto.randomUUID(), label: `Tầng ${i + 1}`, categories: [] }))
}

// Liệt kê các tầng CHƯA lấp đầy đúng cap slot quy định (FLYER_TIER_LIMITS) — dùng để chặn lưu lúc tạo mới chiến dịch Tờ rơi.
function incompleteTiers(tiers: PosmTier[], caps: number[]): string[] {
  return tiers.reduce<string[]>((acc, t, i) => {
    const used = t.categories.reduce((sum, c) => sum + c.slotCount, 0)
    const cap = caps[i]
    if (used !== cap) acc.push(`${t.label} (${used}/${cap})`)
    return acc
  }, [])
}

const inputClass = 'w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]'
const labelClass = 'block text-xs font-medium text-[#475569] mb-1.5'

// 1 ô ngày trong vùng thông tin campaign — sửa được (input date) ở tab Chiến dịch POSM, còn lại chỉ đọc.
function DateField({ label, value, editable, onChange }: { label: string; value: string; editable: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {editable ? (
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <p className="text-sm text-[#0F172A]">{value ? formatDate(value) : '—'}</p>
      )}
    </div>
  )
}

export function PosmCampaignDetailPage() {
  const { id = '' } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { campaigns, addCampaign, updateCampaign } = usePosmStore()
  const authUser = useAuthStore((s) => s.user)

  const group = resolveGroup(pathname)
  const config = GROUP_CONFIG[group]
  const isCreate = config.editable && id === 'new'
  // Không lọc theo group — chiến dịch tạo/sửa ở tab Chiến dịch POSM hiện & xem được ở cả 3 tab
  const existing = !isCreate ? campaigns.find((c) => c.id === id) : undefined

  const [form, setForm] = useState(() => ({
    layoutType: existing?.layoutType ?? LAYOUT_TYPES[0],
    campaignName: existing?.campaignName ?? '',
    status: existing?.status ?? ('new' as PosmCampaignStatus),
    startDate: existing?.startDate ?? '',
    endDate: existing?.endDate ?? '',
    deployDate: existing?.deployDate ?? '',
    printDate: existing?.printDate ?? '',
    description: existing?.description ?? '',
    note: existing?.note ?? '',
    frontTiers: existing?.frontTiers ?? defaultTiers('front'),
    backTiers: existing?.backTiers ?? defaultTiers('back'),
    bannerCategories: existing?.bannerCategories ?? [],
    dataCheckStatus: existing?.dataCheckStatus,
    dataCheckCheckedAt: existing?.dataCheckCheckedAt,
    dataCheckResult: existing?.dataCheckResult,
  }))

  if (!isCreate && !existing) {
    return (
      <AppShell breadcrumb={['AICPS', 'Chiến dịch POSM', config.tabLabel]}>
        <p className="text-xs text-[#94A3B8]">Không tìm thấy chiến dịch.</p>
      </AppShell>
    )
  }

  const nameInputRef = useRef<HTMLInputElement>(null)
  const todayIso = new Date().toISOString().slice(0, 10)
  const currentUserName = authUser?.name ?? 'User POSM'

  const handleSave = () => {
    if (!form.campaignName.trim()) {
      toast('Vui lòng nhập tên campaign', 'error')
      nameInputRef.current?.focus()
      nameInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }

    // Tạo mới campaign Tờ rơi: bắt buộc mọi tầng (cả mặt trước & mặt sau) phải lấp đầy đúng số slot quy định
    // (FLYER_TIER_LIMITS) trước khi cho lưu — đảm bảo layout in ấn được hoạch định đủ ngay từ lúc tạo.
    if (isCreate && form.layoutType === 'Tờ rơi') {
      const gaps = [
        ...incompleteTiers(form.frontTiers, FLYER_TIER_LIMITS.front).map((g) => `Mặt trước ${g}`),
        ...incompleteTiers(form.backTiers, FLYER_TIER_LIMITS.back).map((g) => `Mặt sau ${g}`),
      ]
      if (gaps.length > 0) {
        toast(`Vui lòng cấu hình đủ slot cho: ${gaps.join(', ')}`, 'error')
        return
      }
    }

    if (isCreate) {
      // ID cột là số — phiếu mới lấy số kế tiếp lớn nhất hiện có
      const numericIds = campaigns.map((c) => Number(c.id)).filter((n) => Number.isFinite(n))
      const nextId = String(numericIds.length ? Math.max(...numericIds) + 1 : 1)
      const newCampaign: PosmCampaign = {
        id: nextId,
        group,
        createdAt: todayIso,
        createdBy: currentUserName,
        ...form,
      }
      addCampaign(newCampaign)
      toast('Đã tạo chiến dịch POSM', 'success')
      navigate(`${config.backTo}/${newCampaign.id}`, { replace: true })
    } else if (existing) {
      updateCampaign(existing.id, { ...form })
      toast('Đã cập nhật chiến dịch POSM', 'success')
    }
  }

  const title = isCreate ? 'Tạo chiến dịch POSM' : existing!.campaignName
  const editable = config.editable
  const canRegister = config.canRegister
  // Đăng ký/sửa dòng sản phẩm cho phép ở mọi trạng thái, TRỪ "Hoàn tất" (khoá cứng sau khi tab Chiến dịch POSM duyệt chốt).
  // Cột "Ngành hàng" luôn tĩnh (không sửa được) dù ở trạng thái nào — xử lý ngay trong PosmFlyerSketch/ProductTable.
  const canEditProducts = canRegister && existing?.status !== 'completed'
  // Vùng 2 (bố cục campaign) chỉ có nội dung với các layout dùng sơ đồ slot (Tờ rơi / Banner)
  const hasSlotLayout = SLOT_LAYOUT_TYPES.includes(form.layoutType)
  // Các trạng thái từ khi MKT đã trả thành phẩm trở đi ("MKT trả kết quả" → "NH duyệt" → "Hoàn tất") — dùng cho:
  // bật nút chạy AI Workflow kiểm tra thành phẩm (cả 3 tab), nút Duyệt của POSM, khu feedback/duyệt của NH,
  // và mặc định THU GỌN vùng bố cục (lúc này layout đã chốt, không cần mở ra nữa).
  const MKT_RESULT_STATUSES: PosmCampaignStatus[] = ['mkt_done', 'nh_approved', 'completed']
  const hasMktResult = !!existing && MKT_RESULT_STATUSES.includes(existing.status)
  // Vùng 3 (duyệt & AI) xuất hiện khi phiếu đã sang giai đoạn MKT trở đi — ẩn ở "Mới"/"Đang cập nhật"/"Đủ sản phẩm"
  // (lúc NH còn đang dựng danh sách sản phẩm, chưa có gì để duyệt/kiểm tra).
  const showApprovalRegion =
    !isCreate && !!existing &&
    (['transferred_mkt', 'mkt_proccessing', 'mkt_done', 'nh_approved', 'completed'] as PosmCampaignStatus[]).includes(existing.status)
  // NH chỉ duyệt được khi phiếu đang đúng ở "MKT trả kết quả"; duyệt xong hết ngành hàng thì phiếu sang "NH duyệt" (khoá lại)
  const canReview = canRegister && existing?.status === 'mkt_done'
  const artworkWfRunning = existing?.wfStatus === 'running'
  const nganhHangs = existing ? campaignNganhHangs(existing) : []

  // Tab Dashboard NH không có nút Lưu cho phần đăng ký slot (đăng ký sản phẩm lưu thẳng vào store ngay khi thao tác);
  // riêng feedback/duyệt có nút riêng (xem handleApproveNh / handleSaveNhFeedback).
  // Vừa đăng ký đủ mọi slot lúc đang "Mới"/"Đang cập nhật" → tự chuyển "Đủ sản phẩm"; nếu sau đó gỡ bớt khiến
  // thiếu lại thì tự lùi về "Đang cập nhật" — chỉ tác động 2 trạng thái tiền-MKT này, không đụng các giai đoạn sau.
  const persistIfRegisterOnly = (partial: Partial<PosmCampaign>) => {
    if (!canRegister || editable || !existing) return
    const nowFull = isFullyRegistered({ ...existing, ...partial })
    const statusPartial: Partial<PosmCampaign> =
      nowFull && (existing.status === 'new' || existing.status === 'checked') ? { status: 'products_full' }
      : !nowFull && existing.status === 'products_full' ? { status: 'checked' }
      : {}
    updateCampaign(existing.id, { ...partial, ...statusPartial })
  }

  // 1 NH bấm Duyệt cho ĐÚNG ngành hàng của mình → ghi 1 dòng duyệt (ai duyệt, lúc nào) cho ngành hàng đó.
  // Chỉ khi ngành hàng CUỐI CÙNG duyệt xong thì phiếu mới chuyển trạng thái sang "NH duyệt".
  const handleApproveNh = (nganhHang: string, feedback: string) => {
    if (!existing || !nganhHang) return
    const trimmed = feedback.trim() || undefined
    const nhApprovals = [
      ...(existing.nhApprovals ?? []).filter((a) => a.nganhHang !== nganhHang),
      // approvedBy chỉ cần tên người duyệt — ngành hàng đã là 1 cột riêng trong bảng chi tiết duyệt
      { nganhHang, approvedBy: currentUserName, approvedAt: new Date().toISOString(), feedback: trimmed },
    ]
    const allDone = allNhApproved({ ...existing, nhApprovals })
    updateCampaign(existing.id, {
      nhFeedback: trimmed ?? existing.nhFeedback,
      nhApprovals,
      nhApproved: allDone,
      status: allDone ? 'nh_approved' : existing.status,
    })
    toast(allDone ? `NH ${nganhHang} đã duyệt — đủ toàn bộ ngành hàng, chuyển "NH duyệt"` : `NH ${nganhHang} đã duyệt`, 'success')
  }

  const handleSaveNhFeedback = (feedback: string) => {
    if (!existing) return
    updateCampaign(existing.id, { nhFeedback: feedback.trim() || undefined })
    toast('Đã lưu feedback', 'success')
  }

  // Duyệt CHỐT của user tab Chiến dịch POSM → phiếu "Hoàn tất" (khoá luôn phần đăng ký sản phẩm của NH).
  // Đồng bộ luôn form.status để nút "Lưu thay đổi" sau đó không ghi đè trạng thái cũ.
  const handleApprovePosm = () => {
    if (!existing) return
    updateCampaign(existing.id, {
      status: 'completed',
      posmApproved: true,
      posmApprovedBy: currentUserName,
      posmApprovedAt: new Date().toISOString(),
    })
    setForm((f) => ({ ...f, status: 'completed' }))
    toast('Đã duyệt — chiến dịch chuyển "Hoàn tất"', 'success')
  }

  // Kiểm tra DỮ LIỆU chiến dịch bằng AI Workflow — chỉ tab Chiến dịch POSM tự chạy để soát lại cấu hình tầng/slot
  // + thông tin campaign trước khi lưu (khác WF kiểm tra thành phẩm MKT ở vùng 3, chạy trên form hiện tại, không cần existing).
  const handleRunDataCheck = () => {
    setForm((f) => ({ ...f, dataCheckStatus: 'running', dataCheckCheckedAt: undefined, dataCheckResult: undefined }))
    setTimeout(() => {
      setForm((f) => {
        const gaps = f.layoutType === 'Tờ rơi'
          ? [
              ...incompleteTiers(f.frontTiers, FLYER_TIER_LIMITS.front).map((g) => `Mặt trước ${g}`),
              ...incompleteTiers(f.backTiers, FLYER_TIER_LIMITS.back).map((g) => `Mặt sau ${g}`),
            ]
          : []
        const problems = [...(f.campaignName.trim() ? [] : ['thiếu tên campaign']), ...gaps]
        const passed = problems.length === 0
        return {
          ...f,
          dataCheckStatus: passed ? 'passed' : 'failed',
          dataCheckCheckedAt: new Date().toISOString(),
          dataCheckResult: passed
            ? 'AI Workflow: dữ liệu chiến dịch hợp lệ — đủ slot mọi tầng, thông tin campaign đầy đủ.'
            : `AI Workflow: phát hiện vấn đề — ${problems.join('; ')}.`,
        }
      })
    }, 1500)
  }

  // Upload thành phẩm ở tab Dashboard MKT: chuyển trạng thái "MKT Đang xử lý" trong lúc chạy ngầm AI Workflow check,
  // xong thì chuyển "MKT trả kết quả". Upload lại (khi đã có thành phẩm) sẽ chạy lại WF từ đầu — kết quả hiện ở cả 3 tab vì đọc thẳng từ `existing`.
  // Số hình cần theo layoutType (tờ rơi 2, standee 3, ...) — ghép nhãn theo LAYOUT_ARTWORK_SLOTS/artworkSlots().
  const handleUploadArtwork = (files: { url: string; name: string }[]) => {
    if (!existing) return
    const labels = artworkSlots(existing.layoutType)
    const mktArtworks: PosmMktArtwork[] = files.map((f, i) => ({
      id: crypto.randomUUID(),
      name: f.name,
      label: labels[i] ?? `Hình ${i + 1}`,
      url: f.url,
    }))
    updateCampaign(existing.id, {
      mktArtworks,
      mktArtworkUploadedAt: new Date().toISOString(),
      status: 'mkt_proccessing',
      wfStatus: 'running',
      wfCheckedAt: undefined,
      wfResult: undefined,
      wfResultDetails: undefined,
    })
    toast('Đã upload thành phẩm — đang chạy AI Workflow kiểm tra', 'info')

    setTimeout(() => {
      updateCampaign(existing.id, {
        status: 'mkt_done',
        wfStatus: 'passed',
        wfCheckedAt: new Date().toISOString(),
        wfResult: `AI Workflow: kiểm tra ${files.length}/${labels.length} hình — bố cục đúng chuẩn, đủ ngành hàng đăng ký, không phát hiện lỗi.`,
        wfResultDetails: wfTierResults(existing),
      })
    }, 2500)
  }

  // Chạy (lại) AI Workflow kiểm tra THÀNH PHẨM MKT đã nộp — nút này có ở CẢ 3 tab, bật từ khi "MKT trả kết quả" trở đi.
  // Ghi thẳng vào store nên kết quả hiện ngay ở khu "Thành phẩm MKT & kiểm tra AI" của cả 3 tab (đọc từ `existing`).
  const handleRecheckArtwork = () => {
    if (!existing) return
    const slotCount = artworkSlots(existing.layoutType).length
    const artworkCount = existing.mktArtworks?.length ?? 0
    updateCampaign(existing.id, { wfStatus: 'running', wfCheckedAt: undefined, wfResult: undefined, wfResultDetails: undefined })
    setTimeout(() => {
      updateCampaign(existing.id, {
        wfStatus: 'passed',
        wfCheckedAt: new Date().toISOString(),
        wfResult: `AI Workflow: kiểm tra lại ${artworkCount}/${slotCount} hình — bố cục đúng chuẩn, đủ ngành hàng đăng ký, không phát hiện lỗi.`,
        wfResultDetails: wfTierResults(existing),
      })
    }, 1500)
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Chiến dịch POSM', config.tabLabel, isCreate ? 'Tạo mới' : existing!.id]}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(config.backTo)} className="text-xs text-[#94A3B8] hover:text-[#0F172A]">← {config.tabLabel}</button>
          {!isCreate && (
            <>
              <span className="text-[#E2E8F0]">/</span>
              <span className="text-xs text-[#475569] font-mono">{existing!.id}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 mb-5 mt-2">
          <h1 className="text-lg font-semibold text-[#0F172A]">{title}</h1>
          {!isCreate && (
            <PosmDotBadge
              label={STATUS_META[existing!.status].label}
              dot={STATUS_META[existing!.status].dot}
              bg={STATUS_META[existing!.status].bg}
              color={STATUS_META[existing!.status].color}
            />
          )}
        </div>

        {/* ================= VÙNG 1 · THÔNG TIN CAMPAIGN ================= */}
        <PosmSectionCard title="Thông tin campaign">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Ngày tạo</label>
              <p className="text-sm text-[#0F172A]">{formatDate(isCreate ? todayIso : existing!.createdAt)}</p>
            </div>
            <div>
              <label className={labelClass}>Người tạo</label>
              <p className="text-sm text-[#0F172A]">{(isCreate ? currentUserName : existing!.createdBy) || '—'}</p>
            </div>
            <div>
              <label className={labelClass}>Trạng thái</label>
              {/* Chỉ đọc — trạng thái chuyển qua các nút hành động (Duyệt, upload thành phẩm, đăng ký đủ slot...),
                  không cho chọn tay để tránh lệch với luồng xử lý tương ứng. */}
              <p className="text-sm text-[#0F172A]">{STATUS_META[form.status].label}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Loại campaign</label>
              {editable ? (
                <select
                  value={form.layoutType}
                  onChange={(e) => setForm((f) => ({ ...f, layoutType: e.target.value }))}
                  className={inputClass}
                >
                  {LAYOUT_TYPES.map((lt) => <option key={lt} value={lt}>{lt}</option>)}
                </select>
              ) : (
                <p className="text-sm text-[#0F172A]">{form.layoutType}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Tên campaign {editable && <span style={{ color: '#EF4444' }}>*</span>}</label>
              {editable ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={form.campaignName}
                  onChange={(e) => setForm((f) => ({ ...f, campaignName: e.target.value }))}
                  placeholder="Tên chiến dịch POSM"
                  className={inputClass}
                />
              ) : (
                <p className="text-sm text-[#0F172A]">{form.campaignName}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Mô tả</label>
            {editable ? (
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Mô tả nội dung, mục tiêu của chiến dịch"
                className={`${inputClass} resize-none`}
              />
            ) : (
              <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{form.description || '—'}</p>
            )}
          </div>

          {/* Mốc thời gian: áp dụng (bắt đầu → kết thúc) + vận hành (triển khai tại điểm bán, in ấn) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DateField label="Ngày bắt đầu" value={form.startDate} editable={editable} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <DateField label="Ngày kết thúc" value={form.endDate} editable={editable} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
            <DateField label="Ngày triển khai" value={form.deployDate} editable={editable} onChange={(v) => setForm((f) => ({ ...f, deployDate: v }))} />
            <DateField label="Ngày in" value={form.printDate} editable={editable} onChange={(v) => setForm((f) => ({ ...f, printDate: v }))} />
          </div>

          <div>
            <label className={labelClass}>Ghi chú</label>
            {editable ? (
              <textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="Ghi chú thêm (nếu có)"
                className={`${inputClass} resize-none`}
              />
            ) : (
              <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{form.note || '—'}</p>
            )}
          </div>

          {/* Lưu/Hủy nằm ngay trong vùng thông tin campaign — sát các field mà nút này lưu.
              Vẫn lưu cả cấu hình tầng/slot của vùng 2 (chung 1 form state). */}
          {editable && (
            <div className="flex gap-2 pt-4 border-t border-[#F1F5F9]">
              <OcpsButton variant="primary" onClick={handleSave}>{isCreate ? 'Tạo campaign' : 'Lưu thay đổi'}</OcpsButton>
              <OcpsButton type="button" variant="ghost" onClick={() => navigate(config.backTo)}>Hủy</OcpsButton>
            </div>
          )}
        </PosmSectionCard>

        {/* ================= VÙNG 2 · BỐ CỤC CAMPAIGN =================
            Sơ đồ (cấu hình tầng/slot + đăng ký sản phẩm) và phác thảo bố cục in.
            Thu gọn được; mặc định THU GỌN từ khi MKT trả kết quả trở đi vì layout đã chốt. */}
        {hasSlotLayout && (
          <PosmSectionCard
            title="Bố cục campaign"
            hint={`Layout ${form.layoutType}`}
            collapsible
            defaultCollapsed={hasMktResult}
          >
            <PosmFlyerWireframe layoutType={form.layoutType} frontTiers={form.frontTiers} backTiers={form.backTiers} />

            <PosmFlyerSketch
              layoutType={form.layoutType}
              editable={editable}
              canRegister={canEditProducts}
              frontTiers={form.frontTiers}
              backTiers={form.backTiers}
              bannerCategories={form.bannerCategories}
              onChangeFrontTiers={(tiers) => { setForm((f) => ({ ...f, frontTiers: tiers })); persistIfRegisterOnly({ frontTiers: tiers }) }}
              onChangeBackTiers={(tiers) => { setForm((f) => ({ ...f, backTiers: tiers })); persistIfRegisterOnly({ backTiers: tiers }) }}
              onChangeBannerCategories={(categories) => { setForm((f) => ({ ...f, bannerCategories: categories })); persistIfRegisterOnly({ bannerCategories: categories }) }}
            />

            {/* AI Workflow soát DỮ LIỆU cấu hình (tầng/slot, thông tin campaign) — chỉ tab Chiến dịch POSM.
                Ẩn hẳn ở trạng thái "Mới": phiếu vừa tạo thì chưa có thông tin AI nào để hiện. */}
            {editable && form.status !== 'new' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[#475569]">Kiểm tra dữ liệu chiến dịch bằng AI Workflow</p>
                  {form.dataCheckStatus && (
                    <PosmDotBadge
                      label={WF_STATUS_META[form.dataCheckStatus].label}
                      dot={WF_STATUS_META[form.dataCheckStatus].dot}
                      bg={WF_STATUS_META[form.dataCheckStatus].bg}
                      color={WF_STATUS_META[form.dataCheckStatus].color}
                    />
                  )}
                </div>
                <div className="border border-[#E2E8F0] rounded-lg p-3 space-y-2">
                  {form.dataCheckResult && form.dataCheckStatus !== 'running' && (
                    <p className="text-xs text-[#475569]">{form.dataCheckResult}</p>
                  )}
                  {form.dataCheckCheckedAt && form.dataCheckStatus !== 'running' && (
                    <p className="text-[11px] text-[#94A3B8]">Kiểm tra lúc: {formatDateTime(form.dataCheckCheckedAt)}</p>
                  )}
                  <OcpsButton size="sm" onClick={handleRunDataCheck} disabled={form.dataCheckStatus === 'running'}>
                    {form.dataCheckStatus === 'running' ? (
                      <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Đang chạy AI Workflow...</span>
                    ) : 'AI kiểm tra dữ liệu chiến dịch'}
                  </OcpsButton>
                </div>
              </div>
            )}
          </PosmSectionCard>
        )}

        {/* ================= VÙNG 3 · DUYỆT & AI =================
            Thành phẩm MKT (MKT upload) · nút chạy AI Workflow kiểm tra thành phẩm (cả 3 tab) ·
            nút Duyệt (POSM chốt phiếu ở tab Chiến dịch POSM, NH duyệt phần ngành hàng của mình ở Dashboard NH) ·
            danh sách người duyệt + thời gian duyệt của các NH. */}
        {showApprovalRegion && (
          <PosmSectionCard title="Duyệt & AI kiểm tra">
            <PosmMktArtworkSection
              canUpload={config.canUploadArtwork}
              layoutType={existing!.layoutType}
              artworks={existing!.mktArtworks}
              uploadedAt={existing!.mktArtworkUploadedAt}
              wfStatus={existing!.wfStatus}
              wfCheckedAt={existing!.wfCheckedAt}
              wfResult={existing!.wfResult}
              wfResultDetails={existing!.wfResultDetails}
              onUpload={handleUploadArtwork}
            />

            <div className="flex flex-wrap items-center gap-2">
              <OcpsButton
                size="sm"
                variant="outline"
                onClick={handleRecheckArtwork}
                disabled={!hasMktResult || artworkWfRunning}
                title={!hasMktResult ? 'Chỉ chạy được khi MKT đã trả kết quả' : undefined}
              >
                {artworkWfRunning ? (
                  <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Đang chạy AI Workflow...</span>
                ) : 'AI kiểm tra thành phẩm'}
              </OcpsButton>

              {/* Duyệt chốt của POSM — chỉ tab Chiến dịch POSM, chuyển phiếu sang "Hoàn tất" */}
              {editable && (
                <OcpsButton
                  size="sm"
                  variant="success"
                  onClick={handleApprovePosm}
                  disabled={!hasMktResult || existing!.status === 'completed'}
                  title={
                    existing!.status === 'completed' ? 'Chiến dịch đã được duyệt chốt'
                    : !hasMktResult ? 'Chỉ duyệt được khi MKT đã trả kết quả'
                    : undefined
                  }
                >
                  Duyệt
                </OcpsButton>
              )}

              {existing!.posmApproved && (
                <span className="text-xs text-[#16A34A] font-medium">
                  ✓ POSM đã duyệt · {existing!.posmApprovedBy}
                  {existing!.posmApprovedAt ? ` · ${formatDateTime(existing!.posmApprovedAt)}` : ''}
                </span>
              )}
            </div>

            <PosmNhReviewSection
              visible={hasMktResult}
              canReview={canReview}
              nganhHangs={nganhHangs}
              feedback={existing!.nhFeedback}
              approvals={existing!.nhApprovals}
              onApprove={handleApproveNh}
              onSaveFeedback={handleSaveNhFeedback}
            />
          </PosmSectionCard>
        )}

      </div>
    </AppShell>
  )
}
