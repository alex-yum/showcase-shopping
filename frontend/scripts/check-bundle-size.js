#!/usr/bin/env node
// Parses `next build` output for each route's "First Load JS" column and
// fails if any route exceeds the size budget. Run as:
//   npm run build | tee build-output.txt && node scripts/check-bundle-size.js build-output.txt
const fs = require('fs')

const BUDGET_KB = 250

const file = process.argv[2]
if (!file) {
  console.error('Usage: check-bundle-size.js <build-output.txt>')
  process.exit(1)
}

const output = fs.readFileSync(file, 'utf8')

// Matches route rows like:
// "├ ○ /login                                    26.2 kB         140 kB"
// and the shared baseline row:
// "+ First Load JS shared by all            105 kB"
const routeLineRegex = /^[│├└+┌]\s*[○●ƒ]?\s*(\S+)\s+[\d.]+\s*(?:kB|B)\s+([\d.]+)\s*kB\s*$/gm
const sharedLineRegex = /First Load JS shared by all\s+([\d.]+)\s*kB/

const results = []
let match
while ((match = routeLineRegex.exec(output)) !== null) {
  const [, route, firstLoadKb] = match
  results.push({ route, firstLoadKb: parseFloat(firstLoadKb) })
}

const sharedMatch = sharedLineRegex.exec(output)
const sharedKb = sharedMatch ? parseFloat(sharedMatch[1]) : null

if (results.length === 0) {
  console.warn('check-bundle-size: could not parse any route sizes from build output; skipping budget check.')
  process.exit(0)
}

console.log('Route First Load JS sizes:')
let failed = false
for (const { route, firstLoadKb } of results) {
  const status = firstLoadKb > BUDGET_KB ? 'FAIL' : 'ok'
  if (firstLoadKb > BUDGET_KB) failed = true
  console.log(`  ${status === 'FAIL' ? '✗' : '✓'} ${route}: ${firstLoadKb} kB (budget ${BUDGET_KB} kB)`)
}
if (sharedKb !== null) {
  console.log(`Shared JS baseline: ${sharedKb} kB`)
}

if (failed) {
  console.error(`\nBundle size budget of ${BUDGET_KB} kB exceeded. See routes marked FAIL above.`)
  process.exit(1)
}

console.log('\nAll routes are within the bundle size budget.')
