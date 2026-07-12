import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import socket from '../socket/socket';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'chess-auth-token';
const GUEST_ID_KEY = 'chess-guest-id';

const createGuestId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `guest-${Math.random().toString(36).slice(2, 12)}`;
};

const getStoredGuestId = () => {
    const stored = localStorage.getItem(GUEST_ID_KEY);
    if (stored) return stored;
    const guestId = createGuestId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
    return guestId;
};

const buildHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
    const [user, setUser] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [guestId] = useState(getStoredGuestId);

    const syncSocketAuth = (nextToken) => {
        socket.auth = nextToken ? { token: nextToken } : {};
        if (socket.connected) {
            socket.disconnect();
            socket.connect();
        }
    };

    useEffect(() => {
        const restoreSession = async () => {
            if (!token) {
                setUser(null);
                setIsReady(true);
                syncSocketAuth('');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    headers: buildHeaders(token),
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Session expired');
                }
                setUser(data.user);
                syncSocketAuth(token);
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                setToken('');
                setUser(null);
                syncSocketAuth('');
            } finally {
                setIsReady(true);
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        if (!token) {
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
            syncSocketAuth('');
            return;
        }

        localStorage.setItem(TOKEN_KEY, token);
        syncSocketAuth(token);
    }, [token, isReady]);

    const setSession = (nextToken, nextUser) => {
        if (nextToken) {
            localStorage.setItem(TOKEN_KEY, nextToken);
            setToken(nextToken);
        } else {
            localStorage.removeItem(TOKEN_KEY);
            setToken('');
        }
        setUser(nextUser || null);
    };

    const submitCredentials = async (endpoint, payload) => {
        const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Authentication failed');
        }
        setSession(data.token, data.user);
        return data.user;
    };

    const login = (email, password) => submitCredentials('login', { email, password });
    const register = (name, email, password) => submitCredentials('register', { name, email, password });

    const startGoogleLogin = (returnTo = '/multiplayer') => {
        window.location.href = `${API_URL}/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
    };

    const completeGoogleLogin = (nextToken) => {
        if (!nextToken) return;
        setToken(nextToken);
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: buildHeaders(token),
            });
        } catch {
            // logout is best-effort only
        } finally {
            setSession('', null);
        }
    };

    const value = useMemo(() => ({
        user,
        token,
        guestId,
        isReady,
        isAuthenticated: Boolean(user && token),
        isGuest: !user,
        login,
        register,
        logout,
        startGoogleLogin,
        completeGoogleLogin,
        setSession,
    }), [user, token, guestId, isReady]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
