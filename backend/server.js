const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Запуск после инициализации БД
initDb().then(() => {
  const authRoutes    = require('./routes/auth');
  const clientRoutes  = require('./routes/clients');
  const bookRoutes    = require('./routes/books');
  const archiveRoutes = require('./routes/archive');

  app.use('/api/auth',    authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/books',   bookRoutes);
  app.use('/api/archive', archiveRoutes);

  app.use('/api/*', (req, res) => res.status(404).json({ error: 'Маршрут не найден' }));

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log(`📚 ИС "Библиотека" готова к работе`);
    console.log(`🔑 Логин: admin  |  Пароль: admin123\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Порт ${PORT} уже занят!`);
      console.error(`   Завершите предыдущий процесс или измените PORT.`);
      console.error(`   Windows: netstat -ano | findstr :${PORT}  → taskkill /PID <pid> /F\n`);
    } else {
      console.error('❌ Ошибка сервера:', err.message);
    }
    process.exit(1);
  });

  // Корректное завершение
  process.on('SIGINT',  () => { server.close(() => process.exit(0)); });
  process.on('SIGTERM', () => { server.close(() => process.exit(0)); });

}).catch(err => {
  console.error('❌ Ошибка инициализации БД:', err);
  process.exit(1);
});
