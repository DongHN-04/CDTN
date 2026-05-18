const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id, role },               // payload
    process.env.JWT_SECRET,     // secret key
    { expiresIn: '30d' }        // thời hạn token
  );
};

module.exports = generateToken;
