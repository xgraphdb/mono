const { getQStringAndState, parse, run, raw } = require('./lib');

function q(graph, query, debug) {
  const qRun = (stringFrags, ...values) => {
    const { qString, state } = getQStringAndState(stringFrags, values);
    const steps = parse(qString, state);
    return run(graph, steps, debug);
  };
  return query ? qRun([query]) : qRun;
}

q.raw = raw;
module.exports = q;
