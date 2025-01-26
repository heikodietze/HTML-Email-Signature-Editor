import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Statische Dateien
app.use(express.static('.'));

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});