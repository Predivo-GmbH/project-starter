# Prototype QC review pass (the judgement half of G-PROTO)

`prototype-qc.mjs` measures. This pass judges. Follow it, write `qc-judgements.json`, then run
`prototype-qc-merge.mjs` to produce the final report. The scoring is in the merge script, not here,
so two reviewers cannot score the same findings differently.

**You need:** the machine report (`prototype-qc.json`), the running prototype, and the design brief.

---

## 1. Confirm the runner's candidates

The runner's two detectors are deliberately over-eager. Your job is to decide which hits are real.

**Dead controls** (`tierA.checks.A2.deadControlCandidates`). Each entry is a control that produced no
visible change when clicked. Click each one yourself and decide:
- It is the nav item for the screen you are already on -> NOT dead, drop it.
- It opens something off-screen, or its effect is subtle -> NOT dead, drop it.
- It is a deliberate stub that gives feedback (a toast, a disabled state) -> NOT dead, drop it.
- Nothing at all happens and a client would expect something -> **CONFIRMED dead.**

**Emails** (`tierA.checks.A3.emailCandidates`). For each, decide: is this a real person's address, or
invented demo data? Only a real one counts.

> A confirmed hit in either list is a HARD FAIL. It stops the prototype going out. That is correct.

---

## 2. B2 state coverage (20 points)

For **every screen**, decide each of the six states. This is where prototypes feel fake, because the
happy path is always designed and nothing else is.

| State | The question |
|---|---|
| `empty` | What does this screen look like with no data at all? A first-day customer sees this. |
| `loading` | Is there a skeleton or spinner, or does it flash blank? |
| `error` | What if the data fails to load? |
| `first-run` | Is there an onboarding or first-login state? |
| `destructive-confirm` | Does deleting something ask first? |
| `form-validation` | Does a bad input say what is wrong? |

Answer each with exactly one of:
- `present` - it exists and is designed
- `missing` - it should exist and does not (costs 4 points)
- `n/a` - this screen genuinely cannot have it (a static info screen has no form validation). Costs nothing.

Be honest with `n/a`. It is the escape hatch that makes this check useless if abused.

---

## 3. B5 content (15 points)

- **`languageOk`** - is the text in the client's own market language, as stated in the brief? Note:
  English-only is a rule for the client PORTAL, not for the prototype. A German salon app should be
  in German. (Roger, 2026-08-19.)
- **`placeholdersOk`** - the runner already greps for lorem, TODO, "Screen 3". Confirm, and add
  anything it missed: a heading that is really a label, a button called "Button".
- **`plausible`** - read the demo data as a customer would. Do the numbers add up? Are the dates
  sensible? Does a salon really have 400 bookings on a Tuesday? Implausible data makes a good
  prototype feel like a toy.

Each failure costs 5 points.

---

## 4. B6 brand (10 points)

- **`assetsOk`** - logo present in the right variant with a transparent background, mono fallback
  available, favicons at 16 / 32 / 180. The runner reports what it found, but its logo detection is
  a weak guess (it looks for an `alt` containing "logo"), so confirm by eye. Each missing asset
  costs 3 points.
- **`paletteOk`** - do the colours on screen match the palette in the brief? Not "are they nice",
  but "are they the agreed ones". Drift costs 4 points.

---

## 5. Tier C, the human signature

Two things no script and no agent can sign:

- **`C1` real device.** Open the actual share link on an iPhone and on an Android phone. Not a
  desktop browser pretending. Your client will use a phone.
- **`C2` expectation framing.** Walk it as the client. Does anything look like it works when it does
  not? A form that silently swallows a submit reads as a bug, not as "it is a prototype".

Set `acknowledged: true` only once both are genuinely done, and put your name in `by`. Until this is
true the report stays `incomplete` and the gate will refuse it.

---

## 6. Write the judgements file

```json
{
  "reviewer": "who or what did this pass",
  "tierA": {
    "A2": { "deadControlsConfirmed": [] },
    "A3": { "emailsConfirmed": [] }
  },
  "tierB": {
    "B2": {
      "states": {
        "dashboard": { "empty": "present", "loading": "present", "error": "missing",
                       "first-run": "n/a", "destructive-confirm": "n/a", "form-validation": "n/a" }
      }
    },
    "B5": { "languageOk": true, "placeholdersOk": true, "plausible": true, "notes": "" },
    "B6": { "assetsOk": true, "paletteOk": true, "missingAssets": [], "notes": "" }
  },
  "tierC": { "acknowledged": true, "by": "Roger", "notes": ["iPhone 15 Safari ok", "no misleading controls"] }
}
```

Then:

```
node scripts/prototype-qc-merge.mjs --report=prototype-qc.json --judgements=qc-judgements.json
```

Exit 0 means the merged report is a `pass` and is the receipt for the `prototype_qc` gate. Exit 1
means it is a fail or still incomplete, and the reason is printed.

**Do not soften a judgement to make it pass.** An honest fail costs a fix; a dishonest pass costs a
client.
