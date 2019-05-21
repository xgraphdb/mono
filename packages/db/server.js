const cluster = require('cluster');
const path = require('path');
const { createXQPServer } = require('@xgraph/xqp');

module.exports = function startXGraphDBServer({ port, dbPath }) {
  cluster.setupMaster({
    exec: path.resolve(__dirname, 'worker.js'),
  });
  const worker = cluster.fork();
  const pending = new Map();
  worker
    .once('online', () => {
      worker.send({
        type: 'INIT',
        dbPath,
      });
      createXQPServer(async function(request, msgId) {
        return new Promise((resolve, reject) => {
          pending.set(msgId, { resolve, reject });
          worker.send({ type: 'REQUEST', request, msgId });
        });
      })
        .on('connection', conn => {
          console.log('Connection created');
          conn.once('close', () => console.log('Connection left'));
        })
        .once('listening', () => console.log(`XDB listening on port ${port}`))
        .listen(port);
    })
    .on('message', message => {
      switch (message.type) {
        case 'REPLY': {
          const { payload, msgId } = message;
          const { resolve } = pending.get(msgId);
          pending.delete(msgId);
          return resolve(payload);
        }
        case 'ERROR': {
          const { payload, msgId } = message;
          const { reject } = pending.get(msgId);
          pending.delete(msgId);
          return reject(new Error(payload));
        }
      }
    });
};
