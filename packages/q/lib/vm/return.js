const js = require('virdo');

module.exports = function update(graph, command, _, results, _) {
  const { script } = command;
  const fn = js(script);
  return fn(results, graph);
};
