/**
 * HowHeardPrompt — a one-tap "How did you hear about us?" prompt shown ONCE on
 * the first dashboard visit. Part of Roger's approved distribution plan
 * (2026-10-01): every product asks this, in plain English, whether sign-up was
 * via OAuth or email.
 *
 * SOURCE: generalised from ChannelMover's `components/HowHeardPrompt.tsx` (a
 * React Native / Expo component, since ChannelMover is a mobile+web app). This
 * is the plain React-DOM equivalent for this starter's Vite + React web app,
 * following the Tailwind `var(--color-*)` token convention already used in
 * src/pages/auth/SignUpPage.tsx.
 *
 * Records the answer to `profiles.how_heard` (+ `how_heard_other` for the
 * free-text "Other"), and is never shown again once answered OR dismissed —
 * tracked by both a localStorage flag (instant, survives a reload before the
 * write lands) and the persisted `profiles.how_heard` value (survives a new
 * device/session).
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  HOW_HEARD_OPTIONS,
  isHowHeardDismissed,
  markHowHeardDismissed,
  shouldShowHowHeardPrompt,
  buildHowHeardUpdate,
  type AttributionProfileFields,
} from '@/lib/attribution'

interface HowHeardPromptProps {
  profile: AttributionProfileFields | null
  /** Called after a successful save so the parent can refresh the profile. */
  onAnswered?: () => void
}

export function HowHeardPrompt({ profile, onAnswered }: HowHeardPromptProps) {
  const [visible, setVisible] = useState(false)
  const [choice, setChoice] = useState<string | null>(null)
  const [other, setOther] = useState('')
  const [saving, setSaving] = useState(false)

  // Decide once whether to show — the actual rule (not yet answered, not
  // dismissed) lives in the pure shouldShowHowHeardPrompt() so it's unit-tested
  // without mounting this component.
  useEffect(() => {
    setVisible(shouldShowHowHeardPrompt(profile, isHowHeardDismissed()))
  }, [profile])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const dismiss = () => {
    markHowHeardDismissed()
    setVisible(false)
  }

  const submit = async () => {
    if (!profile || saving) return
    const update = buildHowHeardUpdate(choice, other)
    if (!update) return

    setSaving(true)
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id)
    setSaving(false)

    // Either way we stop showing the prompt — a transient write error should not
    // nag the user on every dashboard visit; attribution is best-effort, not a
    // critical path.
    markHowHeardDismissed()
    setVisible(false)
    if (!error) onAnswered?.()
  }

  if (!visible) return null

  const canSubmit = !!buildHowHeardUpdate(choice, other)

  return (
    <div
      role="presentation"
      onClick={dismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
    >
      <div
        role="dialog"
        aria-label="How did you hear about us?"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          How did you hear about us?
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
          One quick tap helps us reach more people who could use this.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {HOW_HEARD_OPTIONS.map((option) => {
            const selected = choice === option
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setChoice(option)}
                className={`flex min-h-11 items-center justify-between rounded-lg border px-3.5 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 font-medium text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-accent)]/50'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {choice === 'Other' && (
          <input
            type="text"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Tell us where you found us"
            aria-label="Tell us where you heard about us"
            maxLength={255}
            autoFocus
            className="mt-3 block min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
          />
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || saving}
            className="min-h-11 flex-1 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white transition-opacity hover:brightness-110 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
