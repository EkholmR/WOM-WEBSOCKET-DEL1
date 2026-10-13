const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { verifyToken } = require('./auth');
const connections = require('./connections');

function createServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  // NEW: maxPayload rejects messages over 64 KB
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

  // The JWT is checked here, once, during the handshake
  server.on('upgrade', (req, socket, head) => {
    let user;
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) throw new Error('Missing token');
      user = verifyToken(token);
    } catch (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.user = user;
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (socket) => {
    const userId = socket.user.id;
    connections.add(userId, socket);
    console.log(`Client connected (user ${userId}, ${connections.getSockets(userId).size} open)`);
    socket.send(`Welcome, user ${userId}!`);

    // NEW: heartbeat bookkeeping and error handler
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('error', (err) => console.error(`Socket error (user ${userId}):`, err.message));

    // Relay to all of this user's connections (including the sender)
    socket.on('message', (data, isBinary) => {
      for (const client of connections.getSockets(userId)) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: isBinary });
        }
      }
    });

    socket.on('close', () => {
      connections.remove(userId, socket);
      console.log(`Client disconnected (user ${userId})`);
    });
  });

  // NEW: every 30 s, drop sockets that didn't answer the last ping
  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      if (!client.isAlive) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, 30000);
  server.on('close', () => clearInterval(heartbeat));

  return server;
}

module.exports = createServer;