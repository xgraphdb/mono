#! /usr/bin/env node
const fs = require('fs');
const yargs = require('yargs');
const { createXQPClient } = require('@xgraph/xqp');
const { PORT } = require('../common');

function parseArguments() {
  const {
    argv: { port, host, timeout, script },
  } = yargs
    .usage('Usage: xdbc [...options] <xql script file>')

    .default('port', PORT)
    .default('host', 'localhost')
    .default('timeout', 30)

    .describe('port', 'XDB Server port')
    .describe('host', 'XDB Server host')
    .describe('timeout', 'Timeout for script (in seconds)')

    .check(opts => {
      const {
        _: [file],
      } = opts;
      if (!file) {
        throw new Error('XQL script file is required');
      }
      const script = fs.readFileSync(file, { encoding: 'utf8' });
      opts.script = script;
      return true;
    });
  return { port, host, timeout, script };
}

const { port, host, timeout, script } = parseArguments();
const client = createXQPClient({ port, host, requestTimeout: timeout * 1000 });

async function main() {
  try {
    const results = await client.execute(script);
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    client.connection.end();
  }
}
main();
