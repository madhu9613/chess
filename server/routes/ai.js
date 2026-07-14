import express from 'express';
import axios from 'axios';

const router = express.Router();

const STOCKFISH_URL = process.env.STOCKFISH_SERVICE_URL || 'http://localhost:3001';

router.post('/move', async (req, res, next) => {
    const { fen, level = 'medium' } = req.body || {};

    if (!fen) {
        return res.status(400).json({ success: false, error: 'FEN is required' });
    }

    try {
        const response = await axios.post(`${STOCKFISH_URL}/move`, { fen, level }, { timeout: 20000 });
        return res.json(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return next(new Error('Stockfish service timed out'));
        }
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return next(error);
    }
});

router.post('/analyze', async (req, res, next) => {
    const { fen, level = 'hard' } = req.body || {};

    if (!fen) {
        return res.status(400).json({ success: false, error: 'FEN is required' });
    }

    try {
        const response = await axios.post(`${STOCKFISH_URL}/analyze`, { fen, level }, { timeout: 25000 });
        return res.json(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return next(new Error('Stockfish service timed out'));
        }
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return next(error);
    }
});

export default router;