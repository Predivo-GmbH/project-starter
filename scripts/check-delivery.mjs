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

/** The workflow's lines without comments (a word in a comment never counts as a trigger or an input). */
function codeLines(text) {
  return text.split(/\r?\n/).map((l) => l.replace(/(^|\s)#.*$/, '')).filter((l) => l.trim() !== '')
}

/** The keys directly under the top-level `on:` block (push, pull_request, schedule, workflow_dispatch, ...). */
export function triggersOf(text) {
  const lines = codeLines(text)
  const out = new Set()
  const at = lines.findIndex((l) => /^(on|'on'|"on")\s*:/.test(l))
  if (at < 0) return out
  const inline = lines[at].replace(/^[^:]*:\s*/, '').trim()
  if (inline) {
    // on: push   |   on: [push, pull_request]
    for (const t of inline.replace(/[[\]]/g, '').split(',')) if (t.trim()) out.add(t.trim())
    return out
  }
  let indent = null
  for (const l of lines.slice(at + 1)) {
    const lead = l.match(/^\s*/)[0].length
    if (lead === 0) break
    if (indent === null) indent = lead
    if (lead !== indent) continue
    const m = l.trim().match(/^([A-Za-z_]+)\s*:/)
    if (m) out.add(m[1])
  }
  return out
}

/** What a class B release workflow still lacks to join Cockpit's release queue ([] = nothing). */
export function queueGaps(deployText, workflowsDir) {
  const gaps = []
  const code = codeLines(deployText ?? '').join('\n')
  if (!triggersOf(deployText ?? '').has('workflow_dispatch')) gaps.push('the release workflow has no workflow_dispatch (Cockpit starts every production run with one)')
  if (!/^\s+release_sha\s*:/m.test(code)) gaps.push('the release workflow has no release_sha input (the queue ships exactly the commit staging proved)')
  if (!/inputs\.confirm\s*==\s*'gates'/.test(code)) gaps.push("the release workflow does not run the night gates on confirm=gates (the dispatcher's night run)")
  if (!/Night gates of/.test(code)) gaps.push('the release workflow does not title a gates-only run «Night gates of <sha>» (production-monitor files it in the nightly lane)')
  const files = fs.existsSync(workflowsDir) ? fs.readdirSync(workflowsDir).filter((f) => /\.ya?ml(\.template)?$/.test(f)) : []
  const hands = files.some((f) => {
    const t = codeLines(fs.readFileSync(path.join(workflowsDir, f), 'utf8')).join('\n')
    return /release-when-green\.mjs\s+request/.test(t) && /id-token:\s*write/.test(t) && /pull-requests:\s*(read|write)\b/.test(t)
  })
  if (!hands) gaps.push('no workflow hands a green staging run to Cockpit\'s release-request (release-when-green.yml: `node scripts/release-when-green.mjs request`, id-token: write, pull-requests: read for the hotfix label)')
  return gaps
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
    const groupsByPr = /github\.ref\b|github\.event\.pull_request\.number|github\.head_ref/.test(group)
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
    if (deployText !== null) for (const g of queueGaps(deployText, workflowsDir)) errors.push(`class B cannot be carried out yet: ${g}`)
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
    if (typeof n.at_zurich !== 'string' || !HHMM.test(n.at_zurich)) errors.push(`${where}.at_zurich must be «HH:MM» Zurich time (it is ${JSON.stringify(n.at_zurich)})`)
    if (!isPlainObject(n.inputs) || Object.values(n.inputs).some((v) => typeof v !== 'string')) errors.push(`${where}.inputs must be an object of input names and plain string values`)
    if (n.label !== undefined && (typeof n.label !== 'string' || n.label.length < 1 || n.label.length > 200)) errors.push(`${where}.label must be 1-200 characters`)
  })

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
