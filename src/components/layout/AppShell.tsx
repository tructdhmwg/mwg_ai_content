import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: ReactNode
  breadcrumb?: string[]
  contentClassName?: string
}

export function AppShell({ children, breadcrumb, contentClassName }: Props) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen overflow-x-clip bg-[#f0f2f5]">
      <Sidebar />
      <main className="ml-[var(--sidebar-width)] min-h-screen w-[calc(100%_-_var(--sidebar-width))] min-w-0 overflow-x-clip">
        <div className={contentClassName || 'max-w-[1280px] mx-auto p-6'}>
          {breadcrumb && (
            <nav className="mb-4 text-xs text-gray-400">
              {breadcrumb.map((item, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5 text-gray-300">/</span>}
                  <span className={i === breadcrumb.length - 1 ? 'text-gray-600 font-medium' : ''}>
                    {item}
                  </span>
                </span>
              ))}
            </nav>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
