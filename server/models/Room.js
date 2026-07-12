import mongoose from 'mongoose';

const moveSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    promotion: { type: String, default: null },
    san: String,
    fen: String,
    turn: { type: String, enum: ['w', 'b'] }
}, { _id: false });

const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    color: { type: String, enum: ['w', 'b'], required: true },
    socketId: { type: String, required: true }
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, default: 'Guest' },
    role: { type: String, enum: ['white', 'black', 'spectator'], default: 'spectator' },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const guestChatCountSchema = new mongoose.Schema({
    guestId: { type: String, required: true },
    count: { type: Number, default: 0 }
}, { _id: false });

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, unique: true, required: true, index: true },
    players: [playerSchema],
    currentFen: {
        type: String,
        default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    turn: { type: String, default: 'w' },
    status: { type: String, enum: ['waiting', 'playing', 'completed'], default: 'waiting' },
    winner: { type: String, enum: ['w', 'b', 'draw', null], default: null },
    resultReason: { type: String, default: null },
    ffn: { type: String, default: '' },
    moveHistory: [moveSchema],
    recentChat: { type: [chatMessageSchema], default: [] },
    guestChatCounts: { type: [guestChatCountSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null }
});

const Room = mongoose.model('Room', roomSchema);

export default Room;