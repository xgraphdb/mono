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
  t.deepEquals(parse(`(foo{$$454Foo})`), [
    {
      type: 'query',
      value: [{ type: 'vertex', varName: 'foo', filter: 'Foo' }],
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
  t.deepEquals(parse(`()-[foo{$$3Meow}]->()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: true, filter: 'Meow' },
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
  t.deepEquals(parse(`()<-[foo{$$3Meow}]-()`), [
    {
      type: 'query',
      value: [
        { type: 'vertex' },
        { type: 'edge', varName: 'foo', out: false, filter: 'Meow' },
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
