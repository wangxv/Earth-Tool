'use strict';

const createPoster = require('..');
const assert = require('assert').strict;

assert.strictEqual(createPoster(), 'Hello from createPoster');
console.info('createPoster tests passed');
