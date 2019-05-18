const nearley = require('nearley');
const grammar = require('./grammar');

const grammarObject = nearley.Grammar.fromCompiled(grammar);

module.exports = function parse(input) {
  const parser = new nearley.Parser(grammarObject);
  parser.feed(input);
  return parser.results && parser.results[0];
};
