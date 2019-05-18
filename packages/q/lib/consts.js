const EDGE = 'edge';
const VERTEX = 'vertex';
const PREFIX = `$$${Math.floor(Math.random() * 100)}`;
const isRawSymbol = Symbol('is-raw');
const raw = value => ({ value, [isRawSymbol]: true });
const isRaw = value => value && value[isRawSymbol];

module.exports = { EDGE, VERTEX, PREFIX, raw, isRaw };
