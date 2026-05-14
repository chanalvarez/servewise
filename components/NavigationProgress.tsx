'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Thin indigo progress bar at the very top of the viewport.
 * - Cards dispatch 'sw:nav-start' on click → bar appears instantly at ~72% width.
 * - When the route actually changes (pathname differs) → bar fills to 100% then fades.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [complete, setComplete] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const loading = useRef(false)
  const prevPath = useRef(pathname)

  useEffect(() => {
    const start = () => {
      loading.current = true
      clearTimeout(hideTimer.current)
      setComplete(false)
      setVisible(true)
    }
    window.addEventListener('sw:nav-start', start)
    return () => window.removeEventListener('sw:nav-start', start)
  }, [])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname
    if (!loading.current) return
    loading.current = false
    setComplete(true)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setComplete(false)
    }, 380)
    return () => clearTimeout(hideTimer.current)
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[2px]"
      style={{
        right: complete ? '0%' : '28%',
        background: 'linear-gradient(to right, #6366F1, #8B5CF6)',
        boxShadow: '0 0 8px rgba(99,102,241,0.55)',
        transition: complete
          ? 'right 180ms ease-out'
          : 'right 1400ms cubic-bezier(0.05, 0.35, 0.15, 1)',
      }}
    />
  )
}
