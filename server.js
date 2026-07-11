const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'maru_db');

app.use(express.static(__dirname));
app.use(express.json()); // Parse JSON bodies

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open SQLite database:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT,
        created_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS stats (
        key TEXT PRIMARY KEY,
        value INTEGER
    )`);

    db.run(`INSERT OR IGNORE INTO stats(key, value) VALUES ('visits', 0), ('sorry_accepted', 0)`);
});

// Routes
// Note: static middleware already handles index.html, questions.html, etc.

// API Endpoints
app.get('/api/stats', (req, res) => {
    db.serialize(() => {
        db.run(`UPDATE stats SET value = value + 1 WHERE key = 'visits'`, function (err) {
            if (err) return res.status(500).json({ error: 'Server error' });

            db.get(`SELECT key, value FROM stats`, (err, row) => {
                if (err) return res.status(500).json({ error: 'Server error' });
                db.all(`SELECT key, value FROM stats`, (err, rows) => {
                    if (err) return res.status(500).json({ error: 'Server error' });
                    const stats = rows.reduce((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});
                    res.json({ message: 'Visit logged', stats });
                });
            });
        });
    });
});

app.post('/api/save-answer', (req, res) => {
    const { question, answer } = req.body;

    if (!answer || !question) {
        return res.status(400).json({ error: 'Missing question or answer' });
    }

    db.run(
        `INSERT INTO answers (question, answer, created_at) VALUES (?, ?, ?)`,
        [question, answer, new Date().toISOString()],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to save' });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.post('/api/sorry-accepted', (req, res) => {
    db.run(`UPDATE stats SET value = value + 1 WHERE key = 'sorry_accepted'`, function (err) {
        if (err) return res.status(500).json({ error: 'Failed' });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running smoothly on http://localhost:${PORT}`);
});
