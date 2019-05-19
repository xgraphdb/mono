const Graph = require('@xgraph/core');
const q = require('@xgraph/q');
const tx = require('@xgraph/tx');

const Persister = require('./persist');

module.exports = class BaseGraph {
  constructor(dataPath) {
    this.__graph = null;
    if (dataPath) {
      this._persister = new Persister(dataPath);
    }
    const data = this._persister && this._persister.readJSON();
    if (data) {
      this._graph = Graph.fromObject(data);
    } else {
      this._graph = new Graph();
    }
  }

  _persist() {
    if (this._persister) {
      this._persister.writeJSON(this._graph.toObject());
    }
  }

  withTx(cb) {
    if (this.__graph) {
      return cb();
    }
    this.__graph = this._graph;
    tx(
      this._graph,
      ({ graph }) => {
        this._graph = graph;
        cb();
      },
      {
        onCommit: () => {
          this._graph = this.__graph;
          this.__graph = null;
          this._persist();
        },
        onRollback: () => {
          this._graph = this.__graph;
          this.__graph = null;
        },
      }
    );
  }

  query(queryFragments, ...values) {
    return Array.isArray(queryFragments)
      ? q(this._graph)(queryFragments, ...values)
      : q(this._graph, queryFragments);
  }
};
