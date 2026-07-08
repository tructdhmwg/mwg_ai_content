// Bridge auth cho khu OCPS — KHÔNG phải nguồn auth riêng.
// Đọc user từ useAuthStore của A và suy ra vai trò OCPS hiệu lực:
//   effectiveOcpsRole = user.ocpsRole ?? DEFAULT_ROLE_MAP[user.role]
// Không có login/logout riêng — đăng nhập/đăng xuất vẫn qua authStore của A.
// (Bridge thuần đọc zustand nên không cần Provider; giữ tên file OcpsAuthContext
// theo MERGE_PLAN.md để dễ đối chiếu với AuthContext.jsx của source B.)
import { useAuthStore } from '../../../store/authStore'
import type { User } from '../../../types'
import { ROLES } from '../data/ocpsMockData'
import type { OcpsRole, OcpsUser } from '../types'

export const DEFAULT_ROLE_MAP: Record<User['role'], OcpsRole | undefined> = {
  admin: 'admin',
  site_manager: 'nh',
  content_manager: 'content',
  viewer: undefined,
}

export interface OcpsAuthValue {
  /** User của A đã chiếu sang hình dạng OcpsUser mà các trang OCPS kỳ vọng; null nếu chưa đăng nhập hoặc không có vai trò OCPS */
  currentUser: OcpsUser | null
  effectiveOcpsRole: OcpsRole | undefined
  ROLES: typeof ROLES
}

export function useOcpsAuth(): OcpsAuthValue {
  const user = useAuthStore((s) => s.user)
  const effectiveOcpsRole = user ? user.ocpsRole ?? DEFAULT_ROLE_MAP[user.role] : undefined
  const currentUser: OcpsUser | null =
    user && effectiveOcpsRole
      ? {
          id: user.id,
          name: user.name,
          role: effectiveOcpsRole,
          vendorId: user.vendorId,
          nganhhang: user.nganhhang,
        }
      : null
  return { currentUser, effectiveOcpsRole, ROLES }
}
