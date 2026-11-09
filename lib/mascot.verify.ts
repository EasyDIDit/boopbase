// Run: npx tsx lib/mascot.verify.ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { allowMascotPreview, mascotSrc, mascotStyle, type MascotPose } from './mascot';

assert.equal(mascotStyle('', true), '3d');
assert.equal(mascotStyle('?mascot=3d', true), '3d');
assert.equal(mascotStyle('?mascot=drawn', true), 'drawn');
assert.equal(mascotStyle('?other=value&mascot=drawn', true), 'drawn');
assert.equal(mascotStyle('?mascot=unknown', true), '3d');
assert.equal(mascotStyle('?mascot=drawn', false), '3d');
assert.equal(allowMascotPreview('production', 'production'), false);
assert.equal(allowMascotPreview('production', 'development'), false);
assert.equal(allowMascotPreview(undefined, 'production'), false);
assert.equal(allowMascotPreview('preview', 'production'), true);
assert.equal(allowMascotPreview(undefined, 'development'), true);
const poses: MascotPose[] = ['1-pointing', '2-phone-card', '3-waving', '4-thumbs-up', '5-peeking'];
for (const style of ['3d', 'drawn'] as const) {
  for (const pose of poses) {
    assert.ok(existsSync(resolve('public', '.' + mascotSrc(style, pose))), `${style} ${pose} asset exists`);
  }
}
for (const style of ['3d', 'drawn']) {
  assert.ok(existsSync(resolve('public/mascots/poses', `panther-${style}-head.webp`)), `${style} head exists`);
}
const skins = readFileSync(resolve('lib/skins.ts'), 'utf8');
assert.ok(!/[\u{1f431}\u{1f63a}-\u{1f640}\u{1f408}]/u.test(skins), 'no yellow-cat emoji in skin configuration');
const editor = readFileSync(resolve('app/dashboard/page.tsx'), 'utf8');
assert.equal((editor.match(/<FieldTip[^>]*pose=/g) || []).length, 7, 'all seven editor tips retain a speaker pose');
console.log('mascot.verify: all 25 checks passed');
