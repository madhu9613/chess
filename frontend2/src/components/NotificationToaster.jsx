import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCircle2,
    Swords,
    Trophy,
    Clock3,
    X,
} from 'lucide-react';
import socket from '../socket/socket';

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = 7000;

const TYPE_META = {
    matchmaking_queued: {
        title: 'Matchmaking',
        icon: Clock3,
        accent: 'from-amber-300/80 to-yellow-200/80',
        border: 'border-amber-200/35',
    },
    match_found: {
        title: 'Match Found',
        icon: Swords,
        accent: 'from-emerald-300/80 to-lime-200/80',
        border: 'border-emerald-200/35',
    },
    game_result: {
        title: 'Game Result',
        icon: Trophy,
        accent: 'from-sky-300/80 to-cyan-200/80',
        border: 'border-cyan-200/35',
    },
    default: {
        title: 'Notification',
        icon: Bell,
        accent: 'from-zinc-200/80 to-slate-100/80',
        border: 'border-white/25',
    },
};

const makeToastId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const fallbackMessage = (type, payload) => {
    if (payload?.message) return payload.message;
    if (type === 'matchmaking_queued') return 'You have been added to matchmaking queue.';
    if (type === 'match_found') return `Match found${payload?.roomCode ? `: ${payload.roomCode}` : '.'}`;
    if (type === 'game_result') return 'Game finished.';
    return 'You have a new update.';
};

const NotificationToaster = () => {
    const navigate = useNavigate();
    const [toasts, setToasts] = useState([]);
    const timeoutMapRef = useRef(new Map());

    useEffect(() => {
        const removeToast = (id) => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
            const timeoutId = timeoutMapRef.current.get(id);
            if (timeoutId) {
                window.clearTimeout(timeoutId);
                timeoutMapRef.current.delete(id);
            }
        };

        const scheduleAutoDismiss = (id) => {
            const timeoutId = window.setTimeout(() => {
                removeToast(id);
            }, AUTO_DISMISS_MS);
            timeoutMapRef.current.set(id, timeoutId);
        };

        const onNotification = (payload = {}) => {
            const type = payload.type || 'default';
            const id = makeToastId();
            const toast = {
                id,
                type,
                title: TYPE_META[type]?.title || TYPE_META.default.title,
                message: fallbackMessage(type, payload),
                roomCode: payload.roomCode || null,
                payload,
                timestamp: Date.now(),
            };

            setToasts((current) => [toast, ...current].slice(0, MAX_TOASTS));
            scheduleAutoDismiss(id);
        };

        socket.on('notification', onNotification);

        return () => {
            socket.off('notification', onNotification);
            timeoutMapRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            timeoutMapRef.current.clear();
        };
    }, []);

    const dismissToast = (id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        const timeoutId = timeoutMapRef.current.get(id);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            timeoutMapRef.current.delete(id);
        }
    };

    const openToastAction = (toast) => {
        if (!toast?.roomCode) return;
        navigate('/multiplayer', {
            state: {
                notification: toast.payload || { type: toast.type, roomCode: toast.roomCode },
            },
        });
        dismissToast(toast.id);
    };

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-80 flex w-[min(92vw,380px)] flex-col gap-3">
            <AnimatePresence initial={false}>
                {toasts.map((toast) => {
                    const typeMeta = TYPE_META[toast.type] || TYPE_META.default;
                    const Icon = typeMeta.icon || Bell;
                    const isActionable = Boolean(toast.roomCode);

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 30, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={`pointer-events-auto overflow-hidden rounded-2xl border ${typeMeta.border} bg-[#15110b]/90 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-md ${isActionable ? 'cursor-pointer' : ''}`}
                            onClick={() => openToastAction(toast)}
                        >
                            <div className={`h-0.75 w-full bg-linear-to-r ${typeMeta.accent}`} />

                            <div className="p-3">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-white/90">
                                        <Icon size={16} />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-white">{toast.title}</p>
                                            <CheckCircle2 size={14} className="text-emerald-300" />
                                        </div>
                                        <p className="mt-1 text-sm leading-snug text-white/82">{toast.message}</p>
                                        {toast.roomCode ? (
                                            <div className="mt-2 flex items-center gap-2">
                                                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Room {toast.roomCode}</p>
                                                <span className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                                                    Open
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            dismissToast(toast.id);
                                        }}
                                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition-colors hover:bg-white/12 hover:text-white"
                                        aria-label="Dismiss notification"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default NotificationToaster;