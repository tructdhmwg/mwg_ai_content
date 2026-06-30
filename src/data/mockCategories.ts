import type { PromptCategoryLevel1 } from '../types'

export const MOCK_PROMPT_CATEGORIES: PromptCategoryLevel1[] = [
  {
    id: 'DIEN_THOAI',
    name: 'Điện thoại',
    site_id: 'tgdd',
    sub_categories: [
      {
        id: 'wf1_specs_dt',
        workflow_type: 'wf1_specs',
        name: 'Phân tích Thông số Điện thoại',
        options: [
          {
            id: 'spec_dt_chuan',
            name: 'Trích xuất chuẩn TGDD',
            template_content: `Bạn là một chuyên gia dữ liệu sản phẩm của hệ thống Thế Giới Di Động.\nNhiệm vụ của bạn là đọc nội dung file specs đính kèm và trích xuất các thông số kỹ thuật của điện thoại {{ten_san_pham}}.\nTrả về kết quả dưới định dạng JSON bao gồm các trường: Kích thước màn hình, Công nghệ màn hình, Chipset, RAM, ROM, Camera trước, Camera sau, Dung lượng pin, Sạc nhanh.\nNếu không tìm thấy thông tin, hãy để giá trị là "Đang cập nhật".`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      },
      {
        id: 'wf2_outline',
        workflow_type: 'wf2_outline',
        name: 'Dàn bài (Outline) Chung',
        options: [
          {
            id: 'outline_std',
            name: 'Cơ bản (3-4 Phần)',
            template_content: `Sinh dàn bài bài viết đánh giá chi tiết cho điện thoại {{ten_san_pham}}.\n\nYêu cầu cấu trúc:\n1. Thiết kế và hiển thị (Design & Display)\n2. Hiệu năng và pin (Performance & Battery)\n3. Hệ thống camera (Camera system)\n4. Tổng kết (Conclusion)\n\nMỗi phần cần có 2-3 ý chính dựa trên thông số kỹ thuật sau: {{spec_final_json}}.\nĐịnh dạng trả về: Markdown H2, H3.`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          },
          {
            id: 'outline_premium',
            name: 'Chi tiết (Premium - 5 Phần)',
            template_content: `Sinh dàn bài đánh giá chuyên sâu cho dòng điện thoại cao cấp {{ten_san_pham}}.\n\nYêu cầu cấu trúc (Markdown):\n1. Thiết kế sang trọng, chất liệu cao cấp\n2. Trải nghiệm màn hình (độ sáng, tần số quét)\n3. Đánh giá chi tiết cụm camera (chụp đêm, quay phim)\n4. Sức mạnh hiệu năng (Chip, tản nhiệt, gaming)\n5. Dung lượng pin và tốc độ sạc\n\nHãy tập trung vào những điểm nổi bật nhất từ thông số: {{spec_final_json}}.`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      },
      {
        id: 'wf3_writing_1',
        workflow_type: 'wf3_writing',
        name: 'Viết bài: Điện thoại Giá Rẻ',
        options: [
          {
            id: 'write_cheap_1',
            name: 'Tập trung Pin & Màn hình',
            template_content: `Viết bài đánh giá SEO dài khoảng 800 chữ cho điện thoại giá rẻ {{ten_san_pham}}.\n\nDựa vào dàn bài sau:\n{{outline}}\n\nThông số kỹ thuật:\n{{spec_final_json}}\n\nHướng dẫn viết:\n- Văn phong: Thân thiện, dễ hiểu, nhắm đến đối tượng sinh viên, học sinh, người lao động phổ thông.\n- Nhấn mạnh vào: Màn hình lớn để xem phim, Dung lượng pin trâu (sử dụng cả ngày dài không cần sạc).\n- Tránh dùng từ ngữ quá hàn lâm về công nghệ.\n- Chèn thẻ [IMAGE] ở cuối mỗi đoạn H2 để hệ thống chèn ảnh sau.`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      },
      {
        id: 'wf3_writing_2',
        workflow_type: 'wf3_writing',
        name: 'Viết bài: Điện thoại Gaming',
        options: [
          {
            id: 'write_gaming_1',
            name: 'Tập trung Hiệu năng & Tản nhiệt',
            template_content: `Viết bài đánh giá chuyên sâu (khoảng 1000 chữ) cho điện thoại gaming {{ten_san_pham}}.\n\nDựa vào dàn bài:\n{{outline}}\n\nThông số: {{spec_final_json}}\n\nHướng dẫn viết:\n- Văn phong: Năng động, chuyên nghiệp, sử dụng từ ngữ của giới game thủ (combat, fps, drop fps, tản nhiệt buồng hơi).\n- Tập trung phân tích: Sức mạnh con chip (chơi Genshin Impact, PUBG), dung lượng RAM lớn để đa nhiệm, và hệ thống tản nhiệt.\n- Trình bày dạng Markdown chuẩn, chèn [IMAGE] dưới mỗi H2.`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      },
            {
        id: 'wf5_seo_dt',
        workflow_type: 'wf5_seo',
        name: 'Tối ưu SEO Điện thoại',
        options: [
          {
            id: 'seo_dt_1',
            name: 'Chuẩn SEO TGDD',
            template_content: `Đóng vai là chuyên gia SEO của Thế Giới Di Động.
Hãy sinh thẻ Meta Title (dưới 65 ký tự) và Meta Description (dưới 155 ký tự) cho bài viết về {{ten_san_pham}}.
- Title phải chứa tên sản phẩm và các từ khóa: giá rẻ / chính hãng / trả góp 0%.
- Description phải hấp dẫn, có lời kêu gọi hành động (Call-to-action).`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      },
      {
        id: 'wf4_article_images_dt',
        workflow_type: 'wf4_article_images',
        name: 'Ảnh Bài Viết (Điện thoại)',
        options: [
          {
            id: 'img_dt_1',
            name: 'Sinh ảnh minh họa tính năng',
            template_content: `Sinh prompt cho DALL-E 3 để tạo bộ 4 ảnh minh họa bài viết cho điện thoại {{ten_san_pham}}.
Ảnh 1: Cầm điện thoại trên tay, nền đường phố hiện đại.
Ảnh 2: Chơi game eSport trên màn hình điện thoại.
Ảnh 3: Ống kính camera chụp macro.
Ảnh 4: Sạc nhanh với hiệu ứng tia sét.`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      }
    ]
  },
  {
    id: 'TU_LANH',
    name: 'Tủ lạnh',
    site_id: 'dmx',
    sub_categories: [
      {
        id: 'wf2_outline_tl',
        workflow_type: 'wf2_outline',
        name: 'Dàn bài Tủ lạnh',
        options: [
          {
            id: 'tl_outline_1',
            name: 'Cơ bản (Inverter)',
            template_content: `Tạo dàn bài cho tủ lạnh {{ten_san_pham}} thuộc hệ thống Điện Máy Xanh.\nCấu trúc:\n1. Thiết kế bên ngoài và dung tích\n2. Công nghệ tiết kiệm điện Inverter\n3. Công nghệ làm lạnh & khử mùi\n4. Các tiện ích khác\nThông số: {{spec_final_json}}`,
            is_active: true,
            model: 'gpt-4o',
            updated_at: new Date().toISOString(),
            updated_by: 'Admin'
          }
        ]
      }
    ]
  }
]
