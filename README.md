# Arivioo Project Starter

Reusable Claude Code workflow templates for all Arivioo projects. Provides automated design review, code review, and security review via subagents, slash commands, and GitHub Actions.

Based on the [OneRedOak Claude Code Workflows](https://github.com/OneRedOak/claude-code-workflows) methodology.

---

## What's Included

| Component | Path | Purpose |
|-----------|------|---------|
| **Design Review Agent** | `.claude/agents/design-review.md` | 8-phase visual review using Playwright MCP |
| **Code Review Agent** | `.claude/agents/code-review.md` | "Pragmatic Quality" framework — architecture, security, performance |
| **Security Review Agent** | `.claude/agents/security-review.md` | High-confidence vulnerability detection (read-only) |
| **Design Review Command** | `.claude/commands/design-review.md` | `/design-review` slash command for current branch |
| **Code Review Command** | `.claude/commands/code-review.md` | `/code-review` slash command for current branch |
| **Security Review Command** | `.claude/commands/security-review.md` | `/security-review` slash command for current branch |
| **Code Review Action** | `.github/workflows/code-review.yml` | Automated PR code review |
| **Design Review Action** | `.github/workflows/design-review.yml` | Automated PR design review (frontend files only) |
| **Security Review Action** | `.github/workflows/security-review.yml` | Automated PR security review |
| **Design Principles** | `context/design-principles.md` | Customizable design checklist template |
| **Style Guide** | `context/style-guide.md` | Customizable brand style guide template |
| **CLAUDE.md Template** | `CLAUDE.md.template` | Base CLAUDE.md with visual development section |
| **MCP Config Template** | `.mcp.json.template` | Team-shared Playwright MCP config |

---

## Prerequisites

### 1. Playwright MCP (User-Scoped)

Install once — available across all projects:

```bash
claude mcp add --transport stdio --scope user playwright -- cmd /c npx -y @playwright/mcp@latest
```

> **macOS/Linux**: Remove `cmd /c` from the command.

If browser binaries are missing:

```bash
npx playwright install --with-deps
```

Verify: Run `/mcp` inside Claude Code — `playwright` should appear.

### 2. GitHub Secret

For GitHub Actions, add `ANTHROPIC_API_KEY` as a repository secret:

```
Settings → Secrets and variables → Actions → New repository secret
```

---

## Setup for a New Project

### Step 1: Copy Files

```bash
# From your new project root:
cp -r /path/to/project-starter/.claude .claude
cp -r /path/to/project-starter/.github .github
cp -r /path/to/project-starter/context context
cp /path/to/project-starter/CLAUDE.md.template CLAUDE.md
```

### Step 2: Customize

1. **`CLAUDE.md`** — Fill in project name, stack, dev server URL, project-specific rules
2. **`context/design-principles.md`** — Replace `<!-- CUSTOMIZE -->` sections with your design system
3. **`context/style-guide.md`** — Replace with your brand colors, typography, component specs

### Step 3 (Optional): Team MCP Config

If team members need Playwright without user-scoped install:

```bash
cp /path/to/project-starter/.mcp.json.template .mcp.json
```

---

## Usage

### During Development

After making front-end changes, Claude Code will automatically:
1. Navigate to affected pages using Playwright
2. Take screenshots and compare against design principles
3. Check for console errors
4. Self-correct any issues

This happens because of the "Quick Visual Check" section in CLAUDE.md.

### On-Demand Reviews

```bash
# Design review (visual, accessibility, responsiveness)
/design-review

# Code review (architecture, security, performance)
/code-review

# Security review (vulnerability detection)
/security-review
```

### Via Subagents

```bash
# Invoke directly in conversation
@design-review Review the new dashboard page at localhost:8080/dashboard
@code-review Check the last 3 commits for quality issues
@security-review Audit the authentication changes
```

### Automated on PRs

GitHub Actions trigger automatically when a PR is opened or updated:
- **Code review** runs on every PR
- **Design review** runs only when frontend files (`.tsx`, `.css`, `.html`, etc.) are modified
- **Security review** runs on every PR

---

## The Iterative Agentic Loop

The core workflow concept:

```
Design Brief / Style Guide (fixed spec)
        ↓
   Code Changes
        ↓
   Playwright Screenshot ←──┐
        ↓                    │
   Compare to Spec           │
        ↓                    │
   Differences Found? ───YES─┘
        ↓ NO
   Done ✓
```

Claude Code builds → takes a screenshot → compares to the design spec → fixes discrepancies → repeats. This loop runs automatically via the CLAUDE.md instructions.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Orchestration Layer            │
│                                         │
│  Context          Tools        Validation│
│  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │Design    │  │Playwright│  │Subagent  ││
│  │Principles│  │MCP       │  │Reviews   ││
│  │Style     │  │(browser) │  │(design,  ││
│  │Guide     │  │          │  │code,     ││
│  │CLAUDE.md │  │          │  │security) ││
│  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
    Inner Loop  Slash Cmds  GitHub Actions
    (auto visual  (/review)  (PR automation)
     feedback)
```

---

## Customization Tips

### Generating Design Principles

Use Gemini Deep Research or Claude to analyze 2-3 reference screenshots:

> "Analyze the UI in these screenshots and describe it in detail — color palette, typography, spacing, component patterns, interaction states. Output as a structured markdown design checklist."

### Adding Project-Specific Agents

Create new `.md` files in `.claude/agents/` following the same format. Common additions:
- **Performance auditor** — Lighthouse scores, bundle analysis
- **Migration assistant** — Framework or library upgrade guidance
- **Documentation writer** — API docs, README updates

### Git Worktrees for Parallel Development

Run multiple Claude Code instances on different worktrees for parallel iteration:

```bash
git worktree add ../project-v2 -b feature/v2
# Open Claude Code in ../project-v2 and iterate independently
```

---

## Credits

- Methodology: [Patrick Ellis / OneRedOak](https://github.com/OneRedOak/claude-code-workflows)
- Playwright MCP: [Microsoft](https://github.com/microsoft/playwright-mcp)
- Security review: [Anthropic](https://github.com/anthropics/claude-code-security-review)
