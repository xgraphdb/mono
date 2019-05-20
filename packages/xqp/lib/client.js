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

function createQRequest(text) {
  const msgId = uid();
  const opCode = OP_REQUEST;
  return new Promise((resolve, reject) => {
    lzutf8.compressAsync(
      text,
      { outputEncoding: 'Buffer' },
      (messageBuffer, err) => {
        if (err) return reject(err);
        return resolve({ msgId, opCode, messageBuffer });
      }
    );
  });
}

function decodeQReply(message) {
  if (message.opCode === OP_REPLY) {
    return {
      ...message,
      payload: msgpack.decode(message.messageBuffer),
    };
  } else if (message.opCode === OP_ERROR) {
    const error = new Error(msgpack.decode(message.messageBuffer).error);
    error.responseTo = message.responseTo;
    throw error;
  } else {
    throw new Error('Bad opcode');
  }
}

function handleReplies(socket, onReply, onError) {
  handleQMessageSocket(socket, message => {
    try {
      const reply = decodeQReply(message);
      onReply(reply);
    } catch (err) {
      onError(err);
    }
  });
}

function createRequester(socket, requestTimeout) {
  const pendingRequests = new Map();
  handleReplies(
    socket,
    reply => {
      const { resolve } = pendingRequests.get(reply.responseTo);
      pendingRequests.delete(reply.responseTo);
      resolve(reply.payload);
    },
    error => {
      if (error.responseTo) {
        const { reject } = pendingRequests.get(error.responseTo);
        pendingRequests.delete(error.responseTo);
        reject(error.message);
      }
    }
  );
  return async text => {
    const request = await createQRequest(text);
    const replyPromise = new Promise((resolve, reject) =>
      pendingRequests.set(request.msgId, { resolve, reject })
    );
    const message = encodeQMessage(request);
    socket.write(message);
    return Promise.race([
      replyPromise,
      new Promise((_resolve, reject) =>
        setTimeout(reject, requestTimeout, new Error('Timout')).unref()
      ),
    ]);
  };
}

module.exports = function createXQPClient({
  host,
  port,
  requestTimeout = 30000,
}) {
  const conn = net.createConnection({
    host,
    port,
  });
  const client = createRequester(conn, requestTimeout);
  client.connection = conn;
  return client;
};
