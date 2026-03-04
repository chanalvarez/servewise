'use client'

import { usePathname } from 'next/navigation'
import { useActiveTickets } from '@/context/ActiveTicketsContext'
import { QueueTicket } from '@/components/queue/QueueTicket'
import { Ticket, ChevronDown, ChevronUp } from 'lucide-react'

export function ActiveTicketsDrawer() {
  const pathname = usePathname()
  const { tickets, isLoading, drawerOpen, setDrawerOpen, removeTicket } = useActiveTickets()

  // The drawer is a customer feature — never show it on staff pages
  if (pathname.includes('/staff')) return null

  if (isLoading || tickets.length === 0) return null

  const visibleTickets = tickets
  const hasUrgent = visibleTickets.some((t) => t.status === 'called' || t.status === 'no_show')

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
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
            className={`w-full rounded-t-3xl px-5 py-4 text-white transition-colors ${
              hasUrgent
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 ring-2 ring-purple-400'
                : 'bg-indigo-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Ticket className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight">My Active Tickets</p>
                  <p className="text-xs text-indigo-200">
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
                <ChevronDown className="h-5 w-5 text-indigo-200" />
              ) : (
                <ChevronUp className="h-5 w-5 text-indigo-200" />
              )}
            </div>
          </button>

          {/* Content panel */}
          <div className="max-h-[60vh] overflow-y-auto bg-white">
            <div className="space-y-3 p-4">
              {visibleTickets.map((ticket) => (
                <QueueTicket
                  key={ticket.id}
                  ticket={ticket}
                  onRemove={() => removeTicket(ticket.id)}
                />
              ))}
            </div>
            {/* iOS safe-area bottom padding */}
            <div className="pb-safe" />
          </div>
        </div>
      </div>

      {/* Spacer so page content isn't hidden behind the drawer handle */}
      <div className="h-[72px]" />
    </>
  )
}
