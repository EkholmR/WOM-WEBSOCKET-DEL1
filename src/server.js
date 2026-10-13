const http = require('http');
const { WebSocketServer } = require('ws');
const { verifyToken } = require('./auth');

function createServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  const wss = new WebSocketServer({ noServer: true });

  // JWT Check
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
    console.log(`Client connected (user ${socket.user.id})`);
    socket.send(`Welcome, user ${socket.user.id}!`);

    socket.on('close', () => console.log(`Client disconnected (user ${socket.user.id})`));
  });

  return server;
}

module.exports = createServer;