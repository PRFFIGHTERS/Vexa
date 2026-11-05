const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к базе данных Render (ты получишь ссылку, когда создашь PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Создание таблицы пользователей (если ее нет)
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    phone VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100) UNIQUE,
    avatar TEXT,
    last_seen BIGINT
  );
`);

// 1. Проверка юзера по телефону (вызывается при входе)
app.post('/api/find-by-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length > 0) {
      res.json({ found: true, user: result.rows[0] });
    } else {
      res.json({ found: false });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Регистрация нового юзера
app.post('/api/register', async (req, res) => {
  try {
    const { id, phone, firstName, lastName, username } = req.body;
    await pool.query(
      'INSERT INTO users (id, phone, first_name, last_name, username, last_seen) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, phone, firstName, lastName, username, Date.now()]
    );
    res.json({ ok: true, user: { id, phone, first_name: firstName, last_name: lastName, username } });
  } catch (e) {
    if (e.code === '23505') { // Ошибка уникальности (username занят)
      res.json({ error: 'username_taken' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// 3. Проверка username
app.get('/api/check-username/:username', async (req, res) => {
  const result = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
  res.json({ taken: result.rows.length > 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
