const { VERTEX } = require('../../consts');
const createVertex = require('./vertex');
const createEdge = require('./edge');

module.exports = function create(graph, command, _state, results, _debug) {
  const { varName, entityType, payload } = command;
  const entity =
    entityType === VERTEX
      ? createVertex(graph, payload)
      : createEdge(graph, payload, results);
  if (entity && varName) {
    results[varName] = entity;
  }
};
