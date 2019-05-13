const iter = require('itercol');
const { ID, TYPE } = require('./common');

class Index {
  constructor(prop, type = null) {
    this._type = type;
    this._prop = prop;
    this._map = new Map();
  }

  static fromObject({ prop, index }) {
    const idx = new Index(prop);
    idx._map = new Map(index.map(([value, ids]) => [value, new Set(ids)]));
    return idx;
  }

  toObject() {
    return {
      prop: this._prop,
      index: Array.from(
        iter(this._map.entries()).map(([value, idsSet]) => [
          value,
          Array.from(idsSet),
        ])
      ),
    };
  }

  _addToIndex(value, id) {
    if (!this._map.has(value)) {
      this._map.set(value, new Set());
    }
    this._map.get(value).add(id);
  }

  _removeFromIndex(value, id) {
    if (this._map.has(value)) {
      this._map.get(value).delete(id);
      if (!this._map.get(value).size) {
        this._map.delete(value);
      }
    }
  }

  removeVertex(vertex) {
    if (!vertex) return;
    if (this._type && vertex[TYPE] !== this._type) return;
    this._removeFromIndex(vertex[this._prop], vertex[ID]);
  }

  addVertex(vertex) {
    if (!vertex) return;
    if (this._type && vertex[TYPE] !== this._type) return;
    this._addToIndex(vertex[this._prop], vertex[ID]);
  }

  validate(value, id) {
    return this._map.has(value) && this._map.get(value).has(id);
  }

  getEqIds(value) {
    return this._map.get(value) || new Set();
  }

  getIdsByPredicate(predicate) {
    const ids = new Set();
    for (let [value, valueIds] of this._map.entries()) {
      if (predicate(value)) {
        for (let id of valueIds) {
          ids.add(id);
        }
      }
    }
    return ids;
  }
}

module.exports = Index;
