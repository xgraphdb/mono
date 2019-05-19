const test = require('nefarious');
const Graph = require('@xgraph/core');
const q = require('.');

test.beforeEach(t => {
  const g = new Graph();
  g.setVertex('foo', 'Person', { name: 'foo', age: 20 });
  g.setVertex('bar', 'Person', { name: 'bar', age: 5 });
  g.setVertex('cat', 'Animal', { name: 'cat' });
  g.setVertex('home', 'Place', { name: 'Home' });
  g.setVertex('pt', 'Place', { name: 'Petah Tikva', tags: ['Horrible'] });
  g.setEdge('foo', 'bar', 'friend');
  g.setEdge('bar', 'foo', 'friend');
  g.setEdge('bar', 'cat', 'owns-a');
  g.setEdge('bar', 'cat', 'likes-a');
  g.setEdge('cat', 'bar', 'hates', { reason: 'meow' });
  g.setEdge('foo', 'home', 'visited', { at: Date.now() });
  g.setEdge('bar', 'home', 'visited', { at: Date.now() });
  g.setEdge('bar', 'pt', 'lives-in', { at: Date.now() });
  t.context.g = g;
});

test('bad syntax', t => {
  t.throws(() => {
    q(t.context.g)`p:Person)`;
  });
});

test('basic query', t => {
  const { p: results } = q(t.context.g)`(p:Person)`;
  t.is(results.length, 2);
});

test('basic filtered query', t => {
  const { p: results } = q(t.context.g)`(p:Person{name:"foo"})`;
  t.is(results.length, 1);
  const [foo] = results;
  t.is(foo.name, 'foo');
});

test('advanced filtered query', t => {
  const { p: results } = q(t.context.g)`(p${v => v.name.includes('a')})`;
  t.is(results.length, 3);
});

test('match against edges', t => {
  const { e: results } = q(t.context.g)`(:Person)-[e]->`;
  t.is(results.length, 7);
});

test('match against edges with type', t => {
  const { e: results } = q(t.context.g)`(:Person)-[e:visited]->`;
  t.is(results.length, 2);
  const [{ origin }] = results;
  t.is(origin.name, 'foo');
});

test('match against edges, filtered', t => {
  const { e: results } = q(t.context.g)`
  (:Person)-[e${({ properties }) => properties.at}]->
  `;
  t.is(results.length, 3);
});

test('match against full path', t => {
  const { v: results } = q(t.context.g)`
    (:Person)-->(v)
  `;
  t.is(results.length, 5);
});

test('Using raw values', t => {
  const { v: results } = q(t.context.g)`
    (:${q.raw('Person')})-->(v)
  `;
  t.is(results.length, 5);
});

test('misc queries', t => {
  const { g } = t.context;
  const { places, _steps } = q(g, null, true)`(:Person)-->(places:Place)`;
  t.is(_steps.length, 3);
  t.is(places.length, 2);
  const { visitors, visits } = q(g)`
    (:Place)<-[visits:visited]-(visitors:Person{name:"foo"})
  `;
  t.is(visits.length, 2);
  t.is(visitors.length, 1);
  const [foo] = visitors;
  t.is(foo.name, 'foo');

  const { any } = q(g)`(any)-->()`;
  t.is(any.length, Array.from(g.vertices()).length);
});

test('delayed evalution of parameters', t => {
  const { g } = t.context;
  function testScenario({ hated, haters }) {
    t.is(haters.length, 1);
    const [cat] = haters;
    t.is(cat.name, 'cat');

    t.is(hated.length, 1);
    const [bar] = hated;
    t.is(bar.name, 'bar');
  }
  testScenario(q(g)`
    (?hated)<-[:hates{reason:"meow"}]-(haters)
  `);
  testScenario(q(g)`
    (?haters)-[:hates{reason:"meow"}]->(hated)
  `);
});

test('Injecting non functions', t => {
  const { g } = t.context;
  const name = 'foo';
  const { v } = q(g)`({name:${name}})-->(v)`;
  t.is(v.length, 2);
});

test('long query', t => {
  const { g } = t.context;
  const { withFriends, haters, hated } = q(g)`
  ()-[:friend]->(withFriends:Person)
    -[:owns-a]->(haters)
    -[:hates]->(hated)
  `;
  t.is(withFriends.length, 2);
  t.is(haters.length, 1);
  const [cat] = haters;
  t.is(cat.name, 'cat');

  t.is(hated.length, 1);
  const [bar] = hated;
  t.is(bar.name, 'bar');
});

test('insecure query', t => {
  const { g } = t.context;
  t.throws(() => {
    const { _steps } = q(
      g,
      `({name: (() => {throw new Error("Why does this throw?")})()})`,
      true
    );
    console.log(_steps);
  });
});

test('weird id', t => {
  const { g } = t.context;
  g.setVertex('528853d3-bb8a-469a-91e0-edadcdc66758', 'Test');
  const { results } = q(g)`(#${q.raw(
    '528853d3-bb8a-469a-91e0-edadcdc66758'
  )})-->()-->(results)`;
  t.is(results.length, 0);
});

test('deep nested query', t => {
  const { g } = t.context;
  g.setVertex('spam', 'Document', {
    data: {
      items: [1],
    },
  });
  const { results } = q(g)`(results{data:{items:[1]}})`;
  t.is(results.length, 1);
});

