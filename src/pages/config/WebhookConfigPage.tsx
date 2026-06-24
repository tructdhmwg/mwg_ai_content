import { useState } from 'react'
import { AppShell } from '../../components/layout/AppShell'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useWebhookStore } from '../../store/webhookStore'
import { useToast } from '../../components/ui/Toast'
import { Loader2 } from 'lucide-react'

const WF_COLORS: Record<string, string> = {
  wf1: 'bg-blue-100 text-blue-700',
  wf2: 'bg-purple-100 text-purple-700',
  wf3: 'bg-green-100 text-green-700',
  wf4: 'bg-orange-100 text-orange-700',
  wf5: 'bg-red-100 text-red-700',
}

export function WebhookConfigPage() {
  const { webhooks, updateWebhook } = useWebhookStore()
  const { toast } = useToast()
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [localUrls, setLocalUrls] = useState<Record<string, string>>(
    Object.fromEntries(webhooks.map((w) => [w.wf_key, w.url]))
  )
  const [localTimeouts, setLocalTimeouts] = useState<Record<string, number>>(
    Object.fromEntries(webhooks.map((w) => [w.wf_key, w.timeout_ms]))
  )

  const handleTest = async (wf_key: string, label: string) => {
    setTesting((t) => ({ ...t, [wf_key]: true }))
    await new Promise((r) => setTimeout(r, 1000))
    setTesting((t) => ({ ...t, [wf_key]: false }))
    toast(`${label.split(' – ')[0]} webhook phản hồi 200 OK (1.2s)`, 'success')
  }

  const handleToggle = (wf_key: string, current: boolean) => {
    updateWebhook(wf_key, { is_active: !current })
    toast(`${wf_key.toUpperCase()} ${!current ? 'đã bật' : 'đã tắt'}`, 'info')
  }

  const handleSaveAll = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    webhooks.forEach((w) => {
      updateWebhook(w.wf_key, { url: localUrls[w.wf_key], timeout_ms: localTimeouts[w.wf_key] })
    })
    setSaving(false)
    toast('Đã lưu cấu hình webhook', 'success')
  }

  return (
    <AppShell breadcrumb={['AICPS', 'Cấu hình', 'Webhook Config']}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cấu hình Webhook n8n</h1>
          <p className="text-sm text-gray-500 mt-0.5">URL các workflow tự động hóa trên automation.tgdd.vn</p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          Lưu tất cả
        </Button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 mb-5">
        ⚠️ Thay đổi URL sẽ ảnh hưởng tới tất cả jobs mới. Jobs đang chạy không bị ảnh hưởng.
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-48">Workflow</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">URL</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Timeout (ms)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24">Trạng thái</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Test</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((w) => (
              <tr key={w.wf_key} className={`border-b border-gray-50 ${!w.is_active ? 'bg-gray-50/50 opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <Badge className={WF_COLORS[w.wf_key] ?? 'bg-gray-100 text-gray-700'}>
                    {w.wf_key.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">{w.label.split(' – ').slice(1).join(' – ')}</p>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="url"
                    value={localUrls[w.wf_key]}
                    onChange={(e) => setLocalUrls((u) => ({ ...u, [w.wf_key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://..."
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={localTimeouts[w.wf_key]}
                    onChange={(e) => setLocalTimeouts((t) => ({ ...t, [w.wf_key]: Number(e.target.value) }))}
                    className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </td>
                <td className="px-4 py-3">
                  <div
                    onClick={() => handleToggle(w.wf_key, w.is_active)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${w.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${w.is_active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm" variant="outline"
                    disabled={testing[w.wf_key] || !w.is_active}
                    onClick={() => handleTest(w.wf_key, w.label)}
                  >
                    {testing[w.wf_key] ? <Loader2 size={12} className="animate-spin" /> : 'Test'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
