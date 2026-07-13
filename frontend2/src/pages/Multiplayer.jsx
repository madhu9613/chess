import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import LiveChat from '../components/LiveChat';
import socket from '../socket/socket';
import { motion } from 'framer-motion';
import { Globe2, Link2, Copy, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    applyMultiplayerMove,
    clearMultiplayerState,
    resetGame,
    selectIsMyTurn,
    selectOpponentJoined,
    selectPlayerColor,
    selectRoomId,
    setMyTurn,
    setOpponentJoined,
    setPlayerColor,
    setRoomId,
    syncGameState
} from '../store/gameSlice';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const MATCH_MODES = [
    { id: '5+0', label: '5 min' },
    { id: '15+0', label: '15 min' },
];

const formatClock = (timeMs) => {
    const safeMs = Math.max(0, Number(timeMs || 0));
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const colorLabel = (value) => {
    if (value === 'w') return 'White';
    if (value === 'b') return 'Black';
    if (value === 'draw') return 'Draw';
    return String(value || 'Unknown');
};

const Multiplayer = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const roomId = useSelector(selectRoomId);
    const playerColor = useSelector(selectPlayerColor);
    const isMyTurn = useSelector(selectIsMyTurn);
    const opponentJoined = useSelector(selectOpponentJoined);

    const [roomInput, setRoomInput] = useState('');
    const [status, setStatus] = useState('Create or join a room to start multiplayer.');
    const [error, setError] = useState('');
    const [connectionState, setConnectionState] = useState(socket.connected ? 'connected' : 'disconnected');
    const [savedFFN, setSavedFFN] = useState('');
    const [isLoadingRoomInfo, setIsLoadingRoomInfo] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const [liveChatHistory, setLiveChatHistory] = useState([]);
    const [spectatorCount, setSpectatorCount] = useState(0);
    const [selectedMode, setSelectedMode] = useState('5+0');
    const [timeControl, setTimeControl] = useState('5+0');
    const [whiteTimeMs, setWhiteTimeMs] = useState(5 * 60 * 1000);
    const [blackTimeMs, setBlackTimeMs] = useState(5 * 60 * 1000);
    const [clockRunning, setClockRunning] = useState(false);
    const [clockActiveColor, setClockActiveColor] = useState('w');
    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [isResigning, setIsResigning] = useState(false);
    const [showResignConfirm, setShowResignConfirm] = useState(false);
    const resetTimerRef = useRef(null);
    const handledNotificationRef = useRef(null);

    const resetMultiplayerView = () => {
        dispatch(clearMultiplayerState());
        dispatch(resetGame());
        dispatch(syncGameState({ fen: START_FEN }));
        setRoomInput('');
        setSavedFFN('');
        setRoomInfo(null);
        setLiveChatHistory([]);
        setSpectatorCount(0);
        setClockRunning(false);
        setClockActiveColor('w');
        setWhiteTimeMs(5 * 60 * 1000);
        setBlackTimeMs(5 * 60 * 1000);
        setShowResignConfirm(false);
    };

    useEffect(() => {
        const onConnect = () => setConnectionState('connected');
        const onDisconnect = () => setConnectionState('disconnected');

        const applyClockPayload = (payload) => {
            if (typeof payload?.whiteTimeMs === 'number') setWhiteTimeMs(payload.whiteTimeMs);
            if (typeof payload?.blackTimeMs === 'number') setBlackTimeMs(payload.blackTimeMs);
            if (payload?.activeColor) setClockActiveColor(payload.activeColor);
            if (typeof payload?.running === 'boolean') setClockRunning(payload.running);
            if (payload?.timeControl) setTimeControl(payload.timeControl);
        };

        const onRoomCreated = ({ roomCode, color, timeControl: roomMode, ...clockPayload }) => {
            dispatch(clearMultiplayerState());
            dispatch(resetGame());
            dispatch(syncGameState({ fen: START_FEN }));
            dispatch(setRoomId(roomCode));
            dispatch(setPlayerColor(color));
            dispatch(setOpponentJoined(false));
            dispatch(setMyTurn(false));
            setIsMatchmaking(false);
            setStatus(`Room created: ${roomCode}. Share this code with your friend.`);
            setSavedFFN('');
            setRoomInfo(null);
            setLiveChatHistory([]);
            setSpectatorCount(0);
            setTimeControl(roomMode || selectedMode);
            applyClockPayload(clockPayload);
            setError('');
        };

        const onJoinedRoom = ({ roomCode, color, timeControl: roomMode, ...clockPayload }) => {
            dispatch(clearMultiplayerState());
            dispatch(resetGame());
            dispatch(syncGameState({ fen: START_FEN }));
            dispatch(setRoomId(roomCode));
            dispatch(setPlayerColor(color));
            dispatch(setOpponentJoined(true));
            dispatch(setMyTurn(false));
            setIsMatchmaking(false);
            setStatus(`Joined room ${roomCode}. Waiting for game sync...`);
            setSavedFFN('');
            setRoomInfo(null);
            setLiveChatHistory([]);
            setSpectatorCount(0);
            setTimeControl(roomMode || selectedMode);
            applyClockPayload(clockPayload);
            setError('');
        };

        const onOpponentJoined = ({ roomCode }) => {
            dispatch(setOpponentJoined(true));
            setStatus(`Opponent joined room ${roomCode}. Game started.`);
        };

        const onGameStart = ({ fen, turn, timeControl: roomMode, ...clockPayload }) => {
            dispatch(syncGameState({ fen }));
            dispatch(setMyTurn(turn === playerColor));
            setTimeControl(roomMode || selectedMode);
            applyClockPayload(clockPayload);
            setStatus('Game started. Good luck!');
        };

        const onMoveMade = ({ move, fen, turn, ...clockPayload }) => {
            dispatch(applyMultiplayerMove({ move, fen }));
            dispatch(setMyTurn(turn === playerColor));
            applyClockPayload(clockPayload);
            setRoomInfo((current) => (current ? { ...current, currentFen: fen, moveCount: (current.moveCount || 0) + 1, turn } : current));
        };

        const onGameOver = ({ winner, reason, timedOutColor, ffn }) => {
            dispatch(setMyTurn(false));
            setClockRunning(false);
            setSavedFFN(ffn || '');
            const didIWin = winner && winner === playerColor;
            const winnerText = colorLabel(winner);

            if (reason === 'timeout') {
                const timedOutText = colorLabel(timedOutColor);
                setStatus(`Game over: ${winnerText} wins by timeout (${timedOutText} flagged). Saved to recent games.`);
                return;
            }
            if (reason === 'resignation') {
                setStatus(`Game over: ${winnerText} wins by resignation. Saved to recent games. Resetting...`);
                if (resetTimerRef.current) {
                    window.clearTimeout(resetTimerRef.current);
                }
                resetTimerRef.current = window.setTimeout(() => {
                    resetMultiplayerView();
                    setStatus('Create or join a room to start multiplayer.');
                }, 2200);
                return;
            }
            setStatus(`Game over: ${reason}. Winner: ${winner === 'draw' ? 'Draw' : winner}`);
        };

        const onOpponentDisconnected = () => {
            dispatch(setMyTurn(false));
            setStatus('Opponent disconnected. You can create a new room.');
        };

        const onChatMessage = (payload) => {
            if (payload?.roomCode !== roomId) return;
            setLiveChatHistory((current) => [...current.slice(-39), payload]);
        };

        const onPresenceUpdated = ({ roomCode, spectatorCount: viewers }) => {
            if (roomCode !== roomId) return;
            setSpectatorCount(viewers || 0);
        };

        const onClockUpdated = (payload) => {
            if (payload?.roomCode !== roomId) return;
            applyClockPayload(payload);
        };

        const onMatchmakingQueued = ({ timeControl: queuedMode, queueSize }) => {
            setIsMatchmaking(true);
            setStatus(`Searching ${queuedMode} game... queue size ${queueSize || 1}`);
        };

        const onMatchmakingCanceled = () => {
            setIsMatchmaking(false);
            setStatus('Matchmaking canceled.');
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('roomCreated', onRoomCreated);
        socket.on('joinedRoom', onJoinedRoom);
        socket.on('opponentJoined', onOpponentJoined);
        socket.on('gameStart', onGameStart);
        socket.on('moveMade', onMoveMade);
        socket.on('gameOver', onGameOver);
        socket.on('opponentDisconnected', onOpponentDisconnected);
        socket.on('chatMessage', onChatMessage);
        socket.on('roomPresenceUpdated', onPresenceUpdated);
        socket.on('gameClockUpdated', onClockUpdated);
        socket.on('matchmakingQueued', onMatchmakingQueued);
        socket.on('matchmakingCanceled', onMatchmakingCanceled);

        return () => {
            if (resetTimerRef.current) {
                window.clearTimeout(resetTimerRef.current);
            }
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('roomCreated', onRoomCreated);
            socket.off('joinedRoom', onJoinedRoom);
            socket.off('opponentJoined', onOpponentJoined);
            socket.off('gameStart', onGameStart);
            socket.off('moveMade', onMoveMade);
            socket.off('gameOver', onGameOver);
            socket.off('opponentDisconnected', onOpponentDisconnected);
            socket.off('chatMessage', onChatMessage);
            socket.off('roomPresenceUpdated', onPresenceUpdated);
            socket.off('gameClockUpdated', onClockUpdated);
            socket.off('matchmakingQueued', onMatchmakingQueued);
            socket.off('matchmakingCanceled', onMatchmakingCanceled);
        };
    }, [dispatch, playerColor, roomId, selectedMode]);

    const createRoom = () => {
        socket.emit('createRoom', { timeControl: selectedMode }, (response) => {
            if (!response?.success) {
                setError(response?.error || 'Failed to create room');
            }
        });
    };

    const findMatch = () => {
        setError('');
        socket.emit('findMatch', { timeControl: selectedMode }, (response) => {
            if (!response?.success) {
                setError(response?.error || 'Failed to queue for match');
                return;
            }

            if (response.queued) {
                setIsMatchmaking(true);
                setStatus(`Searching for ${selectedMode} game...`);
            }
        });
    };

    const cancelMatchmaking = () => {
        socket.emit('cancelMatchmaking', () => {
            setIsMatchmaking(false);
            setStatus('Matchmaking canceled.');
        });
    };

    const joinRoom = () => {
        const roomCode = roomInput.trim().toUpperCase();
        if (!roomCode) {
            setError('Enter a valid room code');
            return;
        }

        socket.emit('joinRoom', { roomCode }, (response) => {
            if (!response?.success) {
                setError(response?.error || 'Failed to join room');
                return;
            }
            setError('');
        });
    };

    const copyRoomCode = async () => {
        if (!roomId) return;
        try {
            await navigator.clipboard.writeText(roomId);
            setStatus('Room code copied to clipboard.');
        } catch {
            setStatus(`Room code: ${roomId}`);
        }
    };

    const resignGame = () => {
        if (!roomId || !isAuthenticated || isResigning) return;
        setShowResignConfirm(true);
    };

    const confirmResignGame = () => {
        if (!roomId || !isAuthenticated || isResigning) return;
        setIsResigning(true);
        socket.emit('resignGame', { roomCode: roomId }, (response) => {
            setIsResigning(false);
            setShowResignConfirm(false);
            if (!response?.success) {
                setError(response?.error || 'Could not resign game');
                return;
            }
            setStatus('You resigned the game.');
            setError('');
        });
    };

    const syncFromServer = () => {
        if (!roomId) return;
        socket.emit('getRoomState', { roomCode: roomId }, (response) => {
            if (!response?.success) {
                setError(response?.error || 'Unable to sync room state');
                return;
            }
            dispatch(syncGameState({ fen: response.fen }));
            dispatch(setMyTurn(response.turn === playerColor));
            setStatus(response.status === 'completed'
                ? `Game over: ${response.resultReason || 'completed'}. Winner: ${response.winner || 'draw'}`
                : 'Room synced with server.');
            setSavedFFN(response.ffn || '');
            setLiveChatHistory(response.recentChat || []);
            if (response.timeControl) setTimeControl(response.timeControl);
            if (typeof response.whiteTimeMs === 'number') setWhiteTimeMs(response.whiteTimeMs);
            if (typeof response.blackTimeMs === 'number') setBlackTimeMs(response.blackTimeMs);
            if (response.activeColor) setClockActiveColor(response.activeColor);
            if (typeof response.running === 'boolean') setClockRunning(response.running);
            setError('');
        });
    };

    const loadRoomInfo = async () => {
        if (!roomId) return;
        setIsLoadingRoomInfo(true);
        try {
            const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/${roomId}`);
            const data = await result.json();
            if (!result.ok || !data.success) {
                setError(data.error || 'Failed to fetch room details');
                return;
            }
            setRoomInfo(data.room);
            setLiveChatHistory(data.room?.recentChat || []);
            if (data.room?.timeControl) setTimeControl(data.room.timeControl);
            if (typeof data.room?.whiteTimeMs === 'number') setWhiteTimeMs(data.room.whiteTimeMs);
            if (typeof data.room?.blackTimeMs === 'number') setBlackTimeMs(data.room.blackTimeMs);
            if (data.room?.clockActiveColor) setClockActiveColor(data.room.clockActiveColor);
            if (typeof data.room?.clockRunning === 'boolean') setClockRunning(data.room.clockRunning);
            setError('');
        } catch {
            setError('Failed to fetch room details');
        } finally {
            setIsLoadingRoomInfo(false);
        }
    };

    useEffect(() => {
        if (!roomId || !socket.connected) return;
        socket.emit('getRoomState', { roomCode: roomId }, (response) => {
            if (!response?.success) return;
            dispatch(syncGameState({ fen: response.fen }));
            dispatch(setMyTurn(response.turn === playerColor));
            setSavedFFN(response.ffn || '');
            setLiveChatHistory(response.recentChat || []);
            if (response.timeControl) setTimeControl(response.timeControl);
            if (typeof response.whiteTimeMs === 'number') setWhiteTimeMs(response.whiteTimeMs);
            if (typeof response.blackTimeMs === 'number') setBlackTimeMs(response.blackTimeMs);
            if (response.activeColor) setClockActiveColor(response.activeColor);
            if (typeof response.running === 'boolean') setClockRunning(response.running);
        });
    }, [dispatch, playerColor, roomId, connectionState]);

    useEffect(() => {
        const navNotification = location.state?.notification;
        const roomCode = String(navNotification?.roomCode || '').trim().toUpperCase();
        if (!roomCode) return;

        const signature = `${roomCode}:${navNotification?.type || 'unknown'}`;
        if (handledNotificationRef.current === signature) return;
        handledNotificationRef.current = signature;

        setRoomInput(roomCode);
        setStatus(`Opened room ${roomCode} from notification.`);
        setError('');

        const userId = user?.id || user?._id || user?.sub || null;

        if (isAuthenticated && socket.connected) {
            socket.emit('getRoomState', { roomCode }, (response) => {
                if (!response?.success) {
                    setStatus(`Opened room ${roomCode}. Use Join Room if needed.`);
                    return;
                }

                dispatch(setRoomId(roomCode));
                dispatch(syncGameState({ fen: response.fen || START_FEN }));

                const playerEntry = Array.isArray(response.players)
                    ? response.players.find((player) => player.userId === userId)
                    : null;

                if (playerEntry?.color) {
                    dispatch(setPlayerColor(playerEntry.color));
                    dispatch(setMyTurn(response.turn === playerEntry.color));
                }

                dispatch(setOpponentJoined((response.players || []).length >= 2));
                setSavedFFN(response.ffn || '');
                setLiveChatHistory(response.recentChat || []);
                if (response.timeControl) setTimeControl(response.timeControl);
                if (typeof response.whiteTimeMs === 'number') setWhiteTimeMs(response.whiteTimeMs);
                if (typeof response.blackTimeMs === 'number') setBlackTimeMs(response.blackTimeMs);
                if (response.activeColor) setClockActiveColor(response.activeColor);
                if (typeof response.running === 'boolean') setClockRunning(response.running);
                setStatus('Room synced from notification context.');
            });
        }

        navigate(location.pathname, { replace: true, state: null });
    }, [dispatch, isAuthenticated, location.pathname, location.state, navigate, user, socket.connected]);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-7xl flex-col gap-6">
            <div className="surface-panel rounded-[1.75rem] p-5">
                {!isAuthenticated && (
                    <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                        Sign in to create rooms, join as a player, or make moves. Guests can still use the Watch Live page.
                        <div className="mt-3">
                            <Link to="/auth?returnTo=/multiplayer" className="inline-flex items-center rounded-2xl border border-amber-300/20 bg-amber-300/15 px-3 py-2 font-semibold text-white transition-colors hover:bg-amber-300/25">
                                Sign in now
                            </Link>
                        </div>
                    </div>
                )}
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-[0.35em] text-white/40">Multiplayer Lobby</div>
                        <h2 className="mt-1 text-2xl font-semibold text-white">Create, match, and play with clocks.</h2>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                        connectionState === 'connected'
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                            : 'border-red-500/30 bg-red-500/15 text-red-200'
                    }`}>
                        Socket: {connectionState}
                    </span>
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 text-xs uppercase tracking-[0.3em] text-white/45">Match Mode</div>
                    <div className="flex flex-wrap gap-2">
                        {MATCH_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${selectedMode === mode.id
                                    ? 'border-amber-300/30 bg-amber-300/15 text-amber-100'
                                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_1fr]">
                    <button
                        onClick={createRoom}
                        disabled={!isAuthenticated}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/15 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Globe2 size={18} />
                        Create Room
                    </button>
                    <input
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        placeholder="Enter room code"
                        className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-amber-300/40"
                    />
                    <button
                        onClick={joinRoom}
                        disabled={!isAuthenticated}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/15 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Link2 size={18} />
                        Join Room
                    </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <button
                        onClick={findMatch}
                        disabled={!isAuthenticated || isMatchmaking || Boolean(roomId)}
                        className="rounded-2xl border border-blue-300/25 bg-blue-300/15 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-300/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isMatchmaking ? 'Searching...' : `Find Match (${selectedMode})`}
                    </button>
                    <button
                        onClick={cancelMatchmaking}
                        disabled={!isMatchmaking}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Cancel Matchmaking
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        onClick={syncFromServer}
                        disabled={!roomId}
                        className="rounded-2xl border border-blue-400/30 bg-blue-400/15 px-3 py-2 text-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Sync Room State
                    </button>
                    <button
                        onClick={loadRoomInfo}
                        disabled={!roomId || isLoadingRoomInfo}
                        className="rounded-2xl border border-violet-400/30 bg-violet-400/15 px-3 py-2 text-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isLoadingRoomInfo ? 'Loading...' : 'Load Room Info'}
                    </button>
                    <button
                        onClick={copyRoomCode}
                        disabled={!roomId}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Copy size={16} className="mr-2 inline" />
                        Copy Room Code
                    </button>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-white/72 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Status: {status}</div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Time Control: <span className="font-semibold text-white">{timeControl}</span></div>
                    {roomId && <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Room: <span className="font-semibold text-amber-100">{roomId}</span></div>}
                    {playerColor && <div className="rounded-2xl border border-white/10 bg-white/5 p-3">You are: <span className="font-semibold text-white">{playerColor === 'w' ? 'White' : 'Black'}</span></div>}
                    {savedFFN && <div className="break-all rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-100">Saved FFN: {savedFFN}</div>}
                    {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-red-200">{error}</div>}
                </div>

                {roomInfo && (
                    <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm">
                        <div className="mb-2 font-semibold text-white">Room Snapshot</div>
                        <div>Status: {roomInfo.status}</div>
                        <div>Mode: {roomInfo.timeControl || timeControl}</div>
                        <div>Moves: {roomInfo.moveCount}</div>
                        <div>Players: {roomInfo.playerCount}</div>
                        <div>Turn: {roomInfo.turn}</div>
                        <div>Watching: {spectatorCount}</div>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className={`rounded-2xl border p-4 ${clockActiveColor === 'w' && clockRunning ? 'border-emerald-300/30 bg-emerald-300/10' : 'border-white/10 bg-white/5'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.3em] text-white/45">White</div>
                                    <div className="mt-1 text-sm font-semibold text-white">{playerColor === 'w' ? `${user?.name || 'You'} (You)` : 'Opponent'}</div>
                                </div>
                                <div className="text-2xl font-bold text-white">{formatClock(whiteTimeMs)}</div>
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-4 ${clockActiveColor === 'b' && clockRunning ? 'border-emerald-300/30 bg-emerald-300/10' : 'border-white/10 bg-white/5'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.3em] text-white/45">Black</div>
                                    <div className="mt-1 text-sm font-semibold text-white">{playerColor === 'b' ? `${user?.name || 'You'} (You)` : 'Opponent'}</div>
                                </div>
                                <div className="text-2xl font-bold text-white">{formatClock(blackTimeMs)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <Board reversed={playerColor === 'b'} roomId={roomId} isMultiplayer showTurnIndicator={false} />
                    </div>
                </div>
                <div className="w-full space-y-4 lg:w-95">
                    <div className="surface-panel-soft rounded-3xl p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Match Actions</h3>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/35">In-game controls</p>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                                {isMyTurn ? 'Your move' : 'Opponent move'}
                            </div>
                        </div>
                        <button
                            onClick={resignGame}
                            disabled={!roomId || !opponentJoined || isResigning}
                            className="w-full rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 font-semibold text-red-100 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Flag size={16} className="mr-2 inline" />
                            {isResigning ? 'Resigning...' : 'Resign Game'}
                        </button>
                    </div>
                    <MoveList title="Live Move List" />
                    <LiveChat
                        roomId={roomId}
                            displayName={user?.name || 'Guest'}
                        initialMessages={liveChatHistory}
                        initialSpectatorCount={spectatorCount}
                        isAuthenticated={isAuthenticated}
                        guestId={null}
                        guestCommentCount={0}
                        guestCommentLimit={5}
                    />
                </div>
            </div>

            {showResignConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/65 px-4">
                    <div className="surface-panel w-full max-w-md rounded-3xl border border-white/10 p-5">
                        <h3 className="text-xl font-semibold text-white">Confirm Resign</h3>
                        <p className="mt-2 text-sm text-white/65">Are you sure you want to resign? This will immediately end the game and your opponent will win.</p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setShowResignConfirm(false)}
                                disabled={isResigning}
                                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmResignGame}
                                disabled={isResigning}
                                className="flex-1 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 font-semibold text-red-100 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isResigning ? 'Resigning...' : 'Yes, Resign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Multiplayer;
