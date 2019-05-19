const query = require('./query');
const create = require('./create');

const commands = { query, create };

module.exports = function run(
  graph,
  command,
  state,
  results = {},
  debug = false
) {
  const commandFn = commands[command.type];
  if (commandFn) {
    commandFn(graph, command, state, results, debug);
  }
  return results;
};
