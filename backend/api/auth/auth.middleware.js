const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: { 
        message: 'Access token required', 
        status: 401 
      } 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: { 
          message: 'Invalid or expired token', 
          status: 403 
        } 
      });
    }
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          message: 'Authentication required', 
          status: 401 
        } 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: { 
          message: 'Insufficient permissions', 
          status: 403 
        } 
      });
    }

    next();
  };
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      division: user.division 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  generateToken
};