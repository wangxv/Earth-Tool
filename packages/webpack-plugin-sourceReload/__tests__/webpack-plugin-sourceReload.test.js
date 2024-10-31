'use strict';

const webpackPluginSourceReload = require('..');
const assert = require('assert').strict;

assert.strictEqual(webpackPluginSourceReload(), 'Hello from webpackPluginSourceReload');
console.info('webpackPluginSourceReload tests passed');
