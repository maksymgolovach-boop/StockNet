import type { Producer } from '@/types/models'
import { cn } from '@/shared/lib/cn'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

export function ProducerAvatar({ producer, size = 'md' }: { producer: Pick<Producer, 'name' | 'brandHue'>; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: `hsl(${producer.brandHue} 30% 30%)` }}
      className={cn('grid shrink-0 place-items-center rounded-lg font-semibold text-white', size === 'lg' ? 'size-16 text-xl' : size === 'sm' ? 'size-9 text-xs' : 'size-11 text-sm')}
    >
      {initials(producer.name)}
    </span>
  )
}
