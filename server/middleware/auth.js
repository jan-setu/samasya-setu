const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'samasyasetu-sih-jharkhand-super-secret-key-2026';

function requireAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

/**
 * Role-Based Access Control middleware
 * @param {Array<string>|string} allowedRoles
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    // Secondary check: for govt_dept or admin, verify is_verified
    if ((req.user.role === 'admin' || req.user.role === 'govt_dept') && !req.user.is_verified) {
      return res.status(403).json({
        error: 'Your administrative account is pending verification and approval by a state administrator.',
        pendingApproval: true
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireRole
};
