// Run: npx tsx lib/mascot.verify.ts
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
console.log('mascot.verify: all 21 checks passed');
