'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Bell, AlertTriangle } from 'lucide-react'
import { useAlertSystem } from '@/lib/hooks/useAlertSystem'

interface AlertPayload {
  type: 'called' | 'noshow'
  storeId: string
  storeName: string
  mallSlug: string
  timestamp: number
}

const STORAGE_KEY = 'servewise_alert'
const MAX_AGE_MS = 5 * 60 * 1000

export function GlobalAlertListener() {
  const [banner, setBanner] = useState<AlertPayload | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const { playCalledAlert, playNoShowAlert } = useAlertSystem()

  const dismiss = useCallback(() => {
    setBanner(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  const showAlert = useCallback((payload: AlertPayload) => {
    // Skip if the customer is already on the store's own queue page
    if (pathname.includes(payload.storeId)) return
    // Ignore alerts older than 5 minutes
    if (Date.now() - payload.timestamp > MAX_AGE_MS) return

    setBanner(payload)
    if (payload.type === 'called') playCalledAlert()
    else playNoShowAlert()

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(dismiss, 30_000)
  }, [pathname, playCalledAlert, playNoShowAlert, dismiss])

  // On mount and on every navigation: check localStorage for an active alert
  // This handles same-tab navigation away from the store page
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      showAlert(JSON.parse(raw) as AlertPayload)
    } catch {}
  }, [showAlert])

  // Cross-tab: storage event fires on other tabs when localStorage changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try { showAlert(JSON.parse(e.newValue) as AlertPayload) } catch {}
    }
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('storage', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [showAlert])

  if (!banner) return null

  const isCalled = banner.type === 'called'

  return (
    <div className={`fixed inset-x-0 top-0 z-[60] shadow-lg ${isCalled ? 'bg-emerald-600' : 'bg-red-600'}`}>
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        {isCalled
          ? <Bell className="h-4 w-4 flex-shrink-0 text-white" />
          : <AlertTriangle className="h-4 w-4 flex-shrink-0 text-white" />
        }
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {isCalled
              ? `📢 ${banner.storeName} is calling your number!`
              : `⚠️ ${banner.storeName} — No-Show Protocol Active!`}
          </p>
          <p className={`text-xs ${isCalled ? 'text-emerald-100' : 'text-red-100'}`}>
            {isCalled ? 'Return to the store now.' : 'You have 5 minutes to return or lose your spot.'}
          </p>
        </div>
        <Link
          href={`/${banner.mallSlug}/${banner.storeId}`}
          onClick={dismiss}
          className="flex-shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30"
        >
          Go now
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss alert"
          className="flex-shrink-0 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
