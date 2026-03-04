'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'

interface StaffSignOutButtonProps {
  mallSlug: string
}

export function StaffSignOutButton({ mallSlug }: StaffSignOutButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${mallSlug}`)
    router.refresh()
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
