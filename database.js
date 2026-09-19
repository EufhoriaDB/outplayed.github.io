const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'memory.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Base de datos SQLite (memory.db) conectada correctamente.');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS interacciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT DEFAULT 'Blush',
            tipo_accion TEXT,
            estado_animo TEXT,
            prompt TEXT,
            respuesta TEXT,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;