import { useDevStore } from '@/features/dev/devStore'

export class ApiError extends Error {
  readonly status: number
  readonly simulated: boolean
  constructor(message: string, status: number, simulated = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.simulated = simulated
  }
}

export class NotFoundError extends ApiError {
  constructor(what: string) {
    super(`${what} not found`, 404)
    this.name = 'NotFoundError'
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wraps a synchronous mock resolver in a network-like promise: artificial latency (±40 %),
 * optional simulated failures from the dev menu, and a structured clone so callers can never
 * mutate the mock database by accident. Replace call sites' implementations with `fetch` later.
 */
export async function mockRequest<T>(resolve: () => T, { latencyFactor = 1 } = {}): Promise<T> {
  const { latencyMs, simulateErrors } = useDevStore.getState()
  const jitter = 0.6 + Math.random() * 0.8
  await sleep(Math.round(latencyMs * latencyFactor * jitter))
  if (simulateErrors) throw new ApiError('Simulated network failure', 503, true)
  return structuredClone(resolve())
}
