import test from 'node:test';
import assert from 'node:assert';
import { Meeting, User } from './entities.js';

test('Meeting entity basic CRUD', async () => {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };

  const created = await Meeting.create({ title: 'Test' });
  assert.ok(created.id);
  const fetched = await Meeting.get(created.id);
  assert.equal(fetched.title, 'Test');
  await Meeting.update(created.id, { title: 'Updated' });
  assert.equal((await Meeting.get(created.id)).title, 'Updated');
  const list = await Meeting.list();
  assert.equal(list.length, 1);
});

test('User entity supports list and filter', async () => {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };

  const u1 = await User.create({ full_name: 'Alice', organization_id: 'org1' });
  const u2 = await User.create({ full_name: 'Bob', organization_id: 'org2' });
  const all = await User.list();
  assert.equal(all.length, 2);
  const filtered = await User.filter({ organization_id: 'org1' });
  assert.deepEqual(filtered.map(u => u.id), [u1.id]);
});
