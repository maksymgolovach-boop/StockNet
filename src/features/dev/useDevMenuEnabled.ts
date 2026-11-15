import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDevStore } from './devStore'

/**
 * The dev menu is always available in development. In a published build it is hidden until the address contains
 * ?dev=1 (remembered in this browser); ?dev=0 hides it again and switches error simulation off.
 */
export function useDevMenuEnabled(): boolean {
  const flag = new URLSearchParams(useLocation().search).get('dev')
  const enabled = useDevStore((s) => s.menuEnabled)
  useEffect(() => {
    if (flag === '1') useDevStore.setState({ menuEnabled: true })
    if (flag === '0') useDevStore.setState({ menuEnabled: false, simulateErrors: false, latencyMs: 350 })
  }, [flag])
  return import.meta.env.DEV || (flag === null ? enabled : flag === '1')
}
