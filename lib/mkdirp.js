'use strict';

const { dirname } = require('path');
const { mkdir } = require('./general.js');

const cache = new Map();

module.exports = function mkdirp (dir, cb) {
  if (cache.has(dir)) {
    return cache.get(dir).then(cb, cb);
  }
  let finish;
  cache.set(dir, new Promise((resolve, reject) => {
    finish = e => {
      cb(e);
      (e ? reject : resolve)(e);
    };
  }));
  mkdir(dir, err => {
    if (err) {
      if (err.code === 'ENOENT') {
        mkdirp(dirname(dir), e => e ? finish(e) : mkdir(dir, finish));
      } else {
        // We should check if it's a directory, but since we're in control of
        // all of these files anyway, just move along if it exists.
        finish(err.code === 'EEXIST' ? undefined : err);
      }
    } else {
      finish();
    }
  });
};
