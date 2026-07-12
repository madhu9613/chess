import Room from '../models/Room.js';
import Game from '../models/Game.js';
import { validateMove } from '../utils/chessValidator.js';
import { chooseAIMove } from '../utils/socketfish.js';
import { START_FEN, buildFFN } from '../utils/ffn.js';

const buildPlayerPayload = (players) => players.map((player) => ({
    userId: player.userId,
    color: player.color
}));

const MAX_CHAT_MESSAGES = 40;
const GUEST_CHAT_LIMIT = 5;

const getAuthenticatedUser = (socket) => socket.data?.authUser || null;

const getGuestCommentCount = (room, guestId) => room.guestChatCounts?.find((entry) => entry.guestId === guestId)?.count || 0;

const setGuestCommentCount = (room, guestId, count) => {
    room.guestChatCounts = room.guestChatCounts || [];
    const existing = room.guestChatCounts.find((entry) => entry.guestId === guestId);
    if (existing) {
        existing.count = count;
        return;
    }
    room.guestChatCounts.push({ guestId, count });
};

const buildChatPayload = (message) => ({
    userId: message.userId,
    name: message.name,
    role: message.role,
    message: message.message,
    createdAt: message.createdAt
});

const getSocketRole = (room, socketId) => {
    const player = room.players.find((entry) => entry.socketId === socketId);
    return player ? 'player' : 'spectator';
};

const getRoleLabel = (role, color = null) => {
    if (role === 'spectator') return 'spectator';
    return color === 'w' ? 'white' : 'black';
};

const emitRoomPresence = async (io, roomCode) => {
    const sockets = await io.in(roomCode).fetchSockets();
    const spectatorCount = sockets.filter((entry) => entry.data?.role === 'spectator').length;
    const playerCount = sockets.filter((entry) => entry.data?.role === 'player').length;

    io.to(roomCode).emit('roomPresenceUpdated', {
        roomCode,
        spectatorCount,
        playerCount
    });

    return { spectatorCount, playerCount };
};

const createUniqueRoomCode = async () => {
    while (true) {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await Room.exists({ roomCode });
        if (!existing) {
            return roomCode;
        }
    }
};

