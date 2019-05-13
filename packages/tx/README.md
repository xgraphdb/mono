# graph-tx

Isolated Transactions for the @xgraph/core graph

## Usage

```js
const createTransaction = require('graph-tx');
const g = require('./graph');
const tx = createTransaction.bind(null, g);

tx(({ graph, commit }) => {
  graph.setVertex(...);
  commit(); // mark tx as done
});

tx(({ graph }) => {
  graph.setVertex(...);
  // auto commit on successful termination of transaction
});

tx(({ graph, rollback }) => {
  graph.setVertex(...);
  rollback(); // rollback changes and mark as done
});

tx(({ graph }) => {
  graph.setVertex(...);
  throw new Error(); // auto rollback on errors
});

tx(({ graph, commit, rollback }) => {
  // do stuff
}, {
  onCommit() {
    // do stuff after commit
  },
  onRollback(err) {
    // do stuff after rollback
  }
});
```
