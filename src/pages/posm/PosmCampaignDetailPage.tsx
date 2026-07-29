import { useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { Card } from '../../features/ocps/components/Card'
import { OcpsButton } from '../../features/ocps/components/OcpsButton'
import { useToast } from '../../components/ui/Toast'
import { usePosmStore } from '../../store/posmStore'
import { formatDate } from '../../lib/utils'
import { PosmFlyerSketch } from './PosmFlyerSketch'
import { PosmDotBadge } from './PosmDotBadge'
import { PosmMktArtworkSection } from './PosmMktArtworkSection'
import { LAYOUT_TYPES, STATUS_META, type PosmCampaign, type PosmCampaignGroup, type PosmCampaignStatus, type PosmTier } from './posmMockData'

// editable: sửa thông tin/cấu trúc chiến dịch (chỉ tab Chiến dịch POSM)
// canRegister: ngành hàng đăng ký sản phẩm vào slot có sẵn (chỉ tab Dashboard NH)
// canUploadArtwork: MKT upload/upload lại thành phẩm, tự chuyển trạng thái "MKT done" + chạy AI Workflow check (chỉ tab Dashboard MKT)
// — 3 quyền tách biệt nhau, phần thành phẩm/kết quả AI Workflow hiển thị (đọc) ở cả 3 tab
const GROUP_CONFIG: Record<PosmCampaignGroup, { editable: boolean; canRegister: boolean; canUploadArtwork: boolean; backTo: string; tabLabel: string; idPrefix: string }> = {
  nh:          { editable: false, canRegister: true,  canUploadArtwork: false, backTo: '/posm/nh/dashboard',       tabLabel: 'Dashboard NH',    idPrefix: 'POSM-NH' },
  promotions:  { editable: true,  canRegister: false, canUploadArtwork: false, backTo: '/posm/promotions',         tabLabel: 'Chiến dịch POSM', idPrefix: 'KM-POSM' },
  mkt:         { editable: false, canRegister: false, canUploadArtwork: true,  backTo: '/posm/marketing/dashboard', tabLabel: 'Dashboard MKT',   idPrefix: 'MKT-POSM' },
}

function resolveGroup(pathname: string): PosmCampaignGroup {
  if (pathname.startsWith('/posm/nh/dashboard')) return 'nh'
  if (pathname.startsWith('/posm/marketing/dashboard')) return 'mkt'
  return 'promotions'
}

function defaultTiers(): PosmTier[] {
  return [
    { id: crypto.randomUUID(), label: 'Tầng 1', categories: [] },
    { id: crypto.randomUUID(), label: 'Tầng 2', categories: [] },
  ]
}

const inputClass = 'w-full text-xs border border-[#E2E8F0] rounded px-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6]'
const labelClass = 'block text-xs font-medium text-[#475569] mb-1.5'

export function PosmCampaignDetailPage() {
  const { id = '' } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { campaigns, addCampaign, updateCampaign } = usePosmStore()

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
    description: existing?.description ?? '',
    note: existing?.note ?? '',
    frontTiers: existing?.frontTiers ?? defaultTiers(),
    backTiers: existing?.backTiers ?? defaultTiers(),
    bannerCategories: existing?.bannerCategories ?? [],
  }))

  if (!isCreate && !existing) {
    return (
      <AppShell breadcrumb={['AICPS', 'Chiến dịch POSM', config.tabLabel]}>
        <p className="text-xs text-[#94A3B8]">Không tìm thấy chiến dịch.</p>
      </AppShell>
    )
  }

  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!form.campaignName.trim()) {
      toast('Vui lòng nhập tên campaign', 'error')
      nameInputRef.current?.focus()
      nameInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }

    if (isCreate) {
      const newCampaign: PosmCampaign = {
        id: `${config.idPrefix}-${Date.now().toString().slice(-6)}`,
        group,
        createdAt: new Date().toISOString().slice(0, 10),
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
  // Feedback + duyệt từng dòng sản phẩm — chỉ NH thao tác được, và chỉ khi chiến dịch đang ở trạng thái "MKT trả kết quả"
  const showReview = existing?.status === 'mkt_done'
  const canReview = canRegister && showReview

  // Tab Dashboard NH không có nút Lưu riêng (toàn bộ phần còn lại chỉ xem) — đăng ký/feedback/duyệt sản phẩm vào slot
  // lưu thẳng vào store ngay khi thao tác, không chờ hành động Lưu nào khác.
  const persistIfRegisterOnly = (partial: Partial<PosmCampaign>) => {
    if (canRegister && !editable && existing) updateCampaign(existing.id, partial)
  }

  // Upload thành phẩm ở tab Dashboard MKT: chuyển trạng thái "MKT Đang xử lý" trong lúc chạy ngầm AI Workflow check,
  // xong thì chuyển "MKT trả kết quả". Upload lại (khi đã có thành phẩm) sẽ chạy lại WF từ đầu — kết quả hiện ở cả 3 tab vì đọc thẳng từ `existing`.
  const handleUploadArtwork = (file: { url: string; name: string }) => {
    if (!existing) return
    updateCampaign(existing.id, {
      mktArtworkUrl: file.url,
      mktArtworkName: file.name,
      mktArtworkUploadedAt: new Date().toISOString(),
      status: 'mkt_proccessing',
      wfStatus: 'running',
      wfCheckedAt: undefined,
      wfResult: undefined,
    })
    toast('Đã upload thành phẩm — đang chạy AI Workflow kiểm tra', 'info')

    setTimeout(() => {
      updateCampaign(existing.id, {
        status: 'mkt_done',
        wfStatus: 'passed',
        wfCheckedAt: new Date().toISOString(),
        wfResult: 'AI Workflow: bố cục đúng chuẩn, đủ ngành hàng đăng ký, không phát hiện lỗi.',
      })
    }, 2500)
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
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-lg font-semibold text-[#0F172A]">{title}</h1>
          {!editable && !isCreate && (
            <PosmDotBadge
              label={STATUS_META[existing!.status].label}
              dot={STATUS_META[existing!.status].dot}
              bg={STATUS_META[existing!.status].bg}
              color={STATUS_META[existing!.status].color}
            />
          )}
        </div>

        <Card className="space-y-5">
          {!isCreate && (
            <p className="text-xs text-[#94A3B8]">Ngày tạo: {formatDate(existing!.createdAt)}</p>
          )}

          {/* Loại layout + Tên campaign — đặt trước sơ đồ layout để không bị bỏ sót khi cấu hình tầng/slot dài */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Loại layout</label>
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

          <PosmFlyerSketch
            layoutType={form.layoutType}
            editable={editable}
            canRegister={canRegister}
            canReview={canReview}
            showReview={showReview}
            frontTiers={form.frontTiers}
            backTiers={form.backTiers}
            bannerCategories={form.bannerCategories}
            onChangeFrontTiers={(tiers) => { setForm((f) => ({ ...f, frontTiers: tiers })); persistIfRegisterOnly({ frontTiers: tiers }) }}
            onChangeBackTiers={(tiers) => { setForm((f) => ({ ...f, backTiers: tiers })); persistIfRegisterOnly({ backTiers: tiers }) }}
            onChangeBannerCategories={(categories) => { setForm((f) => ({ ...f, bannerCategories: categories })); persistIfRegisterOnly({ bannerCategories: categories }) }}
          />

          {/* Trạng thái (chỉ hiện dropdown khi sửa, không hiện lúc tạo mới) + Thời gian áp dụng */}
          <div className={`grid grid-cols-1 gap-4 ${editable && !isCreate ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {editable && !isCreate && (
              <div>
                <label className={labelClass}>Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PosmCampaignStatus }))}
                  className={inputClass}
                >
                  {(Object.keys(STATUS_META) as PosmCampaignStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Ngày bắt đầu</label>
              {editable ? (
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="text-sm text-[#0F172A]">{form.startDate ? formatDate(form.startDate) : '—'}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Ngày kết thúc</label>
              {editable ? (
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className={inputClass}
                />
              ) : (
                <p className="text-sm text-[#0F172A]">{form.endDate ? formatDate(form.endDate) : '—'}</p>
              )}
            </div>
          </div>

          {/* Mô tả */}
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

          {/* Ghi chú */}
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

          {!isCreate && (
            <PosmMktArtworkSection
              canUpload={config.canUploadArtwork}
              artworkUrl={existing!.mktArtworkUrl}
              artworkName={existing!.mktArtworkName}
              uploadedAt={existing!.mktArtworkUploadedAt}
              wfStatus={existing!.wfStatus}
              wfCheckedAt={existing!.wfCheckedAt}
              wfResult={existing!.wfResult}
              onUpload={handleUploadArtwork}
            />
          )}

          {editable && (
            <div className="flex gap-2 pt-2">
              <OcpsButton variant="primary" onClick={handleSave}>{isCreate ? 'Tạo campaign' : 'Lưu thay đổi'}</OcpsButton>
              <OcpsButton type="button" variant="ghost" onClick={() => navigate(config.backTo)}>Hủy</OcpsButton>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
