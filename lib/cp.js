'use strict';

const mkdirp = require('./mkdirp.js');
const { copy, mkdir, readdir, isdir, hasTypes } = require('./general.js');
const { once } = require('./util.js');

function maybeMkdir (dir, cb) {
  mkdir(dir, (err) => {
    if (err) {
      return cb(err.code === 'EEXIST' ? null : err);
    }
    cb();
  });
}

function cprWithTypes (src, dest, _cb, useMkdir = false, dirent) {
  const cb = once(_cb);
  const errback = fn => (err, result) => err ? cb(err) : fn(result);

  const onIsdir = errback(isDir => {
    if (isDir) {
      (useMkdir ? maybeMkdir : mkdirp)(dest, errback(() => {
        readdir(src, errback(contents => {
          let toRun = contents.length;
          for (const item of contents) {
            let name = item.name;
            cprWithTypes(`${src}/${name}`, `${dest}/${name}`, errback(() => {
              if (--toRun === 0) {
                cb();
              }
            }), true, item);
          }
        }));
      }));
    } else {
      copy(src, dest, cb);
    }
  });

  if (dirent) {
    onIsdir(null, dirent.isDirectory());
  } else {
    isdir(src, onIsdir);
  }
}

function cprWithoutTypes (src, dest, _cb, useMkdir = false) {
  const cb = once(_cb);
  const errback = fn => (err, result) => err ? cb(err) : fn(result);

  isdir(src, errback(isDir => {
    if (isDir) {
      (useMkdir ? maybeMkdir : mkdirp)(dest, errback(() => {
        readdir(src, errback(contents => {
          let toRun = contents.length;
          for (const item of contents) {
            cprWithoutTypes(`${src}/${item}`, `${dest}/${item}`, errback(() => {
              if (--toRun === 0) {
                cb();
              }
            }), true);
          }
        }));
      }));
    } else {
      copy(src, dest, cb);
    }
  }));
}

module.exports = hasTypes ? cprWithTypes : cprWithoutTypes;
