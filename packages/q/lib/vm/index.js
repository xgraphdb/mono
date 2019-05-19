const query = require('./query');
const create = require('./create');
const update = require('./update');
const delete_ = require('./delete');

const commands = { query, create, update, delete: delete_ };

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
