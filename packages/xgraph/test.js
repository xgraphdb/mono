const path = require('path');
const rimraf = require('rimraf');
const test = require('nefarious');
const XGraph = require('.');

test.afterEach(
  t => t.context.file && new Promise(resolve => rimraf(t.context.file, resolve))
);

test('Basic model test', t => {
  const xg = new XGraph();
  const person = xg.createModelType('Person');
  const p = person({ name: 'Foo' });
  t.is(p.name, 'Foo');
  p.name = 'Bar';
  t.is(p.name, 'Bar');
  p.flush();
  t.is(p.name, 'Bar');
});

test('find by id when non exists', t => {
  const xg = new XGraph();
  const person = xg.createModelType('Person');
  t.is(person.findById('meow'));
});

test('auto flush', async t => {
  const xg = new XGraph();
  const person = xg.createModelType('Person');
  const p = person({ name: 'Foo' });
  t.is(p.name, 'Foo');
  p.name = 'Bar';
  await new Promise(resolve =>
    setImmediate(() => {
      const p2 = person.findById(p.id);
      t.is(p2.name, 'Bar');
      resolve();
    })
  );
});

test('Persist graph', async t => {
  t.context.file = path.join(__dirname, 'data', '1.data');
  const xg = new XGraph(t.context.file);
  const person = xg.createModelType('Person');
  const p = person({ name: 'Foo' });
  t.is(p.name, 'Foo');
  p.name = 'Bar';
  t.is(p.name, 'Bar');
  p.flush();
  t.is(p.name, 'Bar');
  p.name = 'Spam';
  p.flush();
  await new Promise(resolve => {
    setTimeout(() => {
      const xg2 = new XGraph(t.context.file);
      const person = xg2.createModelType('Person');
      const p2 = person.findById(p.id);
      t.is(p2.name, 'Spam');
      resolve();
    }, 50);
  });
});

test('Persist graph without data dir', async t => {
  t.context.file = path.join('.', '2.data');
  const xg = new XGraph(t.context.file);
  const person = xg.createModelType('Person');
  const p = person({ name: 'Foo' });
  t.is(p.name, 'Foo');
  p.name = 'Bar';
  t.is(p.name, 'Bar');
  p.flush();
  t.is(p.name, 'Bar');
  p.name = 'Spam';
  p.flush();
  await new Promise(resolve => {
    setTimeout(() => {
      const xg2 = new XGraph(t.context.file);
      const person = xg2.createModelType('Person');
      const p2 = person.findById(p.id);
      t.is(p2.name, 'Spam');
      resolve();
    }, 50);
  });
});

test('Some edges stuff', t => {
  const xg = new XGraph();
  const person = xg.createModelType('Person');
  const foo = person({ name: 'Foo' });
  const bar = person({ name: 'Bar' });
  const spam = person({ name: 'Spam' });
  foo.$.friends.add(bar, null, true);
  bar.$.friends.add(spam);
  const barFriends = Array.from(bar.$.friends.get());
  t.is(barFriends.length, 2);
  foo.$.friends.remove(bar, true);
  const fooFriends = Array.from(foo.$.friends.get());
  t.is(fooFriends.length, 0);
  t.is(Array.from(bar.$.friends.get()).length, 1);
  bar.$.friends.remove(spam);
  t.is(Array.from(bar.$.friends.get()).length, 0);
});

function scenario() {
  const xg = new XGraph();
  const person = xg.createModelType('Person', {
    get likeCount() {
      return Array.from(this.$.likes.get()).length;
    },
  });
  const place = xg.createModelType('Place');
  const animal = xg.createModelType('Animal');
  const foo = person({ name: 'Foo' });
  const bar = person({ name: 'Bar' });
  person({ name: 'Spam' });
  const home = place({ name: 'Home' });
  const pt = place({ name: 'Petah Tikva' });
  const cat = animal({ name: 'Mitzi' });
  foo.$.friend.add(bar);
  bar.$.friend.add(foo);
  bar.$.owns.add(cat);
  bar.$.likes.add(cat);
  foo.$.visited.add(home, { at: Date.now() });
  bar._.livesIn = pt;
  return { xg, person, place, animal };
}

const qTest = (title, query, lengths) =>
  test(title, t => {
    const { xg } = scenario();
    const results = xg.query(query);
    Object.keys(results).forEach(k => t.is(results[k].length, lengths[k]));
  });

test('querying the graph using template strings', t => {
  const { xg } = scenario();
  const { a } = xg.query`()-[:likes]->(a)`;
  t.is(a.length, 1);
});

// qTest(
//   'multiple hops test',
//   `(?withFriends)-[:friend]->(:Person)-[visits:visited]->(places)`,
//   {
//     withFriends: 1,
//     visits: 1,
//     places: 1,
//   }
// );

// test('Checking sync across instances', t => {
//   const { xg } = scenario();
//   const { a, b } = xg.query`(?a)-[:friend]->(b:Person)`;
//   const foo1 = a.find(v => v.name === 'Foo');
//   const foo2 = b.find(v => v.name === 'Foo');
//   t.isNot(foo1, null);
//   t.isNot(foo2, null);
//   foo1.age = 5;
//   foo1.isMeow = true;
//   t.is(foo1.age, 5);
//   foo1.flush();
//   t.is(foo2.age, 5);
//   t.is(foo2.isMeow, true);
// });

// test('Wrapping around edges', t => {
//   const { xg } = scenario();
//   const { friendships } = xg.query`()-[friendships:friend]->()`;
//   t.is(friendships.length, 2);
//   const fooToBar = friendships.find(fr => fr.origin.name === 'Foo');
//   t.is(fooToBar.target.name, 'Bar');
// });

// test('Backtrace property', t => {
//   const { xg } = scenario();
//   const {
//     v: [foo],
//   } = xg.query`(v:Person{name:"Foo"})`;
//   const [home] = foo.$.visited.get();
//   t.truthy(home.$backtrace.at);
// });

// test('Auto rollback of ref', t => {
//   const { xg, person } = scenario();
//   xg.withTx(() => {
//     const p = person({ name: 'Test' });
//     throw new Error();
//   });
//   const { results } = xg.query`(results:Person{name:"Test"})`;
//   t.is(results.length, 0);
// });

// test('Query a model type', t => {
//   const { person } = scenario();
//   const results = person.find({
//     name: {
//       $size: 3,
//     },
//   });
//   t.is(results.length, 2);
//   t.is(person.find().length, 3);
// });

// test('Check connection', t => {
//   const { person } = scenario();
//   const [foo, bar] = person.find({ name: { $not: 'Spam' } });
//   t.is(foo.$.friend.has(bar), true);
// });

// test('Singular connection', t => {
//   const { person } = scenario();
//   const [bar] = person.find({ name: 'Bar' });
//   const pt = bar._.livesIn;
//   t.is(pt.type, 'Place');
//   delete bar._.livesIn;
//   t.is(bar._.livesIn, null);
//   delete bar._.livesIn;
//   t.is(bar._.livesIn, null);
// });

// test('model proto', t => {
//   const { person } = scenario();
//   const [bar] = person.find({ name: 'Bar' });
//   t.is(bar.likeCount, 1);
// });
