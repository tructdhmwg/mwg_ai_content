import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { JobListPage } from './pages/JobListPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { CreateJobPage } from './pages/CreateJobPage'
import { PromptConfigPage } from './pages/config/PromptConfigPage'
import { WebhookConfigPage } from './pages/config/WebhookConfigPage'
import { UserListPage } from './pages/admin/UserListPage'
import { UserFormPage } from './pages/admin/UserFormPage'
import { ProductListPage } from './pages/pim/ProductListPage'
import { SpecsDemoPage } from './pages/pim/SpecsDemoPage'
import { OcpsRoutes } from './features/ocps/routes'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobListPage />} />
          <Route path="/jobs/new" element={<CreateJobPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/products" element={<ProductListPage />} />
          {/* Đồng bộ UI chi tiết sản phẩm: mọi sản phẩm dùng chung UI SpecsDemoPage */}
          <Route path="/products/:id" element={<SpecsDemoPage />} />
          <Route path="/products/:id/specs-demo" element={<SpecsDemoPage />} />
          <Route path="/config/prompts" element={<PromptConfigPage />} />

          <Route path="/config/webhooks" element={<WebhookConfigPage />} />
          <Route path="/admin/users" element={<UserListPage />} />
          <Route path="/admin/users/new" element={<UserFormPage />} />
          <Route path="/admin/users/:id" element={<UserFormPage />} />
          <Route path="/ocps/*" element={<OcpsRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
