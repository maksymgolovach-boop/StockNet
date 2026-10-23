const memory = new Map<string, string>()

function probe(): Storage | null {
  try {
    const s = window.localStorage
    const k = '__sy_probe__'
    s.setItem(k, k)
    s.removeItem(k)
    return s
  } catch {
    return null
  }
}

const native = typeof window === 'undefined' ? null : probe()

/** localStorage with an in-memory fallback for sandboxed previews and private windows. */
export const safeStorage = {
  persistent: native !== null,
  getItem(key: string): string | null {
    try {
      if (native) return native.getItem(key)
    } catch {
      /* fall through */
    }
    return memory.get(key) ?? null
  },
  setItem(key: string, value: string): void {
    try {
      if (native) {
        native.setItem(key, value)
        return
      }
    } catch {
      /* fall through */
    }
    memory.set(key, value)
  },
  removeItem(key: string): void {
    try {
      native?.removeItem(key)
    } catch {
      /* ignore */
    }
    memory.delete(key)
  },
}
