#!/usr/bin/env node
// CHECKS HOW THIS PROJECT IS DELIVERED (.github/delivery.json), delivery plan step 7, 19.11.2026.
//
// Roger, 17.11.2026: «in the future there will be even more projects». A new project joins the delivery workflow by
// declaring two things: its delivery class and its path-to-suite map. This script refuses a declaration the project's
// own workflows cannot carry out, so a class is never only a word:
//   - every class: the release workflow it names exists; no workflow starts a heavy suite on GitHub's schedule (it
//     started them 6.5-9.5 hours late, measured 14.-17.11.2026); each night entry names a workflow Cockpit can start
//     (workflow_dispatch) at a Zurich time «HH:MM»;
//   - class B: a train time «HH:MM», and a release workflow that joins Cockpit's release queue the way the class B
//     products do since 18.11.2026 (ReplyFlow, ChannelMover, mitchind): the exact-commit input release_sha, the night
//     gates (confirm=gates, titled «Night gates of <sha>»), and a release-when-green workflow that hands the release to
//     Cockpit's release-request (`release-when-green.mjs request`, with the hotfix label). Until the template carries
//     that release workflow, a project made from it cannot declare class B and this script says what is missing;
//   - not class B: no train time and no night_gates (Cockpit ignores both outside class B: they would only mislead);
//   - suites: the path-to-suite map stays null until step 4 of the plan (test each change once) defines its shape.
//
// Where the class is kept: Cockpit's run_queue_setting.pilot (delivery_class, train_at, night_gates). This file is the
// project's declaration; `--pilot <owner/repo>` prints the pilot entry fields to add once when the project joins.
//
// Usage: node scripts/check-delivery.mjs                  check .github/delivery.json, exit 1 on any problem
//        node scripts/check-delivery.mjs --pilot org/repo  also print the pilot entry fields for Cockpit
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const CLASSES = ['A', 'B', 'C']
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const WORKFLOW_NAME = /^[A-Za-z0-9_.-]+\.ya?ml$/
const BRANCH = /^[A-Za-z0-9._/-]{1,100}$/

// LIGHT scheduled checks may keep GitHub's schedule (plan step 5 moves them off the test machines): a keep-alive ping
// runs no suite. Anything else with a `schedule:` is a heavy run that belongs on Cockpit's night list.
export const LIGHT_SCHEDULED = ['keep-alive.yml']

/** A workflow's text by its name, as a project has it (name) or as this template ships it (name + '.template'). */
export function readWorkflow(dir, name) {
  for (const f of [name, `${name}.template`]) {
    const p = path.join(dir, f)
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  }
  return null
}

/**
 * One line without its comment, as YAML defines one (review of #15, 19.11.2026: a «#» inside a quoted value was cut):
 * a comment starts at «#» at the line's start or after a space, outside a quoted scalar; a quoted scalar starts where a
 * value starts (after the indentation, «- », «: », «{», «[» or «,»), so «Don't» or «ref:"» inside plain text is text.
 */
export function stripComment(line) {
  return scanLine(line).text
}

/** The line without its comment, and whether it ends inside a quoted value that it opened (which then runs on). */
function scanLine(line) {
  let quote = null
  let valueStart = true
  let flow = 0 // depth of the flow collection ({...} / [...]) the scan is in; its punctuation only counts there
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (quote === "'" && ch === "'" && line[i + 1] === "'") { i++; continue }
      if (quote === '"' && ch === '\\') { i++; continue }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) return { text: line.slice(0, i), open: false }
    if (/\s/.test(ch)) continue
    if ((ch === '"' || ch === "'") && valueStart) { quote = ch; valueStart = false; continue }
    if (ch === '-' && valueStart && /\s/.test(line[i + 1] ?? ' ')) continue
    if (ch === ':' && /\s/.test(line[i + 1] ?? ' ')) { valueStart = true; continue }
    if ((ch === '{' || ch === '[') && (valueStart || flow > 0)) { flow++; valueStart = true; continue }
    if (flow > 0 && ch === ',') { valueStart = true; continue }
    if (flow > 0 && (ch === '}' || ch === ']')) { flow--; valueStart = false; continue }
    valueStart = false
  }
  return { text: line, open: quote !== null }
}

