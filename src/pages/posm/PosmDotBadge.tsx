// Cùng kiểu dot + pill với OcpsBadge (features/ocps/components/OcpsBadge.tsx) để đồng bộ CSS với khu OCPS gốc
export function PosmDotBadge({ label, dot, bg, color }: { label: string; dot: string; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      {label}
    </span>
  )
}
