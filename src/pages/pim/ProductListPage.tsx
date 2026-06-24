import { Fragment, useState, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Search, Edit2, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { AppShell } from '../../components/layout/AppShell'
import { SiteBadge, Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useProductStore } from '../../store/productStore'
import { SITE_META, type Product } from '../../types'
import { formatDateTime } from '../../lib/utils'
import { PRODUCT_CONTENT_STATUS_META, getProductContentStatus } from '../../lib/productContentStatus'

const PAGE_SIZE = 10
const SEARCH_FIELD_OPTIONS = [
  { value: 'model_code', label: 'Mã Model' },
  { value: 'variantcode', label: 'Mã sản phẩm ERP' },
  { value: 'name', label: 'Tên Model' },
] as const

type SearchField = typeof SEARCH_FIELD_OPTIONS[number]['value']

type ProductModelGroup = {
  modelCode: string
  parent: Product
  variants: Product[]
}

export function ProductListPage() {
  const navigate = useNavigate()
  const products = useProductStore((s) => s.products)

  // Filters State
  const [siteFilter, setSiteFilter] = useState<string>('dmx')
  const [nganhFilter, setNganhFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchField, setSearchField] = useState<SearchField>('model_code')
  const [isSearchFieldOpen, setIsSearchFieldOpen] = useState(false)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedModels, setExpandedModels] = useState<Set<string>>(() => new Set(['LG_FV1412H3B']))

  // Recalculate Stats based on current database state
  const stats = useMemo(() => {
    const siteProducts = siteFilter ? products.filter((p) => p.site_id === siteFilter) : products
    const total = siteProducts.length
    const partial = siteProducts.filter((p) => getProductContentStatus(p) === 'partial').length
    const processing = siteProducts.filter((p) => getProductContentStatus(p) === 'processing').length
    const aiGenerated = siteProducts.filter((p) => getProductContentStatus(p) === 'ai_generated').length
    const approved = siteProducts.filter((p) => getProductContentStatus(p) === 'approved').length
    return { total, partial, processing, aiGenerated, approved }
  }, [products, siteFilter])

  // Get Nganh Hang list for filters based on selected site or all
  const availableNganhHang = useMemo(() => {
    const categories = new Set<string>()
    products.forEach((p) => {
      if (siteFilter === 'all' || p.site_id === siteFilter) {
        categories.add(p.nganh_hang)
      }
    })
    return Array.from(categories)
  }, [products, siteFilter])

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!siteFilter) return []
    return products.filter((p) => {
      if (p.site_id !== siteFilter) return false
      if (nganhFilter !== 'all' && p.nganh_hang !== nganhFilter) return false
      if (statusFilter !== 'all' && getProductContentStatus(p) !== statusFilter) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        return p[searchField].toLowerCase().includes(query)
      }
      return true
    })
  }, [products, siteFilter, nganhFilter, statusFilter, searchField, searchQuery])

  const productModelGroups = useMemo<ProductModelGroup[]>(() => {
    const groupMap = new Map<string, Product[]>()
    filteredProducts.forEach((product) => {
      const next = groupMap.get(product.model_code) || []
      next.push(product)
      groupMap.set(product.model_code, next)
    })

    return Array.from(groupMap.entries()).map(([modelCode, variants]) => {
      const sortedVariants = [...variants].sort((a, b) => a.variantcode.localeCompare(b.variantcode))
      return {
        modelCode,
        parent: sortedVariants[0],
        variants: sortedVariants,
      }
    })
  }, [filteredProducts])

  // Paginated model groups
  const totalPages = Math.ceil(productModelGroups.length / PAGE_SIZE)
  const paginatedGroups = useMemo(() => {
    return productModelGroups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  }, [productModelGroups, currentPage])

  const toggleModel = (modelCode: string) => {
    setExpandedModels((prev) => {
      const next = new Set(prev)
      if (next.has(modelCode)) next.delete(modelCode)
      else next.add(modelCode)
      return next
    })
  }

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    setCurrentPage(1)
  }

  const selectedSearchFieldLabel = SEARCH_FIELD_OPTIONS.find((option) => option.value === searchField)?.label

  return (
    <AppShell breadcrumb={['AICPS', 'Sản phẩm PIM']}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-cyan-600" size={22} />
            Danh sách sản phẩm PIM
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Đồng bộ thông tin sản phẩm trực tiếp từ hệ thống PIM của MWG để biên tập nội dung AI.
          </p>
        </div>
      </div>

      {/* Stats Board */}
      {siteFilter && (
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div 
            onClick={() => { setNganhFilter('all'); setStatusFilter('all'); setSearchQuery(''); setCurrentPage(1); }}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Tổng sản phẩm</span>
              <FileSpreadsheet size={16} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <span className="text-[10px] text-gray-400">Được đồng bộ từ PIM</span>
          </div>

          <div 
            onClick={() => { setNganhFilter('all'); setStatusFilter('processing'); setSearchQuery(''); setCurrentPage(1); }}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Đang gen</span>
              <Loader2 size={16} className="text-violet-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.processing}</div>
            <span className="text-[10px] text-violet-600 font-medium">AI đang gen nội dung</span>
          </div>

          <div 
            onClick={() => { setNganhFilter('all'); setStatusFilter('partial'); setSearchQuery(''); setCurrentPage(1); }}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Partial</span>
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.partial}</div>
            <span className="text-[10px] text-amber-600 font-medium">Cần gen bổ sung</span>
          </div>

          <div 
            onClick={() => { setNganhFilter('all'); setStatusFilter('approved'); setSearchQuery(''); setCurrentPage(1); }}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">Approved</span>
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.approved}</div>
            <span className="text-[10px] text-green-600 font-medium">Sẵn sàng push PIM</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        {/* Site Filter */}
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50/50">
          <span className="text-gray-500 font-medium">Site:</span>
          <select
            value={siteFilter}
            onChange={(e) => { setSiteFilter(e.target.value); setNganhFilter('all'); setCurrentPage(1); }}
            className="bg-transparent focus:outline-none font-semibold text-gray-700"
          >
            <option value="">-- Chọn Site --</option>
            {Object.entries(SITE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        {siteFilter && (
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50/50">
            <span className="text-gray-500 font-medium">Ngành hàng:</span>
            <select
              value={nganhFilter}
              onChange={(e) => { setNganhFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none font-semibold text-gray-700 max-w-[180px]"
            >
              <option value="all">Tất cả ngành</option>
              {availableNganhHang.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        {siteFilter && (
          <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-full flex-wrap items-center gap-2 sm:min-w-[420px] sm:flex-nowrap">
            <div
              className="relative flex shrink-0 items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50/50"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setIsSearchFieldOpen(false)
                }
              }}
            >
              <span className="text-gray-500 font-medium whitespace-nowrap">Tìm kiếm theo:</span>
              <button
                type="button"
                onClick={() => setIsSearchFieldOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 font-semibold text-gray-700 focus:outline-none"
                aria-haspopup="listbox"
                aria-expanded={isSearchFieldOpen}
              >
                {selectedSearchFieldLabel}
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isSearchFieldOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSearchFieldOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {SEARCH_FIELD_OPTIONS.map((option) => {
                    const isSelected = option.value === searchField
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSearchField(option.value)
                          setIsSearchFieldOpen(false)
                          setCurrentPage(1)
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-600 ${
                          isSelected ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <span className="text-blue-600">✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nhập keyword..."
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <Button type="submit" size="sm" className="shrink-0">
              <Search size={14} /> Tìm kiếm
            </Button>
          </form>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {!siteFilter ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Database size={40} className="mb-3 opacity-20" />
            <p className="font-medium text-gray-600">Vui lòng chọn Site để xem danh sách sản phẩm</p>
            <p className="text-xs text-gray-400 mt-1">Chọn một trong các site (TGDD, DMX, Topzone, AVAKids, NTAK) ở thanh bộ lọc phía trên.</p>
          </div>
        ) : paginatedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Database size={40} className="mb-3 opacity-20" />
            <p className="font-medium text-gray-500">Chưa có sản phẩm PIM nào</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng kiểm tra lại cấu hình hoặc dữ liệu hệ thống.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Model Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-36">Variant Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Site</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tên</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Ngành hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-48">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Cập nhật lúc</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.map((group) => {
                  const isExpanded = expandedModels.has(group.modelCode)
                  const showVariants = isExpanded && group.variants.length > 1
                  const parent = group.parent

                  return (
                    <Fragment key={group.modelCode}>
                      <tr
                        key={group.modelCode}
                        onClick={() => group.variants.length > 1 ? toggleModel(group.modelCode) : navigate(parent.id === 'PIM-TEST-01' ? `/products/${parent.id}/specs-demo` : `/products/${parent.id}`)}
                        className="border-b border-gray-100 bg-gray-50/40 hover:bg-cyan-50/20 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {group.variants.length > 1 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleModel(group.modelCode)
                                }}
                                className="text-gray-500 hover:text-gray-800"
                                title={isExpanded ? 'Thu gọn variants' : 'Mở variants'}
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            ) : (
                              <span className="w-3.5" />
                            )}
                            <span className="font-mono text-cyan-700 text-xs font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                              {group.modelCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-400">--</td>
                        <td className="px-4 py-4">
                          <SiteBadge site={parent.site_id} />
                        </td>
                        <td className="px-4 py-4 max-w-0">
                          <p className="font-semibold text-gray-900 truncate" title={parent.name}>{parent.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{group.variants.length} variants</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-medium">
                            {parent.nganh_hang}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-400">--</td>
                        <td className="px-4 py-4 text-xs text-gray-400">--</td>
                        <td className="px-4 py-4 text-xs text-gray-400 text-center">--</td>
                      </tr>

                      {showVariants && group.variants.map((p) => {
                        const status = getProductContentStatus(p)
                        const meta = PRODUCT_CONTENT_STATUS_META[status]
                        const targetPath = p.id === 'PIM-TEST-01' ? `/products/${p.id}/specs-demo` : `/products/${p.id}`

                        return (
                          <tr
                            key={p.id}
                            onClick={() => navigate(targetPath)}
                            className="border-b border-gray-50 hover:bg-cyan-50/20 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="ml-5 h-full border-l border-gray-200 pl-4 text-gray-300">--</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-gray-600 text-xs font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                {p.variantcode}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <SiteBadge site={parent.site_id} />
                            </td>
                            <td className="px-4 py-3 max-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800 truncate" title={p.name}>
                                  {p.name}
                                </p>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {p.specs_files?.length || 0} tài liệu specs
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-medium">
                                {parent.nganh_hang}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <Badge className={`${meta.className} border w-fit font-mono text-[11px]`}>
                                  {status === 'processing' && <Sparkles size={10} className="mr-1" />}
                                  {meta.label}
                                </Badge>
                                <span className="text-[10px] leading-tight text-gray-500">{meta.description}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {formatDateTime(p.updated_at)}
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center">
                                <Button 
                                  size="sm" 
                                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium flex items-center gap-1 shadow-sm rounded-lg"
                                  onClick={() => navigate(targetPath)}
                                >
                                  <Edit2 size={12} />
                                  Biên tập
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-500">Hiển thị {paginatedGroups.length} trên tổng số {productModelGroups.length} model</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>‹</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNo) => (
                    <Button
                      key={pageNo}
                      size="sm"
                      variant={pageNo === currentPage ? 'primary' : 'outline'}
                      onClick={() => setCurrentPage(pageNo)}
                    >
                      {pageNo}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>›</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
