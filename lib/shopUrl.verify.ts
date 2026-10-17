// Run: npx tsx lib/shopUrl.verify.ts
import assert from 'node:assert/strict';
import { boopShopUrl, DEFAULT_BOOP_SHOP_URL } from './shopUrl';
assert.equal(boopShopUrl({}), DEFAULT_BOOP_SHOP_URL);
assert.equal(boopShopUrl({ BOOP_SHOP_URL: '  ' }), DEFAULT_BOOP_SHOP_URL);
assert.equal(boopShopUrl({ BOOP_SHOP_URL: 'https://easydidit.com/boop' }), 'https://easydidit.com/boop');
assert.equal(boopShopUrl({ BOOP_SHOP_URL: 'javascript:alert(1)' }), DEFAULT_BOOP_SHOP_URL);
assert.equal(boopShopUrl({ BOOP_SHOP_URL: 'not a url' }), DEFAULT_BOOP_SHOP_URL);
console.log('shopUrl.verify: all checks passed');
