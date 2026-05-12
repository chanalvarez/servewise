'use client'

import { useCallback, useRef } from 'react'

// ── Public interface ───────────────────────────────────────────────────────────

export interface UseAlertSystemReturn {
  /** Call this inside any user gesture handler to pre-unlock audio on iOS Safari */
  unlockAudio: () => void
  /** Gentle two-tone ding + short vibration — fires when staff calls the customer */
  playCalledAlert: () => void
  /** Urgent three-pulse alert + strong vibration — fires when no-show protocol starts */
  playNoShowAlert: () => void
  /** High double-beep + buzz — fires at 2-min and 30-sec no-show warnings */
  playUrgentAlert: () => void
  /** Requests browser Notification permission for background alerts */
  requestNotificationPermission: () => Promise<NotificationPermission>
}

// ── Internal audio helper ──────────────────────────────────────────────────────

function scheduleDing(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  peakGain: number,
  duration: number
): void {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.connect(env)
  env.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startTime)

  // Attack → sustain → exponential decay envelope
  env.gain.setValueAtTime(0, startTime)
  env.gain.linearRampToValueAtTime(peakGain, startTime + 0.012)
  env.gain.setValueAtTime(peakGain, startTime + duration * 0.2)
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAlertSystem(): UseAlertSystemReturn {
  const ctxRef = useRef<AudioContext | null>(null)

  // Lazy-init AudioContext — must be deferred until after a user gesture on iOS
  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        if (!Ctor) return null
        ctxRef.current = new Ctor()
      }
      return ctxRef.current
    } catch {
      return null
    }
  }, [])

  // Call this on any user tap/click on the customer page to satisfy iOS audio unlock requirement
  const unlockAudio = useCallback(() => {
    const ctx = getCtx()
    if (ctx?.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  }, [getCtx])

  // navigator.vibrate is undefined on iOS — wrapped so it never throws
  const safeVibrate = useCallback((pattern: number[]) => {
    console.log('[AlertSystem] safeVibrate called, pattern:', pattern)
    if (typeof navigator === 'undefined') {
      console.log('[AlertSystem] navigator unavailable (SSR context)')
      return
    }
    if (!navigator.vibrate) {
      console.log('[AlertSystem] navigator.vibrate not supported on this device (iOS Safari?)')
      return
    }
    try {
      const result = navigator.vibrate(pattern)
      console.log('[AlertSystem] navigator.vibrate() returned:', result)
      if (!result) {
        console.log('[AlertSystem] vibrate() returned false — may need user gesture or page is not visible')
      }
    } catch (err) {
      console.log('[AlertSystem] navigator.vibrate() threw an error:', err)
    }
  }, [])

  // Runs the audio play function, resuming suspended context first (iOS)
  const playWithCtx = useCallback(
    (playFn: (ctx: AudioContext) => void) => {
      const ctx = getCtx()
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => playFn(ctx)).catch(() => {})
      } else {
        try {
          playFn(ctx)
        } catch {
          // audio scheduling failed — no-op
        }
      }
    },
    [getCtx]
  )

  // Trigger 1: staff calls customer's number
  const playCalledAlert = useCallback(() => {
    safeVibrate([300, 100, 300])

    playWithCtx((ctx) => {
      const t = ctx.currentTime
      // Ascending two-tone ding — pleasant, attention-getting
      scheduleDing(ctx, 880, t, 1.4, 0.7)            // A5
      scheduleDing(ctx, 1318.51, t + 0.18, 1.2, 0.9) // E6
    })
  }, [safeVibrate, playWithCtx])

  // Trigger 2: no-show protocol starts
  const playNoShowAlert = useCallback(() => {
    safeVibrate([500, 100, 500, 100, 500])

    playWithCtx((ctx) => {
      const t = ctx.currentTime
      // Descending three-pulse — signals urgency without being alarming
      scheduleDing(ctx, 1046.5, t, 1.8, 0.45)        // C6
      scheduleDing(ctx, 987.77, t + 0.2, 1.8, 0.45)  // B5
      scheduleDing(ctx, 880, t + 0.4, 2.0, 0.85)      // A5 (resolve)
    })
  }, [safeVibrate, playWithCtx])

  // Escalation alerts: 2-min remaining and 30-sec remaining
  const playUrgentAlert = useCallback(() => {
    safeVibrate([200, 100, 200, 100, 400])

    playWithCtx((ctx) => {
      const t = ctx.currentTime
      // High-pitched rapid double-beep — most attention-grabbing
      scheduleDing(ctx, 1567.98, t, 2.0, 0.3)         // G6
      scheduleDing(ctx, 1567.98, t + 0.22, 2.0, 0.3)  // G6 repeat
    })
  }, [safeVibrate, playWithCtx])

  const requestNotificationPermission = useCallback(
    async (): Promise<NotificationPermission> => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied'
      }
      if (Notification.permission !== 'default') {
        return Notification.permission
      }
      try {
        return await Notification.requestPermission()
      } catch {
        return 'denied'
      }
    },
    []
  )

  return {
    unlockAudio,
    playCalledAlert,
    playNoShowAlert,
    playUrgentAlert,
    requestNotificationPermission,
  }
}
