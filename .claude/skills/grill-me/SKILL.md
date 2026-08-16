---
name: grill-me
description: Stress-test a plan, feature, or idea before ANY code — surface every real decision, propose a recommended default for each, research the answerable facts yourself, and refuse to build until every user-owned decision is confirmed. Replaces Claude Code's built-in Plan Mode for anything non-trivial.
disable-model-invocation: true
argument-hint: "[plan, feature, or idea to stress-test]"
---

Stress-test the plan/idea in `$ARGUMENTS` before writing a single line of code.

## Why this skill exists

Built-in Plan Mode asks 2-3 questions, then silently fills the rest of the plan with its own assumptions. Those hidden assumptions are where builds go wrong — you get a two-page plan that looks complete but quietly decided things you never agreed to, and you find out only after the wrong thing is built. This skill converts that "shallow plan -> wrong build -> rework" loop into ONE clean build by dragging every decision into the open first.

**Core stance:** interrogate mercilessly, but never waste the user's time. Ask only what you genuinely cannot resolve yourself. Everything you *can* answer by reading the code, docs, or running a tool — you answer, and just report it.

## Process

### Step 1 — Understand + self-research (do NOT ask yet)
- Read `$ARGUMENTS` and restate the goal in one sentence.
- Explore the actual codebase/context relevant to it: `git status`, read the files that would change, find existing patterns to match, check configs/schemas. (Rule 2/60 — facts from the real source, not memory.)
- The point of this step is to shrink the question list: anything discoverable is NOT a question for the user.

### Step 2 — Build the decision tree
Enumerate EVERY decision this build actually requires — walk every branch, not just the obvious ones. Typical decision axes (adapt to the task):
- **Data & state:** what's stored, where, schema/shape; incremental vs one-shot; caching; source of truth.
- **Scope boundaries:** what's explicitly IN vs OUT of this build (the #1 source of silent scope creep).
- **Ownership of heavy/ambiguous steps:** e.g. who/what summarizes a large input, who handles the expensive path, what runs server- vs client-side.
- **Output contract:** exact schema/format, ranking or prioritization logic, ordering, empty/zero-result behavior.
- **Edge cases & errors:** failure handling, retries, what a `.catch` does (silent-failure rule), rate limits.
- **Privacy / retention / legal:** personal data, what's persisted, GDPR/Swiss-law surface if any.
- **Placement:** file/folder location, route, component boundaries, naming (match existing patterns).
- **Non-functionals:** auth, performance target, mobile, i18n if relevant.

### Step 3 — Split into FACTS vs DECISIONS
- **FACTS** (answerable by reading code/docs/running a tool): resolve them yourself. List each as "Resolved: X -> Y (from `file:line` / command)". Do NOT ask these.
- **DECISIONS** (only the user can make — product intent, scope, preference, a real trade-off): these become questions.

### Step 4 — Interrogate, ONE question at a time
For each open DECISION, in dependency order:
- Use the **`AskUserQuestion` tool** (clickable options — never plain-text A/B/C). Rule 18.
- Always include your **recommended option first, marked `(Recommended)`**, with a one-line reason grounded in the code/brief. A recommendation must be earned by the analysis, not a neutral menu (Rule 59). Include the real alternatives; the user can always pick "Other".
- Ask **one question, wait for the answer, then ask the next.** Never batch. Let earlier answers prune later branches.
- Never assume a user-owned decision to "keep moving." If you're unsure whether something is a FACT or a DECISION, treat it as a DECISION and ask.

### Step 5 — Play back shared understanding (the build gate)
Once every decision is resolved, output a compact summary:
- Goal (1 sentence)
- Decisions made (facts you resolved + choices the user confirmed), each one line
- Scope: IN vs OUT
- Then ask: **"This is my understanding. Build it, or adjust anything first?"**

Do **NOT** start implementing until the user explicitly confirms. On confirmation, hand off to `/plan` (for a structured implementation plan) or begin the build directly if the path is already unambiguous.

## Hard rules
- No code, edits, migrations, or deploys during this skill — it ends at a confirmed shared understanding.
- One question at a time, clickable, recommendation-first.
- Answer every fact you can; ask only genuine decisions.
- If the idea is already fully unambiguous after Step 1-3 (rare), say so, show the resolved facts, and go straight to the Step 5 gate — don't invent questions to look thorough.
