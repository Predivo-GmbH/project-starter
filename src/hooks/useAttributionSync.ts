import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getStoredAttribution,
  isAttributionPersisted,
  markAttributionPersisted,
  buildAttributionSyncUpdate,
  type AttributionProfileFields,
} from '@/lib/attribution'

/**
 * Persist first-touch marketing attribution (captured pre-signup in localStorage,
 * see src/lib/attribution.ts#captureAttribution) onto the user's `profiles` row —
 * exactly once. Mount once near the app root, alongside `<AuthProvider>`, passing
 * whatever profile object your product already loads after login.
 *
 * All of the actual decision logic (first-touch wins, never overwrite an existing
 * answer, nothing to do when storage is empty) lives in the pure
 * `buildAttributionSyncUpdate()` so it is unit-testable without React or a
 * network call — see tests/attribution/attribution.test.ts.
 *
 * Writes only the 6 attribution columns, which RLS + the column-level grant in
 * 0003_signup_source_tracking.sql.template allow the owner to update on their own
 * row. Best-effort: a failed write is logged and retried on the next mount, never
 * surfaced to the user — attribution is analytics, not a critical path.
 */
export function useAttributionSync(profile: AttributionProfileFields | null): void {
  const inFlight = useRef(false)

  useEffect(() => {
    if (!profile || inFlight.current) return

    const update = buildAttributionSyncUpdate(
      profile,
      getStoredAttribution(),
      isAttributionPersisted(),
    )
    if (!update) return

    inFlight.current = true
    supabase
      .from('profiles')
      .update(update)
      .eq('id', profile.id)
      .then(({ error }) => {
        inFlight.current = false
        if (error) {
          if (import.meta.env.DEV) console.warn('[attribution] failed to persist attribution:', error.message)
        } else {
          markAttributionPersisted()
        }
      })
  }, [profile])
}
