import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { LocaleSync } from '@/features/i18n/LocaleSync'
import { ThemeController } from '@/features/settings/ThemeController'
import { queryClient } from '@/services/queries'
import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleSync />
      <ThemeController />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
