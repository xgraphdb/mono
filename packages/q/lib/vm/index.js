const query = require('./query');
const create = require('./create');
const update = require('./update');
const delete_ = require('./delete');
const return_ = require('./return');

const commands = { query, create, update, delete: delete_, return: return_ };

module.exports = function run(
  graph,
  command,
  state,
  results = {},
  debug = false
) {
  const commandFn = commands[command.type];
  if (commandFn) {
    const value = commandFn(graph, command, state, results, debug);
    if (commandFn === return_) {
      return value;
    }
  }
  return results;
};
