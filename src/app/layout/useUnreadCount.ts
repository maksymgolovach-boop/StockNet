import { useMyThreads } from '@/services/queries'

export function useUnreadCount(): number {
  const { data } = useMyThreads()
  return (data ?? []).reduce((n, t) => n + (t.mySide === 'buyer' ? t.unreadForBuyer : t.unreadForProducer), 0)
}
