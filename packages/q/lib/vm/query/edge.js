const Graph = require('@xgraph/core');
const compileFilter = require('../../filter');

module.exports = function computeEdgeStep(
  graph,
  state,
  results,
  curr,
  step,
  callDelayedExecutionCallback
) {
  if (step.isRef) return results[step.varName];
  curr = curr.map(v =>
    step.out ? graph.outEdges(v[Graph.ID]) : graph.inEdges(v[Graph.ID])
  );
  if (curr.flatten) {
    curr = curr.flatten();
  } else {
    curr = curr.reduce((root, sub) => root.concat(Array.from(sub)), []);
  }
  if (step.etype) {
    curr = curr.filter(e => e.type === step.etype);
  }
  if (step.filter) {
    curr = curr.filter(compileFilter(step.filter, state, 'properties'));
  }
  if (callDelayedExecutionCallback) {
    curr = Array.from(curr);
    const refs = new Set();
    for (let { origin, target } of curr) {
      const ref = step.out ? origin : target;
      refs.add(ref);
    }
    callDelayedExecutionCallback(Array.from(refs));
  }
  if (step.varName) {
    curr = Array.from(curr);
    results[step.varName] = curr;
  }
  return curr.map(e => (step.out ? e.target : e.origin));
};