const testQueryLength = (title, query, length) =>
  test(title, t => {
    const { g } = t.context;
    const { results } = q(g, query);
    t.is(results.length, length);
  });

testQueryLength(
  'advanced json filtering ($eq)',
  `(results:Person{
      age: {
        $eq: 20
      }
    })`,
  1
);

testQueryLength(
  'advanced json filtering ($ne)',
  `(results{
      age: {
        $ne: 25
      }
    })`,
  5
);

testQueryLength(
  'advanced json filtering ($gt)',
  `(results:Person{
      age: {
        $gt: 15
      }
    })`,
  1
);

testQueryLength(
  'advanced json filtering ($gte)',
  `(results:Person{
      age: {
        $gte: 5
      }
    })`,
  2
);

testQueryLength(
  'advanced json filtering ($lt)',
  `(results:Person{
      age: {
        $lt: 15
      }
    })`,
  1
);

testQueryLength(
  'advanced json filtering ($lte)',
  `(results:Person{
      age: {
        $lte: 20
      }
    })`,
  2
);

testQueryLength(
  'advanced json filtering ($in)',
  `(results:Person{
      age: {
        $in: [20, 34, 2]
      }
    })`,
  1
);

testQueryLength(
  'advanced json filtering ($nin)',
  `(results:Person{
      age: {
        $nin: [20, 34, 5]
      }
    })`,
  0
);

testQueryLength(
  'advanced json filtering ($not)',
  `(results{
      name: {
        $not: {
          $eq: "foo"
        }
      }
    })`,
  4
);

testQueryLength(
  'advanced json filtering ($and)',
  `(results{
      age: {
        $and: [{
          $gte: 5
        }, {
          $lt: 23
        }]
      }
    })`,
  2
);

testQueryLength(
  'advanced json filtering ($or)',
  `(results{
      age: {
        $or: [{
          $gt: 5
        }, {
          $lt: 18
        }]
      }
    })`,
  2
);

testQueryLength(
  'advanced json filtering ($exists)',
  `(results{
      age: {
        $exists: true
      }
    })`,
  2
);

testQueryLength(
  'advanced json filtering ($exists)',
  `(results{
      age: {
        $exists: false
      }
    })`,
  3
);

testQueryLength(
  'advanced json filtering ($size, with array)',
  `(results{
      tags: {
        $size: 1
      }
    })`,
  1
);

testQueryLength(
  'advanced json filtering ($size, with string)',
  `(results{
      name: {
        $size: 3
      }
    })`,
  3
);

testQueryLength(
  'advanced json filtering ($all, with array)',
  `(results{
      tags: {
        $all: ['Horrible']
      }
    })`,
  1
);

testQueryLength(
  'advanced json filtering ($all, with string)',
  `(results{
      name: {
        $all: 'o'
      }
    })`,
  2
);

testQueryLength(
  'advanced json filtering ($elemMatch)',
  `(results{
      tags: {
        $elemMatch: {
          $size: 8
        }
      }
    })`,
  1
);

testQueryLength('Using query with vertex id', `(#foo)-->(results)`, 2);

testQueryLength(
  'Using query with vertex id for mid step',
  `()-->(#bar)<--(results)`,
  2
);

testQueryLength(
  'Using full JSON syntax',
  `(results:Person{"name":{"$size":3}})`,
  2
);

testQueryLength('Failed xgraph query', `()-[:friend]->(results)`, 2);

test('Multiple queries', t => {
  const { p, f } = q(t.context.g)`
    (p:Person);
    (f:Person{name:"foo"});
  `;
  t.is(p.length, 2);
  t.is(f.length, 1);
});

test('Multiple queries with state', t => {
  const { visitors, visits } = q(t.context.g)`
    (visitors:Person{name:"foo"});
    (:Place)<-[visits:visited]-(&visitors);
  `;
  t.is(visits.length, 2);
  t.is(visitors.length, 1);
  const [foo] = visitors;
  t.is(foo.name, 'foo');
});

test('Create vertex basic', t => {
  const { g } = t.context;
  q(g)`CREATE VERTEX Person {
    name: 'Lolol'
  }`;
  const { l } = q(g)`(l:Person{name:'Lolol'})`;
  t.is(l.length, 1);
});

test('Create vertex named', t => {
  const { g } = t.context;
  const { lol } = q(g)`CREATE VERTEX Person {
    name: 'Lolol'
  } AS lol`;
  t.is(lol.length, 1);
});

test('Create edge', t => {
  const { g } = t.context;
  const { friendships } = q(g)`
  (people:Person);
  CREATE VERTEX Person { name: 'Lolol' } AS lol;
  CREATE EDGE friend FROM lol TO people AS friendships;
  `;
  t.is(friendships.length, 2);
});

testQueryLength(
  'Update vertex',
  `
  (foo#foo);
  update foo {
    name: "bar"
  };
  (results:Person{
    name: 'bar'
  })
`,
  2
);

testQueryLength(
  'Update edges',
  `
  ()-[friendships:friend]->;
  update friendships {
    mutual: true
  };
  ()-[results:friend{mutual:true}]->;
`,
  2
);

testQueryLength(
  'Delete vertex',
  `
  (foo#foo);
  delete foo;
  (results:Person{
    name: 'foo'
  })
`,
  0
);

testQueryLength(
  'Delete edges',
  `
  ()-[friendships:friend]->;
  delete friendships;
  ()-[results:friend]->;
`,
  0
);