import Room from '../models/Room.js';
import Game from '../models/Game.js';
import { validateMove } from '../utils/chessValidator.js';
import { START_FEN, buildFFN } from '../utils/ffn.js';
import { redisClient } from '../config/redis.js';
import { enqueueNotification } from '../queues/notificationQueue.js';
import axios from 'axios';

const TIME_CONTROLS = {
    '5+0': 5 * 60 * 1000,
    '15+0': 15 * 60 * 1000,
};

const DISCONNECT_GRACE_MS = 50 * 1000;

const MATCH_QUEUE_PREFIX = 'matchmaking:queue:';
const MATCH_ENTRY_PREFIX = 'matchmaking:entry:';
const MATCH_MODE_PREFIX = 'matchmaking:mode:';

const CLOCK_INTERVALS = new Map();
const DISCONNECT_GRACE_TIMERS = new Map();
const DISCONNECT_GRACE_STATE = new Map();

const buildPlayerPayload = (players) => players.map((player) => ({
    userId: player.userId,
    color: player.color
}));

const MAX_CHAT_MESSAGES = 40;
const GUEST_CHAT_LIMIT = 5;

const normalizeTimeControl = (value) => {
    if (value === '5' || value === 5 || value === '5+0') return '5+0';
    if (value === '15' || value === 15 || value === '15+0') return '15+0';
    return '5+0';
};

const getInitialClockMs = (timeControl) => TIME_CONTROLS[normalizeTimeControl(timeControl)] || TIME_CONTROLS['5+0'];

const getClockPayload = (room) => ({
    whiteTimeMs: Math.max(0, Number(room.whiteTimeMs || 0)),
    blackTimeMs: Math.max(0, Number(room.blackTimeMs || 0)),
    activeColor: room.clockActiveColor || room.turn || 'w',
    running: Boolean(room.clockRunning),
    updatedAt: room.clockLastUpdatedAt || null,
});

const syncClockToNow = (room, nowMs = Date.now()) => {
    if (!room.clockRunning || !room.clockLastUpdatedAt) {
        return getClockPayload(room);
    }

    const elapsed = Math.max(0, nowMs - new Date(room.clockLastUpdatedAt).getTime());
    const activeColor = room.clockActiveColor || room.turn || 'w';

    if (activeColor === 'w') {
        room.whiteTimeMs = Math.max(0, Number(room.whiteTimeMs || 0) - elapsed);
    } else {
        room.blackTimeMs = Math.max(0, Number(room.blackTimeMs || 0) - elapsed);
    }

    room.clockLastUpdatedAt = new Date(nowMs);
    return getClockPayload(room);
};

const stopRoomClock = (roomCode) => {
    const interval = CLOCK_INTERVALS.get(roomCode);
    if (!interval) return;
    clearInterval(interval);
    CLOCK_INTERVALS.delete(roomCode);
};

const clearDisconnectGrace = (roomCode) => {
    const timeout = DISCONNECT_GRACE_TIMERS.get(roomCode);
    if (timeout) {
        clearTimeout(timeout);
    }
    DISCONNECT_GRACE_TIMERS.delete(roomCode);
    DISCONNECT_GRACE_STATE.delete(roomCode);
};

