const parse = require('@xgraph/parser');
const { getQStringAndState, run, raw } = require('./lib');

function q(graph, query, debug) {
  const qRun = (stringFrags, ...values) => {
    const { qString, state } = getQStringAndState(stringFrags, values);
    const queries = parse(qString);
    return queries.reduce((results, query) => {
      return run(graph, query, state, results, debug);
    }, {});
  };
  return query ? qRun([query]) : qRun;
}

q.raw = raw;
module.exports = q;
