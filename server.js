const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Подключаемся к Supabase с правами администратора (обходит RLS)
// Убедись, что на Render в Environment Variables добавлены SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 1. Проверка юзера по телефону (вызывается при входе)
app.post('/api/find-by-phone', async (req, res) => {
  try {
    const { phone } = req.body;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle(); // Возвращает null, если не найдено

    if (error) throw error;
    
    if (data) {
      res.json({ found: true, user: data });
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
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        id: id,
        phone: phone,
        first_name: firstName,
        last_name: lastName,
        username: username,
        last_seen: Date.now()
      }])
      .select()
      .single();

    if (error) {
      // Код 23505 — нарушение уникальности (username занят)
      if (error.code === '23505') {
        return res.json({ error: 'username_taken' });
      }
      throw error;
    }
    
    res.json({ ok: true, user: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Проверка username
app.get('/api/check-username/:username', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', req.params.username)
      .maybeSingle();

    if (error) throw error;
    
    res.json({ taken: !!data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
