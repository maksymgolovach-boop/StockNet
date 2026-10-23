import { useTranslation } from 'react-i18next'
import { FileSignature, Heart, MessageSquare } from 'lucide-react'
import type { Product } from '@/types/models'
import { useSaved } from '@/features/saved/savedStore'
import { ReportButton } from '@/features/trust/ReportDialog'
import { ButtonLink, Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

export function ProductActions({ product, showQuote = true }: { product: Product; showQuote?: boolean }) {
  const { t } = useTranslation()
  const saved = useSaved((s) => s.productIds.includes(product.id))
  const toggle = useSaved((s) => s.toggleProduct)
  return (
    <div className="flex flex-col gap-2">
      {showQuote && (
        <ButtonLink to={`/deals/new?product=${product.id}`} size="lg" icon={<FileSignature className="size-4" aria-hidden />}>
          {t('product.requestQuote')}
        </ButtonLink>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <ButtonLink to={`/messages?producer=${product.producerId}&product=${product.id}`} variant="secondary" icon={<MessageSquare className="size-4" aria-hidden />}>
          {t('product.contactProducer')}
        </ButtonLink>
        <Button variant="secondary" onClick={() => toggle(product.id)} aria-pressed={saved} aria-label={t(saved ? 'product.unsave' : 'product.save')} title={t(saved ? 'product.unsave' : 'product.save')}>
          <Heart className={cn('size-4', saved && 'fill-primary text-primary')} aria-hidden />
        </Button>
      </div>
      <div className="pt-1">
        <ReportButton target="listing" name={product.name} />
      </div>
    </div>
  )
}
