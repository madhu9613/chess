import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Users } from 'lucide-react';
import socket from '../socket/socket';

const LiveChat = ({
    roomId,
    displayName = 'Guest',
    initialMessages = [],
    initialSpectatorCount = 0,
    compact = false,
    isAuthenticated = false,
    guestId = null,
    guestCommentCount = 0,
    guestCommentLimit = 5,
    onGuestCommentCountChange,
}) => {
    const [messages, setMessages] = useState(initialMessages);
    const [draft, setDraft] = useState('');
    const [spectatorCount, setSpectatorCount] = useState(initialSpectatorCount);
    const [localGuestCommentCount, setLocalGuestCommentCount] = useState(guestCommentCount);

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages, roomId]);

    useEffect(() => {
        setSpectatorCount(initialSpectatorCount);
    }, [initialSpectatorCount, roomId]);

    useEffect(() => {
        setLocalGuestCommentCount(guestCommentCount);
    }, [guestCommentCount, roomId]);

    useEffect(() => {
        if (!roomId) return undefined;

        const onChatMessage = (payload) => {
            if (payload?.roomCode !== roomId) return;
            setMessages((current) => [...current.slice(-39), payload]);
        };

        const onPresenceUpdated = (payload) => {
            if (payload?.roomCode !== roomId) return;
            setSpectatorCount(payload?.spectatorCount || 0);
        };

        socket.on('chatMessage', onChatMessage);
        socket.on('roomPresenceUpdated', onPresenceUpdated);

        return () => {
            socket.off('chatMessage', onChatMessage);
            socket.off('roomPresenceUpdated', onPresenceUpdated);
        };
    }, [roomId]);

    const remainingGuestComments = Math.max(guestCommentLimit - localGuestCommentCount, 0);
    const canSend = useMemo(() => {
        if (!roomId || !draft.trim()) return false;
        if (isAuthenticated) return true;
        return remainingGuestComments > 0;
    }, [draft, roomId, isAuthenticated, remainingGuestComments]);

    const sendMessage = () => {
        if (!canSend) return;

        socket.emit('sendChatMessage', {
            roomCode: roomId,
            message: draft.trim(),
            name: displayName,
            guestId,
        }, (response) => {
            if (response?.success) {
                setDraft('');
                if (typeof response.guestCommentCount === 'number') {
                    setLocalGuestCommentCount(response.guestCommentCount);
                    onGuestCommentCountChange?.(response.guestCommentCount);
                }
            }
        });
    };

    return (
        <div className={`surface-panel-soft rounded-3xl ${compact ? 'p-4' : 'p-5'}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-amber-300" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Live Chat</h3>
                        <p className="text-xs uppercase tracking-[0.3em] text-white/35">Watch the room conversation</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <Users size={14} />
                    {spectatorCount} watching
                </div>
            </div>

            {!isAuthenticated && roomId && (
                <div className="mb-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                    Guest comments left: {remainingGuestComments}
                </div>
            )}

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                {!roomId ? (
                    <div className="py-8 text-center text-sm text-white/40">Join or watch a room to unlock chat.</div>
                ) : messages.length === 0 ? (
                    <div className="py-8 text-center text-sm text-white/40">No messages yet. Say hello.</div>
                ) : (
                    messages.map((message, index) => (
                        <div key={`${message.createdAt || index}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-white/35">
                                <span>{message.name || 'Guest'}</span>
                                <span>{message.role || 'spectator'}</span>
                            </div>
                            <div className="mt-2 text-sm leading-6 text-white/85">{message.message}</div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-3 flex gap-2">
                <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder={roomId ? 'Type a message' : 'Join a room to chat'}
                    disabled={!roomId || (!isAuthenticated && remainingGuestComments <= 0)}
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                />
                <button
                    onClick={sendMessage}
                    disabled={!canSend}
                    className="flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/15 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Send size={16} />
                    Send
                </button>
            </div>
        </div>
    );
};

export default LiveChat;
