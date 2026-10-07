'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const SERVER = path.join(__dirname, '..', 'mcp-server', 'server.js');

/** Start the server, send messages, collect replies by id. */
function session() {
  const child = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  let buf = '';
  let stderr = '';
  child.stdout.on('data', d => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      const p = pending.get(msg.id);
      if (p) { pending.delete(msg.id); p(msg); }
    }
  });
  child.stderr.on('data', d => { stderr += d; });
  let nextId = 1;
  return {
    call(method, params) {
      const id = nextId++;
      return new Promise(resolve => {
        pending.set(id, resolve);
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      });
    },
    notify(method, params) { child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n'); },
    raw(s) { child.stdin.write(s + '\n'); },
    stderr: () => stderr,
    close() { child.stdin.end(); return new Promise(r => child.on('exit', r)); }
  };
}

test('handshake, tool list and every tool answers', async () => {
  const s = session();
  const init = await s.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  assert.strictEqual(init.result.protocolVersion, '2025-06-18');
  assert.strictEqual(init.result.serverInfo.name, 'md3-expressive');
  s.notify('notifications/initialized');

  const list = await s.call('tools/list');
  const names = list.result.tools.map(t => t.name).sort();
  assert.deepStrictEqual(names, ['build_stylesheet', 'check_contrast', 'get_checklist', 'get_component', 'get_tokens', 'get_type_role', 'lint_markup', 'list_components']);
  for (const t of list.result.tools) assert.strictEqual(t.inputSchema.type, 'object');

  const call = async (name, args) => (await s.call('tools/call', { name, arguments: args })).result;

  const css = await call('get_tokens', {});
  assert.ok(css.content[0].text.includes('--md-primary'));

  const type = await call('get_type_role', { purpose: 'dialog body' });
  assert.ok(type.content[0].text.includes('body-medium'));

  const comps = JSON.parse((await call('list_components', {})).content[0].text);
  assert.ok(comps.find(c => c.id === 'dialog'));

  const dlg = await call('get_component', { id: 'dialog', parts: ['html'] });
  assert.ok(dlg.content[0].text.includes('<dialog'));

  const sheet = await call('build_stylesheet', { components: ['dialog'] });
  assert.ok(sheet.content[0].text.includes('.md-dialog') && sheet.content[0].text.includes('.md-btn'));

  const lintRes = await call('lint_markup', { source: '<button><span class="md-icon">menu</span></button>' });
  assert.ok(lintRes.content[0].text.includes('a11y-button-name'));

  const c = JSON.parse((await call('check_contrast', { foreground: '#000', background: '#fff' })).content[0].text);
  assert.strictEqual(c.ratio, 21);

  const cl = JSON.parse((await call('get_checklist', { surface: 'dialog' })).content[0].text);
  assert.ok(cl.checklist.length > 10 && cl.focus.includes('a11y'));

  await s.close();
  assert.strictEqual(s.stderr(), '');
});

test('errors come back as tool errors, not crashes', async () => {
  const s = session();
  await s.call('initialize', { protocolVersion: '2025-06-18' });
  const bad = (await s.call('tools/call', { name: 'get_component', arguments: { id: 'nope' } })).result;
  assert.strictEqual(bad.isError, true);
  assert.ok(bad.content[0].text.includes('Unknown component'));
  const badColor = (await s.call('tools/call', { name: 'check_contrast', arguments: { foreground: 'red', background: '#fff' } })).result;
  assert.strictEqual(badColor.isError, true);
  const unknown = (await s.call('tools/call', { name: 'nope', arguments: {} })).result;
  assert.strictEqual(unknown.isError, true);
  const noMethod = await s.call('does/not/exist');
  assert.strictEqual(noMethod.error.code, -32601);
  s.raw('{ not json');
  const ping = await s.call('ping');
  assert.deepStrictEqual(ping.result, {});
  await s.close();
});

test('an unknown protocol version falls back to a supported one', async () => {
  const s = session();
  const init = await s.call('initialize', { protocolVersion: '1999-01-01' });
  assert.ok(['2025-06-18', '2025-03-26', '2024-11-05'].includes(init.result.protocolVersion));
  await s.close();
});
