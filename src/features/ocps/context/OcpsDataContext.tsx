// Port từ _source_b_reference/src/context/DataContext.jsx.
// Khác bản gốc theo quyết định duyệt MERGE_PLAN.md:
//   1. Link trong notification sinh runtime prefix /ocps (route OCPS nằm dưới /ocps/*).
//   2. TẮT seed SLA alert lúc init (hàm withSlaAlerts của B đã bỏ) — notifications
//      khởi tạo thẳng từ seed NOTIFICATIONS; các mutator notification vẫn giữ nguyên
//      dù F7 (trang thông báo) chưa port, để luồng nghiệp vụ không phải sửa.
import { createContext, useContext, useState, type ReactNode } from 'react'
import { ITEMS, DOCUMENT_SLOTS, MKT_BRIEFS, NOTIFICATIONS, AUDIT_LOG, FLOW_REQUESTS, USERS, ROLES } from '../data/ocpsMockData'
import { getDocRuleForItem, validateFile } from '../utils/docRules'
import type {
  AuditEntry,
  DocStatus,
  DocumentSlotsMap,
  Flow,
  FlowRequest,
  ItemDocSlots,
  MktBrief,
  OcpsItem,
  OcpsNotification,
  OcpsUser,
  SlotKey,
  TrangThaiBoSung,
} from '../types'

export interface UploadFileInput {
  name: string
  size?: number
  date?: string
  by?: string
}

export interface NewBriefInput {
  nhomKenh: string
  loaiBrief: string
  loaiNhuCau: string[]
  kenh: string[] | string
  deadline: string
  budget: string
  briefText: string
  fileThamKhao?: string[]
  nguoiPhuTrach?: string
}

export interface OcpsDataValue {
  items: OcpsItem[]
  docSlots: DocumentSlotsMap
  briefs: MktBrief[]
  notifications: OcpsNotification[]
  auditLog: AuditEntry[]
  flowRequests: FlowRequest[]
  updateItemStatus: (itemId: string, patch: Partial<OcpsItem>) => void
  uploadFile: (itemId: string, slotKey: SlotKey, file: UploadFileInput, by?: string) => void
  addNote: (itemId: string, slotKey: SlotKey, ghiChu: string | null) => void
  revertDocStatus: (itemId: string, ghiChu: string, slotKey?: SlotKey, by?: string) => void
  confirmSlotStatus: (itemId: string, slotKey: SlotKey, status: TrangThaiBoSung, by?: string) => void
  sendFlowRequest: (itemId: string, tenSP: string, flow: Flow, brief?: NewBriefInput | null, by?: string) => void
  changeFlow: (itemId: string, newFlow: Flow, reason: string, by?: string) => void
  cancelFlowRequest: (itemId: string, reason: string, by?: string) => void
  updateBrief: (briefId: string, patch: Partial<MktBrief>, by?: string) => void
  cancelBrief: (briefId: string, reason: string, by?: string) => void
  updateContentLink: (itemId: string, linkWeb: string, by?: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (role: string) => void
  adminOverride: (itemId: string, patch: Partial<OcpsItem>, reason: string, by: string) => void
  erpUpdateWarning: (itemId: string, fieldChanged: string) => void
  sendPeriodicReports: () => void
  scopeItemsForUser: (items: OcpsItem[], currentUser: OcpsUser | null) => OcpsItem[]
  isContentEligible: (item: OcpsItem | null | undefined) => boolean
  getContentQueue: (items: OcpsItem[]) => OcpsItem[]
}

const OcpsDataContext = createContext<OcpsDataValue | null>(null)

// Tính docStatus từ files hiện tại
function calcDocStatus(slots: Partial<ItemDocSlots> | undefined): DocStatus {
  const img = slots?.hinhanh?.files?.length ?? 0
  const spec = slots?.spec?.files?.length ?? 0
  if (img === 0) return 'thieu'
  if (spec >= 1) return 'du_full'
  return 'du_toithieu'
}

// Suy ra patch seoStatus/mktStatus từ 1 lựa chọn luồng — dùng chung cho sendFlowRequest/changeFlow
function statusPatchForFlow(flow: Flow): Partial<OcpsItem> {
  return {
    flow,
    seoStatus: flow !== 'chi_mkt' ? 'cho' : 'chua',
    mktStatus: flow !== 'chi_content' ? 'da_tiep_nhan' : 'chua_yeu_cau',
  }
}

// Lọc items theo phạm vi dữ liệu của role — dùng chung thay cho filter viết tay rải rác mỗi trang.
// Vendor: chỉ hãng của mình. NH: chỉ ngành hàng của mình. Content/Marketing/Admin: không scope theo
// field cố định trên Item (Content dùng isContentEligible/getContentQueue riêng; Marketing scope theo
// brief, không theo Item; Admin god-view).
function scopeItemsForUser(items: OcpsItem[], currentUser: OcpsUser | null): OcpsItem[] {
  if (!currentUser) return []
  if (currentUser.role === ROLES.VENDOR) return items.filter(i => i.vendorId === currentUser.vendorId)
  if (currentUser.role === ROLES.NH) return items.filter(i => i.nganhhang === currentUser.nganhhang)
  return items
}

// Điều kiện đủ để Content/IT được xử lý 1 Item — gom từ ContentDashboard, dùng lại ở cả Dashboard
// (lọc danh sách) và ContentProcess (chặn truy cập chéo qua URL trực tiếp).
function isContentEligible(item: OcpsItem | null | undefined): boolean {
  return !!item && item.docStatus !== 'thieu' && item.flow !== null && item.flow !== 'chi_mkt' && item.seoStatus !== 'chua'
}

// Hàng đợi Content — lọc đủ điều kiện rồi ưu tiên: trễ SLA nhiều nhất trước, sau đó gửi yêu cầu sớm nhất trước
function getContentQueue(items: OcpsItem[]): OcpsItem[] {
  return items.filter(isContentEligible).slice().sort((a, b) => {
    if (a.slaConLai !== b.slaConLai) return a.slaConLai - b.slaConLai
    return (a.ngayGuiYeuCau || '').localeCompare(b.ngayGuiYeuCau || '')
  })
}

export function OcpsDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OcpsItem[]>(ITEMS)
  const [docSlots, setDocSlots] = useState<DocumentSlotsMap>(DOCUMENT_SLOTS)
  const [briefs, setBriefs] = useState<MktBrief[]>(MKT_BRIEFS)
  // Bản gốc B seed thêm SLA alert lúc init (withSlaAlerts) — đã tắt theo quyết định bỏ F7.
  const [notifications, setNotifications] = useState<OcpsNotification[]>(NOTIFICATIONS)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(AUDIT_LOG)
  const [flowRequests, setFlowRequests] = useState<FlowRequest[]>(FLOW_REQUESTS)

