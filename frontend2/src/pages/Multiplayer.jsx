import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import GameControls from '../components/GameControls';
import LiveChat from '../components/LiveChat';
import socket from '../socket/socket';
import { motion } from 'framer-motion';
import { Globe2, Link2, Copy } from 'lucide-react';
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

const Multiplayer = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useAuth();
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
    const [displayName, setDisplayName] = useState(user?.name || 'Guest');
    const [liveChatHistory, setLiveChatHistory] = useState([]);
    const [spectatorCount, setSpectatorCount] = useState(0);

    useEffect(() => {
        const onConnect = () => setConnectionState('connected');
        const onDisconnect = () => setConnectionState('disconnected');

        const onRoomCreated = ({ roomCode, color }) => {
            dispatch(clearMultiplayerState());
            dispatch(resetGame());
            dispatch(syncGameState({ fen: START_FEN }));
            dispatch(setRoomId(roomCode));
            dispatch(setPlayerColor(color));
            dispatch(setOpponentJoined(false));
            dispatch(setMyTurn(false));
            setStatus(`Room created: ${roomCode}. Share this code with your friend.`);
            setSavedFFN('');
            setRoomInfo(null);
            setLiveChatHistory([]);
            setSpectatorCount(0);
            setError('');
        };

        const onJoinedRoom = ({ roomCode, color }) => {
            dispatch(clearMultiplayerState());
            dispatch(resetGame());
            dispatch(syncGameState({ fen: START_FEN }));
            dispatch(setRoomId(roomCode));
            dispatch(setPlayerColor(color));
            dispatch(setOpponentJoined(true));
            dispatch(setMyTurn(false));
            setStatus(`Joined room ${roomCode}. Waiting for game sync...`);
            setSavedFFN('');
            setRoomInfo(null);
            setLiveChatHistory([]);
            setSpectatorCount(0);
            setError('');
        };

        const onOpponentJoined = ({ roomCode }) => {
            dispatch(setOpponentJoined(true));
            setStatus(`Opponent joined room ${roomCode}. Game started.`);
        };

        const onGameStart = ({ fen, turn }) => {
            dispatch(syncGameState({ fen }));
            dispatch(setMyTurn(turn === playerColor));
            setStatus('Game started. Good luck!');
        };

        const onMoveMade = ({ move, fen, turn }) => {
            dispatch(applyMultiplayerMove({ move, fen }));
            dispatch(setMyTurn(turn === playerColor));
            setRoomInfo((current) => (current ? { ...current, currentFen: fen, moveCount: (current.moveCount || 0) + 1, turn } : current));
        };

        const onGameOver = ({ winner, reason, ffn }) => {
            dispatch(setMyTurn(false));
            setSavedFFN(ffn || '');
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

        return () => {
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
        };
    }, [dispatch, playerColor, roomId]);

    const createRoom = () => {
        socket.emit('createRoom', {}, (response) => {
            if (!response?.success) {
                setError(response?.error || 'Failed to create room');
            }
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
        });
    }, [dispatch, playerColor, roomId, connectionState]);

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
                        <h2 className="mt-1 text-2xl font-semibold text-white">Create a room, share the code, play live.</h2>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                        connectionState === 'connected'
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                            : 'border-red-500/30 bg-red-500/15 text-red-200'
                    }`}>
                        Socket: {connectionState}
                    </span>
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
                    {roomId && <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Room: <span className="font-semibold text-amber-100">{roomId}</span></div>}
                    {playerColor && <div className="rounded-2xl border border-white/10 bg-white/5 p-3">You are: <span className="font-semibold text-white">{playerColor === 'w' ? 'White' : 'Black'}</span></div>}
                    {roomId && <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Turn: <span className="font-semibold text-white">{isMyTurn ? 'Your move' : 'Opponent move'}</span></div>}
                    {roomId && <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Opponent: <span className="font-semibold text-white">{opponentJoined ? 'Connected' : 'Waiting...'}</span></div>}
                    {savedFFN && <div className="break-all rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-100">Saved FFN: {savedFFN}</div>}
                    {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-red-200">{error}</div>}
                </div>

                {roomInfo && (
                    <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm">
                        <div className="mb-2 font-semibold text-white">Room Snapshot</div>
                        <div>Status: {roomInfo.status}</div>
                        <div>Moves: {roomInfo.moveCount}</div>
                        <div>Players: {roomInfo.playerCount}</div>
                        <div>Turn: {roomInfo.turn}</div>
                        <div>Watching: {spectatorCount}</div>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                <div className="flex justify-center">
                    <Board reversed={playerColor === 'b'} roomId={roomId} isMultiplayer />
                </div>
                <div className="w-full space-y-4 lg:w-[380px]">
                    <GameControls isMultiplayer />
                    <MoveList title="Live Move List" />
                    <LiveChat
                        roomId={roomId}
                        displayName={user?.name || displayName}
                        initialMessages={liveChatHistory}
                        initialSpectatorCount={spectatorCount}
                        isAuthenticated={isAuthenticated}
                        guestId={null}
                        guestCommentCount={0}
                        guestCommentLimit={5}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default Multiplayer;
