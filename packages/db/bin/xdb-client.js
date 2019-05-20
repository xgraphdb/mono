const { createXQPClient } = require('@xgraph/xqp');
const { PORT } = require('../common');
const client = createXQPClient({ port: PORT });

async function main() {
  console.log(await client.execute(`
  CREATE VERTEX Person { name: 'foo' } AS foo;
  CREATE VERTEX Person { name: 'bar' } AS bar;
  CREATE EDGE friend FROM foo TO bar;
  ()-[friendships:friend]->;
  `));
  client.connection.end();
}
main();