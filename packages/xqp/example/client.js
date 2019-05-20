const { createXQPClient } = require('..');

async function main() {
  const request = createXQPClient({ port: 50644 });
  const results = await Promise.all([request('hello'), request('foo')]);
  console.log(results);
  request.connection.end();
}
 main();