const buildRoomSnapshot = (room) => ({
    roomCode: room.roomCode,
    fen: room.currentFen,
    turn: room.turn,
    status: room.status,
    winner: room.winner,
    resultReason: room.resultReason,
    players: buildPlayerPayload(room.players),
    ffn: room.ffn,
    timeControl: room.timeControl,
    ...getClockPayload(room),
});
const restorePlayerSocket = async (io, socket, room, player, { emitResumeEvents = true } = {}) => {
    clearDisconnectGrace(room.roomCode);

    player.socketId = socket.id;
    room.updatedAt = new Date();

    if (room.status === 'playing') {
        room.clockActiveColor = room.turn || player.color;
        room.clockLastUpdatedAt = new Date();
        room.clockRunning = true;
    }

    socket.join(room.roomCode);
    socket.data.roomCode = room.roomCode;
    socket.data.userId = player.userId;
    socket.data.role = 'player';
    socket.data.color = player.color;
    socket.data.name = socket.data?.authUser?.name || (player.color === 'w' ? 'White' : 'Black');
    socket.data.matchmakingMode = null;

    await room.save();
    await upsertGameDocument(room);

    if (room.status === 'playing') {
        startRoomClock(io, room.roomCode);
    }

    socket.emit('reconnectedRoom', {
        ...buildRoomSnapshot(room),
        color: player.color,
        userId: player.userId,
    });

    if (emitResumeEvents) {
        io.to(room.roomCode).emit('opponentReconnected', {
            roomCode: room.roomCode,
            userId: player.userId,
        });
        emitClockUpdate(io, room);
        await emitRoomPresence(io, room.roomCode);
    }
};
const startDisconnectGrace = async (io, room, disconnectedPlayer, remainingPlayer) => {
    clearDisconnectGrace(room.roomCode);

    room.clockRunning = false;
    room.updatedAt = new Date();
    await room.save();
    await upsertGameDocument(room);
    emitClockUpdate(io, room);

    const expiresAt = Date.now() + DISCONNECT_GRACE_MS;
    DISCONNECT_GRACE_STATE.set(room.roomCode, {
        userId: disconnectedPlayer.userId,
        color: disconnectedPlayer.color,
        expiresAt,
    });

    io.to(room.roomCode).emit('opponentDisconnected', {
        roomCode: room.roomCode,
        userId: disconnectedPlayer.userId,
        color: disconnectedPlayer.color,
        graceMs: DISCONNECT_GRACE_MS,
        expiresAt,
    });

    io.to(room.roomCode).emit('disconnectGraceStarted', {
        roomCode: room.roomCode,
        userId: disconnectedPlayer.userId,
        color: disconnectedPlayer.color,
        graceMs: DISCONNECT_GRACE_MS,
        expiresAt,
    });

    const timeout = setTimeout(async () => {
        try {
            const pending = DISCONNECT_GRACE_STATE.get(room.roomCode);
            if (!pending || pending.userId !== disconnectedPlayer.userId) {
                return;
            }

            const currentRoom = await Room.findOne({ roomCode: room.roomCode });
            if (!currentRoom || currentRoom.status !== 'playing') {
                clearDisconnectGrace(room.roomCode);
                return;
            }

            const activePending = DISCONNECT_GRACE_STATE.get(room.roomCode);
            if (!activePending || activePending.userId !== disconnectedPlayer.userId) {
                return;
            }

            currentRoom.status = 'completed';
            currentRoom.winner = remainingPlayer.color;
            currentRoom.resultReason = 'disconnect';
            currentRoom.clockRunning = false;
            currentRoom.endedAt = new Date();
            currentRoom.updatedAt = new Date();
            await currentRoom.save();
            await upsertGameDocument(currentRoom);
            await enqueueGameResultNotifications(currentRoom);

            io.to(currentRoom.roomCode).emit('gameOver', {
                winner: currentRoom.winner,
                reason: currentRoom.resultReason,
                ffn: currentRoom.ffn,
            });
        } catch (error) {
            console.error('Disconnect grace timeout error:', error);
        } finally {
            clearDisconnectGrace(room.roomCode);
        }
    }, DISCONNECT_GRACE_MS);

    DISCONNECT_GRACE_TIMERS.set(room.roomCode, timeout);
};

const getMatchQueueKey = (timeControl) => `${MATCH_QUEUE_PREFIX}${normalizeTimeControl(timeControl)}`;
const getMatchEntryKey = (socketId) => `${MATCH_ENTRY_PREFIX}${socketId}`;
const getMatchModeKey = (socketId) => `${MATCH_MODE_PREFIX}${socketId}`;

const enqueueMatchmakingNotification = async (socketId, type, message, extra = {}) => {
    try {
        await enqueueNotification(type, {
            socketId,
            message,
            ...extra,
        });
    } catch (error) {
        console.error('Notification enqueue error:', error.message);
    }
};

