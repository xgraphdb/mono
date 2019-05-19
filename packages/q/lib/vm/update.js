const Graph = require('@xgraph/core');

module.exports = function update(graph, command, _state, results, _debug) {
  const { varName, payload } = command;
  const entities = results[varName];
  if (!entities) {
    throw new Error('No entities to update');
  }
  for (let entity of entities) {
    if (entity[Graph.ID]) {
      graph.setVertex(entity[Graph.ID], entity[Graph.TYPE], {
        ...entity,
        ...payload,
      });
    } else {
      const { origin, target, type, properties } = entity;
      graph.setEdge(origin, target, type, { ...properties, ...payload });
    }
  }
};
