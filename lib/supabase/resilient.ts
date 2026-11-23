// Timeout + small retry for Supabase RPC/REST calls.
// Retries only when the failure is a network error (status 0), a timeout, or a 5xx.
// Database errors (4xx, RAISE EXCEPTION messages) are returned as-is and never retried.

interface Result<T> {
  data: T | null
  error: { message: string } | null
  status: number
}

interface Options {
  attempts?: number
  timeoutMs?: number
}

const isRetryable = (status: number, timedOut: boolean) => timedOut || status === 0 || status >= 500

/**
 * `call` receives an AbortSignal that fires on timeout; pass it to `.abortSignal(signal)`.
 * NOTE: a timeout or lost response is ambiguous (the server may have processed the request).
 * Only retry non-idempotent calls like join_queue because the database makes the repeat safe
 * (it raises 'Already in queue for this store', which the caller treats as success).
 */
export async function withRetry<T>(
  call: (signal: AbortSignal) => PromiseLike<Result<T>>,
  { attempts = 3, timeoutMs = 8000 }: Options = {}
): Promise<Result<T>> {
  let last: Result<T> = { data: null, error: { message: 'Request failed' }, status: 0 }
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    try {
      last = await call(controller.signal)
    } catch (err) {
      last = { data: null, error: { message: err instanceof Error ? err.message : 'Network error' }, status: 0 }
    } finally {
      clearTimeout(timer)
    }
    if (!last.error || !isRetryable(last.status, timedOut)) return last
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * 2 ** i + Math.random() * 250))
  }
  return last
}
