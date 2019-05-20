const { randomBytes } = require('crypto');

const OP_REQUEST = 0;
const OP_REPLY = 1;
const OP_ERROR = 2;

const uid = () => randomBytes(4).readUInt32LE(0);

function decodeQHeader(dataBuffer) {
  const length = dataBuffer.readUInt32LE(0);
  const msgId = dataBuffer.readUInt32LE(4);
  const responseTo = dataBuffer.readUInt32LE(8);
  const opCode = dataBuffer.readUInt8(12);
  const messageBuffer = dataBuffer.slice(13);
  return {
    length,
    msgId,
    responseTo,
    opCode,
    messageBuffer,
  };
}

function handleQMessageSocket(socket, onMessage) {
  let state = null;
  socket.on('data', chunk => {
    if (!state) {
      state = decodeQHeader(chunk);
    } else {
      state.messageBuffer = Buffer.concat([state.messageBuffer, chunk]);
    }
    const isDone = state.messageBuffer.length === state.length;
    if (isDone) {
      const message = state;
      state = null;
      onMessage(message);
    }
  });
}

function encodeQMessage({ msgId, responseTo = 0, opCode, messageBuffer }) {
  const buff = Buffer.allocUnsafe(messageBuffer.length + 13);
  buff.writeUInt32LE(messageBuffer.length, 0);
  buff.writeUInt32LE(msgId, 4);
  buff.writeUInt32LE(responseTo, 8);
  buff.writeUInt8(opCode, 12);
  messageBuffer.copy(buff, 13);
  return buff;
}

module.exports = {
  OP_ERROR,
  OP_REPLY,
  OP_REQUEST,
  uid,
  encodeQMessage,
  handleQMessageSocket,
};
