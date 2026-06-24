const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'library.db');

let db = null;

// Сохраняет текущее состояние БД на диск
function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Обёртки для синхронного API поверх sql.js
function prepare(sql) {
  return {
    run(...params) {
      db.run(sql, params);
      saveDb();
      const changes = db.exec('SELECT changes()')[0];
      const lastId  = db.exec('SELECT last_insert_rowid()')[0];
      return {
        changes: changes ? changes.values[0][0] : 0,
        lastInsertRowid: lastId ? lastId.values[0][0] : null
      };
    },
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      const res = db.exec(sql, params);
      if (!res.length) return [];
      const { columns, values } = res[0];
      return values.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    }
  };
}

function exec(sql) {
  db.run(sql);
  saveDb();
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Создание таблиц
  db.run(`PRAGMA foreign_keys = ON;`);

  db.run(`
    CREATE TABLE IF NOT EXISTS Biblioteka (
      id_biblioteki    INTEGER PRIMARY KEY AUTOINCREMENT,
      adres_biblioteki TEXT NOT NULL,
      nazvanie         TEXT NOT NULL DEFAULT 'Городская библиотека №1'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Bibliotekar (
      id_bibliotekarya         INTEGER PRIMARY KEY AUTOINCREMENT,
      id_biblioteki            INTEGER NOT NULL,
      login                    TEXT NOT NULL UNIQUE,
      password_hash            TEXT NOT NULL,
      imya                     TEXT NOT NULL,
      familiya                 TEXT NOT NULL,
      otchestvo                TEXT,
      mesto_propiski           TEXT,
      nomer_telefona           TEXT,
      adres_elektronnoy_pochty TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Klient (
      id_klienta               INTEGER PRIMARY KEY AUTOINCREMENT,
      id_biblioteki            INTEGER NOT NULL,
      imya                     TEXT NOT NULL,
      familiya                 TEXT NOT NULL,
      otchestvo                TEXT,
      mesto_propiski           TEXT,
      nomer_telefona           TEXT,
      adres_elektronnoy_pochty TEXT,
      data_registracii         TEXT NOT NULL DEFAULT (date('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Kniga (
      id_knigi                      INTEGER PRIMARY KEY AUTOINCREMENT,
      id_biblioteki                 INTEGER NOT NULL,
      nazvanie                      TEXT NOT NULL,
      avtor                         TEXT NOT NULL,
      opisanie                      TEXT,
      zhanr                         TEXT,
      vozrastnoe_ogranichenie       TEXT DEFAULT '0+',
      izdatel                       TEXT,
      adresa_bibliotek_nahozhdeniya TEXT,
      dostupna                      INTEGER NOT NULL DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Vydacha (
      id_vydachi       INTEGER PRIMARY KEY AUTOINCREMENT,
      id_klienta       INTEGER NOT NULL,
      id_knigi         INTEGER NOT NULL,
      id_bibliotekarya INTEGER,
      data_vydachi     TEXT NOT NULL DEFAULT (date('now')),
      srok_vozvrata    TEXT NOT NULL,
      vozvrashchena    INTEGER NOT NULL DEFAULT 0,
      data_vozvrata    TEXT
    )
  `);

  saveDb();

  // Seed данных
  const libCount = db.exec('SELECT COUNT(*) as cnt FROM Biblioteka')[0];
  const cnt = libCount ? libCount.values[0][0] : 0;

  if (cnt === 0) {
    db.run(`INSERT INTO Biblioteka (adres_biblioteki, nazvanie) VALUES ('ул. Ленина, 1', 'Городская библиотека №1')`);
    const libId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    const hash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO Bibliotekar (id_biblioteki, login, password_hash, imya, familiya, otchestvo, nomer_telefona) VALUES (${libId}, 'admin', '${hash}', 'Иван', 'Иванов', 'Иванович', '+7 (900) 000-00-00')`);

    const klients = [
      ['Денис','Петров','Сергеевич','г. Москва, ул. Садовая, 5','+7 (911) 111-11-11','denis@mail.ru'],
      ['Матвей','Сидоров','Алексеевич','г. Москва, ул. Лесная, 12','+7 (922) 222-22-22','matvey@mail.ru'],
      ['Анна','Козлова','Михайловна','г. Москва, пр. Мира, 7','+7 (933) 333-33-33','anna@mail.ru'],
    ];
    for (const [im,fa,ot,mp,nt,ep] of klients) {
      db.run(`INSERT INTO Klient (id_biblioteki,imya,familiya,otchestvo,mesto_propiski,nomer_telefona,adres_elektronnoy_pochty) VALUES (${libId},'${im}','${fa}','${ot}','${mp}','${nt}','${ep}')`);
    }

    const books = [
      ['Мастер и Маргарита','Михаил Булгаков','Роман о добре и зле, о любви и творчестве','Роман','16+','АСТ','Зал №1, стеллаж 3'],
      ['Война и мир','Лев Толстой','Эпический роман об Отечественной войне 1812 года','Роман','12+','Эксмо','Зал №1, стеллаж 1'],
      ['Преступление и наказание','Фёдор Достоевский','Психологический роман о вине и искуплении','Роман','16+','АСТ','Зал №1, стеллаж 2'],
      ['Евгений Онегин','Александр Пушкин','Роман в стихах о жизни петербургского аристократа','Поэзия','12+','Эксмо','Зал №2, стеллаж 1'],
      ['Мёртвые души','Николай Гоголь','Поэма о похождениях Чичикова','Поэма','12+','АСТ','Зал №2, стеллаж 2'],
      ['Анна Каренина','Лев Толстой','Роман о трагической любви','Роман','16+','Эксмо','Зал №1, стеллаж 1'],
      ['Идиот','Фёдор Достоевский','История князя Мышкина','Роман','16+','АСТ','Зал №1, стеллаж 2'],
      ['Капитанская дочка','Александр Пушкин','Исторический роман о пугачёвском восстании','Роман','12+','Эксмо','Зал №2, стеллаж 3'],
    ];
    for (const [naz,avt,op,zh,voz,izd,adr] of books) {
      db.run(`INSERT INTO Kniga (id_biblioteki,nazvanie,avtor,opisanie,zhanr,vozrastnoe_ogranichenie,izdatel,adresa_bibliotek_nahozhdeniya) VALUES (${libId},'${naz}','${avt}','${op}','${zh}','${voz}','${izd}','${adr}')`);
    }

    saveDb();
    console.log('✅ Seed данные добавлены. Логин: admin / Пароль: admin123');
  }

  console.log('✅ База данных инициализирована');
  return { prepare, exec };
}

module.exports = { initDb, getDb: () => ({ prepare, exec }) };
