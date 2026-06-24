const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// GET /api/books?search=...&available=true
router.get('/', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const { search, available } = req.query;

  let baseQuery = `
    SELECT kn.*, b.nazvanie as nazvanie_biblioteki
    FROM Kniga kn
    JOIN Biblioteka b ON kn.id_biblioteki = b.id_biblioteki
    WHERE 1=1
  `;
  const params = [];

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    baseQuery += ` AND (kn.nazvanie LIKE ? OR kn.avtor LIKE ? OR CAST(kn.id_knigi AS TEXT) = ?)`;
    params.push(s, s, search.trim());
  }
  if (available === 'true') {
    baseQuery += ` AND kn.dostupna = 1`;
  }
  baseQuery += ` ORDER BY kn.nazvanie LIMIT 100`;

  res.json(prepare(baseQuery).all(...params));
});

// GET /api/books/:id
router.get('/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const kniga = prepare(`
    SELECT kn.*, b.nazvanie as nazvanie_biblioteki
    FROM Kniga kn
    JOIN Biblioteka b ON kn.id_biblioteki = b.id_biblioteki
    WHERE kn.id_knigi = ?
  `).get(req.params.id);

  if (!kniga) return res.status(404).json({ error: 'Книга не найдена' });

  const vydacha = prepare(`
    SELECT v.*, k.imya, k.familiya, k.otchestvo, k.nomer_telefona
    FROM Vydacha v
    JOIN Klient k ON v.id_klienta = k.id_klienta
    WHERE v.id_knigi = ? AND v.vozvrashchena = 0
  `).get(req.params.id);

  res.json({ ...kniga, tekushchaya_vydacha: vydacha || null });
});

// POST /api/books
router.post('/', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const { nazvanie, avtor, opisanie, zhanr, vozrastnoe_ogranichenie, izdatel, adresa_bibliotek_nahozhdeniya } = req.body;
  if (!nazvanie || !avtor) return res.status(400).json({ error: 'Название и автор обязательны' });

  const result = prepare(`
    INSERT INTO Kniga (id_biblioteki, nazvanie, avtor, opisanie, zhanr, vozrastnoe_ogranichenie, izdatel, adresa_bibliotek_nahozhdeniya)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id_biblioteki, nazvanie, avtor,
    opisanie || null, zhanr || null,
    vozrastnoe_ogranichenie || '0+',
    izdatel || null, adresa_bibliotek_nahozhdeniya || null
  );

  res.status(201).json(prepare('SELECT * FROM Kniga WHERE id_knigi = ?').get(result.lastInsertRowid));
});

// PUT /api/books/:id
router.put('/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const existing = prepare('SELECT * FROM Kniga WHERE id_knigi = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Книга не найдена' });

  const { nazvanie, avtor, opisanie, zhanr, vozrastnoe_ogranichenie, izdatel, adresa_bibliotek_nahozhdeniya } = req.body;
  prepare(`
    UPDATE Kniga SET nazvanie=?, avtor=?, opisanie=?, zhanr=?, vozrastnoe_ogranichenie=?, izdatel=?, adresa_bibliotek_nahozhdeniya=?
    WHERE id_knigi=?
  `).run(
    nazvanie || existing.nazvanie, avtor || existing.avtor,
    opisanie ?? existing.opisanie, zhanr ?? existing.zhanr,
    vozrastnoe_ogranichenie || existing.vozrastnoe_ogranichenie,
    izdatel ?? existing.izdatel,
    adresa_bibliotek_nahozhdeniya ?? existing.adresa_bibliotek_nahozhdeniya,
    req.params.id
  );

  res.json(prepare('SELECT * FROM Kniga WHERE id_knigi = ?').get(req.params.id));
});

// DELETE /api/books/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const existing = prepare('SELECT * FROM Kniga WHERE id_knigi = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Книга не найдена' });
  if (!existing.dostupna) return res.status(400).json({ error: 'Нельзя удалить выданную книгу' });

  prepare('DELETE FROM Kniga WHERE id_knigi = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
