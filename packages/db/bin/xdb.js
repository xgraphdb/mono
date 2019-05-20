#! /usr/bin/env node

const startXGraphDBServer = require('../server');

startXGraphDBServer({ dbPath: './hello.db' });
