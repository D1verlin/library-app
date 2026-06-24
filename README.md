# ИС «Библиотека»

Информационная система для библиотекаря.  
**Стек**: Node.js + Express · sql.js (SQLite WASM) · React (Vite) · Vanilla CSS

---

## 🚀 Запуск

### 1. Запустить Backend (в первом окне терминала)

```bash
cd backend
node server.js
```

Сервер запустится на **http://localhost:3001**

### 2. Запустить Frontend (во втором окне терминала)

```bash
cd frontend
npm run dev
```

Откроется на **http://localhost:5173**

### Быстрый запуск (двойным кликом)

- `start-backend.bat` — запустить backend
- `start-frontend.bat` — запустить frontend

---

## 🔑 Авторизация

| Логин | Пароль |
|-------|--------|
| admin | admin123 |

---

## 📋 Страницы

| Страница | URL | Описание |
|----------|-----|----------|
| Клиенты | `/clients` | Поиск, регистрация, карточки читателей |
| Книги | `/books` | Каталог книг, выдача, управление |
| Архив | `/archive` | История выдач, возврат книг |

---

## 🗃️ База данных

Файл: `backend/library.db` (SQLite, создаётся автоматически при первом запуске)

**Таблицы**: `Biblioteka` · `Bibliotekar` · `Klient` · `Kniga` · `Vydacha`

---

## 📡 API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/login` | Вход в систему |
| GET | `/api/clients` | Список клиентов (поиск) |
| POST | `/api/clients` | Создать клиента |
| PUT | `/api/clients/:id` | Обновить клиента |
| DELETE | `/api/clients/:id` | Удалить клиента |
| GET | `/api/books` | Список книг (поиск) |
| POST | `/api/books` | Добавить книгу |
| PUT | `/api/books/:id` | Обновить книгу |
| DELETE | `/api/books/:id` | Удалить книгу |
| GET | `/api/archive` | Архив выдач |
| POST | `/api/archive/issue` | Выдать книгу |
| POST | `/api/archive/return/:id` | Вернуть книгу |
