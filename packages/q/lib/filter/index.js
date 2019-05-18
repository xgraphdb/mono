const compileFilter = require('monjo');

function getFilter(filter, state, expand) {
  if (!filter) return null;
  if (typeof filter === 'number') {
    return state[filter];
  }
  if (expand) {
    filter = {
      [expand]: filter,
    };
  }
  return compileFilter(filter);
}

module.exports = getFilter;
