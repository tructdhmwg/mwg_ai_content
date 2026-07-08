// Port từ _source_b_reference/src/pages/admin/AdminConfig.jsx (route /ocps/admin/config)
// Giữ nguyên MOCK_USERS cục bộ của B (danh sách hiển thị SSO vs Email+OTP — khác biệt
// và tách rời với MOCK_USERS/authStore của A; chỉ để minh hoạ cấu hình, không wire).
import { useState } from 'react'
import { Card } from '../../components/Card'
import { OcpsButton } from '../../components/OcpsButton'
import { useOcpsData } from '../../context/OcpsDataContext'
import { SLA_CONFIG, REPORT_SCHEDULE_CONFIG, NOTIFY_TEMPLATES, DOC_RULES } from '../../data/ocpsMockData'
import type { DocRule, NotifyTemplate, ReportScheduleConfig, SlaConfigRow } from '../../types'

const MOCK_USERS = [
  { name: 'Minh Tuấn', email: 'tuan@mediamart.vn', role: 'NH', nganhhang: 'Gia dụng', xacThuc: 'SSO nội bộ' },
  { name: 'Thu Hà', email: 'ha@mediamart.vn', role: 'NH', nganhhang: 'Mỹ phẩm', xacThuc: 'SSO nội bộ' },
  { name: 'Quang', email: 'quang@mediamart.vn', role: 'NH', nganhhang: 'Tivi', xacThuc: 'SSO nội bộ' },
  { name: 'Bình', email: 'binh@mediamart.vn', role: 'Content/IT', nganhhang: '—', xacThuc: 'SSO nội bộ' },
  { name: 'An', email: 'an@mediamart.vn', role: 'Marketing', nganhhang: '—', xacThuc: 'SSO nội bộ' },
  { name: 'Admin', email: 'admin@mediamart.vn', role: 'Admin', nganhhang: '—', xacThuc: 'SSO nội bộ' },
  // Vendor — đối tác ngoài, xác thực riêng (không SSO/Active Directory)
  { name: 'HomeTech Vietnam', email: 'contact@hometech.vn', role: 'Vendor', nganhhang: '—', xacThuc: 'Email + OTP' },
  { name: 'PureLife Corp', email: 'contact@purelife.vn', role: 'Vendor', nganhhang: '—', xacThuc: 'Email + OTP' },
  { name: 'SmartVision Electronics', email: 'contact@smartvision.vn', role: 'Vendor', nganhhang: '—', xacThuc: 'Email + OTP' },
]

type TabKey = 'sla' | 'assign' | 'users' | 'templates' | 'docrules' | 'reports'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'sla', label: '⏱ SLA' },
  { key: 'assign', label: '🔀 Gán phụ trách' },
  { key: 'users', label: '👥 User & Role' },
  { key: 'templates', label: '🔔 Template notify' },
  { key: 'docrules', label: '📐 Rule tài liệu' },
  { key: 'reports', label: '🗓 Báo cáo định kỳ' },
]

