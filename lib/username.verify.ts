// Run: npx tsx lib/username.verify.ts
import assert from 'node:assert/strict';
import { checkUsername, cleanUsername, isReservedUsername } from './username';

let checks = 0;
const ok = (c: unknown, m: string) => { assert.ok(c, m); checks++; };
const good = (raw: string, want: string) => { const r = checkUsername(raw); ok(r.ok && r.username === want, `accept ${raw}`); };
const bad = (raw: string) => ok(!checkUsername(raw).ok, `reject ${raw}`);

good('PeteEasy', 'peteeasy');
good('pete.easy', 'pete.easy');
good('pete_easy-2', 'pete_easy-2');
good('abc', 'abc');
good('a'.repeat(30), 'a'.repeat(30));
bad('ab');
bad('a'.repeat(31));
bad('@pete');
bad('.pete');
bad('pete.');
bad('-pete');
bad('pe..te');
bad('pe._te');
bad('pete.php');
bad('backup.sql');
bad('site.zip');
bad('admin');
bad('API');
bad('dashboard');
bad('terms');
bad('privacy');
bad('reset-password');
bad('pez');
bad('easydidit');
bad('peasy1');
bad('');
ok(cleanUsername(' Pe te!$ ') === 'pete', 'clean strips spaces and symbols');
ok(isReservedUsername('PEZ'), 'admin names reserved (case-insensitive)');
ok(!isReservedUsername('peteeasy'), 'normal name not reserved');
console.log(`username.verify: ${checks} checks passed`);
