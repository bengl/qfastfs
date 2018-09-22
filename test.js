'use strict';

const {
  ok,
  strictEqual: eq,
  deepStrictEqual: deq
} = require('assert');
const pifall = require('pifall');
const fs = pifall(require('fs'));
const { execAsync: exec } = pifall(require('child_process'));
const path = require('path');

const {
  isdirAsync,
  copyAsync,
  mkdirAsync,
  readdirAsync,
  hasTypes,
  Wrap,
  cprAsync,
  mkdirpAsync
} = pifall(require('./index.js'));

const test = require('pitesti')({ timeout: 60000 });

test`isdir`(async () => {
  ok(await isdirAsync(__dirname));
  ok(!(await isdirAsync(__filename)));
  ok(!(await isdirAsync(path.join(__dirname, 'qafasdfasdf'))));
});

test`copy`(async () => {
  const dst = path.join(__dirname, 'copytest');
  await copyAsync(__filename, dst);
  eq(
    await fs.readFileAsync(__filename, 'utf8'),
    await fs.readFileAsync(dst, 'utf8')
  );
  await fs.unlinkAsync(dst);
});

test`mkdir`(async () => {
  const newDir = path.join(__dirname, 'testdir');
  ok(!(await isdirAsync(newDir)));
  await mkdirAsync(newDir);
  ok(await isdirAsync(newDir));
  await fs.rmdirAsync(newDir);
});

test`readdir`(async () => {
  deq(
    await fs.readdirAsync(__dirname, { withFileTypes: true }),
    await readdirAsync(__dirname)
  );
});

test`hasTypes`(async () => {
  eq(
    typeof (await readdirAsync(__dirname))[0] === 'object',
    hasTypes
  );
});

test`Wrap`(() => {
  const fn = () => {};
  const wrap = new Wrap(fn);
  eq(wrap.oncomplete, fn);
  ok(wrap instanceof process.binding('fs').FSReqWrap);
});

test`mkdirp`(async () => {
  const newDir = path.join(__dirname, 'testdir1', 'testdir2', 'testdir3');
  ok(!(await isdirAsync(newDir)));
  await mkdirpAsync(newDir);
  ok(await isdirAsync(newDir));
  await mkdirpAsync(newDir); // should work on already-made directories
  ok(await isdirAsync(newDir));
  await mkdirpAsync(newDir); // should work on existing directories
  await exec(`rm -rf ${newDir}`);
});

test`cpr`(async () => {
  const srcDir = path.join(__dirname, 'node_modules');
  const destDir = '/tmp/qfastfsdestdir';
  await exec(`rm -rf ${destDir}`);
  const srcTree = await tree(srcDir);
  await cprAsync(srcDir, destDir);
  const destTree = await tree(destDir);
  deq(srcTree, destTree);
  await exec(`rm -rf ${destDir}`);
});

test();

async function tree (dir) {
  const contents = await fs.readdirAsync(dir);
  const result = {};
  for (let i = 0; i < contents.length; i++) {
    const item = contents[i];
    if (item.startsWith('.')) {
      continue;
    }
    const fullItem = dir + '/' + item;
    const stats = await fs.statAsync(fullItem);
    if (stats.isDirectory()) {
      result[item] = await tree(fullItem);
    } else {
      result[item] = stats.size;
    }
  }
  return result;
}
