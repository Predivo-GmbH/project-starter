// A PROJECT DECLARES ITS DELIVERY CLASS, AND ITS WORKFLOWS CAN CARRY IT OUT (delivery plan step 7, 19.11.2026).
// Roger, 17.11.2026: «in the future there will be even more projects» - a new project joins by declaring its class and
// its path-to-suite map (.github/delivery.json), nothing else. scripts/check-delivery.mjs refuses a declaration the
// project's workflows cannot carry out; these tests pin each refusal and prove this template's own declaration holds.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkDelivery, heavyScheduled, prWithoutCancel, triggersOf, dispatchInputsOf, unreadableForm, stripComment as stripCommentForTest, pilotFields } from './check-delivery.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const workflows = path.join(root, '.github', 'workflows')
const declared = () => JSON.parse(fs.readFileSync(path.join(root, '.github', 'delivery.json'), 'utf8'))

/** A throw-away .github/workflows folder with the given files (removed when the suite ends). */
const made = []
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }) })
function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-'))
  made.push(dir)
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text)
  return dir
}
const C_DECL = { delivery_class: 'C', workflow: 'deploy.yml', branch: 'main', train_at: null, night_gates: null, night: [], suites: null }
const PLAIN_DEPLOY = 'name: Deploy\non:\n  push:\n    branches: [main]\n  workflow_dispatch: {}\njobs: {}\n'
// The parts a class B release workflow has since 18.11.2026 (ReplyFlow, ChannelMover, mitchind deploy.yml).
const QUEUE_DEPLOY = [
  'name: Deploy to Production',
  "run-name: ${{ github.event_name == 'workflow_dispatch' && inputs.release_sha == '' && inputs.confirm != 'deploy' && format('Night gates of {0}', github.sha) || '' }}",
  'on:',
  '  push:',
  '    branches: [main]',
  '  workflow_dispatch:',
  '    inputs:',
  '      confirm:',
  '        type: string',
  '      release_sha:',
  '        type: string',
  'jobs:',
  '  gate-e2e:',
  "    if: github.event.inputs.confirm == 'gates' || inputs.confirm == 'gates'",
  '',
].join('\n')
const RELEASE_WHEN_GREEN = [
  'name: Release when staging is green',
  'on:',
  '  workflow_run:',
  "    workflows: ['Deploy to Production']",
  '    types: [completed]',
  'jobs:',
  '  release:',
  '    permissions:',
  '      id-token: write',
  '      pull-requests: read',
  '    steps:',
  '      - run: node scripts/release-when-green.mjs request',
  '',
].join('\n')

test("this template's own declaration holds", () => {
  assert.deepEqual(checkDelivery(declared(), workflows), [])
})

test('the declaration carries a class, the night list and a marked place for the path-to-suite map', () => {
  const d = declared()
  assert.ok(['A', 'B', 'C'].includes(d.delivery_class))
  assert.ok(Array.isArray(d.night))
  assert.ok('suites' in d, 'the path-to-suite map has its place')
  assert.equal(d.suites, null, 'it stays null until step 4 defines it')
})

test('no workflow of the template starts a heavy suite on GitHub\'s schedule', () => {
  assert.deepEqual(heavyScheduled(workflows), [])
})

test('every pull-request workflow of the template stops the runs of a replaced version', () => {
  assert.deepEqual(prWithoutCancel(workflows), [])
})

test('a declaration without a class, or with an unknown one, is refused', () => {
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY })
  for (const cls of [undefined, 'D', 'b', '']) {
    const errs = checkDelivery({ ...C_DECL, delivery_class: cls }, dir)
    assert.ok(errs.some((e) => e.startsWith('delivery_class must be one of')), `${JSON.stringify(cls)}: ${errs}`)
  }
})

test('class B needs a train time «HH:MM»', () => {
  const dir = fixture({ 'deploy.yml': QUEUE_DEPLOY, 'release-when-green.yml': RELEASE_WHEN_GREEN })
  for (const at of [null, '3:00', '24:00', '03:60', 'night']) {
    const errs = checkDelivery({ ...C_DECL, delivery_class: 'B', train_at: at }, dir)
    assert.ok(errs.some((e) => e.startsWith('class B needs train_at')), `${JSON.stringify(at)}: ${errs}`)
  }
  const errs = checkDelivery({ ...C_DECL, delivery_class: 'B', train_at: '03:00', night_gates: 'always' }, dir)
  assert.deepEqual(errs.map((e) => e.split(':')[0]), ['class B is not available from this template yet'], errs.join('\n'))
})

