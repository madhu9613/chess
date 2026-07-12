import Room from '../models/Room.js';
import { validateMove } from '../utils/chessValidator.js';

export default (io, socket) => {
    // Create a new room
    socket.on('createRoom', async (data, callback) => {
        try {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const room = new Room({
                roomCode,
                players: [{
                    userId: data.userId || socket.id,
                    color: 'w',
                    socketId: socket.id
                }]
            });
            await room.save();

            socket.join(roomCode);
            socket.emit('roomCreated', { roomCode, color: 'w' });
            if (callback) callback({ success: true, roomCode });
        } catch (err) {
            console.error('Create room error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    // Join an existing room
    socket.on('joinRoom', async (data, callback) => {
        try {
            const { roomCode, userId } = data;
            const room = await Room.findOne({ roomCode });
            if (!room) return callback?.({ success: false, error: 'Room not found' });
            if (room.players.length >= 2) return callback?.({ success: false, error: 'Room full' });
            if (room.players.some(p => p.socketId === socket.id))
                return callback?.({ success: false, error: 'Already in room' });

            room.players.push({ userId: userId || socket.id, color: 'b', socketId: socket.id });
            room.status = 'playing';
            await room.save();

            socket.join(roomCode);
            socket.emit('joinedRoom', { roomCode, color: 'b' });
            socket.to(roomCode).emit('opponentJoined', { roomCode });
            io.to(roomCode).emit('gameStart', { fen: room.currentFen, turn: room.turn });
            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Join room error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    // Make a move
    socket.on('makeMove', async (data, callback) => {
        try {
            const { roomCode, move, userId } = data;
            const room = await Room.findOne({ roomCode });
            if (!room || room.status !== 'playing') {
                return callback?.({ success: false, error: 'Game not active' });
            }

            const player = room.players.find(
                p => p.userId === userId || p.socketId === socket.id
            );
            if (!player) return callback?.({ success: false, error: 'Not a player' });

            const color = player.color;
            const validation = validateMove(room.currentFen, move, color);
            if (!validation.success) return callback?.({ success: false, error: validation.error });

            room.currentFen = validation.fen;
            room.turn = room.turn === 'w' ? 'b' : 'w';
            room.moveHistory.push({
                from: move.from,
                to: move.to,
                promotion: validation.promotion,
                san: validation.san,
                fen: validation.fen,
                turn: color
            });

            if (validation.checkmate || validation.stalemate) {
                room.status = 'completed';
                room.winner = validation.checkmate ? color : 'draw';
            }

            await room.save();

            io.to(roomCode).emit('moveMade', {
                fen: validation.fen,
                move: { from: move.from, to: move.to, promotion: validation.promotion },
                san: validation.san,
                capture: validation.capture,
                check: validation.check,
                checkmate: validation.checkmate,
                stalemate: validation.stalemate,
                turn: room.turn
            });

            if (room.status === 'completed') {
                io.to(roomCode).emit('gameOver', {
                    winner: room.winner,
                    reason: validation.checkmate ? 'checkmate' : 'stalemate'
                });
            }

            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Make move error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    // Disconnect handling (optional)
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Here you could update the room to mark the player as disconnected
    });
};