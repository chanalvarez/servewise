'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

const CONTACT_URL = 'https://craydev.vercel.app/#contact'

const BANNER_STYLE: CSSProperties = {
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: 'white',
  fontSize: '13px',
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
}

type DemoContextValue = {
  openRestrictionModal: () => void
  /** Returns true if the action was blocked (demo mode). */
  blockIfDemo: () => boolean
  isDemo: boolean
}

const DemoGuardContext = createContext<DemoContextValue | null>(null)

export function useDemoRestriction(): DemoContextValue {
  const ctx = useContext(DemoGuardContext)
  if (!ctx) {
    return {
      openRestrictionModal: () => {},
      blockIfDemo: () => false,
      isDemo: false,
    }
  }
  return ctx
}

export function DemoGuard({ children }: { children: ReactNode }) {
  const isDemo = process.env.NEXT_PUBLIC_IS_DEMO === 'true'
  const [modalOpen, setModalOpen] = useState(false)

  const openRestrictionModal = useCallback(() => setModalOpen(true), [])

  const blockIfDemo = useCallback(() => {
    if (!isDemo) return false
    setModalOpen(true)
    return true
  }, [isDemo])

  const value = useMemo(
    () => ({ openRestrictionModal, blockIfDemo, isDemo }),
    [openRestrictionModal, blockIfDemo, isDemo]
  )

  if (!isDemo) {
    return <>{children}</>
  }

  return (
    <DemoGuardContext.Provider value={value}>
      <div
        style={BANNER_STYLE}
        role="banner"
        aria-label="Demo mode notice"
      >
        <span className="min-w-0 flex-1 leading-snug">
          🔍 Demo Mode — Data is simulated. This is a portfolio preview.
        </span>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
        >
          Contact Me
        </a>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: 'rgba(7,9,26,0.75)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-restriction-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h2 id="demo-restriction-title" className="text-lg font-bold text-white">
              Demo Restriction
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              This action is disabled in demo mode.
              To protect our active clients and their data,
              certain features are restricted in this preview.
              Contact me for more information.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.35)',
                }}
              >
                Contact Me
              </a>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl py-3 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </DemoGuardContext.Provider>
  )
}