test('class B is refused, even with every release-queue part in its workflow, until the template carries that workflow (Codex round 7 on #15)', () => {
  for (const deploy of [PLAIN_DEPLOY, QUEUE_DEPLOY]) {
    const errs = checkDelivery({ ...C_DECL, delivery_class: 'B', train_at: '03:00' }, fixture({ 'deploy.yml': deploy, 'release-when-green.yml': RELEASE_WHEN_GREEN }))
    assert.ok(errs.some((e) => e.startsWith('class B is not available from this template yet')), errs.join('\n'))
  }
})

test('an input whose settings sit on one line, or a flow on:, is refused with «write it in block form», never guessed (review of #15)', () => {
  const inline = 'on:\n  workflow_dispatch:\n    inputs:\n      sha: {type: string, required: true}\njobs: {}\n'
  assert.equal(dispatchInputsOf(inline), null)
  assert.match(unreadableForm(inline), /input «sha» has its settings on one line/)
  assert.match(unreadableForm('on:\n  workflow_dispatch: {inputs: {sha: {required: true}}}\njobs: {}\n'), /workflow_dispatch is written on one line/)
  assert.match(unreadableForm('on:\n  workflow_dispatch:\n    inputs: {sha: {required: true}}\njobs: {}\n'), /inputs are written on one line/)
  assert.match(unreadableForm('on: {pull_request: {}, push: {}}\njobs: {}\n'), /flow mapping/)
  assert.equal(unreadableForm('on:\n  workflow_dispatch: {}\n  push:\n    branches: [main]\njobs: {}\n'), null, 'an empty workflow_dispatch is block form')
  assert.equal(unreadableForm('on: [push, workflow_dispatch]\njobs: {}\n'), null)
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY, 'night.yml': inline, 'pr.yml': 'on: {pull_request: {}}\njobs: {}\n' })
  const errs = checkDelivery({ ...C_DECL, night: [{ workflow: 'night.yml', at_zurich: '02:00', inputs: { sha: 'x' } }] }, dir)
  assert.ok(errs.some((e) => /^night\.yml: .*write it in block form/.test(e)), errs.join('\n'))
  assert.ok(errs.some((e) => /^pr\.yml: its on: is a flow mapping .*write it in block form/.test(e)), errs.join('\n'))
})

test('block form is read as YAML reads it: quoted keys, apostrophes, colons and quotes inside text, a quoted #, comments (review of #15)', () => {
  const quoted = 'on:\n  workflow_dispatch:\n    "inputs":\n      release_sha:\n        type: string\n      confirm:\n        type: string\njobs: {}\n'
  assert.deepEqual(Object.keys(dispatchInputsOf(quoted)), ['release_sha', 'confirm'])
  const text = [
    'on:',
    '  workflow_dispatch:',
    '    inputs:',
    '      sha:',
    "        description: Don't skip this, the prefix is ref:\"",
    '        required: true # needed',
    '      tag:',
    '        description: "Use #tag, required: true is not set"',
    "        default: '#1'",
    '      note:',
    '        description: say # required: true',
    'jobs: {}',
    '',
  ].join('\n')
  assert.deepEqual(dispatchInputsOf(text), { sha: { required: true, hasDefault: false }, tag: { required: false, hasDefault: true }, note: { required: false, hasDefault: false } })
  assert.equal(unreadableForm(text), null)
  assert.equal(stripCommentForTest('branches: [main, "x # y"] # z'), 'branches: [main, "x # y"] ', 'inside a flow list a quoted # stays, the trailing comment goes')
  assert.equal(stripCommentForTest('description: For example build," # required: true'), 'description: For example build," ', 'a comma and a quote in plain text start no quoted value (round 4)')
  // a value in the on: block that runs over several lines is refused, quoted or plain, so no continuation is ever read as
  // an input's shape (Codex round 8)
  const across = 'on:\n  workflow_dispatch:\n    inputs:\n      sha:\n        description: "first\n          required: true"\n      other:\n        type: string\njobs: {}\n'
  assert.equal(dispatchInputsOf(across), null)
  assert.match(unreadableForm(across), /runs over several lines .*write each value on one line/)
  const plainSpill = 'on:\n  workflow_dispatch:\n    inputs:\n      sha:\n        description: first part\n          "second # required: true\njobs: {}\n'
  assert.match(unreadableForm(plainSpill), /runs over several lines/)
  const shaped = 'on:\n  workflow_dispatch:\n    inputs:\n      sha:\n        description: "first\n      other: {required: true}"\njobs: {}\n'
  assert.match(unreadableForm(shaped), /runs over several lines|settings on one line/)
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY, 'night.yml': across })
  assert.ok(checkDelivery({ ...C_DECL, night: [{ workflow: 'night.yml', at_zurich: '02:00', inputs: {} }] }, dir).some((e) => /^night\.yml: .*one line/.test(e)))
  // a run: | block is script text, left out of every structural check (round 7)
  const scripted = 'on:\n  pull_request:\njobs:\n  t:\n    steps:\n      - run: |\n          echo "#1"\n          schedule:\n          workflow_dispatch:\n'
  assert.deepEqual([...triggersOf(scripted)], ['pull_request'])
})

