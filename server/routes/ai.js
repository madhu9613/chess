import express from 'express';
import { analyzePosition, chooseAIMove } from '../utils/socketfish.js';

const router = express.Router();

router.post('/move', async (req, res, next) => {
    const { fen, level = 'medium' } = req.body || {};

    if (!fen) {
        return res.status(400).json({ success: false, error: 'FEN is required' });
    }

    try {
        const result = await chooseAIMove(fen, level);
        return res.json({ success: true, ...result });
    } catch (error) {
        return next(error);
    }
});

router.post('/analyze', async (req, res, next) => {
    const { fen, level = 'hard' } = req.body || {};

    if (!fen) {
        return res.status(400).json({ success: false, error: 'FEN is required' });
    }

    try {
        return res.json({
            success: true,
            analysis: await analyzePosition(fen, level),
        });
    } catch (error) {
        return next(error);
    }
});

export default router;