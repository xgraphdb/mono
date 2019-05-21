CREATE VERTEX Person { name: 'foo' } AS foo;
CREATE VERTEX Person { name: 'bar' } AS bar;
CREATE EDGE friend FROM foo TO bar;
()-[friendships:friend]->;