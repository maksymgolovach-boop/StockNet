import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { SearchPage } from '@/features/search/SearchPage'
import { AppShell } from './layout/AppShell'
import { NotFoundPage } from './NotFoundPage'
import { RouteFallback } from './RouteFallback'

/** Pages other than home and search are code-split and fetched on first visit. */
const page = (load: () => Promise<{ default: React.ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
})

const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, key: K) => page(async () => ({ default: (await load())[key] }))

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'category/:slug', element: <SearchPage /> },
      { path: 'product/:id', ...named(() => import('@/features/product/ProductPage'), 'ProductPage') },
      { path: 'producer/:id', ...named(() => import('@/features/producer/ProducerPage'), 'ProducerPage') },
      { path: 'stock', ...named(() => import('@/features/lots/stock/StockPage'), 'StockPage') },
      { path: 'messages', ...named(() => import('@/features/chat/MessagesPage'), 'MessagesPage') },
      { path: 'messages/:threadId', ...named(() => import('@/features/chat/MessagesPage'), 'MessagesPage') },
      { path: 'deals', ...named(() => import('@/features/deals/DealsPage'), 'DealsPage') },
      { path: 'deals/new', ...named(() => import('@/features/rfq/RfqPage'), 'RfqPage') },
      { path: 'deals/:dealId', ...named(() => import('@/features/deals/DealDetailPage'), 'DealDetailPage') },
      { path: 'partners', ...named(() => import('@/features/partners/PartnersPage'), 'PartnersPage') },
      { path: 'dashboard', ...named(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage') },
      { path: 'settings', ...named(() => import('@/features/settings/SettingsPage'), 'SettingsPage') },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
