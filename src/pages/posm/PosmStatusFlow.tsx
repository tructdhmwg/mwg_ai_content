import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { PosmSectionCard } from './PosmSectionCard'
import { STATUS_META, type PosmCampaignStatus } from './posmMockData'

// Luồng trạng thái của 1 phiếu POSM, đúng thứ tự vận hành: POSM tạo phiếu → NH đăng ký sản phẩm →
// chuyển MKT → MKT dàn thành phẩm → NH duyệt → POSM duyệt chốt.
// Thứ tự này khớp thứ tự khai báo trong STATUS_META (posmMockData) — sửa 1 chỗ thì soát lại chỗ kia.
const STATUS_FLOW: PosmCampaignStatus[] = [
  'new', 'checked', 'products_full', 'transferred_mkt', 'mkt_proccessing', 'mkt_done', 'nh_approved', 'completed',
]

// Ai là người tạo ra bước chuyển đó — cho người xem biết đang chờ bộ phận nào xử lý.
const STATUS_OWNER: Partial<Record<PosmCampaignStatus, string>> = {
  new: 'POSM',
  checked: 'NH',
  products_full: 'NH',
  transferred_mkt: 'POSM',
  mkt_proccessing: 'MKT',
  mkt_done: 'MKT',
  nh_approved: 'NH',
  completed: 'POSM',
}

// Sơ đồ (map) trạng thái phiếu — 1 vùng riêng, đặt trên vùng thông tin campaign.
// Bước đã qua tô nhạt + dấu ✓, bước hiện tại tô đúng màu trạng thái và viền đậm, bước chưa tới để xám.
// Chỉ hiển thị, không bấm để đổi trạng thái — trạng thái chuyển qua các hành động (đăng ký đủ slot,
// upload thành phẩm, NH duyệt, POSM duyệt).
export function PosmStatusFlow({ status }: { status: PosmCampaignStatus }) {
  const currentIdx = STATUS_FLOW.indexOf(status)

  return (
    <PosmSectionCard
      title="Luồng trạng thái phiếu"
      hint={`Bước ${currentIdx + 1}/${STATUS_FLOW.length} · đang chờ ${STATUS_OWNER[status] ?? '—'} xử lý`}
    >
      <div className="flex flex-wrap items-center gap-y-2">
        {STATUS_FLOW.map((s, i) => {
          const meta = STATUS_META[s]
          const done = i < currentIdx
          const current = i === currentIdx
          return (
            <Fragment key={s}>
              {i > 0 && (
                <span
                  aria-hidden
                  className="w-4 h-px mx-1 shrink-0"
                  style={{ backgroundColor: i <= currentIdx ? '#94A3B8' : '#E2E8F0' }}
                />
              )}
              <span
                title={`${meta.label} · ${STATUS_OWNER[s] ?? ''}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap border ${current ? 'font-semibold' : 'font-medium'}`}
                style={
                  current
                    ? { backgroundColor: meta.bg, color: meta.color, borderColor: meta.dot }
                    : done
                      ? { backgroundColor: '#FFFFFF', color: '#475569', borderColor: '#E2E8F0' }
                      : { backgroundColor: '#F8FAFC', color: '#94A3B8', borderColor: '#F1F5F9' }
                }
              >
                {done ? (
                  <Check size={10} className="shrink-0" style={{ color: '#16A34A' }} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: current ? meta.dot : '#CBD5E1' }} />
                )}
                {meta.label}
              </span>
            </Fragment>
          )
        })}
      </div>
    </PosmSectionCard>
  )
}
