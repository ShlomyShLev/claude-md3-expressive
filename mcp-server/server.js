#!/usr/bin/env node
'use strict';

/**
 * Claude MD3 Expressive MCP server.
 *
 * A zero-dependency JSON-RPC 2.0 server over stdio (one JSON message per line), implementing the
 * parts of the Model Context Protocol that tools need: initialize, ping, tools/list, tools/call.
 * Nothing is written to stdout except protocol messages; diagnostics go to stderr.
 */

const readline = require('readline');
const { tools, callTool } = require('./lib/tools');

const SERVER_INFO = { name: 'md3-expressive', version: require('../package.json').version };
const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05'];

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function reply(id, result) { send({ jsonrpc: '2.0', id, result }); }
function fail(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }

function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;

  switch (method) {
    case 'initialize': {
      const wanted = params && params.protocolVersion;
      reply(id, {
        protocolVersion: SUPPORTED.includes(wanted) ? wanted : SUPPORTED[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'MD3 Expressive design kit. Call get_checklist before building UI, get_component for ready-made ' +
          'markup and CSS, get_type_role to choose a text style, lint_markup on what you wrote, ' +
          'and check_contrast for any color pair that is not a token pair.'
      });
      return;
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return;
    case 'ping':
      if (isRequest) reply(id, {});
      return;
    case 'tools/list':
      reply(id, { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
      return;
    case 'tools/call': {
      const name = params && params.name;
      try {
        reply(id, callTool(name, (params && params.arguments) || {}));
      } catch (err) {
        reply(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
      }
      return;
    }
    default:
      if (isRequest) fail(id, -32601, `Method not found: ${method}`);
  }
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', line => {
  const text = line.trim();
  if (!text) return;
  let msg;
  try { msg = JSON.parse(text); } catch {
    fail(null, -32700, 'Parse error');
    return;
  }
  try { handle(msg); } catch (err) {
    process.stderr.write(`md3-expressive: ${err.stack}\n`);
    if (msg && msg.id !== undefined) fail(msg.id, -32603, 'Internal error');
  }
});
rl.on('close', () => process.exit(0));
