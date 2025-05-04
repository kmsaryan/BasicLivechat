const express = require('express');
const multer = require('multer');
const db = require('../database');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload a file
router.post('/upload', upload.single('file'), (req, res) => {
    const { originalname, path: filepath } = req.file;
    db.run('INSERT INTO files (filename, filepath) VALUES (?, ?)', [originalname, filepath], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, filename: originalname });
    });
});

// Download a file
router.get('/download/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM files WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.download(path.resolve(row.filepath), row.filename);
    });
});

// Get files for a specific chat room
router.get('/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    db.all('SELECT * FROM files WHERE roomId = ?', [roomId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;
