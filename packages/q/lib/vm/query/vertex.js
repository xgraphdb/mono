const Graph = require('@xgraph/core');
const compileFilter = require('../../filter')

module.exports = function computeVertexStep(
  graph,
  state,
  results,
  curr,
  step,
  setDelayedExecutionCallback
) {
  if (step.isRef) return results[step.varName];
  if (!curr) {
    curr = step.vid
      ? [graph.vertex(step.vid)].filter(Boolean)
      : graph.vertices(step.vtype);
  } else {
    const refs = new WeakSet();
    curr = curr.filter(v => {
      if (step.vid) {
        return v[Graph.ID] === step.vid;
      }
      if (refs.has(v)) {
        return false;
      }
      refs.add(v);
      return step.vtype ? v[Graph.TYPE] === step.vtype : true;
    });
  }
  if (step.filter) {
    curr = curr.filter(compileFilter(step.filter, state));
  }
  if (step.varName) {
    if (step.delayed) {
      setDelayedExecutionCallback(vertices => {
        results[step.varName] = vertices;
      });
    } else {
      curr = Array.from(curr);
      results[step.varName] = curr;
    }
  }
  return curr;
};
