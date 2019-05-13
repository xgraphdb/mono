const { EDGE } = require('../consts');
const { getFilter, filterPattern } = require('../filter');

const nodeMatcher = /(-\[(.*?)\]?->)|(<-\[(.*?)\]?-)/;

module.exports = function parseEdgeString(edgeString, state) {
  const node = {
    type: EDGE,
    out: edgeString.endsWith('>'),
  };
  const match = edgeString.match(nodeMatcher);
  if (match) {
    const [, , p1, , p2] = match;
    const params = p1 || p2;
    const [rest, filter] = params.split(filterPattern);
    let [vName, type] = rest.split(':');
    const isRef = vName.startsWith('&');
    if (isRef) {
      vName = vName.substr(1);
    }
    Object.assign(node, {
      isRef,
      varName: vName || null,
      etype: type || null,
      filter: getFilter(filter, state, 'properties'),
    });
  }
  return node;
};
