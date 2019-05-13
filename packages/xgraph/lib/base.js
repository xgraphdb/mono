const uuid = require('uuid');
const Graph = require('@xgraph/core');
const q = require('@xgraph/q');
const tx = require('@xgraph/tx');

const Persister = require('./persist');

module.exports = class BaseGraph {
  constructor(dataPath) {
    this._fsLock = false;
    this._protos = {};
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

  _wrapVertex(id, edgeProps) {
    return this._wrapVertexInstance(this._graph.vertex(id), edgeProps);
  }

  createModelType(type, proto) {
    this._protos[type] = proto;
    const create = props => {
      const id = uuid();
      this.withTx(() => {
        this._graph.setVertex(id, type, props);
      });
      return this._wrapVertex(id);
    };
    create.findById = id => {
      if (this._graph.hasVertex(id)) {
        return this._wrapVertex(id);
      }
    };
    create.find = query => {
      if (!query) {
        return Array.from(
          this._graph.vertices(type).map(v => this._wrapVertexInstance(v))
        );
      }
      const { results } = this.query`(results:${q.raw(type)}${query})`;
      return results;
    };
    return create;
  }

  query(queryFragments, ...values) {
    const results = Array.isArray(queryFragments)
      ? q(this._graph)(queryFragments, ...values)
      : q(this._graph, queryFragments);
    const wrap = this._wrapVertexInstance.bind(this);
    return Object.keys(results).reduce((final, vName) => {
      final[vName] = results[vName].map(result =>
        result.id
          ? wrap(result)
          : {
              ...result,
              get origin() {
                return wrap(result.origin, result.properties);
              },
              get target() {
                return wrap(result.target, result.properties);
              },
            }
      );
      return final;
    }, {});
  }
};
