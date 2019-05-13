const test = require('nefarious');
const Graph = require('@xgraph/core');
const tx = require('.');

test.beforeEach(t => {
  const g = new Graph();
  g.setVertex('foo', 'Person', { name: 'foo' });
  g.setVertex('bar', 'Person', { name: 'bar' });
  g.setVertex('cat', 'Animal', { name: 'cat' });
  g.setVertex('home', 'Place', { name: 'Home' });
  g.setVertex('pt', 'Place', { name: 'Petah Tikva' });
  g.setEdge('foo', 'bar', 'friend');
  g.setEdge('bar', 'foo', 'friend');
  g.setEdge('bar', 'cat', 'owns-a');
  g.setEdge('bar', 'cat', 'likes-a');
  g.setEdge('cat', 'bar', 'hates', { reason: 'meow' });
  g.setEdge('foo', 'home', 'visited', { at: Date.now() });
  g.setEdge('bar', 'pt', 'lives-in', { at: Date.now() });
  t.context.g = g;
});

const gTest = (title, scenario) =>
  test(title, t => {
    const { g } = t.context;
    let callCount = 0;
    const scenarioWithTest = txParams => {
      scenario(t, txParams);
      callCount++;
    };
    tx(g, scenarioWithTest);
    t.is(callCount, 1, 'tx function was not called');
  });

gTest('Basic tx with commit works', (t, { graph, commit }) => {
  graph.setVertex('meow', 'Animal', { name: 'Mitzi' });
  t.is(graph.hasVertex('meow'), true);
  commit();
  t.is(graph.hasVertex('meow'), true);
});

gTest(
  'A transaction cannot be resolved twice',
  (t, { graph, commit, rollback }) => {
    graph.setVertex('meow', 'Animal', { name: 'Mitzi' });
    t.is(graph.hasVertex('meow'), true);
    commit();
    t.throws(commit);
    t.throws(rollback);
  }
);

test('A non-throwing function auto commits', t => {
  let callCount = 0;
  tx(
    t.context.g,
    () => {
      callCount++;
    },
    {
      onCommit() {
        callCount++;
      },
    }
  );
  t.is(callCount, 2);
});

test('A throwing function rollsback', t => {
  let callCount = 0;
  const e = new Error();
  tx(
    t.context.g,
    () => {
      callCount++;
      throw e;
    },
    {
      onRollback(err) {
        t.is(e, err);
        callCount++;
      },
    }
  );
  t.is(callCount, 2);
});

test('Throwing inside a resolved tx throws for real', t => {
  t.throws(
    () =>
      tx(t.context.g, ({ commit }) => {
        commit();
        throw new Error();
      }),
    'An error has occured inside of a resolved transaction'
  );
});

test('Mutating the graph inside of a resolved transaction throws', t => {
  t.throws(
    () =>
      tx(t.context.g, ({ graph, commit }) => {
        commit();
        graph.setVertex('meow', 'Animal', { name: 'Mitzi' });
      }),
    'Cannot mutate graph inside a resolved transaction'
  );
});

gTest('Rollback (setVertex)', (t, { graph, rollback }) => {
  graph.setVertex('meow', 'Animal', { name: 'Mitzi' });
  t.is(graph.hasVertex('meow'), true);
  rollback();
  t.is(graph.hasVertex('meow'), false);
});

gTest('Rollback (setVertex) on existing vertex', (t, { graph, rollback }) => {
  graph.setVertex('cat', 'Animal', { name: 'Mitzi' });
  t.is(graph.vertex('cat').name, 'Mitzi');
  rollback();
  t.is(graph.vertex('cat').name, 'cat');
});

gTest('Rollback (removeVertex)', (t, { graph, rollback }) => {
  graph.removeVertex('cat');
  t.is(graph.hasVertex('cat'), false);
  rollback();
  t.is(graph.hasVertex('cat'), true);
  t.is(graph.hasEdge('cat', 'bar', 'hates'), true);
});

gTest(
  'Rollback (removeVertex) on no vertex does nothing',
  (t, { graph, rollback }) => {
    graph.removeVertex('cat1');
    t.is(graph.hasVertex('cat1'), false);
    rollback();
    t.is(graph.hasVertex('cat1'), false);
  }
);

gTest('Rollback (setEdge)', (t, { graph, rollback }) => {
  graph.setEdge('cat', 'home', 'likes');
  t.is(graph.hasEdge('cat', 'home', 'likes'), true);
  rollback();
  t.is(graph.hasEdge('cat', 'home', 'likes'), false);
});

gTest('Rollback (setEdge) on existing edge', (t, { graph, rollback }) => {
  graph.setEdge('cat', 'bar', 'hates', { reason: 'brrr' });
  t.is(graph.hasEdge('cat', 'bar', 'hates'), true);
  rollback();
  t.is(graph.hasEdge('cat', 'bar', 'hates'), true);
  t.is(graph.edge('cat', 'bar', 'hates').properties.reason, 'meow');
});

gTest('Rollback (removeEdge)', (t, { graph, rollback }) => {
  graph.removeEdge('cat', 'bar', 'hates');
  t.is(graph.hasEdge('cat', 'bar', 'hates'), false);
  rollback();
  t.is(graph.hasEdge('cat', 'bar', 'hates'), true);
  t.is(graph.edge('cat', 'bar', 'hates').properties.reason, 'meow');
});

gTest('Rollback (removeEdge) when no edge exists', (t, { graph, rollback }) => {
  graph.removeEdge('cat', 'foo', 'hates');
  t.is(graph.hasEdge('cat', 'foo', 'hates'), false);
  rollback();
  t.is(graph.hasEdge('cat', 'foo', 'hates'), false);
});

gTest('Rollback multiple actions', (t, { graph, rollback }) => {
  graph.setEdge('cat', 'home', 'likes');
  graph.setVertex('meow', 'Animal', { name: 'Mitzi' });
  graph.setVertex('bed', 'Place');
  graph.setEdge('cat', 'meow', 'likes');
  graph.setEdge('meow', 'bed', 'likes');
  t.is(graph.hasEdge('cat', 'home', 'likes'), true);
  t.is(graph.hasEdge('cat', 'meow', 'likes'), true);
  t.is(graph.hasEdge('meow', 'bed', 'likes'), true);
  rollback();
  t.is(graph.hasVertex('meow'), false);
  t.is(graph.hasVertex('bed'), false);
  t.is(graph.hasEdge('cat', 'home', 'likes'), false);
});
