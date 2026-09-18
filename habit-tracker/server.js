const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Obtenir tots els hàbits bàsics
app.get('/api/habits', async (req, res) => {
  try {
    const [habits] = await db.query('SELECT * FROM habit');
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear un nou hàbit
app.post('/api/habits', async (req, res) => {
  const { name, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO habit (Name, Description) VALUES (?, ?)',
      [name, description]
    );
    res.status(201).json({ id: result.insertId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Eliminar un hàbit (i els seus logs automàticament per clau forana)
app.delete('/api/habits/:id', async (req, res) => {
  const habitId = req.params.id;
  try {
    // Si la FK no té CASCADE, primer eliminem logs per seguretat
    await db.query('DELETE FROM habitlogs WHERE IdHabit = ?', [habitId]);
    await db.query('DELETE FROM habit WHERE IdHabit = ?', [habitId]);
    res.json({ success: true, message: 'Hàbit eliminat correctament' });
  } catch (err) {
    console.error('Error a DELETE /api/habits/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Obtenir hàbits per avui amb estat i càlcul de ratxa (streaks)
app.get('/api/habits/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const habitsQuery = `
      SELECT h.IdHabit, h.Name, h.Description, 
             COALESCE(hl.Completed, 0) AS CompletedToday
      FROM habit h
      LEFT JOIN habitlogs hl 
        ON h.IdHabit = hl.IdHabit AND hl.CompletedDay = ?
    `;
    const [habits] = await db.query(habitsQuery, [today]);

    const [logs] = await db.query(
      'SELECT IdHabit, CompletedDay FROM habitlogs WHERE Completed = 1 ORDER BY CompletedDay DESC'
    );

    const habitsWithStreaks = habits.map((habit) => {
      const habitDates = logs
        .filter((l) => l.IdHabit === habit.IdHabit)
        .map((l) => new Date(l.CompletedDay).toISOString().split('T')[0]);

      let streak = 0;
      let checkDate = new Date();

      const todayStr = checkDate.toISOString().split('T')[0];
      if (!habitDates.includes(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (habitDates.includes(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        ...habit,
        streak
      };
    });

    res.json(habitsWithStreaks);
  } catch (err) {
    console.error('Error a GET /api/habits/today:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Commutar (toggle) fet / pendent
app.post('/api/habits/:id/toggle', async (req, res) => {
  const habitId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [existing] = await db.query(
      'SELECT * FROM habitlogs WHERE IdHabit = ? AND CompletedDay = ?',
      [habitId, today]
    );

    if (existing.length > 0) {
      const newStatus = !existing[0].Completed;
      await db.query(
        'UPDATE habitlogs SET Completed = ? WHERE IdHabit = ? AND CompletedDay = ?',
        [newStatus, habitId, today]
      );
      res.json({ success: true, completed: newStatus });
    } else {
      await db.query(
        'INSERT INTO habitlogs (IdHabit, CompletedDay, Completed) VALUES (?, ?, true)',
        [habitId, today]
      );
      res.json({ success: true, completed: true });
    }
  } catch (err) {
    console.error('Error a /api/habits/:id/toggle:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Obtenir el journal d'avui
app.get('/api/journal/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [rows] = await db.query(
      'SELECT * FROM journalentries WHERE Date = ?',
      [today]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error('Error a GET /api/journal/today:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Obtenir l'historial del journal (últimes 7 entrades)
app.get('/api/journal/history', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM journalentries ORDER BY Date DESC LIMIT 7'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error a GET /api/journal/history:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Guardar o actualitzar el journal d'avui
app.post('/api/journal', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { sleepQuality, urgeStatus, dailyWin, mindDump, socialConnection, tomorrowFocus } = req.body;

  try {
    const query = `
      INSERT INTO journalentries 
        (Date, SleepQuality, UrgeStatus, DailyWin, MindDump, SocialConnection, TomorrowFocus)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        SleepQuality = VALUES(SleepQuality),
        UrgeStatus = VALUES(UrgeStatus),
        DailyWin = VALUES(DailyWin),
        MindDump = VALUES(MindDump),
        SocialConnection = VALUES(SocialConnection),
        TomorrowFocus = VALUES(TomorrowFocus)
    `;

    await db.query(query, [
      today,
      sleepQuality || '',
      urgeStatus || '',
      dailyWin || '',
      mindDump || '',
      socialConnection || '',
      tomorrowFocus || ''
    ]);

    res.json({ success: true, message: "Journal guardat correctament" });
  } catch (err) {
    console.error('ERROR GUARDANT JOURNAL:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corrent a http://localhost:${PORT}`);
});