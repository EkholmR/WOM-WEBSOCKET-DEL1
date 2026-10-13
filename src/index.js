require('dotenv').config();

for (const name of ['JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
}

const createServer = require('./server');

const port = process.env.PORT || 8080;
createServer().listen(port, () => {
  console.log(`Server listening on port ${port}`);
});