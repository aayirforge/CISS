const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // "Bearer <token>"

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token is invalid or expired.' });
      }

      try {
        const user = await User.findByPk(decoded.id);
        if (!user || user.status === 'Inactive') {
          return res.status(403).json({ error: 'User is inactive or deleted.' });
        }
        req.user = user;
        next();
      } catch (dbErr) {
        return res.status(500).json({ error: 'Internal server error during authentication.' });
      }
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized role.' });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
};