test('a train time or night_gates outside class B is refused (Cockpit would ignore it)', () => {
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY })
  assert.ok(checkDelivery({ ...C_DECL, train_at: '03:00' }, dir).some((e) => e.startsWith('train_at is for class B only')))
  assert.ok(checkDelivery({ ...C_DECL, delivery_class: 'A', night_gates: 'always' }, dir).some((e) => e.startsWith('night_gates is for class B only')))
})

test('the release workflow must exist', () => {
  const dir = fixture({})
  assert.ok(checkDelivery(C_DECL, dir).some((e) => e === 'workflow deploy.yml is not in .github/workflows'))
})

test('a night entry must name a workflow Cockpit can start, at «HH:MM», with plain inputs', () => {
  const withInputs = 'on:\n  workflow_dispatch:\n    inputs:\n      confirm:\n        required: true\n        type: string\n      runner:\n        default: self-hosted\n        required: true\n      note:\n        type: string\njobs: {}\n'
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY, 'nightly.yml': 'on:\n  workflow_run:\n    workflows: [x]\njobs: {}\n', 'ok.yml': withInputs, 'bare.yml': 'on:\n  workflow_dispatch: {}\njobs: {}\n' })
  const errs = (night) => checkDelivery({ ...C_DECL, night }, dir)
  assert.ok(errs([{ workflow: 'missing.yml', at_zurich: '01:30', inputs: {} }]).some((e) => e.includes('missing.yml is not in')))
  assert.ok(errs([{ workflow: 'nightly.yml', at_zurich: '01:30', inputs: {} }]).some((e) => e.includes('no workflow_dispatch')))
  assert.ok(errs([{ workflow: 'ok.yml', at_zurich: '1:30', inputs: { confirm: 'gates' } }]).some((e) => e.includes('at_zurich')))
  assert.ok(errs([{ workflow: 'ok.yml', at_zurich: '01:30', inputs: { confirm: 1 } }]).some((e) => e.includes('inputs must be')))
  assert.deepEqual(errs([{ workflow: 'ok.yml', at_zurich: '01:30', inputs: { confirm: 'gates' }, label: 'Night suite' }]), [])
  assert.deepEqual(errs([{ workflow: 'bare.yml', at_zurich: '01:30', inputs: {} }]), [])
})

test('a night entry gives exactly the inputs its workflow takes, or GitHub refuses the dispatch', () => {
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY, 'bare.yml': 'on:\n  workflow_dispatch: {}\njobs: {}\n', 'gated.yml': 'on:\n  workflow_dispatch:\n    inputs:\n      confirm:\n        required: true\njobs: {}\n' })
  const errs = (night) => checkDelivery({ ...C_DECL, night }, dir)
  assert.ok(errs([{ workflow: 'bare.yml', at_zurich: '01:30', inputs: { confirm: 'gates' } }]).some((e) => e.includes('declares no workflow_dispatch input «confirm»')))
  assert.ok(errs([{ workflow: 'gated.yml', at_zurich: '01:30', inputs: {} }]).some((e) => e.includes('requires the input «confirm»')))
  assert.deepEqual(errs([{ workflow: 'gated.yml', at_zurich: '01:30', inputs: { confirm: 'gates' } }]), [])
})

test('a heavy workflow on GitHub\'s schedule is refused; a light keep-alive may keep it', () => {
  const scheduled = 'on:\n  schedule:\n    - cron: "0 2 * * *"\n  workflow_dispatch: {}\njobs: {}\n'
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY, 'e2e-nightly.yml': scheduled, 'keep-alive.yml': scheduled })
  assert.deepEqual(heavyScheduled(dir), ['e2e-nightly.yml'])
  assert.ok(checkDelivery(C_DECL, dir).some((e) => e.startsWith("e2e-nightly.yml starts on GitHub's schedule")))
  const commentedOut = fixture({ 'deploy.yml': PLAIN_DEPLOY, 'x.yml': 'on:\n  # schedule:\n  workflow_dispatch: {}\njobs: {}\n' })
  assert.deepEqual(heavyScheduled(commentedOut), [])
})

