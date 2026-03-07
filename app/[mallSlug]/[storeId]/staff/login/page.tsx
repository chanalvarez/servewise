'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Layers, Loader2, Lock } from 'lucide-react'

export default function StaffLoginPage() {
  const router = useRouter()
  const params = useParams<{ mallSlug: string; storeId: string }>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Redirect back to the staff dashboard
    router.push(`/${params.mallSlug}/${params.storeId}/staff`)
    router.refresh()
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.12) 0%, transparent 50%), #07091A',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}
          >
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Staff Login</h1>
            <p className="mt-0.5 text-sm text-white/40">Sign in to manage your store queue</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <label htmlFor="email" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
              />
            </div>

            <div className="px-4 py-3.5">
              <label htmlFor="password" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/20">
          Staff accounts are created by the ServeWise administrator.
        </p>
      </div>
    </main>
  )
}
