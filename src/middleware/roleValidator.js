const roleValidator = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'No tienes permiso para realizar esta acción',
      });
    }

    next();
  };
};

module.exports = {
  isAdmin: roleValidator(['admin']),
  isUser: roleValidator(['user', 'admin']),
};
