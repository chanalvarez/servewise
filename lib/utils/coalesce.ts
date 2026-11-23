/**
 * Wraps `fn` so a burst of calls runs it at most once per `ms`:
 * the first call runs immediately, calls inside the window collapse into one trailing run.
 * Used to turn bursts of Realtime events into a single refetch.
 */
export function createCoalescer(fn: () => void, ms = 1000) {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  const run = () => {
    timer = null
    last = Date.now()
    fn()
  }

  const trigger = () => {
    if (timer) return
    const wait = last + ms - Date.now()
    if (wait <= 0) run()
    else timer = setTimeout(run, wait)
  }
  trigger.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return trigger
}
