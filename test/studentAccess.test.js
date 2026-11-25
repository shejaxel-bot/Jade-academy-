const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '../db.js');
const accessPath = path.resolve(__dirname, '../studentAccess.js');

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const loadAccess = (execute) => {
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { execute },
  };
  delete require.cache[accessPath];
  return require('../studentAccess');
};

test('parent can access only a student linked through students.parent_id', async () => {
  let query;
  const access = loadAccess(async (sql, params) => {
    query = { sql, params };
    return [[{ id: 51 }]];
  });

  const req = { params: { id: '51' }, user: { id: 9, role: 'parent' } };
  const res = makeResponse();
  let nextCalled = false;

  await access.requireStudentAccess('id')(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.studentId, 51);
  assert.match(query.sql, /parent_id = \?/);
  assert.deepEqual(query.params, [51, 9]);
});

test('parent cannot access a student linked to a different parent', async () => {
  const access = loadAccess(async () => [[]]);
  const req = { params: { id: '51' }, user: { id: 10, role: 'parent' } };
  const res = makeResponse();
  let nextCalled = false;

  await access.requireStudentAccess('id')(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Student not found.');
});

test('own-student resolver uses students.id rather than assuming it equals users.id', async () => {
  const access = loadAccess(async (sql, params) => {
    assert.match(sql, /WHERE user_id = \?/);
    assert.deepEqual(params, [700]);
    return [[{ id: 51 }]];
  });

  const req = { params: {}, user: { id: 700, role: 'student' } };
  const res = makeResponse();
  let nextCalled = false;

  await access.resolveOwnStudentId(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.studentId, 51);
  assert.equal(req.params.id, '51');
  assert.equal(req.params.studentId, '51');
});

test('student cannot request another student ID', async () => {
  const access = loadAccess(async () => [[]]);
  const req = { params: { id: '52' }, user: { id: 700, role: 'student' } };
  const res = makeResponse();
  let nextCalled = false;

  await access.requireStudentAccess('id')(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 404);
});

test('admin bypasses ownership query after student ID validation', async () => {
  let queryCount = 0;
  const access = loadAccess(async () => { queryCount += 1; return [[]]; });
  const req = { params: { id: '51' }, user: { id: 1, role: 'admin' } };
  const res = makeResponse();
  let nextCalled = false;

  await access.requireStudentAccess('id')(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.studentId, 51);
  assert.equal(queryCount, 0);
});

test('invalid student IDs are rejected before database access', async () => {
  let queryCount = 0;
  const access = loadAccess(async () => { queryCount += 1; return [[]]; });
  const req = { params: { id: '0' }, user: { id: 9, role: 'parent' } };
  const res = makeResponse();

  await access.requireStudentAccess('id')(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(queryCount, 0);
});
