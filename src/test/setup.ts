import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach } from 'vitest'
import { initI18n } from '@/features/i18n/i18n'
import { useDevStore } from '@/services/devStore'

// jsdom has no matchMedia (used by the theme and reduced-motion checks)
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

beforeAll(async () => {
  await initI18n('en')
})

beforeEach(() => {
  // the mock API answers at once and never fails, unless a test says otherwise
  useDevStore.setState({ latencyMs: 0, simulateErrors: false })
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
