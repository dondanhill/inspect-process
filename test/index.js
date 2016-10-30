'use strict';

/* -----------------------------------------------------------------------------
 * dependencies
 * ---------------------------------------------------------------------------*/

// core
const spawn = require('child_process').spawn;
const path = require('path');
const net = require('net');

// 3rd party
const _ = require('lodash');
const assert = require('chai').assert;
const stdout = require('test-console').stdout;
const stderr = require('test-console').stderr;

// lib
const inspect = require('../lib/index');


/* -----------------------------------------------------------------------------
 * reusable
 * ---------------------------------------------------------------------------*/

const executablePath = path.resolve(__dirname, '..', 'bin', 'inspect.js');
const fixturesPath = path.resolve(__dirname, 'fixtures');

const successPath = path.resolve(fixturesPath, 'success');
const errorPath = path.resolve(fixturesPath, 'error');


/* -----------------------------------------------------------------------------
 * test
 * ---------------------------------------------------------------------------*/

describe('inspect', function () {

  before(function () {
    process.env['PATH'] += ':' + fixturesPath;
  });

  beforeEach(function () {
    this.stdout = stdout.inspect();
    this.stderr = stderr.inspect();
  });

  afterEach(function () {
    this.stdout.restore();
    this.stderr.restore();

    // mocha results are printed to stdout
    process.stdout.write(_.last(this.stdout.output));
  });

  describe('api', function () {

    it('Should resolve with success.', function () {
      return inspect(successPath);
    });

    it('Should reject with error.', function () {
      return inspect(errorPath)
        .then(() => { throw new Error('Promise was resolved') })
        .catch(() => true);
    });

    it('Should resolve files found in path.', function () {
      return inspect('success');
    });

    it('Should hide --inspect generated stderr.', function () {
      return inspect(successPath)
        .then(() => assert.equal(this.stderr.output.length, 0));
    });

    it('Should forward child process stderr.', function () {
      return inspect(errorPath)
        .then(() => { throw new Error('Promise was resolved') })
        .catch(() => assert.equal(this.stderr.output.length, 1));
    });

    it('Should forward all stdout text.', function () {
      return inspect(successPath)
        .then(() => assert.equal(this.stdout.output.length, 1));
    });

    it('Should find an open port.', function (done) {
      const server = net.createServer();
      server.listen(9229, () => inspect(successPath).then(done));
    });
  });

  describe('executable', function () {

    it('Should return with the child process success exitcode.', function (done) {
      const proc = spawn(executablePath, ['success']);

      proc.on('exit', () => {
        assert.equal(proc.exitCode, 0);
        done();
      });
    });

    it('Should return with the child process error exitcode.', function (done) {
      const proc = spawn(executablePath, ['error']);

      proc.on('exit', () => {
        assert.equal(proc.exitCode, 1);
        done();
      });
    });

    it('Should forward args.', function (done) {
      const proc = spawn(executablePath, ['success', 'overwrite']);
      let output;

      proc.stdout.on('data', (data) => output = data.toString());
      proc.on('exit', () => {
        assert.equal(output, 'overwrite');
        done();
      });
    });

  });

});