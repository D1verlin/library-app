const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// GET /api/clients?search=...
router.get('/', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const { search } = req.query;
  let rows;

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    rows = prepare(`
      SELECT k.*, b.nazvanie as nazvanie_biblioteki
      FROM Klient k
      JOIN Biblioteka b ON k.id_biblioteki = b.id_biblioteki
      WHERE k.familiya LIKE ? OR k.imya LIKE ? OR k.otchestvo LIKE ?
         OR k.nomer_telefona LIKE ? OR CAST(k.id_klienta AS TEXT) = ?
      ORDER BY k.familiya, k.imya
      LIMIT 100
    `).all(s, s, s, s, search.trim());
  } else {
    rows = prepare(`
      SELECT k.*, b.nazvanie as nazvanie_biblioteki
      FROM Klient k
      JOIN Biblioteka b ON k.id_biblioteki = b.id_biblioteki
      ORDER BY k.familiya, k.imya
      LIMIT 50
    `).all();
  }

  res.json(rows);
});

// GET /api/clients/:id
router.get('/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const klient = prepare(`
    SELECT k.*, b.nazvanie as nazvanie_biblioteki, b.adres_biblioteki
    FROM Klient k
    JOIN Biblioteka b ON k.id_biblioteki = b.id_biblioteki
    WHERE k.id_klienta = ?
  `).get(req.params.id);

  if (!klient) return res.status(404).json({ error: 'Клиент не найден' });

  const aktivnye = prepare(`
    SELECT v.*, kn.nazvanie, kn.avtor
    FROM Vydacha v
    JOIN Kniga kn ON v.id_knigi = kn.id_knigi
    WHERE v.id_klienta = ? AND v.vozvrashchena = 0
    ORDER BY v.data_vydachi DESC
  `).all(req.params.id);

  res.json({ ...klient, aktivnye_knigi: aktivnye });
});

// POST /api/clients
router.post('/', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const { imya, familiya, otchestvo, mesto_propiski, nomer_telefona, adres_elektronnoy_pochty } = req.body;
  if (!imya || !familiya) return res.status(400).json({ error: 'Имя и фамилия обязательны' });

  const result = prepare(`
    INSERT INTO Klient (id_biblioteki, imya, familiya, otchestvo, mesto_propiski, nomer_telefona, adres_elektronnoy_pochty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id_biblioteki, imya, familiya, otchestvo || null, mesto_propiski || null, nomer_telefona || null, adres_elektronnoy_pochty || null);

  const newKlient = prepare('SELECT * FROM Klient WHERE id_klienta = ?').get(result.lastInsertRowid);
  res.status(201).json(newKlient);
});

// PUT /api/clients/:id
router.put('/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const existing = prepare('SELECT * FROM Klient WHERE id_klienta = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Клиент не найден' });

  const { imya, familiya, otchestvo, mesto_propiski, nomer_telefona, adres_elektronnoy_pochty } = req.body;
  prepare(`
    UPDATE Klient SET imya=?, familiya=?, otchestvo=?, mesto_propiski=?, nomer_telefona=?, adres_elektronnoy_pochty=?
    WHERE id_klienta=?
  `).run(
    imya || existing.imya, familiya || existing.familiya,
    otchestvo ?? existing.otchestvo, mesto_propiski ?? existing.mesto_propiski,
    nomer_telefona ?? existing.nomer_telefona, adres_elektronnoy_pochty ?? existing.adres_elektronnoy_pochty,
    req.params.id
  );

  res.json(prepare('SELECT * FROM Klient WHERE id_klienta = ?').get(req.params.id));
});

// DELETE /api/clients/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const existing = prepare('SELECT * FROM Klient WHERE id_klienta = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Клиент не найден' });

  const active = prepare('SELECT COUNT(*) as cnt FROM Vydacha WHERE id_klienta = ? AND vozvrashchena = 0').get(req.params.id);
  if (active && active.cnt > 0) return res.status(400).json({ error: 'У клиента есть невозвращённые книги' });

  prepare('DELETE FROM Klient WHERE id_klienta = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
