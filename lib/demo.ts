/** True when portfolio demo mode is enabled (read-only mutations). */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_IS_DEMO === 'true'
}

export const DEMO_RESTRICTED_MESSAGE =
  'This action is disabled in demo mode. Contact me to see the full version.'
