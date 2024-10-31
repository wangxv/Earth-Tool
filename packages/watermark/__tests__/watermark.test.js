'use strict';

const watermark = require('..');
const assert = require('assert').strict;

assert.strictEqual(watermark(), 'Hello from watermark');
console.info('watermark tests passed');