const upsertGameDocument = async (room) => {
    const ffn = buildFFN(room.moveHistory, START_FEN);
    const payload = {
        roomCode: room.roomCode,
        players: buildPlayerPayload(room.players),
        startFen: START_FEN,
        currentFen: room.currentFen,
        turn: room.turn,
        status: room.status,
        winner: room.winner,
        resultReason: room.resultReason,
        moveHistory: room.moveHistory,
        moveCount: room.moveHistory.length,
        ffn
    };

    if (room.moveHistory.length > 0) {
        payload.lastMoveAt = new Date();
    }

    if (room.status === 'completed') {
        payload.endedAt = new Date();
    }

    await Game.findOneAndUpdate(
        { roomCode: room.roomCode },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export default (io, socket) => {
    socket.on('createRoom', async (data, callback) => {
        try {
            const authUser = getAuthenticatedUser(socket);
            if (!authUser) {
                return callback?.({ success: false, error: 'Authentication required to play' });
            }

            const roomCode = await createUniqueRoomCode();
            const userId = authUser.sub;
            const room = new Room({
                roomCode,
                players: [{
                    userId,
                    color: 'w',
                    socketId: socket.id
                }],
                currentFen: START_FEN,
                ffn: buildFFN([], START_FEN)
            });
            await room.save();
            await upsertGameDocument(room);

            socket.join(roomCode);
            socket.data.roomCode = roomCode;
            socket.data.userId = userId;
            socket.data.role = 'player';
            socket.data.color = 'w';
            socket.data.name = authUser.name || 'White';
            const response = { roomCode, color: 'w', userId };
            socket.emit('roomCreated', response);
            await emitRoomPresence(io, roomCode);
            if (callback) callback({ success: true, ...response });
        } catch (err) {
            console.error('Create room error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('joinRoom', async (data, callback) => {
        try {
            const { roomCode, userId } = data || {};
            const authUser = getAuthenticatedUser(socket);
            if (!authUser) return callback?.({ success: false, error: 'Authentication required to play' });
            if (!roomCode) return callback?.({ success: false, error: 'roomCode is required' });
            const room = await Room.findOne({ roomCode });
            if (!room) return callback?.({ success: false, error: 'Room not found' });
            if (room.players.length >= 2) return callback?.({ success: false, error: 'Room full' });
            if (room.players.some(p => p.socketId === socket.id))
                return callback?.({ success: false, error: 'Already in room' });
            if (room.status === 'completed') return callback?.({ success: false, error: 'Game already completed' });

            room.players.push({ userId: authUser.sub || userId || socket.id, color: 'b', socketId: socket.id });
            room.status = 'playing';
            room.updatedAt = new Date();
            await room.save();
            await upsertGameDocument(room);

            socket.join(roomCode);
            socket.data.roomCode = roomCode;
            socket.data.userId = authUser.sub || userId || socket.id;
            socket.data.role = 'player';
            socket.data.color = 'b';
            socket.data.name = authUser.name || 'Black';
            const joinPayload = { roomCode, color: 'b', userId: authUser.sub || userId || socket.id };
            socket.emit('joinedRoom', joinPayload);
            socket.to(roomCode).emit('opponentJoined', { roomCode });
            io.to(roomCode).emit('gameStart', {
                roomCode,
                fen: room.currentFen,
                turn: room.turn,
                players: buildPlayerPayload(room.players)
            });
            await emitRoomPresence(io, roomCode);
            if (callback) callback({ success: true, ...joinPayload });
        } catch (err) {
            console.error('Join room error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('watchRoom', async (data, callback) => {
        try {
            const { roomCode, userId, name, guestId } = data || {};
            if (!roomCode) return callback?.({ success: false, error: 'roomCode is required' });

            const room = await Room.findOne({ roomCode });
            if (!room) return callback?.({ success: false, error: 'Room not found' });

            const authUser = getAuthenticatedUser(socket);
            const spectatorId = authUser?.sub || userId || guestId || socket.id;
            const spectatorName = authUser?.name || name || 'Guest';
            const guestCommentCount = authUser ? 0 : getGuestCommentCount(room, spectatorId);

            socket.join(roomCode);
            socket.data.roomCode = roomCode;
            socket.data.userId = spectatorId;
            socket.data.role = 'spectator';
            socket.data.name = spectatorName;
            socket.data.guestId = authUser ? null : spectatorId;

            const spectatorInfo = await emitRoomPresence(io, roomCode);

            socket.emit('watchRoomJoined', {
                success: true,
                roomCode,
                role: 'spectator',
                fen: room.currentFen,
                turn: room.turn,
                status: room.status,
                winner: room.winner,
                resultReason: room.resultReason,
                players: buildPlayerPayload(room.players),
                ffn: room.ffn,
                recentChat: (room.recentChat || []).map(buildChatPayload),
                spectatorCount: spectatorInfo.spectatorCount,
                playerCount: room.players.length,
                guestCommentCount,
                guestCommentLimit: authUser ? null : GUEST_CHAT_LIMIT
            });

            io.to(roomCode).emit('spectatorJoined', {
                roomCode,
                spectatorCount: spectatorInfo.spectatorCount
            });

            if (callback) callback({ success: true, roomCode, role: 'spectator' });
        } catch (err) {
            console.error('Watch room error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('getRoomState', async (data, callback) => {
        try {
            if (!data?.roomCode) return callback?.({ success: false, error: 'roomCode is required' });
            const room = await Room.findOne({ roomCode: data.roomCode });
            if (!room) return callback?.({ success: false, error: 'Room not found' });

            return callback?.({
                success: true,
                roomCode: room.roomCode,
                fen: room.currentFen,
                turn: room.turn,
                status: room.status,
                winner: room.winner,
                resultReason: room.resultReason,
                players: buildPlayerPayload(room.players),
                ffn: room.ffn,
                recentChat: (room.recentChat || []).map(buildChatPayload),
                guestCommentCount: socket.data?.guestId ? getGuestCommentCount(room, socket.data.guestId) : 0,
                guestCommentLimit: socket.data?.guestId ? GUEST_CHAT_LIMIT : null
            });
        } catch (err) {
            console.error('Get room state error:', err);
            return callback?.({ success: false, error: err.message });
        }
    });

    socket.on('sendChatMessage', async (data, callback) => {
        try {
            const { roomCode, message, name, guestId } = data || {};
            if (!roomCode || !message) {
                return callback?.({ success: false, error: 'roomCode and message are required' });
            }

            const room = await Room.findOne({ roomCode });
            if (!room) return callback?.({ success: false, error: 'Room not found' });

            const trimmedMessage = String(message).trim().slice(0, 240);
            if (!trimmedMessage) return callback?.({ success: false, error: 'Message cannot be empty' });

            const authUser = getAuthenticatedUser(socket);
            const role = getSocketRole(room, socket.id);
            const player = room.players.find((entry) => entry.socketId === socket.id);
            const spectatorGuestId = guestId || socket.data?.guestId || socket.data?.userId || socket.id;
            const userId = authUser?.sub || socket.data?.userId || player?.userId || socket.id;
            const senderName = name || socket.data?.name || (player ? `${player.color === 'w' ? 'White' : 'Black'}` : 'Spectator');

            room.recentChat = room.recentChat || [];
            if (!authUser && (role === 'spectator' || !player)) {
                const currentCount = getGuestCommentCount(room, spectatorGuestId);
                if (currentCount >= GUEST_CHAT_LIMIT) {
                    return callback?.({
                        success: false,
                        error: 'Guest chat limit reached',
                        guestCommentCount: currentCount,
                        guestCommentLimit: GUEST_CHAT_LIMIT
                    });
                }
                setGuestCommentCount(room, spectatorGuestId, currentCount + 1);
            }

            room.recentChat.push({
                userId,
                name: senderName,
                role: getRoleLabel(role, player?.color),
                message: trimmedMessage,
                createdAt: new Date()
            });
            room.recentChat = room.recentChat.slice(-MAX_CHAT_MESSAGES);
            room.updatedAt = new Date();
            await room.save();
            await upsertGameDocument(room);

            const chatPayload = buildChatPayload(room.recentChat[room.recentChat.length - 1]);
            io.to(roomCode).emit('chatMessage', {
                roomCode,
                ...chatPayload
            });

            if (callback) callback({
                success: true,
                guestCommentCount: !authUser && (role === 'spectator' || !player)
                    ? getGuestCommentCount(room, spectatorGuestId)
                    : null,
                guestCommentLimit: !authUser ? GUEST_CHAT_LIMIT : null
            });
        } catch (err) {
            console.error('Chat message error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('makeMove', async (data, callback) => {
        try {
            const { roomCode, move, userId } = data || {};
            const authUser = getAuthenticatedUser(socket);
            if (!roomCode || !move?.from || !move?.to) {
                return callback?.({ success: false, error: 'roomCode and move are required' });
            }
            if (!authUser) {
                return callback?.({ success: false, error: 'Authentication required to play' });
            }
            const room = await Room.findOne({ roomCode });
            if (!room || room.status !== 'playing') {
                return callback?.({ success: false, error: 'Game not active' });
            }

            const player = room.players.find(
                p => p.userId === authUser.sub || p.userId === userId || p.socketId === socket.id
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
            room.ffn = buildFFN(room.moveHistory, START_FEN);
            room.updatedAt = new Date();

            if (validation.checkmate || validation.stalemate) {
                room.status = 'completed';
                room.winner = validation.checkmate ? color : 'draw';
                room.resultReason = validation.checkmate ? 'checkmate' : 'stalemate';
                room.endedAt = new Date();
            }

            await room.save();
            await upsertGameDocument(room);

            io.to(roomCode).emit('moveMade', {
                roomCode,
                fen: validation.fen,
                move: { from: move.from, to: move.to, promotion: validation.promotion },
                san: validation.san,
                capture: validation.capture,
                check: validation.check,
                checkmate: validation.checkmate,
                stalemate: validation.stalemate,
                turn: room.turn,
                ffn: room.ffn
            });

            if (room.status === 'completed') {
                io.to(roomCode).emit('gameOver', {
                    winner: room.winner,
                    reason: room.resultReason,
                    ffn: room.ffn
                });
            }

            if (callback) callback({ success: true });
        } catch (err) {
            console.error('Make move error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('requestAIMove', async (data, callback) => {
        try {
            const { fen, level = 'medium' } = data || {};
            if (!fen) {
                return callback?.({ success: false, error: 'fen is required' });
            }

            const result = await chooseAIMove(fen, level);
            if (!result?.move) {
                return callback?.({ success: false, error: 'Stockfish did not return a move' });
            }

            return callback?.({ success: true, ...result });
        } catch (err) {
            console.error('AI move request error:', err);
            return callback?.({ success: false, error: err.message || 'Unable to get AI move' });
        }
    });

    socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        try {
            const roomCode = socket.data?.roomCode;
            const role = socket.data?.role;

            if (roomCode && role === 'spectator') {
                await emitRoomPresence(io, roomCode);
            }

            const room = await Room.findOne({ 'players.socketId': socket.id });
            if (!room) return;

            const disconnected = room.players.find((player) => player.socketId === socket.id);
            const remainingPlayer = room.players.find((player) => player.socketId !== socket.id);

            room.players = room.players.filter((player) => player.socketId !== socket.id);

            if (room.status === 'playing' && remainingPlayer) {
                room.status = 'completed';
                room.winner = remainingPlayer.color;
                room.resultReason = 'disconnect';
                room.endedAt = new Date();
                await room.save();
                await upsertGameDocument(room);

                io.to(room.roomCode).emit('opponentDisconnected', {
                    roomCode: room.roomCode,
                    userId: disconnected?.userId || null
                });
                io.to(room.roomCode).emit('gameOver', {
                    winner: room.winner,
                    reason: 'disconnect',
                    ffn: room.ffn
                });
                return;
            }

            if (room.players.length === 0) {
                await Room.deleteOne({ roomCode: room.roomCode });
                await Game.findOneAndUpdate(
                    { roomCode: room.roomCode },
                    {
                        status: 'abandoned',
                        resultReason: 'empty-room',
                        endedAt: new Date()
                    }
                );
                return;
            }

            room.updatedAt = new Date();
            await room.save();
            await upsertGameDocument(room);
        } catch (err) {
            console.error('Disconnect handling error:', err);
        }
    });
};