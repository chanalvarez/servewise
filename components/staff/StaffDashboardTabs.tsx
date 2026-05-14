'use client'

import { useState } from 'react'
import { ListOrdered, BarChart2, Star } from 'lucide-react'
import { StaffQueuePanel } from './StaffQueuePanel'
import { StaffAnalyticsPanel } from './StaffAnalyticsPanel'
import { StaffFeedbackPanel } from './StaffFeedbackPanel'
import type { Store, Ticket } from '@/types'

type Tab = 'queue' | 'analytics' | 'feedback'

interface StaffDashboardTabsProps {
  storeId: string
  initialTickets: Ticket[]
  initialStore: Pick<Store, 'current_serving' | 'last_queue_number'>
}

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'queue',     label: 'Queue',     Icon: ListOrdered },
  { key: 'analytics', label: 'Analytics', Icon: BarChart2   },
  { key: 'feedback',  label: 'Feedback',  Icon: Star        },
]

export function StaffDashboardTabs({
  storeId,
  initialTickets,
  initialStore,
}: StaffDashboardTabsProps) {
  const [tab, setTab] = useState<Tab>('queue')

  // activated flags: false until the tab is clicked for the first time.
  // The child panels watch this prop and only start fetching once it flips true.
  // This prevents any fetch from firing while the panel is hidden on page load.
  const [analyticsActivated, setAnalyticsActivated] = useState(false)
  const [feedbackActivated,  setFeedbackActivated]  = useState(false)

  const handleTabChange = (next: Tab) => {
    setTab(next)
    if (next === 'analytics') setAnalyticsActivated(true)
    if (next === 'feedback')  setFeedbackActivated(true)
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div
        className="flex gap-1 rounded-2xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === key ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Queue — conditionally rendered; real-time subscriptions live here */}
      {tab === 'queue' && (
        <StaffQueuePanel
          storeId={storeId}
          initialTickets={initialTickets}
          initialStore={initialStore}
        />
      )}

      {/* Analytics — always mounted, hidden via inline style (not Tailwind hidden class).
          style={{ display }} lets React keep the component fully alive without any
          CSS specificity interference. activated=false blocks the initial fetch until
          the first tab click; after that the panel owns its own refresh lifecycle. */}
      <div style={{ display: tab === 'analytics' ? 'block' : 'none' }}>
        <StaffAnalyticsPanel storeId={storeId} activated={analyticsActivated} />
      </div>

      {/* Feedback — same always-mounted pattern */}
      <div style={{ display: tab === 'feedback' ? 'block' : 'none' }}>
        <StaffFeedbackPanel storeId={storeId} activated={feedbackActivated} />
      </div>
    </div>
  )
}
