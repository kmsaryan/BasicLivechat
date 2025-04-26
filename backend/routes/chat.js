const express = require('express');
const db = require('../database');
const router = express.Router();

// Get chat messages
router.get('/messages', (req, res) => {
    db.all('SELECT * FROM messages ORDER BY timestamp ASC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Save a new message
router.post('/messages', (req, res) => {
    const { user, message } = req.body;
    db.run('INSERT INTO messages (user, message) VALUES (?, ?)', [user, message], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

module.exports = router;
