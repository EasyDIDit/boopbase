// Run: npx tsx lib/mascot.verify.ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mascotSrc, profileSetupComplete, startHereExpression, PEEK_EXPRESSIONS, type MascotPose } from './mascot';

let checks = 0;
const ok = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; };
const poses: MascotPose[] = ['1-pointing', '2-phone-card', '3-waving', '4-thumbs-up', '5-peeking'];
for (const pose of poses) {
  ok(mascotSrc(pose).includes('/clean/panther-drawn-'), 'fixed drawn style');
  ok(existsSync(resolve('public', '.' + mascotSrc(pose))), 'rendered asset exists');
}
for (const style of ['3d', 'drawn']) {
  for (const pose of [...poses, 'head']) {
    ok(existsSync(resolve(`public/mascots/poses/clean/panther-${style}-${pose}.webp`)), 'both cleaned locked sets exist');
    ok(existsSync(resolve(`public/mascots/poses/panther-${style}-${pose}.webp`)), 'legacy asset path preserved');
  }
}
const complete = { photo: '/example.webp', name: 'Example', bio: 'Example bio', socials: [{}], links: [{}] };
ok(profileSetupComplete(complete), 'all five steps complete');
for (const missing of [{ photo: null }, { name: ' ' }, { bio: ' ' }, { socials: [] }, { links: [] }]) {
  ok(!profileSetupComplete({ ...complete, ...missing }), 'every setup step is required');
}
const editor = readFileSync(resolve('app/dashboard/page.tsx'), 'utf8');
const mascot = readFileSync(resolve('components/Mascot.tsx'), 'utf8');
ok(!editor.includes('MascotStyleSwitch') && !mascot.includes('URLSearchParams'), 'no style switch or query override');
// Stage 2 mobile editor (approved 390x844 mockups): save status lives in the bottom save bar,
// no peeking panthers in the editor; the panther head is the default photo / link thumb.
ok(!editor.includes('pose="4-thumbs-up"') && editor.includes('All changes saved'), 'save bar replaces the thumbs-up toast');
ok(editor.includes('<MascotHead') && readFileSync(resolve('components/editor/LinkCard.tsx'), 'utf8').includes('<MascotHead'), 'no photo = Boop panther head');
ok(!readFileSync(resolve('components/InsightsPanel.tsx'), 'utf8').includes('Mascot'), 'no insight empty-state mascots');
ok(!/[\u{1f431}\u{1f63a}-\u{1f640}\u{1f408}]/u.test(readFileSync(resolve('lib/skins.ts'), 'utf8')), 'no yellow-cat badge');
for (const [name, v] of Object.entries(PEEK_EXPRESSIONS)) {
  ok(existsSync(resolve(`public/mascots/peek/panther-drawn-peek-${name}.webp`)), `peek ${name} asset exists`);
  ok(v.grip > 0 && v.grip < 0.25 && v.width > 0 && v.height > 0, `peek ${name} grip line sane`);
}
ok(startHereExpression(0) === 'shock' && startHereExpression(2) === 'grin' && startHereExpression(4) === 'gasp', 'start-here reacts to progress');
ok(!/peek="\w+"/.test(editor) && !editor.includes('PeekPanther'), 'mobile editor has no peeking panthers (per approved mockups)');
ok(!('tongue' in PEEK_EXPRESSIONS) && !existsSync(resolve('public/mascots/peek/panther-drawn-peek-tongue.webp')), 'tongue-out omitted');
ok(readFileSync(resolve('app/globals.css'), 'utf8').includes('prefers-reduced-motion: reduce'), 'reduced motion respected');
console.log(`mascot.verify: all ${checks} checks passed`);
