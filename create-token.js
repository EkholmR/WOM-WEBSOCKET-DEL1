require('dotenv').config();
const jwt = require('jsonwebtoken');

const userId = process.argv[2] || '1';
console.log(jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' }));