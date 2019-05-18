const { PREFIX, isRaw } = require('./consts');

const newLinesAndBuffers = /\s*\n+\s*/g;

module.exports = function getQStringAndState(stringFrags, values) {
  const state = {};
  const qString = stringFrags
    .reduce((str, frg, idx) => {
      let value = values[idx - 1];
      if (typeof value === 'function') {
        const v = PREFIX + 'f' + idx;
        state[idx] = value;
        value = `{${v}}`;
      } else {
        value = isRaw(value) ? value.value : JSON.stringify(value);
      }
      return str + value + frg;
    })
    .trim()
    .replace(newLinesAndBuffers, '');
  return { state, qString };
};
