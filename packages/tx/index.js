const Graph = require('@xgraph/core');

const noop = () => null;
const internal = Symbol('internal');

const getTxOptions = ({ onRollback = noop, onCommit = noop } = {}) => ({
  onRollback,
  onCommit,
});

const txProxyHandlers = state => {
  const logAction = (type, payload) => {
    if (state.resolved) {
      const e = new Error('Cannot mutate graph inside a resolved transaction');
      e[internal] = true;
      throw e;
    }
    state.actions.push({ type, payload });
  };
  const createMutator = (graph, label) => (...args) => {
    const payload = { args };
    switch (label) {
      case 'setVertex': {
        const [vid] = args;
        payload.vertex = graph.vertex(vid);
        break;
      }
      case 'setEdge': {
        payload.edge = graph.edge(...args);
        break;
      }
      case 'removeVertex': {
        const [vid] = args;
        payload.vertex = graph.vertex(vid);
        if (payload.vertex) {
          payload.outEdges = Array.from(graph.outEdges(vid));
          payload.inEdges = Array.from(graph.outEdges(vid));
        }
        break;
      }
      case 'removeEdge': {
        const edge = graph.edge(...args);
        if (edge) {
          payload.properties = edge.properties;
        }
        break;
      }
    }
    logAction(label, payload);
    return graph[label](...args);
  };
  return {
    get(graph, method) {
      switch (method) {
        case 'setVertex':
        case 'removeVertex':
        case 'setEdge':
        case 'removeEdge':
          return createMutator(graph, method);
        default: {
          return graph[method].bind(graph);
        }
      }
    },
  };
};

function getTxGraph(graph, state) {
  return new Proxy(graph, txProxyHandlers(state));
}

function rollbackAction(action, graph) {
  switch (action.type) {
    case 'setVertex': {
      if (action.payload.vertex) {
        const {
          [Graph.ID]: id,
          [Graph.TYPE]: type,
          ...props
        } = action.payload.vertex;
        return graph.setVertex(id, type, props);
      }
      const [vid] = action.payload.args;
      return graph.removeVertex(vid);
    }
    case 'setEdge': {
      const [origin, target, type] = action.payload.args;
      if (action.payload.edge) {
        const { properties } = action.payload.edge;
        return graph.setEdge(origin, target, type, properties);
      }
      return graph.removeEdge(origin, target, type);
    }
    case 'removeEdge': {
      if (action.payload.properties) {
        graph.setEdge(...action.payload.args, action.payload.properties);
      }
      return;
    }
    case 'removeVertex': {
      const { vertex, inEdges, outEdges } = action.payload;
      if (vertex) {
        const { [Graph.ID]: id, [Graph.TYPE]: type, ...props } = vertex;
        graph.setVertex(id, type, props);
        outEdges.forEach(
          ({ target: { [Graph.ID]: tid }, type, properties }) => {
            graph.setEdge(id, tid, type, properties);
          }
        );
        inEdges.forEach(({ origin: { [Graph.ID]: oid }, type, properties }) => {
          graph.setEdge(oid, id, type, properties);
        });
      }
      return;
    }
  }
}

module.exports = function createTransaction(
  originalGraph,
  txFunction,
  txOptions
) {
  const options = getTxOptions(txOptions);
  const state = { resolved: false, actions: [] };
  const resolver = onResolve => (...args) => {
    if (state.resolved) {
      throw new Error('A resolved transaction cannot be resolved again');
    }
    state.resolved = true;
    onResolve(...args);
  };
  const commit = resolver(options.onCommit);
  const rollback = resolver(e => {
    while (state.actions.length) {
      const lastAction = state.actions.pop();
      rollbackAction(lastAction, originalGraph);
    }
    options.onRollback(e);
  });
  const graph = getTxGraph(originalGraph, state);
  try {
    txFunction({ graph, commit, rollback });
    if (!state.resolved) {
      commit();
    }
  } catch (e) {
    if (state.resolved) {
      if (e[internal]) {
        throw e;
      }
      const err = new Error(
        'An error has occured inside of a resolved transaction'
      );
      err.originalError = e;
      throw err;
    }
    rollback(e);
  }
};
