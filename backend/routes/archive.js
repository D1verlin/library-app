const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// GET /api/archive?id_klienta=...&id_knigi=...&vozvrashchena=...
router.get('/', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const { id_klienta, id_knigi, vozvrashchena } = req.query;

  let query = `
    SELECT v.*,
           k.imya, k.familiya, k.otchestvo, k.nomer_telefona,
           kn.nazvanie, kn.avtor, kn.zhanr,
           bl.familiya as bl_familiya, bl.imya as bl_imya
    FROM Vydacha v
    JOIN Klient k  ON v.id_klienta = k.id_klienta
    JOIN Kniga kn  ON v.id_knigi   = kn.id_knigi
    LEFT JOIN Bibliotekar bl ON v.id_bibliotekarya = bl.id_bibliotekarya
    WHERE 1=1
  `;
  const params = [];

  if (id_klienta) { query += ' AND v.id_klienta = ?'; params.push(id_klienta); }
  if (id_knigi)   { query += ' AND v.id_knigi = ?';   params.push(id_knigi); }
  if (vozvrashchena !== undefined && vozvrashchena !== '') {
    query += ' AND v.vozvrashchena = ?';
    params.push(vozvrashchena === 'true' ? 1 : 0);
  }

  query += ' ORDER BY v.data_vydachi DESC LIMIT 200';
  res.json(prepare(query).all(...params));
});

// POST /api/archive/issue — выдать книгу
router.post('/issue', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const { id_klienta, id_knigi, srok_vozvrata } = req.body;

  if (!id_klienta || !id_knigi || !srok_vozvrata) {
    return res.status(400).json({ error: 'id_klienta, id_knigi и srok_vozvrata обязательны' });
  }

  const kniga = prepare('SELECT * FROM Kniga WHERE id_knigi = ?').get(id_knigi);
  if (!kniga) return res.status(404).json({ error: 'Книга не найдена' });
  if (!kniga.dostupna) return res.status(400).json({ error: 'Книга уже выдана другому читателю' });

  const klient = prepare('SELECT * FROM Klient WHERE id_klienta = ?').get(id_klienta);
  if (!klient) return res.status(404).json({ error: 'Клиент не найден' });

  const today = new Date().toISOString().split('T')[0];
  const result = prepare(`
    INSERT INTO Vydacha (id_klienta, id_knigi, id_bibliotekarya, data_vydachi, srok_vozvrata)
    VALUES (?, ?, ?, ?, ?)
  `).run(id_klienta, id_knigi, req.user.id, today, srok_vozvrata);

  prepare('UPDATE Kniga SET dostupna = 0 WHERE id_knigi = ?').run(id_knigi);

  const vydacha = prepare(`
    SELECT v.*, k.imya, k.familiya, kn.nazvanie, kn.avtor
    FROM Vydacha v
    JOIN Klient k  ON v.id_klienta = k.id_klienta
    JOIN Kniga kn  ON v.id_knigi   = kn.id_knigi
    WHERE v.id_vydachi = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(vydacha);
});

// POST /api/archive/return/:id — вернуть книгу
router.post('/return/:id', authMiddleware, (req, res) => {
  const { prepare } = getDb();
  const vydacha = prepare('SELECT * FROM Vydacha WHERE id_vydachi = ?').get(req.params.id);
  if (!vydacha) return res.status(404).json({ error: 'Запись выдачи не найдена' });
  if (vydacha.vozvrashchena) return res.status(400).json({ error: 'Книга уже отмечена как возвращённая' });

  const today = new Date().toISOString().split('T')[0];
  prepare('UPDATE Vydacha SET vozvrashchena = 1, data_vozvrata = ? WHERE id_vydachi = ?').run(today, req.params.id);
  prepare('UPDATE Kniga SET dostupna = 1 WHERE id_knigi = ?').run(vydacha.id_knigi);

  res.json({ ok: true, message: 'Книга успешно возвращена' });
});

module.exports = router;
