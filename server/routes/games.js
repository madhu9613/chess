import express from 'express';
import Game from '../models/Game.js';

const router = express.Router();

router.get('/recent', async (req, res) => {
    const games = await Game.find({})
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();

    return res.json({
        success: true,
        games
    });
});

router.get('/room/:roomCode', async (req, res) => {
    const game = await Game.findOne({ roomCode: req.params.roomCode }).lean();
    if (!game) {
        return res.status(404).json({ success: false, error: 'Game not found' });
    }

    return res.json({
        success: true,
        game
    });
});

router.get('/user/:userId', async (req, res) => {
    const games = await Game.find({ 'players.userId': req.params.userId })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

    return res.json({
        success: true,
        games
    });
});

export default router;
