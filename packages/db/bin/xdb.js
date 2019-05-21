#! /usr/bin/env node
const yargs = require('yargs');
const { PORT } = require('../common');
const startXGraphDBServer = require('../server');

function parseArguments() {
  const {
    argv: { port, data },
  } = yargs
    .usage('Usage: xdb [...options]')
    .demandOption(['data'])

    .default('port', PORT)

    .describe('port', 'Server port to listen to')
    .describe('data', 'Path to db file');
  return { data, port };
}
const { port, data } = parseArguments();
startXGraphDBServer({ dbPath: data, port });
