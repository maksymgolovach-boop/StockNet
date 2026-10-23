import { useDevStore } from '@/features/dev/devStore'
import { useMyThreads } from '@/services/queries'

export function useUnreadCount(): number {
  const role = useDevStore((s) => s.role)
  const { data } = useMyThreads()
  return (data ?? []).reduce((n, t) => n + (role === 'buyer' ? t.unreadForBuyer : t.unreadForProducer), 0)
}
