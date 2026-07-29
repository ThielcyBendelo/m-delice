import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Guichet unique de l'API DRC Assurances
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ONLINE", service: "DRC Assurances Gateway Core Engine" });
});

app.listen(PORT, () => {
    console.log(`\n🛡️  Serveur API DRC Assurances démarré avec succès sur le port ${PORT}`);
    console.log(`🔗 Point d'accès local : http://localhost:${PORT}/api/health`);
});
