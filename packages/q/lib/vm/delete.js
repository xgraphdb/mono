const Graph = require('@xgraph/core');

module.exports = function update(graph, command, _state, results, _debug) {
  const { varName } = command;
  const entities = results[varName];
  if (!entities) {
    throw new Error('No entities to delete');
  }
  for (let entity of entities) {
    if (entity[Graph.ID]) {
      graph.removeVertex(entity[Graph.ID]);
    } else {
      const { origin, target, type } = entity;
      graph.removeEdge(origin, target, type);
    }
  }
};
