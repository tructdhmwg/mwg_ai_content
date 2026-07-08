import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export interface BentoCardStat {
  label: string
  dotColor: string
  value: number | null
  loading?: boolean
  error?: boolean
}

export interface BentoCardProps {
  to: string
  kicker: string
  kickerIcon: LucideIcon
  title: string
  description: string
  ctaLabel: string
  glyphIcon: LucideIcon
  /** CSS `background` value cho nền thẻ (gradient theo màu brand riêng của thẻ) */
  background: string
  /** CSS `background` value cho ô vuông icon (GlyphTile) */
  tileGradient: string
  /** Màu chữ/icon accent (kicker text, CTA, focus ring) */
  accentColor: string
  stat?: BentoCardStat
  className?: string
}

function StatPillSkeleton() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 motion-safe:animate-pulse" />
      <span className="h-3 w-20 rounded bg-gray-300 motion-safe:animate-pulse" />
    </div>
  )
}

export function BentoCard({
  to,
  kicker,
  kickerIcon: KickerIcon,
  title,
  description,
  ctaLabel,
  glyphIcon: GlyphIcon,
  background,
  tileGradient,
  accentColor,
  stat,
  className,
}: BentoCardProps) {
  const showStat = stat && !stat.error
  const kickerAndCtaStyle = { color: accentColor }

  return (
    <Link
      to={to}
      aria-label={title}
      style={{ background, ['--tw-ring-color' as string]: accentColor }}
      className={cn(
        'group relative flex h-[340px] max-[899px]:h-auto max-[899px]:min-h-[280px] flex-col overflow-hidden rounded-[24px] border border-black/[0.06] p-8 shadow-[0_1px_3px_rgba(16,24,40,0.06)]',
        'transition-[transform,box-shadow] duration-[250ms] ease-out motion-safe:hover:-translate-y-[3px] motion-safe:active:scale-[0.99]',
        'hover:shadow-[0_20px_40px_-12px_rgba(16,24,40,0.16)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Glyph nền phóng to, bleed ra góc dưới-phải — bị crop bởi overflow-hidden của card;
          giữ gọn trong góc dưới để không đè lên vùng kicker/title; ẩn ở mobile */}
      <GlyphIcon
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-10 hidden opacity-[0.07] min-[900px]:block"
        size={220}
        style={{ color: accentColor }}
        strokeWidth={1.5}
      />

      {/* Góc trên-phải: stat pill */}
      {showStat && (
        <div className="absolute right-8 top-8">
          {stat!.loading ? (
            <StatPillSkeleton />
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stat!.dotColor }} />
              {stat!.value ?? 0} {stat!.label}
            </div>
          )}
        </div>
      )}

      {/* Góc trên-trái: kicker + title + description.
          Ở mobile (card height auto + GlyphTile vẫn absolute góc phải), giới hạn width theo %
          để text không chạy lấn xuống dưới GlyphTile — trên desktop dùng max-width cố định theo spec. */}
      <div className="relative max-w-[70%] min-[900px]:max-w-[380px]">
        <div
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em]"
          style={kickerAndCtaStyle}
        >
          <KickerIcon size={13} />
          {kicker}
        </div>
        <h3 className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-gray-900">{title}</h3>
        <p className="mt-3 max-w-full text-[13.5px] leading-[1.6] text-gray-500 min-[900px]:max-w-[340px]">{description}</p>
      </div>

      {/* Góc dưới-trái: CTA (affordance — cả thẻ là vùng click) */}
      <div className="relative mt-auto flex items-center gap-2 text-[13.5px] font-semibold" style={kickerAndCtaStyle}>
        {ctaLabel}
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 transition-transform duration-[250ms] ease-out motion-safe:group-hover:translate-x-[3px]"
        >
          <ArrowRight size={13} />
        </span>
      </div>

      {/* Góc dưới-phải: GlyphTile kiểu app icon */}
      <div
        className="absolute bottom-7 right-7 flex h-[108px] w-[108px] items-center justify-center rounded-[26px] shadow-[0_14px_30px_rgba(16,24,40,0.16)] transition-transform duration-[250ms] ease-out motion-safe:group-hover:scale-[1.04] motion-safe:group-hover:-rotate-2"
        style={{ background: tileGradient }}
      >
        <GlyphIcon className="text-white" size={52} strokeWidth={1.75} />
      </div>
    </Link>
  )
}
