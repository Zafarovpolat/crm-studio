const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Пользователь не найден или деактивирован' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
};

module.exports = { auth, requireRole };