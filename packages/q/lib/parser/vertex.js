const { VERTEX, SyntaxError } = require('../consts');
const { getFilter, filterPattern } = require('../filter');

const nodeMatcher = /\((.*)?\)/;

module.exports = function parseVertexString(vertexString, state) {
  const match = vertexString.match(nodeMatcher);
  if (!match) {
    throw new SyntaxError(`Bad vertex string: ${vertexString}`);
  }
  const node = {
    type: VERTEX,
  };
  const [, params] = match;
  if (params) {
    const [rest, filter] = params.split(filterPattern);
    let vid;
    let [vName, type] = rest.split(/:|#/);
    if (rest.includes('#')) {
      vid = type;
      type = null;
    }
    let delayed = false;
    if (vName.startsWith('?')) {
      delayed = true;
      vName = vName.substr(1);
    }
    Object.assign(node, {
      delayed,
      varName: vName || null,
    });
    if (vid) {
      Object.assign(node, { vid });
    } else {
      Object.assign(node, {
        vtype: type || null,
        filter: getFilter(filter, state),
      });
    }
  }
  return node;
};
