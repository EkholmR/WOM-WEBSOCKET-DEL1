const jwt = require('jsonwebtoken');

function verifyToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  if (!payload.sub) {
    throw new Error('Token has no user id');
  }
  return { id: String(payload.sub) };
}

module.exports = { verifyToken };