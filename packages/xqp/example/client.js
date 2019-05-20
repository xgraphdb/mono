const { createXQPClient } = require('..');

async function main() {
  const client = createXQPClient({ port: 50644 });
  const results = await Promise.all([
    client.execute('hello'),
    client.execute('foo'),
  ]);
  console.log(results);
  client.connection.end();
}
main();
