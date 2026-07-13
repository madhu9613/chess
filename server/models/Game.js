import mongoose from 'mongoose';

const moveSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    promotion: { type: String, default: null },
    san: { type: String, required: true },
    fen: { type: String, required: true },
    turn: { type: String, enum: ['w', 'b'], required: true }
}, { _id: false });

const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    color: { type: String, enum: ['w', 'b'], required: true }
}, { _id: false });

const gameSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true, index: true },
    players: { type: [playerSchema], default: [] },
    timeControl: { type: String, enum: ['5+0', '15+0'], default: '5+0' },
    whiteTimeMs: { type: Number, default: 5 * 60 * 1000 },
    blackTimeMs: { type: Number, default: 5 * 60 * 1000 },
    startFen: {
        type: String,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    currentFen: {
        type: String,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    turn: { type: String, enum: ['w', 'b'], default: 'w' },
    status: { type: String, enum: ['waiting', 'playing', 'completed', 'abandoned'], default: 'waiting' },
    winner: { type: String, enum: ['w', 'b', 'draw', null], default: null },
    resultReason: { type: String, default: null },
    moveHistory: { type: [moveSchema], default: [] },
    ffn: { type: String, default: '' },
    moveCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastMoveAt: { type: Date, default: null },
    endedAt: { type: Date, default: null }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

export default Game;
