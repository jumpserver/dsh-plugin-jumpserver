import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Agent } from 'undici';
import { setupConnection } from '../lib/cli.js';
import { JumpServerManager } from '../lib/manager.js';
import { StateStore } from '../lib/store.js';
import { provider } from './fixtures/provider.js';

test('self-signed HTTPS is opt-in, limited to the configured origin and reversible', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'jumpserver-tls-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1', '-keyout', 'key.pem', '-out', 'cert.pem'],
    { cwd: dir, stdio: 'ignore' });
  const tls = { key: await readFile(join(dir, 'key.pem')), cert: await readFile(join(dir, 'cert.pem')) };
  const site = await provider({ tls, files: true });
  const other = await provider({ tls });
  t.after(() => Promise.all([site.close(), other.close()]));
  const store = new StateStore(join(dir, 'state.json'));
  const manager = new JumpServerManager({ store });
  t.after(() => manager.dispose());
  const url = site.base + '/koko/mcp';
  const row = await manager.add({ url });
  assert.equal(row.skipTlsVerify, false);
  await store.transaction(({ connection }) => { delete connection.skipTlsVerify; }); // pre-option state
  const untrusted = error => error.cause?.code === 'DEPTH_ZERO_SELF_SIGNED_CERT';
  await assert.rejects(manager.authorize(row.id), untrusted);

  // The browser trusts the test certificate independently of the plugin.
  const browser = new Agent({ connect: { ca: tls.cert } });
  t.after(() => browser.destroy());
  const onAuthorize = async link => {
    const consent = await fetch(link, { dispatcher: browser, redirect: 'manual' });
    const callback = await fetch(consent.headers.get('location'));
    assert.equal(callback.status, 200);
    await callback.text();
  };
  assert.equal((await setupConnection(url, { store, skipTlsVerify: true, onAuthorize })).status, 'connected');
  assert.equal((await manager.status()).skipTlsVerify, true);
  await manager.start();
  assert.equal((await manager.status()).status, 'connected');
  await manager.oauth.token(row.id, { force: true });
  assert.equal(site.state.refreshes, 1);
  const download = await manager.call(row.id, 'file_read', {
    operation: 'download', session_id: 'file-session', remote_path: '/fixture.bin', idempotency_key: 'one-download',
  });
  const file = await manager.oauth.fileFetch(row.id, 'download', { headers: download.structuredContent.transfer.headers });
  assert.equal(file.status, 200);
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), site.state.fileBytes);
  assert.equal(site.state.fileHeaders.authorization, 'Bearer ' + site.state.access);
  await manager.logout(row.id);
  assert.equal(site.state.revoked, true);

  site.state.resourceMetadataUrl = other.base + '/.well-known/oauth-protected-resource/koko/mcp';
  await assert.rejects(manager.authorize(row.id), untrusted);
  delete site.state.resourceMetadataUrl;
  await assert.rejects(fetch(url), untrusted);
  await manager.update(row.id, { skipTlsVerify: false });
  await assert.rejects(manager.authorize(row.id), untrusted);
  await assert.rejects(manager.update(row.id, { skipTlsVerify: 'false' }), { code: 'invalid_tls_setting' });
  await manager.update(row.id, { skipTlsVerify: true });
  assert.equal((await manager.update(row.id, { url: other.base })).skipTlsVerify, false);
});
