const { getQStringAndState, parse, run, raw } = require('./lib');

function q(graph, query, debug) {
  const qRun = (stringFrags, ...values) => {
    const { qString, state } = getQStringAndState(stringFrags, values);
    const queries = qString.split(';').filter(Boolean);
    return queries.reduce((results, query) => {
      const steps = parse(query, state);
      return run(graph, steps, results, debug);
    }, {});
  };
  return query ? qRun([query]) : qRun;
}

q.raw = raw;
module.exports = q;
