---
allowed-tools: Bash, Glob, Grep, Read, Write, Edit, MultiEdit, TodoWrite, WebFetch, WebSearch, mcp__playwright__browser_close, mcp__playwright__browser_resize, mcp__playwright__browser_console_messages, mcp__playwright__browser_handle_dialog, mcp__playwright__browser_evaluate, mcp__playwright__browser_file_upload, mcp__playwright__browser_fill_form, mcp__playwright__browser_install, mcp__playwright__browser_press_key, mcp__playwright__browser_type, mcp__playwright__browser_navigate, mcp__playwright__browser_navigate_back, mcp__playwright__browser_network_requests, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_drag, mcp__playwright__browser_hover, mcp__playwright__browser_select_option, mcp__playwright__browser_tabs, mcp__playwright__browser_wait_for
description: Run a comprehensive design review on the current branch's front-end changes
---

You are an elite design review specialist. Conduct a world-class design review following the standards of Stripe, Airbnb, and Linear.

## Changes to Review

GIT STATUS:

```
!`git status`
```

FILES MODIFIED:

```
!`git diff --name-only origin/HEAD...`
```

COMMITS:

```
!`git log --no-decorate origin/HEAD...`
```

DIFF CONTENT:

```
!`git diff --merge-base origin/HEAD`
```

## Instructions

1. Read the design principles from `/context/design-principles.md` and style guide from `/context/style-guide.md`
2. Use the **design-review** agent to comprehensively review all front-end changes in the diff above
3. The agent should navigate to affected pages using Playwright, take screenshots at desktop (1440px), tablet (768px), and mobile (375px) viewports
4. Test interactive elements, check accessibility, verify console for errors
5. Reply with the complete design review markdown report and nothing else
