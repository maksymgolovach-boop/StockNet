import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import type { LanguageCode } from '@/types/models'
import { LANGUAGES } from '@/config/languages'
import { useFormat } from '@/features/i18n/useFormat'

/**
 * User-written content shown in its original language. The "Translate" action swaps in a
 * (mock) machine translation into the interface language and labels it clearly.
 */
export function TranslatableText({ text, lang, translations, className }: { text: string; lang: LanguageCode; translations: Partial<Record<LanguageCode, string>>; className?: string }) {
  const { t } = useTranslation()
  const { lang: uiLang } = useFormat()
  const [translated, setTranslated] = useState(false)
  const available = lang !== uiLang && translations[uiLang]
  const shown = translated && available ? (translations[uiLang] as string) : text
  return (
    <div className="flex flex-col gap-2">
      <p className={className} lang={translated && available ? uiLang : lang}>
        {shown}
      </p>
      {available && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button type="button" onClick={() => setTranslated((v) => !v)} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            <Languages className="size-3.5" aria-hidden />
            {translated ? t('translate.showOriginal', { language: LANGUAGES[lang].nativeName }) : t('translate.translateTo', { language: LANGUAGES[uiLang].nativeName })}
          </button>
          {translated && <span className="rounded bg-surface-2 px-1.5 py-0.5 text-ink-muted">{t('translate.machineLabel')}</span>}
          {!translated && <span className="text-ink-subtle">{t('translate.originalIn', { language: LANGUAGES[lang].nativeName })}</span>}
        </div>
      )}
    </div>
  )
}