test('a pull-request workflow that does not cancel a replaced version is refused', () => {
  const none = 'on:\n  pull_request:\njobs: {}\n'
  const neverCancels = 'on:\n  pull_request:\nconcurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: false\njobs: {}\n'
  const oneGroupForAll = 'on:\n  pull_request:\nconcurrency:\n  group: reviews\n  cancel-in-progress: true\njobs: {}\n'
  const prOnly = "on:\n  push:\n  pull_request:\nconcurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: ${{ github.event_name == 'pull_request' }}\njobs: {}\n"
  const byNumber = 'on: [pull_request]\nconcurrency:\n  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}\n  cancel-in-progress: true\njobs: {}\n'
  const perCommit = 'on:\n  pull_request:\nconcurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}-${{ github.sha }}\n  cancel-in-progress: true\njobs: {}\n'
  const quotedList = 'on: ["pull_request"]\njobs: {}\n'
  const dir = fixture({ 'a.yml': none, 'b.yml': neverCancels, 'c.yml': oneGroupForAll, 'd.yml': prOnly, 'e.yml': byNumber, 'f.yml': perCommit, 'g.yml': quotedList })
  assert.deepEqual(prWithoutCancel(dir).sort(), ['a.yml', 'b.yml', 'c.yml', 'f.yml', 'g.yml'])
})

test('triggersOf reads block, list and single forms of on:', () => {
  assert.deepEqual([...triggersOf('on:\n  push:\n    branches: [main]\n  pull_request:\njobs: {}\n')], ['push', 'pull_request'])
  assert.deepEqual([...triggersOf('on: [push, pull_request]\n')], ['push', 'pull_request'])
  assert.deepEqual([...triggersOf('on: workflow_dispatch\n')], ['workflow_dispatch'])
  assert.deepEqual([...triggersOf('on: ["pull_request", \'push\']\n')], ['pull_request', 'push'])
  assert.deepEqual([...triggersOf('on: {schedule: [{cron: "0 2 * * *"}], "workflow_dispatch": {}}\n')], [], 'a flow on: is not guessed')
  assert.match(unreadableForm('on: {schedule: [{cron: "0 2 * * *"}], "workflow_dispatch": {}}\n'), /flow mapping/)
  assert.deepEqual([...triggersOf('on:\n  "pull_request":\n  \'schedule\':\n    - cron: "0 2 * * *"\n')], ['pull_request', 'schedule'])
  assert.deepEqual([...triggersOf('on:\n  - push\n  - "pull_request"\njobs: {}\n')], ['push', 'pull_request'], 'a block list (review round 2)')
  assert.deepEqual([...triggersOf('on:\n- push\n- workflow_dispatch\njobs: {}\n')], ['push', 'workflow_dispatch'], 'a block list at the key\'s indent')
  assert.deepEqual(dispatchInputsOf('on:\n- push\n- workflow_dispatch\njobs: {}\n'), {}, 'a block list carries no inputs')
})

test('the suites map stays null until step 4 defines it', () => {
  const dir = fixture({ 'deploy.yml': PLAIN_DEPLOY })
  const { suites, ...withoutSuites } = C_DECL
  assert.ok(checkDelivery(withoutSuites, dir).some((e) => e.startsWith('suites (the path-to-suite map) must be present')))
  assert.ok(checkDelivery({ ...C_DECL, suites: { 'src/**': ['unit'] } }, dir).some((e) => e.startsWith('suites must stay null')))
})

test('the pilot entry carries the class fields Cockpit reads; class A has none', () => {
  assert.deepEqual(pilotFields({ ...C_DECL }, 'predivo-ch/x'), { repo: 'predivo-ch/x', workflow: 'deploy.yml', branch: 'main', delivery_class: 'C' })
  assert.deepEqual(pilotFields({ ...C_DECL, delivery_class: 'B', train_at: '03:00', night_gates: 'always' }, 'predivo-ch/x'),
    { repo: 'predivo-ch/x', workflow: 'deploy.yml', branch: 'main', delivery_class: 'B', train_at: '03:00', night_gates: 'always', sha_input: 'release_sha' })
  assert.equal(pilotFields({ ...C_DECL, delivery_class: 'A' }, 'predivo-ch/x'), null)
})
