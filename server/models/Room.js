import mongoose from 'mongoose';

const moveSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    promotion: { type: String, default: null },
    san: String,
    fen: String,
    turn: { type: String, enum: ['w', 'b'] }
}, { _id: false });

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, unique: true, required: true, index: true },
    players: [{
        userId: String,                  
        color: { type: String, enum: ['w', 'b'] },
        socketId: String
    }],
    currentFen: {
        type: String,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    turn: { type: String, default: 'w' },
    status: { type: String, enum: ['waiting', 'playing', 'completed'], default: 'waiting' },
    winner: { type: String, enum: ['w', 'b', 'draw', null], default: null },
    moveHistory: [moveSchema],
    createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);

export default Room;