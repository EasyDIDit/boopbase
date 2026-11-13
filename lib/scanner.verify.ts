// Run: npx tsx lib/scanner.verify.ts
import assert from 'node:assert/strict';
import { isGonePath, isScannerPath } from './gone-paths';
import { BAN_HITS, BAN_MS, TempBan } from './tempBan';

let checks = 0;
const ok = (c: unknown, m: string) => { assert.ok(c, m); checks++; };

for (const p of ['/.env', '/.env.local', '/.git/config', '/.aws/credentials', '/x/.git/HEAD', '/.DS_Store', '/backup.sql', '/site.zip', '/db.sqlite', '/index.php~', '/config.php', '/wp-login.php', '/phpmyadmin', '/phpmyadmin/index.php', '/server.key', '/dump.tar.gz', '/.htaccess', '/api/.env', '/dashboard/.git/config']) {
  ok(isScannerPath(p), `scanner: ${p}`);
  ok(isGonePath(p), `gone: ${p}`);
}
for (const p of ['/', '/jane', '/jane.doe', '/pete_easy-2', '/dashboard', '/login', '/api/me', '/api/vcard/jane.doe', '/p/PEASY1', '/claim/abc', '/.well-known/apple-app-site-association', '/_next/static/chunks/a.js', '/skins/x.webp', '/terms', '/privacy', '/reset-password', '/forgot-password', '/verify-email']) {
  ok(!isScannerPath(p), `not scanner: ${p}`);
}
for (const p of ['/', '/jane', '/dashboard', '/terms', '/privacy', '/forgot-password', '/reset-password', '/verify-email']) ok(!isGonePath(p), `not gone: ${p}`);

const bans = new TempBan();
const t0 = 1_700_000_000_000;
for (let i = 1; i < BAN_HITS; i++) bans.recordScannerHit('1.2.3.4', t0 + i);
ok(!bans.isBanned('1.2.3.4', t0 + 10), `under ${BAN_HITS} hits: not banned`);
ok(bans.recordScannerHit('1.2.3.4', t0 + 20), `${BAN_HITS}th hit starts a ban`);
ok(bans.isBanned('1.2.3.4', t0 + 30), 'banned right after');
ok(!bans.isBanned('5.6.7.8', t0 + 30), 'other IPs unaffected');
ok(!bans.isBanned('1.2.3.4', t0 + 20 + BAN_MS + 1), 'ban expires');
const slow = new TempBan();
for (let i = 0; i < BAN_HITS; i++) slow.recordScannerHit('9.9.9.9', t0 + i * 11 * 60 * 1000);
ok(!slow.isBanned('9.9.9.9', t0 + BAN_HITS * 11 * 60 * 1000), 'hits spread over >10 min do not ban');
ok(!new TempBan().recordScannerHit('unknown', t0), 'unknown IP never banned');
console.log(`scanner.verify: ${checks} checks passed`);
