const XGraph = require('@xgraph/xgraph/lib/base');

let graph = null;
process.on('message', message => {
  switch (message.type) {
    case 'INIT': {
      graph = new XGraph(message.dbPath);
      break;
    }
    case 'REQUEST': {
      const { msgId, request } = message;
      graph.withTx(({ rollback }) => {
        try {
          const results = graph.query(request);
          process.send({ type: 'REPLY', msgId, payload: results });
        } catch (err) {
          process.send({ type: 'ERROR', msgId, payload: err.message });
          rollback(err);
        }
      });
      break;
    }
  }
});
