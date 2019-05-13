const Graph = require('@xgraph/core');

module.exports = function computeEdgeStep(
  graph,
  results,
  curr,
  step,
  callDelayedExecutionCallback
) {
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
    curr = curr.filter(step.filter);
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
