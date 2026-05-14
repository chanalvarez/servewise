'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | 'all'
type View  = 'hour' | 'day'

interface ChartRow { label: string; count: number }

// ── Label maps ─────────────────────────────────────────────────────────────────

const HOUR_LABELS = [
  '12AM','1AM','2AM','3AM','4AM','5AM','6AM','7AM',
  '8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM',
  '4PM','5PM','6PM','7PM','8PM','9PM','10PM','11PM',
]

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Component ─────────────────────────────────────────────────────────────────

interface StaffAnalyticsPanelProps {
  storeId: string
  activated: boolean
}

export function StaffAnalyticsPanel({ storeId, activated }: StaffAnalyticsPanelProps) {
  const [range, setRange]         = useState<Range>('7d')
  const [view, setView]           = useState<View>('hour')
  const [isLoading, setIsLoading] = useState(false)      // first-ever fetch in progress
  const [isRefreshing, setIsRefreshing] = useState(false) // background re-fetch
  const [error, setError]         = useState<string | null>(null)
  const [hourData, setHourData]   = useState<ChartRow[]>([])
  const [dayData,  setDayData]    = useState<ChartRow[]>([])

  // hasLoadedRef: true once any fetch completes successfully.
  // Using a ref (not state) so it doesn't trigger a re-render and doesn't
  // become a stale closure value inside useCallback.
  const hasLoadedRef = useRef(false)

  // fetchIdRef: incremented at the start of every fetch. Checked before
  // applying results so stale responses from cancelled fetches are discarded.
  const fetchIdRef = useRef(0)

  const fetchData = useCallback(async () => {
    const id = ++fetchIdRef.current

    // First load → full skeleton. Subsequent fetches → keep chart, spin button.
    if (hasLoadedRef.current) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const supabase = createClient()
      console.log('[ANALYTICS] About to fetch, storeId:', storeId, 'range:', range)
      let query = supabase
        .from('tickets')
        .select('created_at')
        .eq('store_id', storeId)

      if (range !== 'all') {
        const days  = range === '7d' ? 7 : 30
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', since)
      }

      const { data, error: queryError } = await query
      console.log('[ANALYTICS] Supabase response:', data, queryError)
      if (queryError) throw queryError

      if (id !== fetchIdRef.current) return

      const hours = new Array(24).fill(0) as number[]
      const days  = new Array(7).fill(0)  as number[]

      for (const { created_at } of data ?? []) {
        const d = new Date(created_at)
        hours[d.getHours()]++
        days[d.getDay()]++
      }

      setHourData(HOUR_LABELS.map((label, i) => ({ label, count: hours[i] })))
      setDayData(DAY_LABELS.map((label, i) => ({ label, count: days[i] })))
      hasLoadedRef.current = true
    } catch {
      if (id !== fetchIdRef.current) return
      setError('Failed to load data.')
    } finally {
      if (id === fetchIdRef.current) {
        console.log('[ANALYTICS] Loading set to false')
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [storeId, range])

  useEffect(() => { console.log('[ANALYTICS] Component mounted') }, [])

  // Fires when the tab is first clicked (activated flips true) and again when
  // range changes (fetchData identity changes). Guards against premature fetch
  // while the panel is hidden on page load.
  useEffect(() => {
    console.log('[ANALYTICS] activated:', activated, 'hasLoaded:', hasLoadedRef.current)
    if (!activated) return
    void fetchData()
  }, [activated, fetchData])

  const chartData = view === 'hour' ? hourData : dayData
  const maxCount  = Math.max(1, ...chartData.map((d) => d.count))
  const total     = chartData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-3">

      {/* Date range pills + manual refresh button */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-2">
          {(['7d', '30d', 'all'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-indigo-600 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
              style={range !== r ? { background: 'rgba(255,255,255,0.05)' } : undefined}
            >
              {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'All time'}
            </button>
          ))}
        </div>

        {/* Refresh button — spins during background refresh; no full-page blanking */}
        <button
          onClick={() => void fetchData()}
          disabled={isLoading || isRefreshing}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/8 disabled:opacity-40"
          title="Refresh"
          aria-label="Refresh analytics"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-white/35 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* View toggle */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {(['hour', 'day'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              view === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {v === 'hour' ? 'By Hour of Day' : 'By Day of Week'}
          </button>
        ))}
      </div>

      {/* Subtle error banner — only shown when there is existing data to keep visible */}
      {error && hasLoadedRef.current && (
        <p className="text-right text-xs text-red-400/70">
          Refresh failed — showing previous data
        </p>
      )}

      {/* Chart card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {isLoading ? (
          // First-load skeleton
          <div className="flex h-52 items-center justify-center">
            <p className="text-sm text-white/30">Loading…</p>
          </div>
        ) : error && !hasLoadedRef.current ? (
          // Error on first load — no existing data to fall back on
          <div className="flex h-52 flex-col items-center justify-center gap-3">
            <p className="text-sm text-white/40">{error}</p>
            <button
              onClick={() => void fetchData()}
              className="rounded-xl px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              Retry
            </button>
          </div>
        ) : total === 0 ? (
          <div className="flex h-52 items-center justify-center">
            <p className="text-sm text-white/30">No data for this period</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-white/40">
              {view === 'hour'
                ? 'Customer arrivals by hour of day'
                : 'Customer arrivals by day of week'}
              {' '}·{' '}
              <span className="text-white/60">{total} total</span>
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 0, bottom: 0, left: -24 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={view === 'hour' ? 3 : 0}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: 'rgba(7,9,26,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 13,
                  }}
                  formatter={(val) => [val, 'Customers']}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((row, i) => (
                    <Cell
                      key={i}
                      fill={`rgba(99,102,241,${(0.3 + 0.7 * (row.count / maxCount)).toFixed(2)})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

    </div>
  )
}
