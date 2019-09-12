const test = require('nefarious');
const parse = require('.');

test('Vertex', t => {
  t.deepEquals(
    parse(`()`),
    [{ type: 'query', value: [{ type: 'vertex' }] }],
    JSON.stringify(parse(`()`))
  );
  t.deepEquals(parse(`(foo)`), [
    { type: 'query', value: [{ type: 'vertex', varName: 'foo' }] },
  ]);
  t.deepEquals(parse(`(foo:Person)`), [
    {
      type: 'query',
      value: [{ type: 'vertex', varName: 'foo', vtype: 'Person' }],
    },
  ]);
  t.deepEquals(parse(`(foo#bar)`), [
    {
      type: 'query',
      value: [{ type: 'vertex', varName: 'foo', vid: 'bar' }],
    },
  ]);
  t.deepEquals(parse(`(?foo#bar)`), [
    {
      type: 'query',
      value: [{ type: 'vertex', varName: 'foo', delayed: true, vid: 'bar' }],
    },
  ]);
  t.deepEquals(parse(`(foo{name:"Hello"})`), [
    {
      type: 'query',
      value: [{ type: 'vertex', varName: 'foo', filter: { name: 'Hello' } }],
    },
  ]);
  t.deepEquals(parse(`(foo{$$454f33})`), [
    {
      type: 'query',
      value: [{ type: 'vertex', varName: 'foo', filter: 33 }],
    },
  ]);
});

test('Edge', t => {
  t.deepEquals(parse(`(foo{name:"Hello"})-->()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex', varName: 'foo', filter: { name: 'Hello' } },
        { type: 'edge', out: true },
        { type: 'vertex' },
      ],
    },
  ]);
  t.deepEquals(parse(`()-[:has-a]->`), [
    {
      type: 'query',
      value: [{ type: 'vertex' }, { type: 'edge', out: true, etype: 'has-a' }],
    },
  ]);
  t.deepEquals(parse(`(foo{name:"Hello"})-->`), [
    {
      type: 'query',
      value: [
        { type: 'vertex', varName: 'foo', filter: { name: 'Hello' } },
        { type: 'edge', out: true },
      ],
    },
  ]);
  t.deepEquals(parse(`()-[foo]->()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: true },
        { type: 'vertex' },
      ],
    },
  ]);
  t.deepEquals(parse(`()-[foo:friend]->()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: true, etype: 'friend' },
        { type: 'vertex' },
      ],
    },
  ]);
  t.deepEquals(parse(`()-[foo{$$3f1}]->()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: true, filter: 1 },
        { type: 'vertex' },
      ],
    },
  ]);

  t.deepEquals(parse(`(foo{name:"Hello"})<--()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex', varName: 'foo', filter: { name: 'Hello' } },
        { type: 'edge', out: false },
        { type: 'vertex' },
      ],
    },
  ]);
  t.deepEquals(parse(`(foo{name:"Hello"})<--`), [
    {
      type: 'query',
      value: [
        { type: 'vertex', varName: 'foo', filter: { name: 'Hello' } },
        { type: 'edge', out: false },
      ],
    },
  ]);
  t.deepEquals(parse(`()<-[foo]-()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: false },
        { type: 'vertex' },
      ],
    },
  ]);
  t.deepEquals(parse(`()<-[foo:friend]-()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: false, etype: 'friend' },
        { type: 'vertex' },
      ],
    },
  ]);
  t.deepEquals(parse(`()<-[foo{$$3f4}]-()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: false, filter: 4 },
        { type: 'vertex' },
      ],
    },
  ]);
});

test('Multiple queries', t => {
  t.deepEquals(
    parse(`
  (visitors:Person{name:";foo"});
  (:Place)<-[visits:visited]-(&visitors);
  `),
    [
      {
        type: 'query',
        value: [
          {
            type: 'vertex',
            varName: 'visitors',
            vtype: 'Person',
            filter: { name: ';foo' },
          },
        ],
      },
      {
        type: 'query',
        value: [
          { type: 'vertex', vtype: 'Place' },
          { type: 'edge', out: false, varName: 'visits', etype: 'visited' },
          { type: 'vertex', varName: 'visitors', isRef: true },
        ],
      },
    ]
  );
});

