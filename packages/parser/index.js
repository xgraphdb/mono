const nearley = require('nearley');
const grammar = require('./grammar');

const grammarObject = nearley.Grammar.fromCompiled(grammar);

const mutatorRegEx = /RETURN ((?:(?:.)|(?:\s))*)/i;

module.exports = function parse(input) {
  let mutator;
  const parser = new nearley.Parser(grammarObject);
  const mutatorMatch = input.match(mutatorRegEx);
  if (mutatorMatch) {
    mutator = mutatorMatch[1];
    input = input.replace(mutator, '');
  }
  parser.feed(input);
  const results = parser.results && parser.results[0];
  if (results) {
    return results.map(res =>
      res.type === 'return'
        ? {
            ...res,
            script: mutator,
          }
        : res
    );
  }
};
