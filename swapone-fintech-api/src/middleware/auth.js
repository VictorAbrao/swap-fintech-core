const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware para verificar JWT token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Usar dados do token JWT diretamente
    req.user = {
      userId: decoded.userId,
      id: decoded.userId, // Para compatibilidade
      email: decoded.email,
      role: decoded.role,
      clientId: decoded.clientId,
      client_id: decoded.clientId, // Para compatibilidade
      twofa_enabled: decoded.twofa_enabled || false
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Malformed token'
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid token'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é admin
 */
const requireAdmin = authorizeRoles('admin');

/**
 * Middleware para verificar se é admin ou ops
 */
const requireAdminOrOps = authorizeRoles('admin', 'ops');

/**
 * Middleware para verificar se é cliente ou superior
 */
const requireClientOrAbove = authorizeRoles('admin', 'ops', 'client');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireAdmin,
  requireAdminOrOps,
  requireClientOrAbove
};