const enqueueGameResultNotifications = async (room) => {
    const winnerLabel = room.winner === 'w' ? 'White' : room.winner === 'b' ? 'Black' : 'Draw';
    const reasonLabel = room.resultReason || 'finished';

    await Promise.all((room.players || []).map((player) =>
        enqueueMatchmakingNotification(
            player.socketId,
            'game_result',
            `Game ${room.roomCode}: ${winnerLabel} wins by ${reasonLabel}`,
            {
                roomCode: room.roomCode,
                userId: player.userId,
                winner: room.winner,
                resultReason: room.resultReason,
            }
        )
    ));
};

const removeFromMatchmakingQueue = async (socketId) => {
    const mode = await redisClient.get(getMatchModeKey(socketId));

    if (mode) {
        await redisClient.lrem(getMatchQueueKey(mode), 0, socketId);
    }

    for (const queueMode of Object.keys(TIME_CONTROLS)) {
        await redisClient.lrem(getMatchQueueKey(queueMode), 0, socketId);
    }

    await redisClient.del(getMatchEntryKey(socketId), getMatchModeKey(socketId));
};

const dequeueWaitingOpponent = async (io, timeControl, currentSocketId) => {
    const queueKey = getMatchQueueKey(timeControl);

    while (true) {
        const socketId = await redisClient.lpop(queueKey);
        if (!socketId) return null;
        if (socketId === currentSocketId) continue;

        const rawEntry = await redisClient.get(getMatchEntryKey(socketId));
        await redisClient.del(getMatchEntryKey(socketId), getMatchModeKey(socketId));
        if (!rawEntry) continue;

        let entry = null;
        try {
            entry = JSON.parse(rawEntry);
        } catch {
            entry = null;
        }

        if (!entry?.socketId) continue;

        const queuedSocket = io.sockets.sockets.get(entry.socketId);
        if (!queuedSocket || queuedSocket.data?.roomCode) continue;

        return entry;
    }
};

const getAuthenticatedUser = (socket) => socket.data?.authUser || null;

const restoreActiveRoomConnection = async (io, socket) => {
    const authUser = getAuthenticatedUser(socket);
    if (!authUser?.sub) {
        return;
    }

    const room = await Room.findOne({
        status: 'playing',
        'players.userId': authUser.sub,
    });

    if (!room) {
        return;
    }

    const player = room.players.find((entry) => entry.userId === authUser.sub);
    if (!player) {
        return;
    }

    if (player.socketId === socket.id) {
        socket.join(room.roomCode);
        socket.data.roomCode = room.roomCode;
        socket.data.userId = player.userId;
        socket.data.role = 'player';
        socket.data.color = player.color;
        socket.data.name = authUser.name || (player.color === 'w' ? 'White' : 'Black');
        return;
    }

    await restorePlayerSocket(io, socket, room, player);
};

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
        timeControl: normalizeTimeControl(room.timeControl),
        whiteTimeMs: Number(room.whiteTimeMs || 0),
        blackTimeMs: Number(room.blackTimeMs || 0),
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

const finalizeTimeout = (room, loserColor) => {
    room.status = 'completed';
    room.winner = loserColor === 'w' ? 'b' : 'w';
    room.resultReason = 'timeout';
    room.clockRunning = false;
    room.endedAt = new Date();
};

const emitClockUpdate = (io, room) => {
    io.to(room.roomCode).emit('gameClockUpdated', {
        roomCode: room.roomCode,
        ...getClockPayload(room),
        timeControl: normalizeTimeControl(room.timeControl),
    });
};

