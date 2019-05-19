const { VERTEX } = require('../../consts');
const computeVertexStep = require('./vertex');
const computeEdgeStep = require('./edge');

function createQueryReducer(graph, state, results) {
  let delayedExecutionCallback = null;
  const setDelayedExecutionCallback = cb => {
    delayedExecutionCallback = cb;
  };
  return (curr, step) =>
    step.type === VERTEX
      ? computeVertexStep(
          graph,
          state,
          results,
          curr,
          step,
          setDelayedExecutionCallback
        )
      : computeEdgeStep(
          graph,
          state,
          results,
          curr,
          step,
          delayedExecutionCallback
        );
}

module.exports = function query(graph, command, state, results, debug) {
  const steps = command.value;
  if (debug) {
    results._steps = steps;
  }
  return steps.reduce(createQueryReducer(graph, state, results), null);
};
