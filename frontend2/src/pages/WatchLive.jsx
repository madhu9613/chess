import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, RefreshCw, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import LiveChat from '../components/LiveChat';
import socket from '../socket/socket';
import { useAuth } from '../context/AuthContext';
import {
    clearMultiplayerState,
    resetGame,
    selectRoomId,
    setOpponentJoined,
    setPlayerColor,
    setRoomId,
    syncGameState,
} from '../store/gameSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WatchLive = () => {
    const dispatch = useDispatch();
    const roomId = useSelector(selectRoomId);
    const { user, guestId } = useAuth();
    const [activeRooms, setActiveRooms] = useState([]);
    const [watchRoomCode, setWatchRoomCode] = useState('');
    const [status, setStatus] = useState('Pick a live room to watch.');
    const [roomInfo, setRoomInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [spectatorCount, setSpectatorCount] = useState(0);
    const [guestCommentCount, setGuestCommentCount] = useState(0);
    const [guestCommentLimit, setGuestCommentLimit] = useState(5);
    const [error, setError] = useState('');

    const displayName = user?.name || 'Guest';

    const fetchActiveRooms = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms/active`);
            const data = await response.json();
            if (!response.ok || !data.success) return;
            setActiveRooms((data.rooms || []).filter((room) => room.status === 'playing'));
        } catch {
            // ignore transient failures
        }
    };

    useEffect(() => {
        fetchActiveRooms();
        const timer = setInterval(fetchActiveRooms, 10000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const onChatMessage = (payload) => {
            if (payload?.roomCode !== roomId) return;
            setMessages((current) => [...current.slice(-39), payload]);
        };

        const onPresenceUpdated = ({ roomCode, spectatorCount: viewers }) => {
            if (roomCode !== roomId) return;
            setSpectatorCount(viewers || 0);
        };

        socket.on('chatMessage', onChatMessage);
        socket.on('roomPresenceUpdated', onPresenceUpdated);

        return () => {
            socket.off('chatMessage', onChatMessage);
            socket.off('roomPresenceUpdated', onPresenceUpdated);
        };
    }, [roomId]);

    useEffect(() => {
        if (!roomId || !socket.connected) return;
        socket.emit('getRoomState', { roomCode: roomId }, (response) => {
            if (!response?.success) return;
            dispatch(syncGameState({ fen: response.fen }));
            dispatch(setPlayerColor(null));
            dispatch(setOpponentJoined(response.players?.length >= 2));
            setMessages(response.recentChat || []);
            setGuestCommentCount(response.guestCommentCount ?? 0);
            setGuestCommentLimit(response.guestCommentLimit ?? 5);
        });
    }, [dispatch, roomId]);

    const watchRoom = (roomCode) => {
        const normalizedRoomCode = roomCode.trim().toUpperCase();
        if (!normalizedRoomCode) {
            setError('Enter a valid room code');
            return;
        }

        socket.emit('watchRoom', {
            roomCode: normalizedRoomCode,
            name: displayName,
            guestId,
        }, (response) => {
            if (!response?.success) {
                setError(response?.error || 'Failed to watch room');
                return;
            }

            dispatch(clearMultiplayerState());
            dispatch(resetGame());
            dispatch(setRoomId(normalizedRoomCode));
            setError('');
            setWatchRoomCode('');
            setStatus(`Watching live room ${normalizedRoomCode}`);
        });
    };

    const currentRoomCode = roomId || watchRoomCode.trim().toUpperCase();

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-7xl flex-col gap-6">
            <div className="surface-panel rounded-[1.75rem] p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-[0.35em] text-white/40">Watch Live</div>
                        <h2 className="mt-1 text-2xl font-semibold text-white">Open match rooms with live chat for everyone.</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Guest watch</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">5 guest comments</span>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                        value={watchRoomCode}
                        onChange={(event) => setWatchRoomCode(event.target.value)}
                        placeholder="Room code to watch"
                        className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30"
                    />
                    <button
                        onClick={() => watchRoom(watchRoomCode)}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/15 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-300/25"
                    >
                        <Eye size={18} />
                        Watch Live
                    </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/60">
                    <span>{status}</span>
                    <button onClick={fetchActiveRooms} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 transition-colors hover:bg-white/10">
                        <RefreshCw size={16} />
                        Refresh rooms
                    </button>
                </div>

                {error && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                <div className="space-y-4">
                    <div className="surface-panel rounded-[1.75rem] p-5">
                        <div className="text-xs uppercase tracking-[0.35em] text-white/40">Watching</div>
                        <h3 className="mt-1 text-xl font-semibold text-white">{currentRoomCode || 'No room selected'}</h3>
                        <div className="mt-3 grid gap-2 text-sm text-white/70">
                            <div>Viewer: {displayName}</div>
                            <div>Watchers: {spectatorCount}</div>
                            <div>{guestCommentLimit ? `Guest comments left: ${Math.max(guestCommentLimit - guestCommentCount, 0)}` : 'Signed-in chat access'}</div>
                        </div>
                    </div>

                    <div className="surface-panel rounded-[1.75rem] p-5">
                        <div className="mb-4 flex justify-center">
                            <Board reversed={false} roomId={roomId} isMultiplayer isSpectator />
                        </div>
                        <MoveList title="Live Move List" />
                        <div className="mt-4">
                            <LiveChat
                                roomId={roomId}
                                displayName={displayName}
                                initialMessages={messages}
                                initialSpectatorCount={spectatorCount}
                                isAuthenticated={Boolean(user)}
                                guestCommentCount={guestCommentCount}
                                guestCommentLimit={guestCommentLimit}
                                guestId={guestId}
                                onGuestCommentCountChange={setGuestCommentCount}
                            />
                        </div>
                    </div>
                </div>

                <aside className="surface-panel rounded-[1.75rem] p-5 xl:sticky xl:top-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Live Rooms</div>
                            <h3 className="mt-1 text-xl font-semibold text-white">Ongoing matches you can watch now.</h3>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                            {activeRooms.length} live
                        </div>
                    </div>

                    {activeRooms.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/50">No live matches at the moment.</div>
                    ) : (
                        <div className="space-y-3">
                            {activeRooms.map((room) => (
                                <button
                                    key={room.roomCode}
                                    onClick={() => watchRoom(room.roomCode)}
                                    className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition-transform hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-xs uppercase tracking-[0.35em] text-white/35">Room</div>
                                            <div className="mt-1 text-lg font-semibold text-white">{room.roomCode}</div>
                                        </div>
                                        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">Playing</div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-white/70">
                                        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">Players: {room.playerCount}</div>
                                        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">Moves: {room.moveCount}</div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm text-white/55">
                                        <span>Turn: {room.turn}</span>
                                        <span className="inline-flex items-center gap-1 text-amber-100"><Link2 size={14} /> Watch</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>
            </div>
        </motion.div>
    );
};

export default WatchLive;
