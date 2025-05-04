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

// Get chat history (messages and files) for a specific room
router.get('/history/:roomId', (req, res) => {
    const { roomId } = req.params;

    // Fetch messages and files for the room
    const queryMessages = 'SELECT * FROM messages WHERE roomId = ? ORDER BY timestamp ASC';
    const queryFiles = 'SELECT * FROM files WHERE roomId = ? ORDER BY timestamp ASC';

    db.all(queryMessages, [roomId], (err, messages) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        db.all(queryFiles, [roomId], (err, files) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({ messages, files });
        });
    });
});

module.exports = router;
