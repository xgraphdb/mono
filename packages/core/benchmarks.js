const Graph = require('.');

const benchmark = (label, cb) => {
  console.time(label);
  cb();
  console.timeEnd(label);
};

function setupGraph(g) {
  Array.from({ length: 199999 }).forEach((_, idx) =>
    g.setVertex(`v${idx}`, 'Number', { x: idx })
  );
  g.setVertex('foo', 'Person', { name: 'foo' });
  g.setVertex('bar', 'Person', { name: 'bar' });
  g.setVertex('cat', 'Animal', { name: 'cat' });
  Array.from({ length: 199999 }).forEach((_, idx) =>
    g.setVertex(`v${idx}_1`, 'Number', { x: idx })
  );
  g.setVertex('home', 'Place', { name: 'Home' });
  g.setVertex('pt', 'Place', { name: 'Petah Tikva' });
  Array.from({ length: 199999 }).forEach((_, idx) =>
    g.setVertex(`v${idx}_2`, 'Number', { x: idx })
  );
  g.setEdge('foo', 'bar', 'friend');
  g.setEdge('bar', 'foo', 'friend');
  g.setEdge('bar', 'cat', 'owns-a');
  Array.from({ length: 199999 }).forEach((_, idx) =>
    g.setVertex(`v${idx}_3`, 'Number', { x: idx })
  );
  g.setEdge('bar', 'cat', 'likes-a');
  g.setEdge('foo', 'home', 'visited', { at: Date.now() });
  Array.from({ length: 199999 }).forEach((_, idx) =>
    g.setVertex(`v${idx}_4`, 'Number', { x: idx })
  );
}

const g = new Graph();
const gx = new Graph();

console.log(`Benchmarks for 1000000 vertices:`);

benchmark('Setup [no initial Index]', () => setupGraph(g));

benchmark('Setup [with initial index]', () => {
  gx.addIndex('x');
  setupGraph(gx);
});

benchmark(
  'Querying over all vertices, 50 times [no index, no type annotation, monjo syntax]',
  () => {
    for (let i = 0; i < 50; i++) {
      Array.from(g.vertices({ x: 3 }));
    }
  }
);

benchmark(
  'Querying over all vertices, 50 times [no index, with type annotation, monjo syntax]',
  () => {
    for (let i = 0; i < 50; i++) {
      Array.from(g.vertices('Number', { x: 3 }));
    }
  }
);

benchmark(
  'Querying over all vertices, 50 times [no index, no type annotation, classic filter]',
  () => {
    for (let i = 0; i < 50; i++) {
      Array.from(g.vertices().filter(({ x }) => x === 3));
    }
  }
);

benchmark(
  'Querying over all vertices, 50 times [no index, with type annotation, classic filter]',
  () => {
    for (let i = 0; i < 50; i++) {
      Array.from(g.vertices('Number').filter(({ x }) => x === 3));
    }
  }
);

benchmark('Creating an index for all vertices', () => g.addIndex('x'));

benchmark(
  'Querying over all vertices, 50 times [with index, no type annotation]',
  () => {
    for (let i = 0; i < 50; i++) {
      Array.from(g.vertices({ x: 3 }));
    }
  }
);

benchmark(
  'Querying over all vertices, 50 times [with index, with type annotation]',
  () => {
    for (let i = 0; i < 50; i++) {
      Array.from(g.vertices('Number', { x: 3 }));
    }
  }
);
