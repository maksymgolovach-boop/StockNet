import L from 'leaflet'

/** Content that requires rebuilding the icon markup. */
export interface PinContent {
  label: string
  unit: string
  from: string | null
  count: number
  verified: boolean
  saved: boolean
  partner: boolean
}

/** Interaction states, applied as classes on the existing element (no DOM swap on hover). */
export interface PinState {
  hovered: boolean
  selected: boolean
  visited: boolean
}

const CHECK = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
const HEART = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.1 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 2.9 1.5-1.8 3-2.9 5.1-2.9 3.8 0 6 3.8 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>'
const HANDSHAKE = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7 .9L21 7"/><path d="m3 7 2.6-2.6a5.8 5.8 0 0 1 7 .9"/></svg>'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

const cache = new Map<string, L.DivIcon>()

export const pinKey = (v: PinContent) => JSON.stringify(v)

/** Memoised price-label pin icon; identical content shares one DivIcon instance. */
export function pinIcon(v: PinContent): L.DivIcon {
  const key = pinKey(v)
  const hit = cache.get(key)
  if (hit) return hit
  const html =
    '<div class="sy-pin">' +
    (v.verified ? `<span class="sy-pin__check">${CHECK}</span>` : '') +
    (v.saved ? `<span class="sy-pin__heart">${HEART}</span>` : '') +
    (v.from ? `<span class="sy-pin__from">${esc(v.from)}</span>` : '') +
    `<span>${esc(v.label)}</span>` +
    (v.unit ? `<span class="sy-pin__unit">/&nbsp;${esc(v.unit)}</span>` : '') +
    (v.count > 1 ? `<span class="sy-pin__count">${v.count}</span>` : '') +
    (v.partner ? `<span class="sy-pin__partner">${HANDSHAKE}</span>` : '') +
    '</div>'
  const icon = L.divIcon({ className: 'sy-pin-wrap', html, iconSize: [0, 0], iconAnchor: [0, 0] })
  if (cache.size > 500) cache.clear()
  cache.set(key, icon)
  return icon
}

export function applyPinState(el: HTMLElement | undefined, s: PinState) {
  const pin = el?.querySelector('.sy-pin')
  if (!pin) return
  pin.classList.toggle('is-hovered', s.hovered && !s.selected)
  pin.classList.toggle('is-selected', s.selected)
  pin.classList.toggle('is-visited', s.visited && !s.selected && !s.hovered)
}

export function clusterIcon(count: number, fromLabel: string | null, ariaLabel: string): L.DivIcon {
  return L.divIcon({
    className: 'sy-cluster-wrap',
    html: `<div class="sy-cluster" role="img" aria-label="${esc(ariaLabel)}"><strong>${count}</strong>${fromLabel ? `<span>${esc(fromLabel)}</span>` : ''}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}
