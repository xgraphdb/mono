const test = require('nefarious');
const Graph = require('./lib');

test.beforeEach(t => {
  const g = new Graph();
  g.setVertex('foo', 'Person', { name: 'foo', age: 23 });
  g.setVertex('bar', 'Person', { name: 'bar', age: 20 });
  g.setVertex('cat', 'Animal', { name: 'cat' });
  g.setVertex('home', 'Place', { name: 'Home' });
  g.setVertex('pt', 'Place', { name: 'Petah Tikva' });
  g.setEdge('foo', 'bar', 'friend');
  g.setEdge('bar', 'foo', 'friend');
  g.setEdge('bar', 'cat', 'owns-a');
  g.setEdge('bar', 'cat', 'likes-a');
  g.setEdge('foo', 'home', 'visited', { at: Date.now() });
  t.context.g = g;
});

test('has vertex', t => {
  const { g } = t.context;
  t.is(g.hasVertex('foo'), true);
  t.is(g.hasVertex('bar'), true);
  t.is(g.hasVertex('cat'), true);
  t.is(g.hasVertex('meow'), false);
});

test('get vertex', t => {
  const { g } = t.context;
  t.is(g.vertex('foo').name, 'foo');
  t.is(g.vertex('meow'), undefined);
});

test('set vertex', t => {
  const { g } = t.context;
  g.setVertex('foo', 'Person', { name: 'foo1' });
  t.is(g.vertex('foo').name, 'foo1');
  g.setVertex('lolz', 'Person');
  t.is(g.vertex('lolz')[Graph.TYPE], 'Person');
});

test('has edge', t => {
  const { g } = t.context;
  t.is(g.hasEdge('foo', 'bar', 'friend'), true);
  t.is(g.hasEdge('foo', 'bar', 'hates'), false);
  t.is(g.hasEdge('foo', 'barzor', 'hates'), false);
});

test('get edge', t => {
  const { g } = t.context;
  const { origin, target, type } = g.edge('foo', 'bar', 'friend');
  t.is(origin.name, 'foo');
  t.is(target.name, 'bar');
  t.is(type, 'friend');
  t.is(g.edge('foo', 'cat', 'lolz'), null);
  t.is(g.edge('pt', 'foo', 'meow'), null);
  t.truthy(g.edge('foo', 'home', 'visited').properties.at < Date.now());
});

test('set edge', t => {
  const { g } = t.context;
  t.is(g.hasEdge('foo', 'pt', 'visited'), false);
  t.is(g.setEdge('foo', 'pt', 'visited', { at: Date.now() }).type, 'visited');
  t.is(g.hasEdge('foo', 'pt', 'visited'), true);
  t.is(g.setEdge('foo', 'meow', 'visited'), null);
});

test('remove vertex', t => {
  const { g } = t.context;
  t.is(g.removeVertex('fox'), false);
  t.is(g.removeVertex('foo'), true);
  t.is(g.vertex('foo'), undefined);
  t.is(g.hasEdge('foo', 'bar', 'friend'), false);
  t.is(g.removeVertex('pt'), true);
});

test('remove edge', t => {
  const { g } = t.context;
  g.removeEdge('bar', 'cat', 'owns-a');
  t.is(g.hasEdge('bar', 'cat', 'owns-a'), false);
  g.removeEdge('bar', 'car', 'owns-a');
  t.is(g.hasEdge('bar', 'car', 'owns-a'), false);
  g.removeEdge('bar', 'cat', 'likes-a');
  t.is(g.hasEdge('bar', 'cat', 'likes-a'), false);
  g.removeEdge('bar', 'cat', 'likes-a');
  t.is(g.hasEdge('bar', 'cat', 'likes-a'), false);
  g.removeEdge('pt', 'cat', 'likes-a');
  t.is(g.hasEdge('pt', 'cat', 'likes-a'), false);
});

test('From Edges', t => {
  const { g } = t.context;
  t.is(Array.from(g.outEdges('pt')).length, 0);
  t.is(Array.from(g.outEdges('foo')).length, 2);
  t.throws(() => g.outEdges('meow'));
});

test('To Edges', t => {
  const { g } = t.context;
  t.is(Array.from(g.inEdges('pt')).length, 0);
  t.is(Array.from(g.inEdges('foo')).length, 1);
  t.throws(() => g.inEdges('meow'));
});

test('inter edges', t => {
  const { g } = t.context;
  t.is(Array.from(g.interEdges('bar', 'cat')).length, 2);
});

test('all edges', t => {
  const { g } = t.context;
  t.is(Array.from(g.allEdges('bar')).length, 4);
});

test('vertices', t => {
  const { g } = t.context;
  const vs = g.vertices().filter(({ name }) => name.includes('a'));
  t.is(Array.from(vs).length, 3);
  const vst = g.vertices('Person').filter(({ name }) => name.includes('a'));
  t.is(Array.from(vst).length, 1);
});

test('to & from object', t => {
  const { g } = t.context;
  g.addIndex('name');
  const bare = JSON.parse(JSON.stringify(g.toObject()));
  const g2 = Graph.fromObject(bare);
  t.truthy(g2.edge('foo', 'home', 'visited').properties.at < Date.now());
});

test('non type find by type', t => {
  const { g } = t.context;
  t.is(Array.from(g.vertices('meow')).length, 0);
});

test('Use custom index', t => {
  const { g } = t.context;
  g.addIndex('name');
  t.truthy(g.hasIndex('name'));
  t.is(Array.from(g.vertices({ name: name => name.length === 3 })).length, 3);
  const [foo] = g.vertices({ name: 'foo' });
  t.is(foo.name, 'foo');
  g.dropIndex('name');
  t.falsy(g.hasIndex('name'));
  g.addIndex('name');
  g.addIndex('age', 'Person');
  t.is(
    Array.from(
      g.vertices({
        name: name => name.length === 3,
        age: age => age && age >= 20,
      })
    ).length,
    2
  );
});

test('Complex filters', t => {
  const { g } = t.context;
  g.addIndex('age');
  const results = Array.from(
    g.vertices('Person', {
      name: {
        $all: 'a',
      },
      age: {
        $gte: 20,
      },
    })
  );
  const [bar] = results;
  t.is(results.length, 1);
  t.is(bar.name, 'bar');
  g.dropIndex('age');
  t.is(
    Array.from(
      g.vertices({
        name: {
          $all: 'a',
        },
        age: {
          $gte: 20,
        },
      })
    ).length,
    1
  );
});
