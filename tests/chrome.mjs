// Optional native smoke: use an already-installed Playwright, no dependency installation.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/chrome.mjs
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cases } from './check.mjs';

assert.ok(process.env.PLAYWRIGHT_MODULE, 'Set PLAYWRIGHT_MODULE to an installed Playwright index.mjs');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const scratch = await mkdtemp(join(tmpdir(), 'typing-privacy-chrome-'));
const harness = join(scratch, 'harness');
await mkdir(harness);
// Separate test-only companion: production extension stays byte-for-byte unchanged.
await writeFile(join(harness, 'manifest.json'), JSON.stringify({
  manifest_version: 3, name: 'Typing Privacy Test Companion', version: '0.0.1',
  permissions: ['management'], background: { service_worker: 'worker.js' },
}));
await writeFile(join(harness, 'worker.js'), 'chrome.runtime.onInstalled.addListener(() => {});');
const extension = fileURLToPath(new URL('../extension/', import.meta.url));
const context = await chromium.launchPersistentContext(join(scratch, 'profile'), {
  channel: 'chromium', headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}),
  args: [`--disable-extensions-except=${extension},${harness}`, `--load-extension=${extension},${harness}`],
});
try {
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const installed = await worker.evaluate(() => chrome.management.getAll());
  const target = installed.find(item => item.name === 'Anti Operator Detection for Chaturbate');
  assert.ok(target?.enabled, 'Production extension loaded and enabled');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${target.id}/rules.json`);
  const result = await page.evaluate(async ({ cases, regex }) => {
    const api = chrome.declarativeNetRequest;
    const enabled = await api.getEnabledRulesets();
    const supported = await api.isRegexSupported({ regex, isCaseSensitive: true });
    const outcomes = [];
    for (const [url, method, type] of cases) {
      const match = await api.testMatchOutcome({ url, method, type });
      outcomes.push(match.matchedRules.some(rule => rule.ruleId === 1));
    }
    return { enabled, supported, outcomes };
  }, { cases, regex: JSON.parse(await readFile(new URL('../extension/rules.json', import.meta.url)))[0].condition.regexFilter });
  assert.deepEqual(result.enabled, ['typing-block']);
  assert.equal(result.supported.isSupported, true);
  assert.deepEqual(result.outcomes, cases.map(item => item[3]));
  console.log(JSON.stringify({ status: 'PASS', browser: context.browser().version(),
    productionManifestUnmodified: true, enabledRulesets: result.enabled,
    nativeMatchCases: cases.length, regexSupported: true,
    limitation: 'Native rule matching only; no live account A/B or message delivery test.' }, null, 2));
} finally {
  await context.close();
  // Scratch is left for diagnosis; never copy this temporary browser profile into evidence.
}