test('Create vertex', t => {
  t.deepEquals(parse('create vertex Person {name: "foo"}'), [
    {
      type: 'create',
      entityType: 'vertex',
      payload: {
        vtype: 'Person',
        properties: {
          name: 'foo',
        },
      },
      varName: null,
    },
  ]);
  t.deepEquals(parse(`create vertex Person {name: "foo"} as foo`), [
    {
      type: 'create',
      entityType: 'vertex',
      payload: {
        vtype: 'Person',
        properties: {
          name: 'foo',
        },
      },
      varName: 'foo',
    },
  ]);
});

test('Create edge', t => {
  t.deepEquals(parse(`create edge friend from foo to bar`), [
    {
      type: 'create',
      entityType: 'edge',
      payload: {
        etype: 'friend',
        properties: null,
        sourceVar: 'foo',
        targetVar: 'bar',
      },
      varName: null,
    },
  ]);
  t.deepEquals(parse(`create edge friend {foo: false} from foo to bar`), [
    {
      type: 'create',
      entityType: 'edge',
      payload: {
        etype: 'friend',
        properties: { foo: false },
        sourceVar: 'foo',
        targetVar: 'bar',
      },
      varName: null,
    },
  ]);
  t.deepEquals(parse(`create edge friend from foo to bar as friendship`), [
    {
      type: 'create',
      entityType: 'edge',
      payload: {
        etype: 'friend',
        properties: null,
        sourceVar: 'foo',
        targetVar: 'bar',
      },
      varName: 'friendship',
    },
  ]);
});

test('Update frag', t => {
  t.deepEquals(parse(`UPDATE foo { age: 20 }`), [
    { type: 'update', varName: 'foo', payload: { age: 20 } },
  ]);
});

test('Delete', t => {
  t.deepEquals(parse(`DELETE foo`), [{ type: 'delete', varName: 'foo' }]);
});

test('Parse with mutation', t => {
  const s = `({ users, friendships }) => {
      const friends = friendships.reduce(
        (map, { origin, properties }) => ({
          ...map,
          [origin.id]: properties
        }),
        {}
      );
      return users.map(user =>
        friends[user.id]
          ? {
              ...user,
              friendship: friends[user.id]
            }
          : user
      );
    }
  `;
  t.deepEquals(
    parse(`
    (users:User)-[friendships:friend]->;
    RETURN ${s}`),
    [
      {
        type: 'query',
        value: [
          { type: 'vertex', varName: 'users', vtype: 'User' },
          { type: 'edge', varName: 'friendships', out: true, etype: 'friend' },
        ],
      },
      {
        type: 'return',
        script: s,
      },
    ]
  );
});

test('Multiple variable steps with comments', t => {
  t.deepEquals(
    parse(`
  CREATE VERTEX Person { name: '//' } AS foo1;
  // CREATE VERTEX Person { name: 'foo' } AS foo1;
  CREATE EDGE friend FROM foo1 TO bar1;
  ()-[friendships:friend]->;
  `),
    [
      {
        type: 'create',
        entityType: 'vertex',
        payload: {
          vtype: 'Person',
          properties: {
            name: '//',
          },
        },
        varName: 'foo1',
      },
      {
        type: 'create',
        entityType: 'edge',
        payload: {
          etype: 'friend',
          properties: null,
          sourceVar: 'foo1',
          targetVar: 'bar1',
        },
        varName: null,
      },
      {
        type: 'query',
        value: [
          { type: 'vertex' },
          { type: 'edge', varName: 'friendships', out: true, etype: 'friend' },
        ],
      },
    ]
  );
});
