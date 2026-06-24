const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'library_secret_key_2024';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  try {
    const payload = jwt.verify(auth.split(' ')[1], SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}

module.exports = { authMiddleware };