export function AdminConfig() {
  const { sendPeriodicReports } = useOcpsData()
  const [sla, setSla] = useState<SlaConfigRow[]>(SLA_CONFIG)
  const [reportSchedule, setReportSchedule] = useState<ReportScheduleConfig>(REPORT_SCHEDULE_CONFIG)
  const [templates, setTemplates] = useState<NotifyTemplate[]>(NOTIFY_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null)
  const [docRules, setDocRules] = useState<Record<string, DocRule>>(DOC_RULES)
  const [activeTab, setActiveTab] = useState<TabKey>('sla')

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">Cấu hình hệ thống</h1>
        <p className="text-sm text-[#94A3B8]">Tự điều chỉnh quy tắc vận hành không cần dev</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F1F5F9] rounded-lg p-1 w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sla' && (
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-4">Cấu hình SLA theo trạng thái</p>
          <div className="space-y-3">
            {sla.map((row, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#0F172A] w-40">{row.trangThai}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#94A3B8]">Cảnh báo sau</span>
                  <input
                    type="number" min={1} max={30}
                    value={row.ngayCanhBao}
                    onChange={e => setSla(s => s.map((r, j) => j === i ? { ...r, ngayCanhBao: +e.target.value } : r))}
                    className="w-14 text-xs border border-[#E2E8F0] rounded px-2 py-1 text-center outline-none focus:border-[#3B82F6]"
                  />
                  <span className="text-xs text-[#94A3B8]">ngày</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#94A3B8]">Escalate sau</span>
                  <input
                    type="number" min={1} max={30}
                    value={row.ngayEscalate}
                    onChange={e => setSla(s => s.map((r, j) => j === i ? { ...r, ngayEscalate: +e.target.value } : r))}
                    className="w-14 text-xs border border-[#E2E8F0] rounded px-2 py-1 text-center outline-none focus:border-[#3B82F6]"
                  />
                  <span className="text-xs text-[#94A3B8]">ngày</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <OcpsButton variant="primary" size="sm" onClick={() => alert('Đã lưu cấu hình SLA')}>Lưu cấu hình</OcpsButton>
          </div>
        </Card>
      )}

      {activeTab === 'assign' && (
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-3">Quy tắc tự gán người phụ trách theo Category</p>
          <div className="space-y-2">
            {[
              { cat: 'Gia dụng', content: 'Bình', mkt: 'An' },
              { cat: 'Mỹ phẩm', content: 'Bình', mkt: 'An' },
              { cat: 'Điện tử', content: 'Bình', mkt: 'An' },
              { cat: 'Tivi', content: 'Bình', mkt: 'An' },
            ].map(rule => (
              <div key={rule.cat} className="flex items-center gap-3 border border-[#E2E8F0] rounded-lg px-3 py-2.5">
                <span className="text-xs font-medium text-[#0F172A] w-24">{rule.cat}</span>
                <span className="text-xs text-[#94A3B8]">Content: <strong className="text-[#0F172A]">{rule.content}</strong></span>
                <span className="text-xs text-[#94A3B8]">MKT: <strong className="text-[#0F172A]">{rule.mkt}</strong></span>
                <OcpsButton size="sm" className="ml-auto">Sửa</OcpsButton>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#94A3B8] mt-3">8 quy tắc đang áp dụng</p>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#0F172A]">Quản lý user và role ({MOCK_USERS.length} user · 5 role)</p>
            <OcpsButton variant="primary" size="sm">+ Thêm user</OcpsButton>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
                <th className="pb-2 pr-3 font-medium">Tên</th>
                <th className="pb-2 pr-3 font-medium">Email</th>
                <th className="pb-2 pr-3 font-medium">Role</th>
                <th className="pb-2 pr-3 font-medium">Ngành hàng</th>
                <th className="pb-2 pr-3 font-medium">Xác thực</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(u => (
                <tr key={u.email} className="border-b border-[#F8FAFC]">
                  <td className="py-2 pr-3 font-medium text-[#0F172A]">{u.name}</td>
                  <td className="py-2 pr-3 text-[#475569]">{u.email}</td>
                  <td className="py-2 pr-3 text-[#0F172A]">{u.role}</td>
                  <td className="py-2 pr-3 text-[#94A3B8]">{u.nganhhang}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.xacThuc === 'Email + OTP' ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                      {u.xacThuc}
                    </span>
                  </td>
                  <td className="py-2"><OcpsButton size="sm">Sửa</OcpsButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'templates' && (
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-3">Template thông báo ({templates.length} template đang dùng)</p>
          <div className="space-y-2">
            {templates.map((t, i) => (
              <div key={t.event} className="flex items-center gap-3 border border-[#E2E8F0] rounded-lg px-3 py-2.5">
                {editingTemplate === i ? (
                  <>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-[#0F172A] w-40 shrink-0">{t.event}</span>
                      <input
                        value={t.recipient}
                        onChange={e => setTemplates(ts => ts.map((r, j) => j === i ? { ...r, recipient: e.target.value } : r))}
                        placeholder="Người nhận"
                        className="flex-1 text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
                      />
                      <input
                        value={t.channel}
                        onChange={e => setTemplates(ts => ts.map((r, j) => j === i ? { ...r, channel: e.target.value } : r))}
                        placeholder="Kênh gửi"
                        className="flex-1 text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                    <OcpsButton variant="primary" size="sm" onClick={() => setEditingTemplate(null)}>Lưu</OcpsButton>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#0F172A]">{t.event}</p>
                      <p className="text-xs text-[#94A3B8]">{t.recipient} · {t.channel}</p>
                    </div>
                    <OcpsButton size="sm" onClick={() => setEditingTemplate(i)}>Sửa template</OcpsButton>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'docrules' && (
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-1">Rule tài liệu/upload theo ngành hàng</p>
          <p className="text-xs text-[#94A3B8] mb-4">Cấu hình theo từng ngành hàng — không hardcode logic vào code. Chỉ áp cho slot Hình ảnh.</p>
          <div className="space-y-3">
            {Object.entries(docRules).map(([nganh, rule]) => (
              <div key={nganh} className="border border-[#E2E8F0] rounded-lg px-3 py-3">
                <p className="text-xs font-semibold text-[#0F172A] mb-2">{nganh === 'DEFAULT' ? 'Mặc định (ngành khác)' : nganh}</p>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#94A3B8]">Số ảnh tối thiểu</span>
                    <input
                      type="number" min={1} max={10}
                      value={rule.soAnhToiThieu}
                      onChange={e => setDocRules(r => ({ ...r, [nganh]: { ...r[nganh], soAnhToiThieu: +e.target.value } }))}
                      className="w-14 text-xs border border-[#E2E8F0] rounded px-2 py-1 text-center outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#94A3B8]">Size tối đa</span>
                    <input
                      type="number" min={1} max={20}
                      value={rule.sizeMaxMB}
                      onChange={e => setDocRules(r => ({ ...r, [nganh]: { ...r[nganh], sizeMaxMB: +e.target.value } }))}
                      className="w-14 text-xs border border-[#E2E8F0] rounded px-2 py-1 text-center outline-none focus:border-[#3B82F6]"
                    />
                    <span className="text-xs text-[#94A3B8]">MB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#94A3B8]">Ngang tối thiểu</span>
                    <input
                      type="number" min={200} max={4000} step={100}
                      value={rule.minWidthPx}
                      onChange={e => setDocRules(r => ({ ...r, [nganh]: { ...r[nganh], minWidthPx: +e.target.value } }))}
                      className="w-16 text-xs border border-[#E2E8F0] rounded px-2 py-1 text-center outline-none focus:border-[#3B82F6]"
                    />
                    <span className="text-xs text-[#94A3B8]">px</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#94A3B8]">Định dạng cho phép</span>
                    <input
                      type="text"
                      value={rule.dinhDangChoPhep.join(', ')}
                      onChange={e => setDocRules(r => ({ ...r, [nganh]: { ...r[nganh], dinhDangChoPhep: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) } }))}
                      className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#3B82F6] w-40"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-[#0F172A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.nenTrangAnhSanPham}
                      onChange={e => setDocRules(r => ({ ...r, [nganh]: { ...r[nganh], nenTrangAnhSanPham: e.target.checked } }))}
                      className="rounded"
                    />
                    Bắt buộc nền trắng (ảnh chụp sản phẩm)
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <OcpsButton variant="primary" size="sm" onClick={() => alert('Đã lưu Rule tài liệu')}>Lưu cấu hình</OcpsButton>
          </div>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card>
          <p className="text-sm font-medium text-[#0F172A] mb-1">Lịch báo cáo định kỳ cho NH</p>
          <p className="text-xs text-[#94A3B8] mb-4">Gửi tự động theo chu kỳ — mỗi NH chỉ nhận báo cáo của ngành hàng mình phụ trách</p>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#94A3B8]">Chu kỳ</span>
              <input
                type="number" min={1} max={60}
                value={reportSchedule.chuKyNgay}
                onChange={e => setReportSchedule(s => ({ ...s, chuKyNgay: +e.target.value }))}
                className="w-14 text-xs border border-[#E2E8F0] rounded px-2 py-1 text-center outline-none focus:border-[#3B82F6]"
              />
              <span className="text-xs text-[#94A3B8]">ngày</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#94A3B8]">Ngày gửi kế tiếp</span>
              <input
                type="date"
                value={reportSchedule.ngayGuiKeTiep}
                onChange={e => setReportSchedule(s => ({ ...s, ngayGuiKeTiep: e.target.value }))}
                className="text-xs border border-[#E2E8F0] rounded px-2 py-1 outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <OcpsButton variant="primary" size="sm" onClick={() => alert('Đã lưu lịch báo cáo định kỳ')}>Lưu cấu hình</OcpsButton>
            <OcpsButton size="sm" onClick={() => { sendPeriodicReports(); alert('Đã gửi báo cáo định kỳ cho tất cả NH') }}>
              📨 Gửi báo cáo ngay
            </OcpsButton>
          </div>
        </Card>
      )}
    </div>
  )
}
