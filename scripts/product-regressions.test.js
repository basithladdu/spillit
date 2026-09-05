import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isValidCoord } from '../src/utils/format.js';

test('coordinates accept zero and boundary values without coercing missing input', () => {
  for (const [lat, lng] of [[0, 0], [0, 30], [45, 0], [-90, -180], [90, 180], ['12.3', '45.6']]) {
    assert.equal(isValidCoord(lat, lng), true);
  }
  for (const [lat, lng] of [[null, 30], ['', 0], [' ', 20], [undefined, 1], [true, 1], [91, 0], [0, -181], ['bad', 1], [Infinity, 0]]) {
    assert.equal(isValidCoord(lat, lng), false);
  }
});

test('unconfigured data and auth methods return service errors instead of throwing missing-method errors', async () => {
  const source = (await readFile(new URL('../src/utils/supabase.js', import.meta.url), 'utf8'))
    .replace("import { createClient } from '@supabase/supabase-js';", 'const createClient = () => { throw new Error("Unexpected configured client"); };')
    .replaceAll('import.meta.env.', '({}).');
  const { supabase } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const results = await Promise.all([
    supabase.auth.resetPasswordForEmail('local-test@example.invalid'),
    supabase.auth.updateUser({ password: 'local-test-only' }),
    supabase.from('profiles').select('*').eq('id', 'local-test').maybeSingle(),
    supabase.from('profiles').upsert({ id: 'local-test' }).select().single(),
    supabase.from('memories').select('*').not('lat', 'is', null).limit(4),
  ]);
  for (const result of results) assert.match(result.error.message, /service is unavailable/);
});
