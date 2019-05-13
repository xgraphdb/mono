const { VERTEX } = require('../consts');
const computeVertexStep = require('./vertex');
const computeEdgeStep = require('./edge');

function createReducer(graph, results) {
  let delayedExecutionCallback = null;
  const setDelayedExecutionCallback = cb => {
    delayedExecutionCallback = cb;
  };
  return (curr, step) =>
    step.type === VERTEX
      ? computeVertexStep(
          graph,
          results,
          curr,
          step,
          setDelayedExecutionCallback
        )
      : computeEdgeStep(graph, results, curr, step, delayedExecutionCallback);
}

module.exports = function run(graph, steps, state = {}, debug = false) {
  if (debug) {
    state._steps = steps;
  }
  steps.reduce(createReducer(graph, state), null);
  return state;
};
