const { VERTEX } = require('../consts');
const computeVertexStep = require('./query/vertex');
const computeEdgeStep = require('./query/edge');

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

module.exports = function run(
  graph,
  command,
  state,
  results = {},
  debug = false
) {
  const steps = command.value;
  if (debug) {
    results._steps = steps;
  }
  if (command.type === 'query') {
    steps.reduce(createQueryReducer(graph, state, results), null);
  }
  return results;
};
