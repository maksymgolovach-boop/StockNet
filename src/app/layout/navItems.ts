import { Boxes, Handshake, LayoutDashboard, MessageSquare, ReceiptText, type LucideIcon } from 'lucide-react'
import type { PartyRole } from '@/types/models'

export interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
  badge?: 'unread'
  roles?: PartyRole[]
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/messages', labelKey: 'nav.messages', icon: MessageSquare, badge: 'unread' },
  { to: '/stock', labelKey: 'nav.stock', icon: Boxes, roles: ['producer'] },
  { to: '/deals', labelKey: 'nav.deals', icon: ReceiptText },
  { to: '/partners', labelKey: 'nav.partners', icon: Handshake },
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
]

export const navItemsFor = (role: PartyRole) => NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role))
