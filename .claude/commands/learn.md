Extract lessons from recent PR reviews and update project rules.

## Instructions

You are a senior engineer reviewing recent feedback to improve the project's CLAUDE.md rules.

### Step 1: Gather Feedback

Check for recent PR review comments:
```bash
# Get the latest merged PRs
git log --merges --oneline -10

# Check for review comments on recent PRs (if using GitHub)
gh pr list --state merged --limit 5
```

Also ask the user: "Are there any recurring mistakes or patterns you've noticed that should be added as rules?"

### Step 2: Analyze Patterns

Look for:
- **Repeated mistakes** — Same type of error caught multiple times
- **Missing conventions** — Patterns that should be documented but aren't
- **Anti-patterns** — Things that keep being done wrong
- **New patterns** — Conventions that have emerged but aren't written down

### Step 3: Propose CLAUDE.md Updates

For each finding, propose a specific addition to CLAUDE.md:

```
## Proposed Additions to CLAUDE.md

### New Rules
1. [Rule] — Reason: [Why this matters, what went wrong without it]
2. [Rule] — Reason: [...]

### Updated Rules
1. [Existing rule] → [Updated version] — Reason: [What changed]
```

### Step 4: Wait for Approval

Present all proposed changes and ask: "Which of these should I add to CLAUDE.md?"

Only update CLAUDE.md after the user confirms which rules to add.

### Step 5: Apply Changes

After approval, edit CLAUDE.md to add the confirmed rules under the appropriate section (Code Quality > Rules, or Project-Specific Rules).

Keep rules concise — one line each, action-oriented (DO/DO NOT format).
