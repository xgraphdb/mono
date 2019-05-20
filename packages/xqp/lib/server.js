const net = require('net');
const msgpack = require('msgpack-lite');
const lzutf8 = require('lzutf8');
const {
  OP_ERROR,
  OP_REPLY,
  OP_REQUEST,
  uid,
  handleQMessageSocket,
  encodeQMessage,
} = require('./common');

function decodeQRequest(message) {
  if (message.opCode !== OP_REQUEST) {
    return Promise.reject(new Error('Bad opcode'));
  }
  return new Promise((resolve, reject) => {
    lzutf8.decompressAsync(
      message.messageBuffer,
      { inputEncoding: 'Buffer' },
      (payload, err) => {
        if (err) return reject(err);
        return resolve({
          ...message,
          payload,
        });
      }
    );
  });
}

function encodeQReply(responseTo, response) {
  const msgId = uid();
  const opCode = OP_REPLY;
  const messageBuffer = msgpack.encode(response);
  return encodeQMessage({ msgId, responseTo, opCode, messageBuffer });
}

function encodeQError(responseTo, errorMessage) {
  const msgId = uid();
  const opCode = OP_ERROR;
  const messageBuffer = msgpack.encode({ error: errorMessage });
  return encodeQMessage({ msgId, responseTo, opCode, messageBuffer });
}

function handleRequests(socket, onRequest, onError) {
  handleQMessageSocket(socket, async message => {
    try {
      const request = await decodeQRequest(message);
      onRequest(request);
    } catch (err) {
      onError(err);
    }
  });
}

function replyToRequests(socket, handler, onError) {
  handleRequests(
    socket,
    async request => {
      const { msgId, payload } = request;
      try {
        const reply = encodeQReply(msgId, await handler(payload));
        socket.write(reply);
      } catch (error) {
        socket.write(encodeQError(msgId, error.message));
      }
    },
    onError
  );
}

module.exports = function createXQPServer(handler) {
  const server = net.createServer(connection => {
    replyToRequests(connection, handler, error => server.emit('error', error));
  });
  return server;
};
