// Port từ _source_b_reference/src/pages/admin/AdminGodView.jsx (route /ocps/admin/god-view)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOcpsData } from '../../context/OcpsDataContext'
import { Card } from '../../components/Card'
import { OcpsBadge } from '../../components/OcpsBadge'
import { OcpsButton } from '../../components/OcpsButton'
import { DOC_STATUS_LABEL, FLOW_LABEL } from '../../data/ocpsMockData'

interface GodViewFilters {
  nganhhang: string
  hang: string
  flow: string
  doc: string
  sla: string
}
interface SavedView {
  name: string
  filters: GodViewFilters
}

const EMPTY_FILTERS: GodViewFilters = { nganhhang: '', hang: '', flow: '', doc: '', sla: '' }

export function AdminGodView() {
  const { items } = useOcpsData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GodViewFilters>(EMPTY_FILTERS)
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [viewName, setViewName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const nganhhangList = [...new Set(items.map(i => i.nganhhang))]
  const vendorList = [...new Set(items.map(i => i.vendor))]

  const filtered = items.filter(i => {
    if (filters.nganhhang && i.nganhhang !== filters.nganhhang) return false
    if (filters.hang && i.vendor !== filters.hang) return false
    if (filters.flow && i.flow !== filters.flow) return false
    if (filters.doc && i.docStatus !== filters.doc) return false
    if (filters.sla === 'overdue' && i.slaConLai >= 0) return false
    return true
  })

  function handleSaveView() {
    const name = viewName.trim()
    if (!name) return
    setSavedViews(v => [...v.filter(x => x.name !== name), { name, filters: { ...filters } }])
    setViewName('')
    setShowSaveInput(false)
  }

  function handleLoadView(view: SavedView) {
    setFilters({ ...view.filters })
  }

  function handleDeleteView(name: string) {
    setSavedViews(v => v.filter(x => x.name !== name))
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-[#0F172A]">God View</h1>
        <p className="text-sm text-[#94A3B8]">Toàn bộ sản phẩm trong hệ thống — {filtered.length}/{items.length} đang hiển thị</p>
      </div>

      {/* Saved views */}
      {savedViews.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <span className="text-xs text-[#94A3B8]">Bộ lọc đã lưu:</span>
          {savedViews.map(v => (
            <div key={v.name} className="flex items-center gap-1">
              <button
                onClick={() => handleLoadView(v)}
                className="text-xs px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-full text-[#1D4ED8] hover:border-[#3B82F6] transition-colors"
              >
                {v.name}
              </button>
              <button onClick={() => handleDeleteView(v.name)} className="text-[#94A3B8] hover:text-[#EF4444] text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      <Card>
        <div className="flex gap-2 mb-4 flex-wrap items-end">
          <select value={filters.nganhhang} onChange={e => setFilters(f => ({...f, nganhhang: e.target.value}))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]">
            <option value="">Ngành hàng: tất cả</option>
            {nganhhangList.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filters.hang} onChange={e => setFilters(f => ({...f, hang: e.target.value}))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]">
            <option value="">Hãng: tất cả</option>
            {vendorList.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filters.flow} onChange={e => setFilters(f => ({...f, flow: e.target.value}))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]">
            <option value="">Flow: tất cả</option>
            {Object.entries(FLOW_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.doc} onChange={e => setFilters(f => ({...f, doc: e.target.value}))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]">
            <option value="">Tài liệu: tất cả</option>
            {Object.entries(DOC_STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.sla} onChange={e => setFilters(f => ({...f, sla: e.target.value}))}
            className="text-xs border border-[#E2E8F0] rounded px-2 py-1.5 bg-white text-[#0F172A]">
            <option value="">SLA: tất cả</option>
            <option value="overdue">Chỉ trễ SLA</option>
          </select>
          <OcpsButton size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
            Xoá filter
          </OcpsButton>
          {showSaveInput ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                placeholder="Tên bộ lọc..."
                value={viewName}
                onChange={e => setViewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveView(); if (e.key === 'Escape') setShowSaveInput(false) }}
                className="text-xs border border-[#3B82F6] rounded px-2 py-1.5 w-32 text-[#0F172A] outline-none"
              />
              <OcpsButton size="sm" onClick={handleSaveView} disabled={!viewName.trim()}>Lưu</OcpsButton>
              <button onClick={() => setShowSaveInput(false)} className="text-xs text-[#94A3B8] hover:text-[#0F172A] px-1">✕</button>
            </div>
          ) : (
            <OcpsButton size="sm" onClick={() => setShowSaveInput(true)}>💾 Lưu view</OcpsButton>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 750 }}>
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#475569] text-left">
                <th className="pb-2 pr-3 font-medium">Mã ERP</th>
                <th className="pb-2 pr-3 font-medium">Ngành hàng</th>
                <th className="pb-2 pr-3 font-medium">Vendor</th>
                <th className="pb-2 pr-3 font-medium">Tài liệu</th>
                <th className="pb-2 pr-3 font-medium">Flow</th>
                <th className="pb-2 pr-3 font-medium">Content</th>
                <th className="pb-2 pr-3 font-medium">MKT</th>
                <th className="pb-2 pr-3 font-medium">SLA</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer" onClick={() => navigate(`/ocps/admin/override/${item.id}`)}>
                  <td className="py-2 pr-3 font-medium text-[#0F172A]">{item.id}</td>
                  <td className="py-2 pr-3 text-[#475569]">{item.nganhhang}</td>
                  <td className="py-2 pr-3 text-[#475569]">{item.vendor}</td>
                  <td className="py-2 pr-3"><OcpsBadge status={item.docStatus} /></td>
                  <td className="py-2 pr-3 text-[#475569]">{(item.flow && FLOW_LABEL[item.flow]) || '—'}</td>
                  <td className="py-2 pr-3"><OcpsBadge status={item.seoStatus} /></td>
                  <td className="py-2 pr-3"><OcpsBadge status={item.mktStatus} /></td>
                  <td className={`py-2 pr-3 font-medium ${item.slaConLai < 0 ? 'text-[#991B1B]' : 'text-[#166534]'}`}>
                    {item.slaConLai < 0 ? `Trễ ${Math.abs(item.slaConLai)}d` : item.ngayGuiYeuCau ? `+${item.slaConLai}d` : '—'}
                  </td>
                  <td className="py-2">
                    <span className="text-xs text-[#1D4ED8] hover:underline">Override</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-xs text-[#94A3B8] py-6">Không có sản phẩm nào khớp bộ lọc</p>
          )}
        </div>
      </Card>
    </div>
  )
}
