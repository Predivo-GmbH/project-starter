// A repo born from this starter must run its checks on our own machines when RUNNER_LABEL is set,
// not on GitHub-paid ubuntu-latest. A hardcoded "runs-on: ubuntu-latest" is the bug this guards.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.github', 'workflows')
const files = fs.readdirSync(dir).filter(f => /\.ya?ml(\.template)?$/.test(f))
assert.ok(files.length > 0, 'no workflows found')
const ok = "runs-on: ${{ vars.RUNNER_LABEL || 'ubuntu-24.04' }}"
let jobs = 0
for (const f of files) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*runs-on:\s*(.*?)\s*$/)
    if (!m) continue
    jobs++
    assert.equal(`runs-on: ${m[1]}`, ok, `${f}: "${line.trim()}" does not follow vars.RUNNER_LABEL`)
  }
}
assert.ok(jobs > 0)
console.log(`ok: ${jobs} jobs in ${files.length} workflows follow RUNNER_LABEL`)
