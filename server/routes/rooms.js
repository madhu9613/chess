import express from 'express';
import Room from '../models/Room.js';

const router = express.Router();

router.get('/active', async (req, res) => {
    const rooms = await Room.find({ status: { $in: ['waiting', 'playing'] } })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

    return res.json({
        success: true,
        rooms: rooms.map((room) => ({
            roomCode: room.roomCode,
            status: room.status,
            timeControl: room.timeControl,
            whiteTimeMs: room.whiteTimeMs,
            blackTimeMs: room.blackTimeMs,
            clockActiveColor: room.clockActiveColor,
            clockRunning: room.clockRunning,
            playerCount: room.players.length,
            turn: room.turn,
            currentFen: room.currentFen,
            moveCount: room.moveHistory.length,
            winner: room.winner,
            updatedAt: room.updatedAt
        }))
    });
});

router.get('/:roomCode', async (req, res) => {
    const room = await Room.findOne({ roomCode: req.params.roomCode }).lean();
    if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
    }

    return res.json({
        success: true,
        room: {
            roomCode: room.roomCode,
            status: room.status,
            turn: room.turn,
            timeControl: room.timeControl,
            whiteTimeMs: room.whiteTimeMs,
            blackTimeMs: room.blackTimeMs,
            clockActiveColor: room.clockActiveColor,
            clockRunning: room.clockRunning,
            winner: room.winner,
            resultReason: room.resultReason,
            playerCount: room.players.length,
            players: room.players.map((player) => ({
                userId: player.userId,
                color: player.color
            })),
            currentFen: room.currentFen,
            moveCount: room.moveHistory.length,
            ffn: room.ffn,
            updatedAt: room.updatedAt
        }
    });
});

router.get('/:roomCode/moves', async (req, res) => {
    const room = await Room.findOne({ roomCode: req.params.roomCode }, { roomCode: 1, moveHistory: 1 }).lean();
    if (!room) {
        return res.status(404).json({ success: false, error: 'Room not found' });
    }

    return res.json({
        success: true,
        roomCode: room.roomCode,
        moveCount: room.moveHistory.length,
        moves: room.moveHistory
    });
});

export default router;