  function updateItemStatus(itemId: string, patch: Partial<OcpsItem>) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...patch } : i))
  }

  // Điểm ghi audit duy nhất — mọi mutator gọi qua đây thay vì tự push tay vào auditLog.
  // source: 'auto' (hệ thống tự ghi khi đổi trạng thái) | 'admin_override' (bắt buộc reason).
  function logAudit({ itemId, by, from, to, reason = null, source = 'auto' }: {
    itemId: string
    by?: string | null
    from?: string | null
    to?: string | null
    reason?: string | null
    source?: AuditEntry['source']
  }) {
    setAuditLog(prev => [{
      id: `a${Date.now()}`,
      itemId,
      by: by ?? 'Hệ thống',
      from: from as string,
      to: to as string,
      reason: reason as string,
      time: new Date().toLocaleString('vi-VN'),
      source,
    }, ...prev])
  }

  function addSystemNotification(notif: Partial<OcpsNotification> & Pick<OcpsNotification, 'role' | 'type' | 'entityId' | 'text' | 'link'>) {
    setNotifications(prev => {
      // Digest chống spam: cùng type + entityId + chưa đọc → gộp thay vì thêm dòng mới
      const dupIdx = prev.findIndex(n => n.type === notif.type && n.entityId === notif.entityId && !n.read)
      if (dupIdx !== -1) {
        return prev.map((n, i) => i === dupIdx
          ? { ...n, ...notif, count: (n.count ?? 1) + 1, time: 'Vừa xong' }
          : n)
      }
      const category = notif.category ?? (notif.type?.startsWith('sla_') ? 'sla' : 'event')
      return [{ id: `n${Date.now()}`, read: false, time: 'Vừa xong', count: 1, ...notif, category }, ...prev]
    })
  }

  // Upload file — tự tính lại docStatus sau khi thêm, giữ lịch sử version, validate theo DocRule
  // Lưu ý: mọi state mới được tính đồng bộ từ closure (items/docSlots hiện tại) rồi mới setState
  // bằng giá trị cụ thể — logAudit không được gọi lồng trong callback updater vì React StrictMode
  // gọi updater 2 lần ở dev, sẽ làm audit log bị nhân đôi.
  function uploadFile(itemId: string, slotKey: SlotKey, file: UploadFileInput, by = 'Người dùng') {
    const item = items.find(i => i.id === itemId)
    // DocRule (định dạng JPEG/PNG, size, nền trắng...) chỉ áp cho slot "hinhanh" — spec/khac là
    // PDF/tài liệu khác, không thuộc phạm vi rule ảnh nên không validate (tránh báo sai định dạng).
    const { ok, violations } = slotKey === 'hinhanh'
      ? validateFile(file, getDocRuleForItem(item))
      : { ok: true, violations: [] as string[] }
    const fileEntry = { date: '', ...file, isLatest: true, ruleViolation: !ok, ruleMessage: ok ? undefined : violations.join('; ') }

    const existing = docSlots[itemId]?.[slotKey]?.files ?? []
    // Đánh dấu file cùng tên cũ là superseded (version history)
    const updatedExisting = existing.map(f =>
      f.name === file.name ? { ...f, superseded: true } : f
    )
    const newItemSlots: ItemDocSlots = {
      ...docSlots[itemId],
      // Có file mới → luôn quay về "Đang kiểm tra", kể cả khi slot từng được xác nhận "Bổ sung đủ"
      [slotKey]: { ...docSlots[itemId]?.[slotKey], files: [...updatedExisting, fileEntry], trangThaiBoSung: 'dang_kiem_tra' },
    }
    const newDocStatus = calcDocStatus(newItemSlots)

    setDocSlots(prev => ({ ...prev, [itemId]: newItemSlots }))
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, docStatus: newDocStatus } : i))

    if (item && newDocStatus !== item.docStatus) {
      logAudit({ itemId, by, from: item.docStatus, to: newDocStatus, reason: `Upload file ${file.name}` })
    }
  }

  function addNote(itemId: string, slotKey: SlotKey, ghiChu: string | null) {
    setDocSlots(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [slotKey]: { ...prev[itemId]?.[slotKey], ghiChu },
      },
    }))
  }

  // NH/Content xác nhận nhanh 1 slot tài liệu: "Bổ sung đủ" hay "Còn thiếu - Bổ sung thêm".
  // Khác với revertDocStatus (bắt buộc ghi chú + notify ngược Vendor/NH) — đây chỉ là xác nhận
  // trạng thái, không bắt buộc ghi chú, dùng cho việc rà soát nhanh sau khi có file mới.
  function confirmSlotStatus(itemId: string, slotKey: SlotKey, status: TrangThaiBoSung, by = 'Người dùng') {
    const prevStatus = docSlots[itemId]?.[slotKey]?.trangThaiBoSung
    setDocSlots(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [slotKey]: { ...prev[itemId]?.[slotKey], trangThaiBoSung: status },
      },
    }))
    logAudit({ itemId, by, from: prevStatus ?? null, to: status, reason: `Xác nhận tài liệu slot "${slotKey}"` })
  }

  // Content ghi chú thiếu file → lùi docStatus về thieu + notify NH/Vendor
  function revertDocStatus(itemId: string, ghiChu: string, slotKey: SlotKey = 'hinhanh', by = 'Content') {
    const item = items.find(i => i.id === itemId)
    addNote(itemId, slotKey, ghiChu)
    updateItemStatus(itemId, { docStatus: 'thieu' })
    logAudit({ itemId, by, from: item?.docStatus, to: 'thieu', reason: ghiChu })
    addSystemNotification({
      role: [ROLES.NH, ROLES.VENDOR],
      type: 'missing_doc',
      entityId: itemId,
      text: `${itemId} — Content yêu cầu bổ sung: ${ghiChu}`,
      link: '/ocps/vendor/upload',
    })
  }

  // Fix stale closure: nhận tenSP trực tiếp thay vì đọc từ items
  function sendFlowRequest(itemId: string, tenSP: string, flow: Flow, brief?: NewBriefInput | null, by = 'NH') {
    const item = items.find(i => i.id === itemId)
    const today = new Date().toISOString().slice(0, 10)

    updateItemStatus(itemId, { ...statusPatchForFlow(flow), ngayGuiYeuCau: today })

    setFlowRequests(prev => {
      const existing = prev.find(fr => fr.itemId === itemId)
      if (!existing) {
        return [...prev, {
          id: `fr-${itemId}`,
          itemId,
          flow,
          trangThaiGui: 'da_gui' as const,
          trangThaiKhaiBaoDuKien: 'chua_xu_ly' as const,
          version: 1,
          createdAt: today,
          createdBy: by,
          history: [
            { action: 'tao' as const, flow, at: today, by },
            { action: 'gui' as const, flow, at: today, by },
          ],
        }]
      }
      return prev.map(fr => fr.itemId === itemId ? {
        ...fr,
        flow,
        trangThaiGui: 'da_gui' as const,
        version: fr.version + 1,
        history: [...fr.history, { action: 'gui' as const, flow, at: today, by }],
      } : fr)
    })

    logAudit({ itemId, by, from: item?.flow ?? null, to: flow, reason: 'Gửi yêu cầu xử lý' })

    if (brief) {
      // Normalize kenh: string → array
      const kenh = Array.isArray(brief.kenh)
        ? brief.kenh
        : brief.kenh.split(',').map(s => s.trim()).filter(Boolean)
      setBriefs(prev => [...prev, {
        vongChinhSua: 0,
        lichSuChinhSua: [],
        fileThamKhao: [],
        nguoiPhuTrach: by,
        ...brief,
        id: `brief-${Date.now()}`,
        itemId,
        tenSP,
        kenh,
        trangThai: 'da_tiep_nhan',
        ngayTao: today,
      } as MktBrief])
    }
    // Notify Content / MKT
    if (flow !== 'chi_mkt') {
      addSystemNotification({
        role: [ROLES.CONTENT],
        type: 'new_task',
        entityId: itemId,
        text: `NH vừa gửi yêu cầu Content cho ${itemId}`,
        link: `/ocps/content/process/${itemId}`,
      })
    }
    if (flow !== 'chi_content') {
      addSystemNotification({
        role: [ROLES.MARKETING],
        type: 'new_brief',
        entityId: itemId,
        text: `NH vừa gửi brief MKT cho ${itemId}`,
        link: '/ocps/marketing/dashboard',
      })
    }
  }

  // NH đổi luồng sau khi đã gửi — bắt buộc lý do, versioned trên FlowRequest
  function changeFlow(itemId: string, newFlow: Flow, reason: string, by = 'NH') {
    const item = items.find(i => i.id === itemId)
    const today = new Date().toISOString().slice(0, 10)

    updateItemStatus(itemId, statusPatchForFlow(newFlow))

    setFlowRequests(prev => prev.map(fr => fr.itemId === itemId ? {
      ...fr,
      flow: newFlow,
      version: fr.version + 1,
      history: [...fr.history, { action: 'doi_luong' as const, flow: newFlow, reason, at: today, by }],
    } : fr))

    logAudit({ itemId, by, from: item?.flow ?? null, to: newFlow, reason })

    addSystemNotification({
      role: [ROLES.CONTENT, ROLES.MARKETING],
      type: 'flow_changed',
      entityId: itemId,
      text: `NH vừa đổi luồng xử lý cho ${itemId}: ${reason}`,
      link: `/ocps/nh/product/${itemId}`,
    })
  }

  // NH huỷ yêu cầu xử lý — MKT đang chạy (nếu có) chuyển sang đã huỷ, MKT/Admin nhận notify
  function cancelFlowRequest(itemId: string, reason: string, by = 'NH') {
    const item = items.find(i => i.id === itemId)
    const today = new Date().toISOString().slice(0, 10)

    setFlowRequests(prev => prev.map(fr => fr.itemId === itemId ? {
      ...fr,
      trangThaiGui: 'da_huy' as const,
      version: fr.version + 1,
      history: [...fr.history, { action: 'huy' as const, flow: fr.flow, reason, at: today, by }],
    } : fr))

    if (item && item.flow !== 'chi_content') {
      updateItemStatus(itemId, { mktStatus: 'da_huy' })
    }

    logAudit({ itemId, by, from: item?.mktStatus ?? null, to: 'da_huy', reason })

    addSystemNotification({
      role: [ROLES.MARKETING, ROLES.ADMIN],
      type: 'flow_cancelled',
      entityId: itemId,
      text: `NH đã huỷ yêu cầu xử lý cho ${itemId}: ${reason}`,
      link: '/ocps/marketing/dashboard',
    })
  }

  // Brief đã huỷ là trạng thái cuối (chặn ở tầng data) — nhưng "Hoàn tất" KHÔNG khoá: MKT vẫn có thể
  // cập nhật lại nội dung sau khi hoàn tất nếu có feedback, mỗi lần đổi link đều tự ghi vào lichSuChinhSua.
  function updateBrief(briefId: string, patch: Partial<MktBrief>, by = 'Marketing') {
    const brief = briefs.find(b => b.id === briefId)
    if (!brief || brief.trangThai === 'da_huy') {
      if (brief) console.warn(`updateBrief bị chặn: brief ${briefId} đã huỷ`)
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    if (patch.trangThai && patch.trangThai !== brief.trangThai) {
      logAudit({ itemId: brief.itemId, by, from: brief.trangThai, to: patch.trangThai, reason: 'Cập nhật brief MKT' })
    }
    const changes: string[] = []
    if (patch.linkFolder !== undefined && patch.linkFolder !== brief.linkFolder) changes.push(`Link Drive: ${patch.linkFolder || '(trống)'}`)
    if (patch.linkMedia !== undefined && patch.linkMedia !== brief.linkMedia) changes.push(`Link media: ${patch.linkMedia || '(trống)'}`)
    const vong = changes.length ? brief.vongChinhSua + 1 : brief.vongChinhSua
    const lichSuChinhSua = changes.length
      ? [...brief.lichSuChinhSua, { vong, ghiChu: `Cập nhật nội dung — ${changes.join('; ')}`, ngay: today }]
      : brief.lichSuChinhSua
    setBriefs(prev => prev.map(b => b.id === briefId ? { ...b, ...patch, vongChinhSua: vong, lichSuChinhSua } : b))
  }

  // NH huỷ brief MKT giữa chừng — MKT nhận notify dừng sản xuất
  function cancelBrief(briefId: string, reason: string, by = 'NH') {
    const today = new Date().toISOString().slice(0, 10)
    setBriefs(prev => prev.map(b => b.id === briefId ? {
      ...b,
      trangThai: 'da_huy' as const,
      lichSuChinhSua: [...b.lichSuChinhSua, { vong: b.vongChinhSua, ghiChu: `Đã huỷ: ${reason}`, ngay: today }],
    } : b))

    const brief = briefs.find(b => b.id === briefId)
    if (brief) {
      logAudit({ itemId: brief.itemId, by, from: brief.trangThai, to: 'da_huy', reason })
      addSystemNotification({
        role: [ROLES.MARKETING],
        type: 'brief_cancelled',
        entityId: briefId,
        text: `NH đã huỷ brief ${brief.tenSP}: ${reason}`,
        link: `/ocps/marketing/brief/${briefId}`,
      })
    }
  }

  // Content cập nhật link lên web — không cần NH duyệt; gọi lại bất kỳ lúc nào kể cả sau khi đã lên
  // web/hoàn tất (có feedback cần chỉnh lại nội dung), mỗi lần cập nhật đều ghi vào contentLichSuChinhSua.
  function updateContentLink(itemId: string, linkWeb: string, by = 'Content') {
    const item = items.find(i => i.id === itemId)
    if (!item || !linkWeb?.trim()) return
    const isFirstSubmit = !item.linkWeb
    const vong = (item.contentVongChinhSua ?? 0) + 1
    const today = new Date().toISOString().slice(0, 10)
    // Lần đầu gửi thì chuyển seoStatus sang "Đã lên web"; nếu đã qua bước đó rồi thì giữ nguyên trạng
    // thái hiện tại (VD đã "Hoàn tất"), chỉ cập nhật link + lịch sử.
    const newSeoStatus = ['chua', 'cho', 'dang_xu_ly'].includes(item.seoStatus) ? 'da_len_web' as const : item.seoStatus
    updateItemStatus(itemId, {
      seoStatus: newSeoStatus,
      linkWeb,
      contentVongChinhSua: vong,
      contentLichSuChinhSua: [...(item.contentLichSuChinhSua ?? []), {
        vong, ghiChu: isFirstSubmit ? `Gửi link lần đầu: ${linkWeb}` : `Cập nhật link: ${linkWeb}`, ngay: today,
      }],
    })
    logAudit({ itemId, by, from: item.linkWeb || '(chưa có)', to: linkWeb, reason: isFirstSubmit ? 'Gửi kết quả lên web' : 'Cập nhật lại nội dung lên web' })
  }

  function markNotificationRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllNotificationsRead(role: string) {
    setNotifications(prev => prev.map(n => n.role.includes(role as OcpsNotification['role'][number]) ? { ...n, read: true } : n))
  }

  // Admin override — đọc item từ closure (không lồng logAudit/notify trong updater, xem lưu ý ở uploadFile)
  function adminOverride(itemId: string, patch: Partial<OcpsItem>, reason: string, by: string) {
    const item = items.find(i => i.id === itemId)
    logAudit({
      itemId,
      by,
      from: JSON.stringify(Object.fromEntries(Object.keys(patch).map(k => [k, item?.[k as keyof OcpsItem]]))),
      to: JSON.stringify(patch),
      reason,
      source: 'admin_override',
    })
    addSystemNotification({
      role: [ROLES.NH, ROLES.CONTENT, ROLES.MARKETING],
      type: 'override',
      entityId: itemId,
      text: `Admin đã override trạng thái ${itemId}: ${reason}`,
      link: `/ocps/nh/product/${itemId}`,
    })
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...patch } : i))
  }

  // ERP cập nhật sau khi đã lên web → cảnh báo Content/IT review lại
  function erpUpdateWarning(itemId: string, fieldChanged: string) {
    const item = items.find(i => i.id === itemId)
    const today = new Date().toISOString().slice(0, 10)
    addSystemNotification({
      role: [ROLES.CONTENT, ROLES.NH],
      type: 'erp_update',
      entityId: itemId,
      text: `⚠ ERP vừa cập nhật "${fieldChanged}" cho ${itemId} — nội dung web có thể lệch, cần review lại`,
      link: `/ocps/content/process/${itemId}`,
    })
    updateItemStatus(itemId, { erpDirty: true, erpLastSyncAt: today })
    logAudit({ itemId, by: 'ERP', from: item?.erpLastSyncAt ?? null, to: today, reason: `ERP cập nhật "${fieldChanged}" sau khi đã lên web` })
  }

  // Mô phỏng gửi báo cáo định kỳ cho từng NH — mỗi NH chỉ thấy báo cáo ngành hàng mình qua `scopeKey`
  // (Notification vốn chỉ scope theo role, không phân biệt nganhhang — scopeKey bù thêm phần đó).
  function sendPeriodicReports() {
    USERS.filter(u => u.role === ROLES.NH).forEach(user => {
      const myItems = scopeItemsForUser(items, user)
      const done = myItems.filter(i => i.seoStatus === 'da_len_web' || i.seoStatus === 'hoan_tat').length
      const dangXuLy = myItems.filter(i => i.ngayGuiYeuCau && i.seoStatus !== 'da_len_web' && i.seoStatus !== 'hoan_tat').length
      const total = myItems.length
      const overdue = myItems.filter(i => i.slaConLai < 0 && i.ngayGuiYeuCau).length
      const pct = total ? Math.round((done / total) * 100) : 0
      addSystemNotification({
        role: [ROLES.NH],
        scopeKey: user.nganhhang,
        type: 'periodic_report',
        entityId: user.nganhhang ?? '',
        text: `Báo cáo định kỳ ${user.nganhhang}: ${dangXuLy} đang xử lý, ${done}/${total} SP hoàn tất (${pct}%), ${overdue} SP đang trễ SLA`,
        link: '/ocps/nh/report',
      })
    })
  }

  return (
    <OcpsDataContext.Provider value={{
      items, docSlots, briefs, notifications, auditLog, flowRequests,
      updateItemStatus, uploadFile, addNote, revertDocStatus, confirmSlotStatus,
      sendFlowRequest, changeFlow, cancelFlowRequest,
      updateBrief, cancelBrief,
      updateContentLink,
      markNotificationRead, markAllNotificationsRead,
      adminOverride, erpUpdateWarning, sendPeriodicReports,
      scopeItemsForUser, isContentEligible, getContentQueue,
    }}>
      {children}
    </OcpsDataContext.Provider>
  )
}

export function useOcpsData(): OcpsDataValue {
  const ctx = useContext(OcpsDataContext)
  if (!ctx) throw new Error('useOcpsData phải được dùng bên trong <OcpsDataProvider> (route /ocps/*)')
  return ctx
}
