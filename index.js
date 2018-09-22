'use strict';

const cpr = require('./lib/cp.js');
const mkdirp = require('./lib/mkdirp.js');
const general = require('./lib/general.js');

module.exports = Object.assign({}, general, { cpr, mkdirp });