/**
 * The workflow's lines without comments (a word in a comment never counts as a trigger or an input), one line at a time;
 * the lines of a block scalar («key: |», «- run: >-», any indicators), indented deeper than its key, are left out: they
 * are script text, and no structural check reads scripts. The on: block, which the checks read, may hold no value that
 * runs over several lines (unreadableForm refuses it, Codex round 8 on #15), so no quote state spans lines.
 */
function codeLines(text) {
  const out = []
  let block = null // the indent a block scalar's lines must exceed, while inside one
  for (const raw of String(text).split(/\r?\n/)) {
    const lead = raw.match(/^\s*/)[0].length
    if (block !== null) {
      if (raw.trim() === '' || lead > block) continue
      block = null
    }
    const line = stripComment(raw)
    if (line.trim() !== '') out.push(line)
    // a block scalar starts here: «key: |», «key: >-», «- |2», a comment after it already gone
    if (/(^|:\s+|^\s*-\s+)[|>][0-9+-]*\s*$/.test(line)) block = lead
  }
  return out
}

const unquote = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2')
const onLine = (lines) => lines.findIndex((l) => /^(on|'on'|"on")\s*:/.test(l))

/**
 * WHY THIS CHECK CANNOT READ A WORKFLOW, or null. It reads block form only (review of #15, 19.11.2026: three rounds of
 * findings came from reading every YAML shape; a guard that refuses what it cannot read cannot be fooled by it): a flow
 * «on: {...}», a workflow_dispatch written on one line with content, and an input whose settings sit inline
 * («sha: {required: true}») are refused, so the project writes them in block form. «on: push», «on: [push, ...]» and
 * a block list «on:\n  - push» carry no inputs and are read.
 */
