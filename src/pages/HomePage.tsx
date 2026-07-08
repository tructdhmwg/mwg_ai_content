import { useState } from 'react'
import { Inbox, Sparkles } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { BentoCard } from '../components/home/BentoCard'

function getGreeting(hour: number): string {
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function HomePage() {
  const [hour] = useState(() => new Date().getHours())
  const greeting = getGreeting(hour)

  return (
    <AppShell contentClassName="max-w-[1160px] mx-auto p-6">
      <div className="mb-7">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-gray-900">
          {greeting} 👋
        </h1>
        <p className="mt-1.5 text-[14.5px] text-gray-500">
          Bắt đầu với một trong hai luồng công việc chính của AICPS.
        </p>
      </div>

      <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-[22px]">
        <BentoCard
          to="/products"
          kicker="AI PRODUCTION"
          kickerIcon={Sparkles}
          title="Tạo nội dung sản phẩm bằng AI"
          description="Trích xuất thông số, sinh dàn bài, viết bài chi tiết và tạo ảnh slider — tự động theo từng workflow, sẵn sàng xuất bản lên PIM."
          ctaLabel="Bắt đầu tạo nội dung"
          glyphIcon={Sparkles}
          background="linear-gradient(145deg, #EEF1FF 0%, #F7F5FF 55%, #FDFDFF 100%)"
          tileGradient="linear-gradient(160deg, #6366F1 0%, #4338CA 100%)"
          accentColor="#4F46E5"
        />
        <BentoCard
          to="/ocps/content/dashboard"
          kicker="CONTENT REQUESTS"
          kickerIcon={Inbox}
          title="Tiếp nhận và quản lý yêu cầu sản xuất nội dung"
          description="Theo dõi hàng đợi content từ các site, phân công biên tập, duyệt và bàn giao — toàn bộ vòng đời yêu cầu trong một bảng điều khiển."
          ctaLabel="Mở hàng đợi yêu cầu"
          glyphIcon={Inbox}
          background="linear-gradient(145deg, #E9F7F3 0%, #F3FBF8 55%, #FDFFFE 100%)"
          tileGradient="linear-gradient(160deg, #14B8A6 0%, #0F766E 100%)"
          accentColor="#0F766E"
        />
      </div>
    </AppShell>
  )
}
