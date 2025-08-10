import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('data.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL
  )`);
});

app.post('/api/responses', (req, res) => {
  const payload = JSON.stringify(req.body);
  db.run(`INSERT INTO responses (payload) VALUES (?)`, [payload], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ id: this.lastID });
  });
});

app.get('/api/responses/:id', (req, res) => {
  db.get(
    `SELECT payload FROM responses WHERE id = ?`,
    [req.params.id],
    (err, row: { payload?: string } | undefined) => {
      if (err) return res.status(500).send(err.message);
      if (!row || !row.payload) return res.status(404).send('Not found');

      try {
        const data = JSON.parse(row.payload);
        res.json(data);
      } catch {
        res.status(500).send('Corrupted stored payload');
      }
    }
  );
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