export function unreadableForm(text) {
  const lines = codeLines(text ?? '')
  const at = onLine(lines)
  if (at < 0) return null
  const inline = lines[at].replace(/^[^:]*:\s*/, '').trim()
  if (inline.startsWith('{')) return 'its on: is a flow mapping ({...})'
  if (inline) return null
  let end = lines.findIndex((l, i) => i > at && !/^\s/.test(l))
  if (end < 0) end = lines.length
  // every line of the on: block is a key or a list item: a value that runs over several lines is refused (round 8)
  const spill = lines.slice(at + 1, end).find((l) => scanLine(l).open || !/^\s*(-(\s|$)|(['"])[^'"]+\3\s*:(\s|$)|[A-Za-z0-9_-]+\s*:(\s|$))/.test(l))
  if (spill) return `a value in its on: block runs over several lines («${spill.trim().slice(0, 40)}»): write each value on one line`
  const wd = lines.findIndex((l, i) => i > at && i < end && /^\s+['"]?workflow_dispatch['"]?\s*:/.test(l))
  if (wd < 0) return null
  const rest = lines[wd].replace(/^[^:]*:\s*/, '').trim()
  if (rest && !/^(\{\s*\}|~|null)$/.test(rest)) return 'its workflow_dispatch is written on one line'
  const wdLead = lines[wd].match(/^\s*/)[0].length
  let inInputs = false
  let inLead = null
  for (const l of lines.slice(wd + 1)) {
    const lead = l.match(/^\s*/)[0].length
    if (lead <= wdLead) break
    const t = l.trim()
    if (!inInputs) {
      const m = t.match(/^(['"]?)inputs\1\s*:\s*(.*)$/)
      if (m && m[2] && !/^(\{\s*\}|~|null)$/.test(m[2])) return 'its workflow_dispatch inputs are written on one line'
      if (m) inInputs = true
      continue
    }
    if (inLead === null) inLead = lead
    if (lead < inLead) break
    if (lead === inLead) {
      const m = t.match(/^(['"]?)([A-Za-z0-9_-]+)\1\s*:\s*(.*)$/)
      if (m && m[3].trim() !== '') return `its workflow_dispatch input «${m[2]}» has its settings on one line`
    }
  }
  return null
}

/** The workflow files of a folder this check cannot read, with the reason. */
export function unreadableWorkflows(workflowsDir) {
  const files = fs.existsSync(workflowsDir) ? fs.readdirSync(workflowsDir).filter((x) => /\.ya?ml(\.template)?$/.test(x)) : []
  return files.map((x) => [x, unreadableForm(fs.readFileSync(path.join(workflowsDir, x), 'utf8'))]).filter(([, why]) => why)
}

/**
 * The keys directly under the top-level `on:` (push, pull_request, schedule, workflow_dispatch, ...), in block form,
 * as a list «on: [push, "pull_request"]», a block list «on:\n  - push», or a single event «on: push». A flow mapping
 * «on: {...}» gives none: unreadableForm refuses it, so checkDelivery says so.
 */
export function triggersOf(text) {
  const lines = codeLines(text)
  const out = new Set()
  const at = onLine(lines)
  if (at < 0) return out
  const inline = lines[at].replace(/^[^:]*:\s*/, '').trim()
  if (inline.startsWith('{')) return out
  if (inline) {
    for (const t of inline.replace(/[[\]]/g, '').split(',')) if (unquote(t)) out.add(unquote(t))
    return out
  }
  let indent = null
  for (const l of lines.slice(at + 1)) {
    const lead = l.match(/^\s*/)[0].length
    if (lead === 0 && !/^-\s/.test(l)) break // a block list may sit at the key's own indent: «on:\n- push»
    if (indent === null) indent = lead
    if (lead !== indent) continue
    const m = l.trim().match(/^(['"]?)([A-Za-z_]+)\1\s*:/) || l.trim().match(/^-\s*(['"]?)([A-Za-z_]+)\1\s*$/)
    if (m) out.add(m[2])
  }
  return out
}

/**
 * The workflow_dispatch inputs a workflow declares, by name: { required, hasDefault }, read from block form. null when
 * the workflow cannot be read (unreadableForm) or has no workflow_dispatch; {} when it takes no inputs.
 */
export function dispatchInputsOf(text) {
  if (unreadableForm(text)) return null
  const lines = codeLines(text)
  const at = onLine(lines)
  if (at < 0) return null
  const inline = lines[at].replace(/^[^:]*:\s*/, '').trim()
  if (inline) return triggersOf(text).has('workflow_dispatch') ? {} : null // «on: [push, workflow_dispatch]»: no inputs
  let end = lines.findIndex((l, i) => i > at && !/^\s/.test(l))
  if (end < 0) end = lines.length
  const wd = lines.findIndex((l, i) => i > at && i < end && /^\s+['"]?workflow_dispatch['"]?\s*:/.test(l))
  if (wd < 0) return triggersOf(text).has('workflow_dispatch') ? {} : null // «on:\n  - workflow_dispatch»: no inputs
  const wdLead = lines[wd].match(/^\s*/)[0].length
  const inputs = {}
  let inLead = null
  let current = null
  let inInputs = false
  for (const l of lines.slice(wd + 1)) {
    const lead = l.match(/^\s*/)[0].length
    if (lead <= wdLead) break
    const t = l.trim()
    if (!inInputs) { if (/^(['"]?)inputs\1\s*:/.test(t)) inInputs = true; continue } // «inputs:», «"inputs":»
    if (inLead === null) inLead = lead
    if (lead < inLead) break
    if (lead === inLead) {
      const m = t.match(/^(['"]?)([A-Za-z0-9_-]+)\1\s*:/)
      current = m ? m[2] : null
      if (current) inputs[current] = { required: false, hasDefault: false }
    } else if (current) {
      if (/^required\s*:\s*(true|'true'|"true")\s*$/.test(t)) inputs[current].required = true
      if (/^default\s*:/.test(t)) inputs[current].hasDefault = true
    }
  }
  return inputs
}


/** Every workflow that starts on GitHub's schedule and is not a light check. */
export function heavyScheduled(workflowsDir) {
  if (!fs.existsSync(workflowsDir)) return []
  return fs.readdirSync(workflowsDir)
    .filter((f) => /\.ya?ml(\.template)?$/.test(f))
    .filter((f) => !LIGHT_SCHEDULED.includes(f.replace(/\.template$/, '')))
    .filter((f) => triggersOf(fs.readFileSync(path.join(workflowsDir, f), 'utf8')).has('schedule'))
}

/**
 * Every pull-request workflow whose runs of a replaced version are not stopped (delivery plan design 2: 42% of
 * pull-request test minutes ran on versions a newer push replaced, measured 14.-17.11.2026). A workflow-level
 * `concurrency:` must group by the pull request (github.ref or the pull request's number) and cancel at least on a
 * pull request: `cancel-in-progress: true` or `${{ github.event_name == 'pull_request' }}`.
 */
export function prWithoutCancel(workflowsDir) {
  if (!fs.existsSync(workflowsDir)) return []
  const bad = []
  for (const f of fs.readdirSync(workflowsDir).filter((x) => /\.ya?ml(\.template)?$/.test(x))) {
    const text = fs.readFileSync(path.join(workflowsDir, f), 'utf8')
    if (!triggersOf(text).has('pull_request')) continue
    const lines = codeLines(text)
    const at = lines.findIndex((l) => /^concurrency\s*:/.test(l))
    const block = []
    if (at >= 0) for (const l of lines.slice(at + 1)) { if (!/^\s/.test(l)) break; block.push(l.trim()) }
    const group = (block.find((l) => l.startsWith('group:')) ?? '').slice('group:'.length).trim()
    const cancel = (block.find((l) => l.startsWith('cancel-in-progress:')) ?? '').slice('cancel-in-progress:'.length).trim()
    // A part that changes on every push or run (the commit, the run) gives each version its own group: nothing is
    // ever cancelled, whatever cancel-in-progress says.
    const perVersion = /github\.sha\b|github\.run_id|github\.run_number|github\.run_attempt|github\.event\.after\b|github\.event\.pull_request\.head\.sha|github\.event\.head_commit/.test(group)
    const groupsByPr = !perVersion && /github\.ref\b|github\.event\.pull_request\.number|github\.head_ref/.test(group)
    const cancelsOnPr = cancel === 'true' || /^\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*\}\}$/.test(cancel)
    if (!groupsByPr || !cancelsOnPr) bad.push(f)
  }
  return bad
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** The problems of a declaration ([] = it holds). */
export function checkDelivery(decl, workflowsDir) {
  const errors = []
  if (!isPlainObject(decl)) return ['.github/delivery.json is not a JSON object']
  const cls = decl.delivery_class
  if (!CLASSES.includes(cls)) errors.push(`delivery_class must be one of ${CLASSES.join(', ')} (it is ${JSON.stringify(cls)})`)
  const wf = decl.workflow
  let deployText = null
  if (typeof wf !== 'string' || !WORKFLOW_NAME.test(wf)) errors.push(`workflow must name the release workflow file, e.g. "deploy.yml" (it is ${JSON.stringify(wf)})`)
  else {
    deployText = readWorkflow(workflowsDir, wf)
    if (deployText === null) errors.push(`workflow ${wf} is not in .github/workflows`)
  }
  if (typeof decl.branch !== 'string' || !BRANCH.test(decl.branch) || decl.branch.includes('..')) errors.push(`branch must name the branch releases come from (it is ${JSON.stringify(decl.branch)})`)

  if (cls === 'B') {
    if (typeof decl.train_at !== 'string' || !HHMM.test(decl.train_at)) errors.push(`class B needs train_at, its night train as «HH:MM» Zurich time (it is ${JSON.stringify(decl.train_at)})`)
    if (decl.night_gates != null && decl.night_gates !== 'always') errors.push(`night_gates is null (gates only on a night without a train) or "always" (it is ${JSON.stringify(decl.night_gates)})`)
    errors.push('class B is not available from this template yet: the template does not carry the release-queue workflow, and a check that reads workflow text cannot prove a night gates run (confirm=gates) never deploys; declare A or C, and set a class B product up from a class B product\'s workflow, reviewed on its own pull request')
  } else {
    if (decl.train_at != null) errors.push(`train_at is for class B only; class ${cls} has none (Cockpit would ignore it)`)
    if (decl.night_gates != null) errors.push(`night_gates is for class B only; class ${cls} has none (Cockpit would ignore it)`)
  }

  if (!Array.isArray(decl.night)) errors.push('night must be a list (empty when the project has no heavy night suite)')
  else decl.night.forEach((n, i) => {
    const where = `night[${i}]`
    if (!isPlainObject(n)) { errors.push(`${where} is not an object`); return }
    if (typeof n.workflow !== 'string' || !WORKFLOW_NAME.test(n.workflow)) { errors.push(`${where}.workflow must name a workflow file`); return }
    const text = readWorkflow(workflowsDir, n.workflow)
    if (text === null) errors.push(`${where}: ${n.workflow} is not in .github/workflows`)
    else if (!triggersOf(text).has('workflow_dispatch')) errors.push(`${where}: ${n.workflow} has no workflow_dispatch, so Cockpit cannot start it`)
    else if (isPlainObject(n.inputs)) {
      // GitHub refuses a dispatch with an input the workflow does not declare, or without a required one (no default).
      const declared = dispatchInputsOf(text)
      if (declared === null) errors.push(`${where}: the inputs of ${n.workflow}'s workflow_dispatch cannot be read here; write it in block form`)
      else {
        for (const k of Object.keys(n.inputs)) if (!(k in declared)) errors.push(`${where}: ${n.workflow} declares no workflow_dispatch input «${k}», so GitHub would refuse the night run`)
        for (const [k, v] of Object.entries(declared)) if (v.required && !v.hasDefault && !(k in n.inputs)) errors.push(`${where}: ${n.workflow} requires the input «${k}», which the night entry does not give`)
      }
    }
    if (typeof n.at_zurich !== 'string' || !HHMM.test(n.at_zurich)) errors.push(`${where}.at_zurich must be «HH:MM» Zurich time (it is ${JSON.stringify(n.at_zurich)})`)
    if (!isPlainObject(n.inputs) || Object.values(n.inputs).some((v) => typeof v !== 'string')) errors.push(`${where}.inputs must be an object of input names and plain string values`)
    if (n.label !== undefined && (typeof n.label !== 'string' || n.label.length < 1 || n.label.length > 200)) errors.push(`${where}.label must be 1-200 characters`)
  })

  for (const [f, why] of unreadableWorkflows(workflowsDir)) errors.push(`${f}: ${why}; this check reads block form only, so write it in block form`)
  for (const f of heavyScheduled(workflowsDir)) errors.push(`${f} starts on GitHub's schedule: put it on the night list (night) and take the schedule out`)
  for (const f of prWithoutCancel(workflowsDir)) errors.push(`${f} runs on pull requests but does not stop the runs of a replaced version (concurrency grouped by the pull request, cancel-in-progress on pull_request)`)

  if (!('suites' in decl)) errors.push('suites (the path-to-suite map) must be present; it stays null until step 4 of the delivery plan defines it')
  else if (decl.suites !== null) errors.push('suites must stay null until step 4 of the delivery plan (test each change once) defines its shape')
  return errors
}

/** The pilot entry fields Cockpit's run_queue_setting.pilot takes for this project (null for class A: not in the queue). */
export function pilotFields(decl, repo) {
  if (decl.delivery_class === 'A') return null
  const entry = { repo, workflow: decl.workflow, branch: decl.branch, delivery_class: decl.delivery_class }
  if (decl.delivery_class === 'B') {
    entry.train_at = decl.train_at
    if (decl.night_gates === 'always') entry.night_gates = 'always'
    entry.sha_input = 'release_sha'
  }
  return entry
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  const file = path.join(root, '.github', 'delivery.json')
  let decl
  try { decl = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) {
    console.error(`::error::.github/delivery.json cannot be read: ${e.message}`)
    process.exit(1)
  }
  const errors = checkDelivery(decl, path.join(root, '.github', 'workflows'))
  for (const e of errors) console.error(`::error::${e}`)
  if (errors.length) process.exit(1)
  console.log(`ok: delivery class ${decl.delivery_class}, ${decl.night.length} night run(s), path-to-suite map ${decl.suites === null ? 'not yet defined (step 4)' : 'set'}`)
  const at = process.argv.indexOf('--pilot')
  if (at > 0) {
    const repo = process.argv[at + 1]
    if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) { console.error('::error::--pilot needs <owner/repo>'); process.exit(1) }
    const entry = pilotFields(decl, repo)
    if (!entry) console.log('class A is released on demand and has no entry in the release queue.')
    else console.log(`Add to Cockpit's run_queue_setting.pilot (with staging_minutes and production_minutes measured from the workflow):\n${JSON.stringify(entry, null, 2)}`)
  }
}
