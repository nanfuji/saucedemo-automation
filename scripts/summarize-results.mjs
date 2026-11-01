// Prints an execution summary from the Playwright JSON report (test-results/results.json).
import { readFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(process.argv[2] ?? 'test-results/results.json', 'utf8'));
const tests = [];
const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const last = t.results.at(-1) ?? {};
      tests.push({ title: spec.title, file: spec.file, status: t.status, expectedStatus: t.expectedStatus, annotations: t.annotations ?? [], duration: last.duration ?? 0 });
    }
  }
  (suite.suites ?? []).forEach(walk);
};
report.suites.forEach(walk);

const count = (fn) => tests.filter(fn).length;
const byFile = {};
for (const t of tests) {
  byFile[t.file] ??= { total: 0, passed: 0, failed: 0, skipped: 0, expectedFail: 0 };
  const f = byFile[t.file];
  f.total++;
  if (t.status === 'skipped') f.skipped++;
  else if (t.status === 'expected') (t.expectedStatus === 'failed' ? f.expectedFail++ : f.passed++);
  else f.failed++;
}

const s = report.stats;
console.log('Execution summary');
console.log('=================');
console.log(`Total tests:               ${tests.length}`);
console.log(`Passed:                    ${count((t) => t.status === 'expected' && t.expectedStatus === 'passed')}`);
console.log(`Expected failures (known defects, test.fail): ${count((t) => t.status === 'expected' && t.expectedStatus === 'failed')}`);
console.log(`Failed:                    ${count((t) => t.status === 'unexpected')}`);
console.log(`Flaky:                     ${count((t) => t.status === 'flaky')}`);
console.log(`Skipped:                   ${count((t) => t.status === 'skipped')}`);
console.log(`Wall-clock duration:       ${(s.duration / 1000).toFixed(1)} s`);
console.log('\nPer spec file:');
console.table(byFile);

const notes = tests.flatMap((t) => t.annotations.filter((a) => ['known-defect', 'observation', 'performance'].includes(a.type)).map((a) => ({ type: a.type, test: t.title, description: a.description })));
if (notes.length) {
  console.log('\nApplication defects & observations:');
  for (const n of notes) console.log(`- [${n.type}] ${n.test}: ${n.description}`);
}
