const { randomBytes } = require('crypto');

const uid = () => randomBytes(16).toString('hex');

module.exports = function createVertex(graph, { vtype, properties }) {
  const vid = uid();
  graph.setVertex(vid, vtype, properties);
  return [graph.vertex(vid)];
};
