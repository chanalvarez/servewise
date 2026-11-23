'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'

interface StaffSignOutButtonProps {
  mallSlug: string
}

export function StaffSignOutButton({ mallSlug }: StaffSignOutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      // 'local' clears the session without a server round trip; the race caps any stall at 2s
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ])
    } catch {
      // ignore — we navigate away regardless
    }
    // Hard navigation drops all in-memory auth state and avoids racing with the
    // SIGNED_OUT redirect in StaffQueuePanel
    window.location.assign(`/${mallSlug}`)
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
      title="Sign out"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <LogOut className="h-4 w-4 text-gray-400 hover:text-red-500" />
      )}
    </button>
  )
}
