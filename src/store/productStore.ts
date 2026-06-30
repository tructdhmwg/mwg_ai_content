import { create } from 'zustand'
import { MOCK_PRODUCTS } from '../data/mockData'
import type { Product, ReferenceFile, ProductCompleteness, SiteId } from '../types'
import { useJobStore } from './jobStore'
import { useAuthStore } from './authStore'

interface ProductStore {
  products: Product[]
  updateProductField: (productId: string, field: keyof Product, value: any) => void
  uploadSpecFile: (productId: string, fileName: string, fileSize: number, fileType: 'product_image' | 'manufacturer_spec' | 'other') => void
  deleteSpecFile: (productId: string, fileId: string) => void
  updateProductPromptCategory: (productId: string, category: string) => void
  updateProductPromptText: (productId: string, step: string, text: string) => void
  generateFieldWithAI: (productId: string, field: 'name' | 'thong_so_ky_thuat' | 'dac_diem_noi_bat' | 'outline' | 'content_html' | 'meta_seo', customPrompt?: string) => Promise<void>
  runWf1ExtractSpecs: (productId: string) => Promise<void>
  runFullWorkflow: (productId: string, onStepChange?: (step: number) => void) => Promise<void>
  importPimProduct: (jsonStr: string) => Product[]
}



const logJobRun = (
  product: Product,
  jobTypeLabel: string,
  status: 'published' | 'approved' | 'running' | 'qc_pending' | 'outline_running' | 'writing_running' | 'image_running',
  note?: string
) => {
  const user = useAuthStore.getState().user
  const creator = user ? user.name : 'Hệ thống (AI)'
  const newJobId = `JOB-0${Math.floor(Math.random() * 9000) + 1000}`
  
  useJobStore.getState().addJob({
    job_id: newJobId,
    site_id: product.site_id,
    job_type: 'product_content',
    pim_product_id: product.id,
    ten_san_pham: `${product.name} [${jobTypeLabel}]`,
    nganh_hang: product.nganh_hang,
    status: status,
    spec_completeness: product.completeness,
    outline: product.outline,
    content_html: product.content_html,
    gallery_images: product.gallery_images,
    slide_images: product.slide_images,
    thumb_url: product.thumb_url,
    meta_seo: product.meta_seo,
    created_by: creator,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    note: note || `Đã chạy tác vụ đơn lẻ: ${jobTypeLabel}`,
    run_id: `run_${Date.now()}_single`
  })
}

// Helper to load products from localStorage or use mock data
const getInitialProducts = (): Product[] => {
  const stored = localStorage.getItem('aicps_products')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Product[]
      const merged = parsed.map((p) => {
        const mockMatch = MOCK_PRODUCTS.find((m) => m.id === p.id)
        if (mockMatch) {
          return {
            ...mockMatch,
            ...p,
            model_code: p.model_code || mockMatch.model_code || '',
            variantcode: p.variantcode || mockMatch.variantcode || '',
          }
        }
        return p
      })
      
      // Append any new products from MOCK_PRODUCTS that aren't in localStorage yet
      MOCK_PRODUCTS.forEach((mockP) => {
        if (!parsed.find((p) => p.id === mockP.id)) {
          merged.push(mockP)
        }
      })
      
      return merged
    } catch (e) {
      console.error('Failed to parse stored products', e)
    }
  }
  return MOCK_PRODUCTS
}

// Helper to compute completeness & status based on fields
const recalculateCompleteness = (product: Product): { completeness: number; status: ProductCompleteness } => {
  let score = 0
  
  if (product.thong_so_ky_thuat && Object.keys(product.thong_so_ky_thuat).length > 0) {
    score += 20
  }
  if (product.dac_diem_noi_bat && product.dac_diem_noi_bat.length > 0) {
    score += 20
  }
  if (product.outline && product.outline.trim().length > 0) {
    score += 20
  }
  if (product.content_html && product.content_html.trim().length > 0) {
    score += 20
  }
  if (product.meta_seo && (product.meta_seo.title.trim().length > 0 || product.meta_seo.description.trim().length > 0)) {
    score += 20
  }

  let status: ProductCompleteness = 'no_content'
  if (score === 100) {
    status = 'complete'
  } else if (score > 0) {
    status = 'partial'
  }

  return { completeness: score, status }
}

const saveToStorage = (products: Product[]) => {
  localStorage.setItem('aicps_products', JSON.stringify(products))
}

