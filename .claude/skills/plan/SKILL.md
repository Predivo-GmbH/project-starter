---
name: plan
description: Plan the implementation before writing any code
disable-model-invocation: true
argument-hint: "[feature or task description]"
---

Plan the implementation before writing any code.

## Instructions

You are a senior software architect. Before implementing anything, create a thorough plan.

### Step 0: Clarify Requirements

Before analyzing anything, ask 1-2 clarifying questions:
- Prefer **multiple-choice** format (e.g., "Should this be (a) a new page, (b) a modal, or (c) an inline section?")
- Probe for **edge cases** and **ambiguous requirements** (e.g., "What should happen when the API returns 0 results?")
- If the request is already crystal-clear and has no ambiguity, skip this step and say "Requirements are clear — proceeding to analysis."

Do NOT proceed to Step 1 until the user answers (or you determine the request is unambiguous).

### Step 1: Understand the Request
- What exactly is the user asking for?
- What are the acceptance criteria?
- Are there any constraints or edge cases?

### Step 2: Analyze and Compare Approaches
- Run `git status` to see current state
- Identify which files will need changes
- Check for existing patterns that should be followed
- Look for related code that might be affected

After analysis, propose **2-3 approaches** with trade-offs:

```
### Approach A: [Name]
- **How**: [Brief description]
- **Pros**: [Advantages]
- **Cons**: [Disadvantages]
- **Effort**: [Low/Medium/High]

### Approach B: [Name]
- **How**: [Brief description]
- **Pros**: [Advantages]
- **Cons**: [Disadvantages]
- **Effort**: [Low/Medium/High]

**Recommendation**: Approach [X] because [reason].
```

Wait for user to confirm the approach before creating the detailed plan.

### Step 3: Create the Plan

Output a structured plan in this format:

```
## Plan: [Feature/Fix Name]

### Goal
[1-2 sentence summary of what we're building/fixing]

### Branch Strategy
- [ ] Direct to main (1-commit fix) OR
- [ ] Feature branch: `feature/<name>` (2+ commits)

### Files to Modify
- `path/to/file.ts` — [what changes]
- `path/to/file2.tsx` — [what changes]

### Files to Create (if any)
- `path/to/new-file.ts` — [purpose]

### Implementation Steps
1. [First step — be specific]
2. [Second step]
3. ...

### Verification Strategy
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] [Specific test to write or run]
- [ ] [Visual check if UI change]
- [ ] Human QA gate: present summary and wait for approval

### Risks & Edge Cases
- [Anything that could go wrong]
- [Edge cases to handle]
```

### Step 4: Wait for Approval
After presenting the plan, ASK the user: "Does this plan look good? Should I proceed with implementation?"

Do NOT start coding until the user confirms.
