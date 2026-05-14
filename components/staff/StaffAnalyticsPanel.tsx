'use client'

import { useCallback, useEffect, useState } from 'react'
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
}

export function StaffAnalyticsPanel({ storeId }: StaffAnalyticsPanelProps) {
  const [range, setRange]     = useState<Range>('7d')
  const [view, setView]       = useState<View>('hour')
  const [loading, setLoading] = useState(true)
  const [hourData, setHourData] = useState<ChartRow[]>([])
  const [dayData,  setDayData]  = useState<ChartRow[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('tickets')
      .select('created_at')
      .eq('store_id', storeId)

    if (range !== 'all') {
      const days  = range === '7d' ? 7 : 30
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', since)
    }

    const { data } = await query
    setLoading(false)
    if (!data) return

    const hours = new Array(24).fill(0)
    const days  = new Array(7).fill(0)

    for (const { created_at } of data) {
      const d = new Date(created_at)
      hours[d.getHours()]++
      days[d.getDay()]++
    }

    setHourData(HOUR_LABELS.map((label, i) => ({ label, count: hours[i] })))
    setDayData(DAY_LABELS.map((label, i) => ({ label, count: days[i] })))
  }, [storeId, range])

  useEffect(() => { void fetchData() }, [fetchData])

  const chartData = view === 'hour' ? hourData : dayData
  const maxCount  = Math.max(1, ...chartData.map((d) => d.count))
  const total     = chartData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-3">

      {/* Date range pills */}
      <div className="flex gap-2">
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

      {/* Chart card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {loading ? (
          <div className="flex h-52 items-center justify-center">
            <p className="text-sm text-white/30">Loading…</p>
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