export const useProductStore = create<ProductStore>((set) => ({
  products: getInitialProducts(),

  importPimProduct: (jsonStr) => {
    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      throw new Error('Định dạng JSON không hợp lệ!')
    }

    const newProducts: Product[] = []
    const objects = Array.isArray(parsed) ? parsed : (parsed.object || [parsed])
    
    for (const obj of objects) {
      if (!obj) continue
      const cateCode = obj.cate_code || ''
      
      const variants = obj.product_variant || []
      for (const variant of variants) {
        if (!variant) continue
        const variantCode = (variant.variant_code || '').trim()
        if (!variantCode) continue
        
        const commonInfo = variant.common_information?.value || {}
        const seoInfo = variant.seo_information?.value || {}
        const specsInfo = variant.specs_information?.value || {}
        const imagesInfo = variant.image_information_by_variant?.value || {}
        
        const name = commonInfo.product_name_sku?.value ||
                     commonInfo.model_name?.value ||
                     commonInfo.name?.value ||
                     `Sản phẩm ${variantCode}`
        
        let site_id: SiteId = 'dmx'
        const avtUrl = imagesInfo.variant_avt_sku?.value?.[0]?.url || commonInfo.image?.[0]?.url || ''
        const galleryUrls = imagesInfo.gallery?.value || []
        const allUrls = [avtUrl, ...galleryUrls.map((g: any) => g.url)].join(' ').toLowerCase()
        
        if (allUrls.includes('avakids')) site_id = 'avakids'
        else if (allUrls.includes('tgdd')) site_id = 'tgdd'
        else if (allUrls.includes('topzone')) site_id = 'topzone'
        else if (allUrls.includes('ntak')) site_id = 'ntak'
        else if (allUrls.includes('dmx')) site_id = 'dmx'
        
        let nganh_hang = 'Điều hòa'
        if (cateCode === '36') {
          nganh_hang = 'Điều hòa'
        } else {
          const lowerName = name.toLowerCase()
          if (lowerName.includes('điện thoại') || lowerName.includes('iphone') || lowerName.includes('samsung galaxy')) nganh_hang = 'Điện thoại'
          else if (lowerName.includes('máy giặt')) nganh_hang = 'Máy giặt'
          else if (lowerName.includes('tủ lạnh')) nganh_hang = 'Tủ lạnh'
          else if (lowerName.includes('sữa')) nganh_hang = 'Sữa bột'
          else if (lowerName.includes('xe đẩy')) nganh_hang = 'Xe đẩy'
          else if (lowerName.includes('tai nghe') || lowerName.includes('airpods')) nganh_hang = 'Tai nghe'
          else if (lowerName.includes('đồng hồ') || lowerName.includes('smartwatch')) nganh_hang = 'Smartwatch'
        }
        
        const thong_so_ky_thuat: Record<string, string> = {}
        Object.entries(specsInfo).forEach(([_, specObj]: [string, any]) => {
          if (!specObj || specObj.value === null || specObj.value === undefined) return
          const label = specObj.label
          let valueStr = ''
          
          if (specObj.type === 'option') {
            valueStr = specObj.value.name || ''
          } else if (specObj.type === 'options') {
            const arr = Array.isArray(specObj.value) ? specObj.value : [specObj.value]
            valueStr = arr.map((x: any) => x?.name).filter(Boolean).join(', ')
          } else if (typeof specObj.value === 'object') {
            valueStr = specObj.value.name || JSON.stringify(specObj.value)
          } else {
            valueStr = String(specObj.value)
          }
          
          if (label && valueStr) {
            thong_so_ky_thuat[label] = valueStr
          }
        })
        
        const keyFeaturesHtml = commonInfo.key_features?.value || ''
        const dac_diem_noi_bat: string[] = []
        if (keyFeaturesHtml) {
          const liRegex = /<li>(.*?)<\/li>/gi
          const matches = [...keyFeaturesHtml.matchAll(liRegex)]
          if (matches.length > 0) {
            matches.forEach((m) => {
              dac_diem_noi_bat.push(m[1].replace(/<[^>]+>/g, '').trim())
            })
          } else {
            dac_diem_noi_bat.push(keyFeaturesHtml.replace(/<[^>]+>/g, '').trim())
          }
        }
        
        const content_html = commonInfo.product_articles?.value || ''
        
        const meta_seo = {
          title: seoInfo.title?.value || '',
          description: seoInfo.description?.value || '',
          keywords: (seoInfo.keyword?.value || '').split(',').map((k: string) => k.trim()).filter(Boolean)
        }
        
        let reference_url = ''
        const slug = commonInfo.url?.value || ''
        if (slug) {
          if (site_id === 'dmx') {
            reference_url = `https://www.dienmayxanh.com/may-lanh/${slug}`
          } else if (site_id === 'tgdd') {
            reference_url = `https://www.thegioididong.com/dtdd/${slug}`
          } else {
            reference_url = `https://www.dienmayxanh.com/${slug}`
          }
        }
        
        const specs_files = avtUrl ? [
          { 
            id: `spec-${variantCode}`, 
            name: `PIM_${variantCode}_Specs_Official.pdf`, 
            size: 1024 * 1024 + Math.floor(Math.random() * 500000), 
            uploaded_at: new Date().toISOString() 
          }
        ] : []
        
        const gallery_images = galleryUrls.map((g: any, index: number) => ({
          id: `gal-${variantCode}-${index}`,
          url: g.url || '',
          label: g.name || `Ảnh chi tiết ${index + 1}`
        }))
        
        const video_url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        
        const productItem: Product = {
          id: `PIM-${variantCode}`,
          model_code: obj.model_code || '181158',
          variantcode: variantCode,
          variant_name: obj.variant_name || variantCode.replace(/_/g, ' - ').replace(/LG/i, 'LG'),
          product_code_erp: obj.product_code_erp || `${1751098000100 + Math.floor(Math.random() * 900)}`,
          name,
          site_id,
          nganh_hang,
          status: 'no_content',
          completeness: 0,
          pim_status: 'draft',
          reference_url,
          drive_url: '',
          specs_files,
          thong_so_ky_thuat,
          dac_diem_noi_bat,
          outline: '',
          content_html,
          meta_seo,
          thumb_url: avtUrl,
          gallery_images,
          video_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { completeness, status } = recalculateCompleteness(productItem)
        productItem.completeness = completeness
        productItem.status = status
        
        newProducts.push(productItem)
      }
    }
    
    if (newProducts.length === 0) {
      throw new Error('Không tìm thấy product_variant nào hợp lệ trong JSON!')
    }
    
    set((state) => {
      const existingIds = new Set(state.products.map((p) => p.id))
      const uniqueNewProducts = newProducts.filter((p) => !existingIds.has(p.id))
      const updatedProducts = [...uniqueNewProducts, ...state.products]
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    })
    
    return newProducts
  },

  updateProductField: (productId, field, value) =>
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          const updatedProduct = {
            ...p,
            [field]: value,
            updated_at: new Date().toISOString(),
          }
          // Recalculate completeness when content fields are modified
          const { completeness, status } = recalculateCompleteness(updatedProduct)
          updatedProduct.completeness = completeness
          updatedProduct.status = status
          return updatedProduct
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    }),

  uploadSpecFile: (productId, fileName, fileSize, fileType) =>
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          const newFile: ReferenceFile = {
            id: 'file-' + Math.random().toString(36).substring(2, 9),
            name: fileName,
            url: 'https://example.com/' + fileName, // Mock URL
            size: fileSize,
            uploaded_at: new Date().toISOString(),
            file_type: fileType,
          }
          const files = p.specs_files ? [...p.specs_files, newFile] : [newFile]
          return {
            ...p,
            specs_files: files,
            updated_at: new Date().toISOString(),
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    }),

  deleteSpecFile: (productId, fileId) =>
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            specs_files: p.specs_files?.filter((f) => f.id !== fileId) || [],
            updated_at: new Date().toISOString(),
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    }),

  updateProductPromptCategory: (productId, category) =>
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            active_prompt_category: category,
            updated_at: new Date().toISOString(),
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    }),

  updateProductPromptText: (productId, step, text) =>
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          const customPrompt = p.custom_prompt_text ? { ...p.custom_prompt_text } : {}
          customPrompt[step] = text
          return {
            ...p,
            custom_prompt_text: customPrompt,
            updated_at: new Date().toISOString(),
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    }),

  generateFieldWithAI: async (productId, field, customPrompt) => {
    if (customPrompt) {
      console.log(`Generating field "${field}" using custom prompt of length: ${customPrompt.length}`)
    }
    // Return a promise to handle loader state in components
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        let updatedProd: Product | undefined
        set((s) => {
          const updatedProducts = s.products.map((p) => {
            if (p.id === productId) {
              const updated = { ...p }
              const namePart = p.name.replace(/\s\d+GB|\s\d+L.*/gi, '') // Clean name for context

              if (field === 'name') {
                updated.name = p.name + ' (AI Optimized Name)'
              } else if (field === 'thong_so_ky_thuat') {
                updated.thong_so_ky_thuat = {
                  'Thương hiệu': p.site_id === 'tgdd' || p.site_id === 'topzone' ? 'Apple' : 'Thương hiệu lớn',
                  'Loại sản phẩm': p.nganh_hang,
                  'Thông số AI': 'Đã tự động trích xuất từ Specs File và Prompt mẫu',
                  'Hiệu năng': 'Đạt chuẩn AI Vision',
                  'Độ bền': 'Chống trầy xước & va đập',
                  'Bảo hành': '12 tháng chính hãng'
                }
              } else if (field === 'dac_diem_noi_bat') {
                updated.dac_diem_noi_bat = [
                  `Đặc điểm nổi bật 1 của ${namePart} được sinh tự động bằng AI`,
                  `Ứng dụng các công nghệ tiên tiến nhất phù hợp với ngành hàng ${p.nganh_hang}`,
                  `Trải nghiệm người dùng được tối ưu hóa vượt trội nhờ trợ lý AI thông minh`,
                  `Thiết kế đẳng cấp chuẩn phong cách tinh tế, bền bỉ theo thời gian`
                ]
              } else if (field === 'outline') {
                updated.outline = `# Outline AI: ${p.name}\n\n## 1. Giới thiệu tổng quan sản phẩm\n- Giới thiệu nhanh về vị thế thương hiệu và đặc tính cốt lõi.\n\n## 2. Thiết kế đột phá mang lại trải nghiệm tinh tế\n- Phân tích chất liệu, kích thước và màu sắc xu hướng.\n\n## 3. Hiệu năng vận hành mạnh mẽ đáp ứng mọi nhu cầu\n- Liệt kê thông số kỹ thuật then chốt và tính năng nổi bật.\n\n## 4. Tổng kết ưu nhược điểm & Nhận định người dùng\n- Đưa ra lời khuyên lựa chọn phù hợp.`
              } else if (field === 'content_html') {
                const img0 = p.article_images?.[0]?.url || `https://picsum.photos/seed/${p.id}-art0/800/600`
                const img1 = p.article_images?.[1]?.url || `https://picsum.photos/seed/${p.id}-art1/800/600`
                updated.content_html = `<div class="product-desc">
  <h2>Khám phá siêu phẩm ${p.name} - Đỉnh cao công nghệ thế hệ mới</h2>
  <p>Chào mừng bạn đến với kỷ nguyên công nghệ đột phá cùng <strong>${p.name}</strong>. Đây là thiết bị được sinh ra để nâng tầm phong cách sống, kết hợp hài hòa giữa tính nghệ thuật trong thiết kế và hiệu năng mạnh mẽ bên trong.</p>
  
  <h3>Thiết kế đột phá mang lại trải nghiệm tinh tế</h3>
  <p className="img-wrapper"><img src="${img0}" alt="Thiết kế đột phá mang lại trải nghiệm tinh tế" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" /></p>
  <p>Với độ hoàn thiện tỉ mỉ từ vật liệu cao cấp, sản phẩm mang lại cảm giác cầm nắm chắc chắn và sang trọng ngay từ cái nhìn đầu tiên. Các cạnh máy được bo cong mượt mà, kết hợp với các tùy chọn màu sắc thời trang giúp sản phẩm dễ dàng nổi bật trong tay bạn.</p>

  <h3>Hiệu năng vận hành vượt trội</h3>
  <p className="img-wrapper"><img src="${img1}" alt="Hiệu năng vận hành vượt trội" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" /></p>
  <p>Được trang bị bộ vi xử lý tiên tiến nhất trong phân khúc ngành hàng <em>${p.nganh_hang}</em>, sản phẩm có khả năng xử lý mượt mà tất cả các tác vụ từ cơ bản đến phức tạp nhất mà không gặp hiện tượng giật lag, tối ưu hóa tối đa thời lượng sử dụng cho người dùng.</p>
</div>`
              } else if (field === 'meta_seo') {
                updated.meta_seo = {
                  title: `${p.name} chính hãng - Giá tốt nhất thị trường | ${p.site_id.toUpperCase()}`,
                  description: `Mua ngay ${p.name} chính hãng giá cực tốt kèm nhiều ưu đãi hấp dẫn. Cam kết chất lượng, bảo hành dài lâu, giao hàng nhanh 2 giờ.`,
                  keywords: [p.name.toLowerCase(), p.nganh_hang.toLowerCase(), `mua ${p.name.toLowerCase()}`, `gia ${p.name.toLowerCase()}`]
                }
              }

              updated.updated_at = new Date().toISOString()
              const { completeness, status } = recalculateCompleteness(updated)
              updated.completeness = completeness
              updated.status = status
              updatedProd = updated
              return updated
            }
            return p
          })
          saveToStorage(updatedProducts)
          return { products: updatedProducts }
        })

        if (updatedProd) {
          const fieldLabels: Record<string, string> = {
            name: 'AI Tối ưu Tên',
            thong_so_ky_thuat: 'WF1 – Cập nhật Specs',
            dac_diem_noi_bat: 'WF2 – Gen Điểm nổi bật',
            outline: 'WF2 – Tạo Outline',
            content_html: 'WF3 – Viết bài chi tiết',
            meta_seo: 'WF5 – Tối ưu SEO Meta'
          }
          logJobRun(updatedProd, fieldLabels[field] || field, 'published', `Đã sinh tự động bằng AI cho trường: ${field}`)
        }
        resolve()
      }, 1500)
    })
  },

  runWf1ExtractSpecs: async (productId) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        let updatedProd: Product | undefined
        set((s) => {
          const updatedProducts = s.products.map((p) => {
            if (p.id === productId) {
              // Generate specific specs based on industry
              let parsedSpecs: Record<string, string> = {
                'Thương hiệu': p.site_id === 'tgdd' || p.site_id === 'topzone' ? 'Apple' : 'Thương hiệu chính hãng',
                'Loại sản phẩm': p.nganh_hang,
                'Xuất xứ': 'Chính hãng',
              }

              if (p.nganh_hang === 'Điện thoại' || p.nganh_hang === 'iPhone') {
                parsedSpecs = {
                  ...parsedSpecs,
                  'Màn hình': '6.7 inch, Super Retina XDR OLED, 120Hz',
                  'Chipset': 'Apple A18 Pro 3nm',
                  'Bộ nhớ trong': '256 GB',
                  'Camera sau': '48 MP + 48 MP + 12 MP',
                  'Dung lượng pin': '4422 mAh, sạc nhanh 25W MagSafe'
                }
              } else if (p.nganh_hang === 'Laptop') {
                parsedSpecs = {
                  ...parsedSpecs,
                  'CPU': 'Intel Core Ultra 7 155H',
                  'RAM': '16 GB LPDDR5X',
                  'SSD': '512 GB PCIe NVMe M.2',
                  'Màn hình': '14 inch, 2.8K OLED (2880 x 1800), 120Hz',
                  'Trọng lượng': '1.24 kg'
                }
              } else if (p.nganh_hang === 'Sữa bột') {
                parsedSpecs = {
                  ...parsedSpecs,
                  'Khối lượng tịnh': '900g',
                  'Độ tuổi': 'Từ 1 đến 3 tuổi',
                  'Nơi sản xuất': 'New Zealand',
                  'Hạn sử dụng': '24 tháng kể từ ngày sản xuất'
                }
              } else if (p.nganh_hang === 'Tivi') {
                parsedSpecs = {
                  ...parsedSpecs,
                  'Kích cỡ màn hình': '55 inch',
                  'Độ phân giải': '4K Ultra HD (3840 x 2160)',
                  'Hệ điều hành': 'Google TV',
                  'Công nghệ âm thanh': 'Dolby Atmos, DTS Virtual:X'
                }
              } else if (p.nganh_hang === 'Máy giặt') {
                parsedSpecs = {
                  ...parsedSpecs,
                  'Khối lượng giặt': '9.0 kg',
                  'Kiểu động cơ': 'Truyền động gián tiếp (Dây Curoa)',
                  'Công nghệ Inverter': 'Có (Tiết kiệm điện)',
                  'Chương trình giặt': '14 chương trình'
                }
              } else {
                parsedSpecs = {
                  ...parsedSpecs,
                  'Thông số': 'Đã tự động trích xuất',
                  'Kiểm duyệt': 'Đạt chuẩn chất lượng'
                }
              }

              const updated = {
                ...p,
                thong_so_ky_thuat: parsedSpecs,
                updated_at: new Date().toISOString()
              }
              const { completeness, status } = recalculateCompleteness(updated)
              updated.completeness = completeness
              updated.status = status
              updatedProd = updated
              return updated
            }
            return p
          })
          saveToStorage(updatedProducts)
          return { products: updatedProducts }
        })

        if (updatedProd) {
          logJobRun(updatedProd, 'WF1 – Trích xuất Specs Hãng', 'published', 'Đã đọc và trích xuất thành công Specs hãng từ tài liệu vào bảng thông số.')
        }
        resolve()
      }, 1000)
    })
  },

  runFullWorkflow: async (productId, onStepChange) => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    
    // Bước 1: WF1 – Đọc & Trích xuất Specs Hãng (đã làm lẻ hoặc chạy nhanh ở đây)
    if (onStepChange) onStepChange(1)
    await sleep(1000)
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          // If specs are empty, extract them
          if (!p.thong_so_ky_thuat || Object.keys(p.thong_so_ky_thuat).length === 0) {
            return {
              ...p,
              thong_so_ky_thuat: {
                'Thương hiệu': p.site_id === 'tgdd' || p.site_id === 'topzone' ? 'Apple' : 'Thương hiệu lớn',
                'Loại sản phẩm': p.nganh_hang,
                'Thông số': 'Được trích xuất từ WF1',
                'Kiểm duyệt': 'Đạt chuẩn'
              },
              updated_at: new Date().toISOString()
            }
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    })

    // Bước 2: WF2 – Lập Dàn ý & Ý tưởng Media (Outline & Highlights & Image prompts)
    if (onStepChange) onStepChange(2)
    await sleep(1200)
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          const namePart = p.name.replace(/\s\d+GB|\s\d+L.*/gi, '')
          return {
            ...p,
            outline: `# Outline AI: ${p.name}\n\n## 1. Giới thiệu sản phẩm & vị thế vượt trội\n- Đánh giá tổng quan thiết kế.\n- Chèn ảnh slide chính: {{image_slide_1}}\n\n## 2. Các điểm cải tiến đắt giá\n- Điểm nhấn từ thông số kỹ thuật đã chuẩn hóa.\n- Chèn ảnh slide phụ: {{image_slide_2}}\n\n## 3. Video trải nghiệm thực tế\n- Chèn video nhúng trực tiếp: {{video_url}}\n\n## 4. FAQ thường gặp`,
            dac_diem_noi_bat: [
              `Hiệu năng và công nghệ tiên tiến của ${namePart}`,
              `Thiết kế đẳng cấp chuẩn phong cách tinh tế, bền bỉ của dòng ${p.nganh_hang}`,
              `Tối ưu hóa năng lượng qua chuẩn specs đã kiểm duyệt`
            ],
            updated_at: new Date().toISOString()
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    })

    // Bước 3: WF3 – Viết Bài & Meta SEO (HTML với placeholders + SEO tags)
    if (onStepChange) onStepChange(3)
    await sleep(1500)
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            content_html: `<div class="product-desc">
  <h2>Khám phá siêu phẩm ${p.name} - Trải nghiệm hoàn mỹ</h2>
  <p>Chào mừng bạn đến với kỷ nguyên công nghệ đột phá. Đây là thiết bị kết hợp hoàn hảo giữa thiết kế và cấu hình.</p>
  
  <h3>Thiết kế đẳng cấp tinh tế</h3>
  <p className="img-wrapper"><img src="https://picsum.photos/seed/${p.id}-art0/800/600" alt="Thiết kế đẳng cấp tinh tế" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" /></p>
  <p>Chất liệu hoàn thiện tuyệt hảo, bền bỉ theo thời gian.</p>
  <div class="my-4 text-center">
    <img src="{{image_slide_1}}" alt="Hình ảnh thiết kế sản phẩm" class="inline-block rounded-xl max-w-full shadow-sm" />
  </div>

  <h3>Hiệu năng đỉnh cao vượt trội</h3>
  <p className="img-wrapper"><img src="https://picsum.photos/seed/${p.id}-art1/800/600" alt="Hiệu năng đỉnh cao vượt trội" class="mx-auto my-4 rounded-xl max-w-full shadow-sm" /></p>
  <p>Vận hành mạnh mẽ đáp ứng tối đa nhu cầu làm việc và giải trí.</p>
  <div class="my-4 text-center">
    <img src="{{image_slide_2}}" alt="Hình ảnh hiệu năng máy" class="inline-block rounded-xl max-w-full shadow-sm" />
  </div>

  <h3>Trải nghiệm trực quan qua Video</h3>
  <p>Dưới đây là video giới thiệu trực quan chi tiết về sản phẩm này:</p>
  <div class="my-4 aspect-video flex justify-center">
    <iframe src="{{video_url}}" width="100%" height="315" frameborder="0" class="rounded-xl shadow-xs" allowfullscreen></iframe>
  </div>
</div>`,
            meta_seo: {
              title: `${p.name} chính hãng - Giá tốt nhất thị trường | ${p.site_id.toUpperCase()}`,
              description: `Mua ngay ${p.name} chính hãng với nhiều ưu đãi. Cam kết chất lượng chuẩn specs hãng, giao hàng siêu tốc.`,
              keywords: [p.name.toLowerCase(), p.nganh_hang.toLowerCase(), `mua ${p.name.toLowerCase()}`]
            },
            updated_at: new Date().toISOString()
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    })

    // Bước 4: WF4 – Sinh bộ ảnh & Video AI (Tạo các URL thật)
    if (onStepChange) onStepChange(4)
    await sleep(1500)
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          const variantCode = p.id.replace('PIM-', '')
          return {
            ...p,
            thumb_url: 'https://picsum.photos/seed/thumb/400/400',
            gallery_images: [
              { id: `gal-${variantCode}-1`, url: 'https://picsum.photos/seed/gal1/600/400', label: 'Ảnh chi tiết 1' },
              { id: `gal-${variantCode}-2`, url: 'https://picsum.photos/seed/gal2/600/400', label: 'Ảnh chi tiết 2' },
              { id: `gal-${variantCode}-3`, url: 'https://picsum.photos/seed/gal3/600/400', label: 'Ảnh chi tiết 3' }
            ],
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            updated_at: new Date().toISOString()
          }
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    })

    // Bước 5: WF5 – n8n Merge & Đồng bộ PIM (Replace placeholders & Publish)
    if (onStepChange) onStepChange(5)
    await sleep(1200)
    let updatedProd: Product | undefined
    set((s) => {
      const updatedProducts = s.products.map((p) => {
        if (p.id === productId) {
          // Replace placeholders in content_html
          let mergedHtml = p.content_html || ''
          mergedHtml = mergedHtml.replace(/\{\{image_slide_1\}\}/g, 'https://picsum.photos/seed/slide1/800/600')
          mergedHtml = mergedHtml.replace(/\{\{image_slide_2\}\}/g, 'https://picsum.photos/seed/slide2/800/600')
          mergedHtml = mergedHtml.replace(/\{\{video_url\}\}/g, 'https://www.youtube.com/embed/dQw4w9WgXcQ')

          const updated = {
            ...p,
            content_html: mergedHtml,
            status: 'complete' as const,
            completeness: 100,
            pim_status: 'published' as const, // final sync state
            slide_images: [
              { id: 'slide-ai-1', url: 'https://picsum.photos/seed/slide1/800/600', label: 'Slide AI 1 - Thiết kế sang trọng', section_h3: 'Thiết kế đẳng cấp tinh tế', source_image: 'design_sketch.png', selection_reason: 'Sinh tự động để khớp với thiết kế mặt lưng' },
              { id: 'slide-ai-2', url: 'https://picsum.photos/seed/slide2/800/600', label: 'Slide AI 2 - Hiệu năng động cơ', section_h3: 'Hiệu năng đỉnh cao vượt trội', source_image: 'performance.png', selection_reason: 'Khớp với công nghệ tản nhiệt và vi xử lý' }
            ],
            updated_at: new Date().toISOString()
          }
          updatedProd = updated
          return updated
        }
        return p
      })
      saveToStorage(updatedProducts)
      return { products: updatedProducts }
    })

    if (updatedProd) {
      logJobRun(updatedProd, 'Chạy Workflow 5 Bước', 'published', 'Đã hoàn thành toàn bộ quy trình biên tập tự động 5 bước.')
    }
  }
}))
