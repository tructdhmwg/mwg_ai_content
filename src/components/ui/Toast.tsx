import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastCtx {
  toast: (msg: string, type?: ToastType) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle size={16} className="text-green-600 flex-shrink-0" />,
    error:   <XCircle size={16} className="text-red-600 flex-shrink-0" />,
    warning: <AlertCircle size={16} className="text-yellow-600 flex-shrink-0" />,
    info:    <Info size={16} className="text-blue-600 flex-shrink-0" />,
  }
  const styles = {
    success: 'bg-green-50 border-green-200',
    error:   'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info:    'bg-blue-50 border-blue-200',
  }
  return (
    <div className={cn('flex items-start gap-2 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right-5', styles[toast.type])}>
      {icons[toast.type]}
      <p className="text-sm text-gray-800 flex-1">{toast.message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(Ctx)
}
