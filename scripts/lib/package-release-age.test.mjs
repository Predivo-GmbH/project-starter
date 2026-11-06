import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

// SR-SUP-03: a new package version waits at least 3 days before npm resolves it.
// "min-release-age" (days) is read by npm 11.10 and newer when it resolves NEW versions (install, update).
// "npm ci" installs the committed lockfile as it is, and older npm (the Node 22 runners) ignores the key.
// If this test fails, the setting was removed or weakened: restore it, do not delete the test.

const FOLDERS = ['']

for (const folder of FOLDERS) {
  test(`${folder || '.'}/.npmrc keeps min-release-age of at least 3 days (SR-SUP-03)`, () => {
    const file = new URL(`../../${folder}.npmrc`, import.meta.url)
    assert.ok(fs.existsSync(file), `${folder}.npmrc is missing`)
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^[#;]/.test(l))
    const hits = lines.filter((l) => /^min-release-age\s*=/.test(l))
    assert.equal(hits.length, 1, 'exactly one min-release-age line')
    const days = Number(hits[0].split('=')[1].trim())
    assert.ok(Number.isInteger(days) && days >= 3, `min-release-age must be a whole number >= 3, got "${hits[0]}"`)
    assert.ok(!lines.some((l) => /^min-release-age-exclude/.test(l)), 'no min-release-age-exclude: an exemption needs its own decision row')
  })
}
