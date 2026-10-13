const http = require('http');
const { WebSocketServer } = require('ws');

function createServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (socket) => {
    console.log('Client connected');
    socket.send('Welcome!');

    socket.on('close', () => console.log('Client disconnected'));
  });

  return server;
}

module.exports = createServer;