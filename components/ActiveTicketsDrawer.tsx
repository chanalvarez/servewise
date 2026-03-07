'use client'

import { usePathname } from 'next/navigation'
import { useActiveTickets } from '@/context/ActiveTicketsContext'
import { QueueTicket } from '@/components/queue/QueueTicket'
import { Ticket, ChevronDown, ChevronUp } from 'lucide-react'

export function ActiveTicketsDrawer() {
  const pathname = usePathname()
  const { tickets, isLoading, drawerOpen, setDrawerOpen, removeTicket } = useActiveTickets()

  if (pathname.includes('/staff')) return null
  if (isLoading || tickets.length === 0) return null

  const visibleTickets = tickets
  const hasUrgent = visibleTickets.some((t) => t.status === 'called' || t.status === 'no_show')

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm"
          style={{ background: 'rgba(7,9,26,0.6)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer container */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-72px)]'
        }`}
      >
        <div className="mx-auto max-w-2xl">
          {/* Handle / Tab */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="w-full rounded-t-3xl px-5 py-4 text-white transition-all"
            style={{
              background: hasUrgent
                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              boxShadow: hasUrgent
                ? '0 -4px 24px rgba(139,92,246,0.5)'
                : '0 -4px 20px rgba(99,102,241,0.35)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <Ticket className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight text-white">My Active Tickets</p>
                  <p className="text-xs text-white/60">
                    {visibleTickets.length} queue{visibleTickets.length !== 1 ? 's' : ''}
                    {hasUrgent && ' · Action needed'}
                  </p>
                </div>

                {/* Urgent pulse dot */}
                {hasUrgent && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-300 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  </span>
                )}
              </div>

              {drawerOpen ? (
                <ChevronDown className="h-5 w-5 text-white/50" />
              ) : (
                <ChevronUp className="h-5 w-5 text-white/50" />
              )}
            </div>
          </button>

          {/* Content panel — dark glass */}
          <div
            className="max-h-[60vh] overflow-y-auto"
            style={{
              background: 'rgba(7,9,26,0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="space-y-2.5 p-4">
              {visibleTickets.map((ticket) => (
                <QueueTicket
                  key={ticket.id}
                  ticket={ticket}
                  onRemove={() => removeTicket(ticket.id)}
                />
              ))}
            </div>
            <div className="pb-safe" />
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-[72px]" />
    </>
  )
}
