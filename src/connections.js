// userId 
const byUser = new Map();

function add(userId, socket) {
  if (!byUser.has(userId)) byUser.set(userId, new Set());
  byUser.get(userId).add(socket);
}

function remove(userId, socket) {
  const sockets = byUser.get(userId);
  if (!sockets) return;
  sockets.delete(socket);
  if (sockets.size === 0) byUser.delete(userId);
}

function getSockets(userId) {
  return byUser.get(userId) || new Set();
}

module.exports = { add, remove, getSockets };