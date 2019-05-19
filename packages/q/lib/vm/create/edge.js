const Graph = require('@xgraph/core');

module.exports = function createEdge(
  graph,
  { etype, properties, sourceVar, targetVar },
  results
) {
  properties = properties || {};
  const sources = results[sourceVar];
  const targets = results[targetVar];
  if (!sources) {
    throw new Error('No sources found');
  }
  if (!targets) {
    throw new Error('No targets found');
  }
  const edges = [];
  for (let { [Graph.ID]: source } of sources.filter(s => s[Graph.ID])) {
    for (let { [Graph.ID]: target } of targets.filter(s => s[Graph.ID])) {
      edges.push(graph.setEdge(source, target, etype, properties));
    }
  }
  return edges;
};
