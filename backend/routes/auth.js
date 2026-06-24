const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'library_secret_key_2024';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  const { prepare } = getDb();
  const user = prepare(`
    SELECT b.*, bib.nazvanie as nazvanie_biblioteki, bib.adres_biblioteki
    FROM Bibliotekar b
    JOIN Biblioteka bib ON b.id_biblioteki = bib.id_biblioteki
    WHERE b.login = ?
  `).get(login);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const token = jwt.sign(
    {
      id: user.id_bibliotekarya,
      login: user.login,
      imya: user.imya,
      familiya: user.familiya,
      id_biblioteki: user.id_biblioteki
    },
    SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id_bibliotekarya,
      login: user.login,
      imya: user.imya,
      familiya: user.familiya,
      otchestvo: user.otchestvo,
      nazvanie_biblioteki: user.nazvanie_biblioteki,
      adres_biblioteki: user.adres_biblioteki
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Нет токена' });
  try {
    const payload = jwt.verify(auth.split(' ')[1], SECRET);
    res.json({ ok: true, user: payload });
  } catch {
    res.status(401).json({ error: 'Токен недействителен' });
  }
});

module.exports = router;
