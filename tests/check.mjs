import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../extension/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root)));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['declarativeNetRequest']);
assert.deepEqual(Object.keys(manifest).sort(), [
  'manifest_version', 'name', 'version', 'description', 'permissions', 'declarative_net_request', 'icons',
].sort());
assert.deepEqual(manifest.declarative_net_request.rule_resources, [
  { id: 'typing-block', enabled: true, path: 'rules.json' },
]);
const rules = JSON.parse(await readFile(new URL('rules.json', root)));
assert.equal(rules.length, 1);
const [rule] = rules;
assert.equal(rule.id, 1);
assert.equal(rule.priority, 1);
assert.deepEqual(rule.action, { type: 'block' });
assert.deepEqual(Object.keys(rule).sort(), ['id', 'priority', 'action', 'condition'].sort());
assert.deepEqual(Object.keys(rule.condition).sort(), [
  'regexFilter', 'isUrlFilterCaseSensitive', 'requestMethods', 'resourceTypes',
].sort());
assert.equal(rule.condition.isUrlFilterCaseSensitive, true);
assert.deepEqual(rule.condition.requestMethods, ['post']);
assert.deepEqual(rule.condition.resourceTypes, ['xmlhttprequest']);

export const cases = [
  ['https://chaturbate.com/api/messaging/typing/', 'post', 'xmlhttprequest', true],
  ['https://chaturbate.com/api/messaging/typing/?to_username=test&x=1', 'post', 'xmlhttprequest', true],
  ['https://chaturbate.com/api/messaging/typing/?', 'post', 'xmlhttprequest', true],
  ...[
    'http://chaturbate.com/api/messaging/typing/',
    'https://www.chaturbate.com/api/messaging/typing/',
    'https://chaturbate.com.evil.test/api/messaging/typing/',
    'https://example.test/api/messaging/typing/',
    'https://chaturbate.com/api/messaging/typing',
    'https://chaturbate.com/api/messaging/typing/extra',
    'https://chaturbate.com/api/messaging/typing-old/',
    'https://chaturbate.com/API/messaging/typing/',
    'https://chaturbate.com/api/messaging/publish/',
    'https://chaturbate.com/api/messaging/publish-media-set/',
    'https://chaturbate.com/api/messaging/history/',
    'https://chaturbate.com/?next=https://chaturbate.com/api/messaging/typing/',
  ].map(url => [url, 'post', 'xmlhttprequest', false]),
  ['https://chaturbate.com/api/messaging/typing/', 'get', 'xmlhttprequest', false],
  ['https://chaturbate.com/api/messaging/typing/', 'post', 'main_frame', false],
  ['https://chaturbate.com/api/messaging/typing/', 'post', 'script', false],
];
const regex = new RegExp(rule.condition.regexFilter);
for (const [url, method, type, expected] of cases) {
  assert.equal(regex.test(url) && rule.condition.requestMethods.includes(method)
    && rule.condition.resourceTypes.includes(type), expected, `${method} ${type} ${url}`);
}
console.log(`PASS: least privilege, static rule integrity, ${cases.length} simulated request cases. Not Chrome enforcement proof.`);
