/**
 * Intl formatters are slow to construct and cheap to reuse, and a page of products formats hundreds of prices,
 * quantities and dates. These helpers hand out one shared instance per locale and option set.
 */
const cache = new Map<string, object>()

function shared<T extends object>(kind: string, locale: string, options: object | undefined, create: () => T): T {
  const key = `${kind}|${locale}|${options ? JSON.stringify(options) : ''}`
  let formatter = cache.get(key) as T | undefined
  if (!formatter) cache.set(key, (formatter = create()))
  return formatter
}

export const numberFormat = (locale: string, options?: Intl.NumberFormatOptions) =>
  shared('number', locale, options, () => new Intl.NumberFormat(locale, options))

export const dateTimeFormat = (locale: string, options?: Intl.DateTimeFormatOptions) =>
  shared('date', locale, options, () => new Intl.DateTimeFormat(locale, options))

export const relativeTimeFormat = (locale: string, options?: Intl.RelativeTimeFormatOptions) =>
  shared('relative', locale, options, () => new Intl.RelativeTimeFormat(locale, options))

export const listFormat = (locale: string, options?: Intl.ListFormatOptions) =>
  shared('list', locale, options, () => new Intl.ListFormat(locale, options))

export const displayNames = (locale: string, options: Intl.DisplayNamesOptions) =>
  shared('names', locale, options, () => new Intl.DisplayNames([locale], options))
