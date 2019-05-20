const { createXQPServer } = require('..');

createXQPServer(async function handleRequest(payload) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return {
    payloadLength: payload.length,
  };
})
  .on('connection', () => console.log('Connection made'))
  .on('listening', () => console.log('server listening'))
  .listen(50644);