const startRoomClock = (io, roomCode) => {
    stopRoomClock(roomCode);

    const interval = setInterval(async () => {
        try {
            const room = await Room.findOne({ roomCode });
            if (!room) {
                stopRoomClock(roomCode);
                return;
            }

            if (room.status !== 'playing' || !room.clockRunning) {
                stopRoomClock(roomCode);
                return;
            }

            syncClockToNow(room);

            if (room.whiteTimeMs <= 0 || room.blackTimeMs <= 0) {
                const timedOutColor = room.whiteTimeMs <= 0 ? 'w' : 'b';
                finalizeTimeout(room, timedOutColor);
                await room.save();
                await upsertGameDocument(room);
                await enqueueGameResultNotifications(room);
                emitClockUpdate(io, room);
                io.to(room.roomCode).emit('gameOver', {
                    winner: room.winner,
                    reason: room.resultReason,
                    timedOutColor,
                    ffn: room.ffn,
                });
                stopRoomClock(roomCode);
                return;
            }

            await room.save();
            emitClockUpdate(io, room);
        } catch (error) {
            console.error('Clock tick error:', error);
        }
    }, 1000);

    CLOCK_INTERVALS.set(roomCode, interval);
};

export default (io, socket) => {
    void restoreActiveRoomConnection(io, socket).catch((error) => {
        console.error('Restore active room connection error:', error);
    });

    const makePlayerSocketPayload = (targetSocket, roomCode, color, userId, name) => {
        targetSocket.data.roomCode = roomCode;
        targetSocket.data.userId = userId;
        targetSocket.data.role = 'player';
        targetSocket.data.color = color;
        targetSocket.data.name = name;
        targetSocket.data.matchmakingMode = null;
    };

    socket.on('createRoom', async (data, callback) => {
        try {
            await removeFromMatchmakingQueue(socket.id);
            const authUser = getAuthenticatedUser(socket);
            if (!authUser) {
                return callback?.({ success: false, error: 'Authentication required to play' });
            }

            const timeControl = normalizeTimeControl(data?.timeControl);
            const initialClockMs = getInitialClockMs(timeControl);
            const roomCode = await createUniqueRoomCode();
            const userId = authUser.sub;
            const room = new Room({
                roomCode,
                players: [{
                    userId,
                    color: 'w',
                    socketId: socket.id
                }],
                timeControl,
                whiteTimeMs: initialClockMs,
                blackTimeMs: initialClockMs,
                clockActiveColor: 'w',
                clockLastUpdatedAt: null,
                clockRunning: false,
                currentFen: START_FEN,
                ffn: buildFFN([], START_FEN)
            });
            await room.save();
            await upsertGameDocument(room);

            socket.join(roomCode);
            makePlayerSocketPayload(socket, roomCode, 'w', userId, authUser.name || 'White');
            const response = { roomCode, color: 'w', userId, timeControl, ...getClockPayload(room) };
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
            await removeFromMatchmakingQueue(socket.id);
            const { roomCode, userId } = data || {};
            const authUser = getAuthenticatedUser(socket);
            if (!authUser) return callback?.({ success: false, error: 'Authentication required to play' });
            if (!roomCode) return callback?.({ success: false, error: 'roomCode is required' });
            const room = await Room.findOne({ roomCode });
            if (!room) return callback?.({ success: false, error: 'Room not found' });
            const existingPlayer = room.players.find((player) => player.userId === authUser.sub || player.socketId === socket.id);
            if (room.status === 'completed') return callback?.({ success: false, error: 'Game already completed' });

            if (existingPlayer) {
                await restorePlayerSocket(io, socket, room, existingPlayer);

                const joinPayload = {
                    roomCode,
                    color: existingPlayer.color,
                    userId: existingPlayer.userId,
                    timeControl: room.timeControl,
                    ...getClockPayload(room),
                };

                if (callback) callback({ success: true, ...joinPayload });
                return;
            }

            if (room.players.length >= 2) return callback?.({ success: false, error: 'Room full' });

            room.players.push({ userId: authUser.sub || userId || socket.id, color: 'b', socketId: socket.id });
            room.status = 'playing';
            room.timeControl = normalizeTimeControl(room.timeControl);
            const initialClockMs = getInitialClockMs(room.timeControl);
            room.whiteTimeMs = Number(room.whiteTimeMs || initialClockMs);
            room.blackTimeMs = Number(room.blackTimeMs || initialClockMs);
            room.clockActiveColor = room.turn || 'w';
            room.clockLastUpdatedAt = new Date();
            room.clockRunning = true;
            room.updatedAt = new Date();
            await room.save();
            await upsertGameDocument(room);
            startRoomClock(io, roomCode);

            socket.join(roomCode);
            makePlayerSocketPayload(socket, roomCode, 'b', authUser.sub || userId || socket.id, authUser.name || 'Black');
            const joinPayload = {
                roomCode,
                color: 'b',
                userId: authUser.sub || userId || socket.id,
                timeControl: room.timeControl,
                ...getClockPayload(room),
            };
            socket.emit('joinedRoom', joinPayload);
            socket.to(roomCode).emit('opponentJoined', { roomCode });
            io.to(roomCode).emit('gameStart', {
                roomCode,
                fen: room.currentFen,
                turn: room.turn,
                players: buildPlayerPayload(room.players),
                timeControl: room.timeControl,
                ...getClockPayload(room),
            });
            emitClockUpdate(io, room);
            await emitRoomPresence(io, roomCode);
            if (callback) callback({ success: true, ...joinPayload });
        } catch (err) {
            console.error('Join room error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('findMatch', async (data, callback) => {
        try {
            const authUser = getAuthenticatedUser(socket);
            if (!authUser) {
                return callback?.({ success: false, error: 'Authentication required to play' });
            }

            if (socket.data?.roomCode) {
                return callback?.({ success: false, error: 'Leave current room before matchmaking' });
            }

            const timeControl = normalizeTimeControl(data?.timeControl);
            await removeFromMatchmakingQueue(socket.id);

            const opponentEntry = await dequeueWaitingOpponent(io, timeControl, socket.id);

            if (!opponentEntry) {
                const entry = {
                    socketId: socket.id,
                    userId: authUser.sub,
                    name: authUser.name || 'Player',
                    queuedAt: Date.now(),
                };

                await redisClient.set(getMatchEntryKey(socket.id), JSON.stringify(entry), 'EX', 300);
                await redisClient.set(getMatchModeKey(socket.id), timeControl, 'EX', 300);
                await redisClient.rpush(getMatchQueueKey(timeControl), socket.id);

                const queueSize = await redisClient.llen(getMatchQueueKey(timeControl));
                socket.data.matchmakingMode = timeControl;
                socket.emit('matchmakingQueued', { timeControl, queueSize });

                await enqueueMatchmakingNotification(
                    socket.id,
                    'matchmaking_queued',
                    `Queued for ${timeControl} matchmaking`,
                    { timeControl, queueSize }
                );

                return callback?.({ success: true, queued: true, timeControl, queueSize });
            }

            const opponentSocket = io.sockets.sockets.get(opponentEntry.socketId);
            if (!opponentSocket) {
                return callback?.({ success: false, error: 'Matchmaking failed, please retry' });
            }

            const roomCode = await createUniqueRoomCode();
            const initialClockMs = getInitialClockMs(timeControl);

            const room = new Room({
                roomCode,
                players: [
                    { userId: opponentEntry.userId, color: 'w', socketId: opponentSocket.id },
                    { userId: authUser.sub, color: 'b', socketId: socket.id },
                ],
                timeControl,
                whiteTimeMs: initialClockMs,
                blackTimeMs: initialClockMs,
                clockActiveColor: 'w',
                clockLastUpdatedAt: new Date(),
                clockRunning: true,
                currentFen: START_FEN,
                status: 'playing',
                ffn: buildFFN([], START_FEN),
            });

            await room.save();
            await upsertGameDocument(room);
            startRoomClock(io, roomCode);

            opponentSocket.join(roomCode);
            socket.join(roomCode);

            makePlayerSocketPayload(opponentSocket, roomCode, 'w', opponentEntry.userId, opponentEntry.name || 'White');
            makePlayerSocketPayload(socket, roomCode, 'b', authUser.sub, authUser.name || 'Black');

            const clockPayload = getClockPayload(room);
            opponentSocket.emit('roomCreated', { roomCode, color: 'w', userId: opponentEntry.userId, timeControl, ...clockPayload });
            socket.emit('joinedRoom', { roomCode, color: 'b', userId: authUser.sub, timeControl, ...clockPayload });

            io.to(roomCode).emit('opponentJoined', { roomCode });
            io.to(roomCode).emit('gameStart', {
                roomCode,
                fen: room.currentFen,
                turn: room.turn,
                players: buildPlayerPayload(room.players),
                timeControl,
                ...clockPayload,
            });
            emitClockUpdate(io, room);
            await emitRoomPresence(io, roomCode);

            opponentSocket.emit('matchFound', { roomCode, color: 'w', timeControl });
            socket.emit('matchFound', { roomCode, color: 'b', timeControl });

            await Promise.all([
                enqueueMatchmakingNotification(
                    opponentSocket.id,
                    'match_found',
                    `Match found (${timeControl}) in room ${roomCode}`,
                    { roomCode, timeControl, color: 'w', userId: opponentEntry.userId }
                ),
                enqueueMatchmakingNotification(
                    socket.id,
                    'match_found',
                    `Match found (${timeControl}) in room ${roomCode}`,
                    { roomCode, timeControl, color: 'b', userId: authUser.sub }
                ),
            ]);

            return callback?.({ success: true, queued: false, roomCode, color: 'b', timeControl });
        } catch (err) {
            console.error('Find match error:', err);
            return callback?.({ success: false, error: err.message || 'Unable to match players' });
        }
    });

    socket.on('cancelMatchmaking', async (data, callback) => {
        const ack = typeof data === 'function' ? data : (typeof callback === 'function' ? callback : null);
        await removeFromMatchmakingQueue(socket.id);
        socket.data.matchmakingMode = null;
        socket.emit('matchmakingCanceled', { success: true });
        return ack?.({ success: true });
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
                timeControl: room.timeControl,
                ...getClockPayload(room),
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
                timeControl: room.timeControl,
                ...getClockPayload(room),
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
            syncClockToNow(room);
            if ((color === 'w' && room.whiteTimeMs <= 0) || (color === 'b' && room.blackTimeMs <= 0)) {
                finalizeTimeout(room, color);
                await room.save();
                await upsertGameDocument(room);
                await enqueueGameResultNotifications(room);
                emitClockUpdate(io, room);
                io.to(roomCode).emit('gameOver', {
                    winner: room.winner,
                    reason: room.resultReason,
                    timedOutColor: color,
                    ffn: room.ffn,
                });
                stopRoomClock(roomCode);
                return callback?.({ success: false, error: 'Time is over' });
            }

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
            room.clockActiveColor = room.turn;
            room.clockLastUpdatedAt = new Date();
            room.clockRunning = room.status === 'playing';
            room.updatedAt = new Date();

            if (validation.checkmate || validation.stalemate) {
                room.status = 'completed';
                room.winner = validation.checkmate ? color : 'draw';
                room.resultReason = validation.checkmate ? 'checkmate' : 'stalemate';
                room.endedAt = new Date();
                room.clockRunning = false;
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
                ffn: room.ffn,
                timeControl: room.timeControl,
                ...getClockPayload(room),
            });

            emitClockUpdate(io, room);

            if (room.status === 'completed') {
                stopRoomClock(roomCode);
                await enqueueGameResultNotifications(room);
                io.to(roomCode).emit('gameOver', {
                    winner: room.winner,
                    reason: room.resultReason,
                    ffn: room.ffn
                });
            }

            if (callback) callback({ success: true, ...getClockPayload(room) });
        } catch (err) {
            console.error('Make move error:', err);
            if (callback) callback({ success: false, error: err.message });
        }
    });

    socket.on('resignGame', async (data, callback) => {
        try {
            const { roomCode, userId } = data || {};
            const authUser = getAuthenticatedUser(socket);
            if (!authUser) {
                return callback?.({ success: false, error: 'Authentication required to resign' });
            }
            if (!roomCode) {
                return callback?.({ success: false, error: 'roomCode is required' });
            }

            const room = await Room.findOne({ roomCode });
            if (!room || room.status !== 'playing') {
                return callback?.({ success: false, error: 'Game not active' });
            }

            const resigningPlayer = room.players.find(
                (player) => player.userId === authUser.sub || player.userId === userId || player.socketId === socket.id
            );

            if (!resigningPlayer) {
                return callback?.({ success: false, error: 'Not a player in this room' });
            }

            room.status = 'completed';
            room.winner = resigningPlayer.color === 'w' ? 'b' : 'w';
            room.resultReason = 'resignation';
            room.clockRunning = false;
            room.endedAt = new Date();
            room.updatedAt = new Date();
            await room.save();
            await upsertGameDocument(room);
            stopRoomClock(room.roomCode);
            await enqueueGameResultNotifications(room);

            emitClockUpdate(io, room);
            io.to(room.roomCode).emit('gameOver', {
                winner: room.winner,
                reason: room.resultReason,
                ffn: room.ffn,
            });

            return callback?.({
                success: true,
                winner: room.winner,
                reason: room.resultReason,
            });
        } catch (err) {
            console.error('Resign game error:', err);
            return callback?.({ success: false, error: err.message || 'Unable to resign game' });
        }
    });


    /// ai request ;
    socket.on('requestAIMove', async (data, callback) => {
        try {
            const { fen, level = 'medium' } = data || {};
            const ack = typeof callback === 'function' ? callback : null;

            console.log('[Socket][AI] requestAIMove received', {
                socketId: socket.id,
                hasAck: Boolean(ack),
                level,
                fen,
            });

            if (!fen) {
                console.warn('[Socket][AI] requestAIMove rejected: fen is required');
                return ack?.({ success: false, error: 'fen is required' });
            }

            const STOCKFISH_URL = process.env.STOCKFISH_SERVICE_URL || 'http://localhost:3001';
            const response = await axios.post(`${STOCKFISH_URL}/move`, { fen, level }, { timeout: 20000 });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Stockfish service error');
            }

            const result = response.data; // already has { success: true, move, analysis, ... }
            if (!result.move) {
                console.warn('[Socket][AI] requestAIMove: no move returned');
                return ack?.({ success: false, error: 'Stockfish did not return a move' });
            }

            console.log('[Socket][AI] requestAIMove success', {
                socketId: socket.id,
                level,
                move: result.move,
            });

            return ack?.({ success: true, ...result });
        } catch (err) {
            console.error('AI move request error:', err);
            if (err.code === 'ECONNABORTED') {
                return (typeof callback === 'function' ? callback : null)?.({
                    success: false,
                    error: 'Stockfish service timed out'
                });
            }
            return (typeof callback === 'function' ? callback : null)?.({
                success: false,
                error: err.message || 'Unable to get AI move'
            });
        }
    });


    socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        try {
            await removeFromMatchmakingQueue(socket.id);
            const roomCode = socket.data?.roomCode;
            const role = socket.data?.role;

            if (roomCode && role === 'spectator') {
                await emitRoomPresence(io, roomCode);
            }

            const room = await Room.findOne({ 'players.socketId': socket.id });
            if (!room) return;

            const disconnected = room.players.find((player) => player.socketId === socket.id);
            const remainingPlayer = room.players.find((player) => player.socketId !== socket.id);

            if (room.status === 'playing' && remainingPlayer && disconnected) {
                syncClockToNow(room);
                stopRoomClock(room.roomCode);
                await startDisconnectGrace(io, room, disconnected, remainingPlayer);
                return;
            }

            room.players = room.players.filter((player) => player.socketId !== socket.id);

            if (room.players.length === 0) {
                stopRoomClock(room.roomCode);
                clearDisconnectGrace(room.roomCode);
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