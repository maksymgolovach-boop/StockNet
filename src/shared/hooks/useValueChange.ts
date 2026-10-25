import { useState } from 'react'

/**
 * Calls onChange during render when value changes (compared with Object.is). This is React's recommended
 * replacement for an effect that copies a prop into state: no extra render with stale state.
 * onChange may only update state of the calling component.
 */
export function useValueChange<T>(value: T, onChange: (value: T) => void) {
  const [previous, setPrevious] = useState(value)
  if (!Object.is(previous, value)) {
    setPrevious(value)
    onChange(value)
  }
}
