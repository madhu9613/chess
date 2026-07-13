import express from 'express';
import https from 'https';
import User from '../models/User.js';
import {
    buildSetCookie,
    createRandomState,
    getTokenFromRequest,
    hashPassword,
    issueAuthToken,
    optionalAuth,
    parseCookieHeader,
    requireAuth,
    verifyAuthToken,
    verifyPassword,
} from '../utils/auth.js';
const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${API_BASE_URL}/api/auth/google/callback`;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const buildUserResponse = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    provider: user.provider,
    avatarUrl: user.avatarUrl || null,
});

const requestJson = (url, { method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const request = https.request(url, {
        method,
        headers,
    }, (response) => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
            responseBody += chunk;
        });
        response.on('end', () => {
            try {
                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    status: response.statusCode,
                    json: responseBody ? JSON.parse(responseBody) : {},
                });
            } catch (error) {
                reject(error);
            }
        });
    });

    request.on('error', reject);

    if (body) {
        request.write(body);
    }

    request.end();
});

const getSignedInUser = async (req) => {
    const payload = req.auth || verifyAuthToken(getTokenFromRequest(req));
    if (!payload?.sub) return null;
    return User.findById(payload.sub);
};

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        const { salt, hash } = hashPassword(password);
        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            passwordSalt: salt,
            passwordHash: hash,
            provider: 'local'
        });

        const token = issueAuthToken(user);
        return res.json({ success: true, token, user: buildUserResponse(user) });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = issueAuthToken(user);
        return res.json({ success: true, token, user: buildUserResponse(user) });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await getSignedInUser(req);
        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }
        return res.json({ success: true, user: buildUserResponse(user) });
    } catch (err) {
        console.error('Me error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/logout', optionalAuth, async (_req, res) => {
    return res.json({ success: true });
});

router.get('/google/start', (req, res) => {
    try {
        if (!GOOGLE_CLIENT_ID) {
            return res.status(400).json({
                success: false,
                error: 'Google auth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
            });
        }

        const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo.startsWith('/')
            ? req.query.returnTo
            : '/multiplayer';
        const state = JSON.stringify({ nonce: createRandomState(), returnTo });
        const stateCookie = buildSetCookie('oauth_state', JSON.parse(state).nonce, { sameSite: 'Lax', maxAge: 600 });
        const encodedState = Buffer.from(state).toString('base64url');
        const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

        authorizeUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authorizeUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
        authorizeUrl.searchParams.set('response_type', 'code');
        authorizeUrl.searchParams.set('scope', 'openid email profile');
        authorizeUrl.searchParams.set('state', encodedState);
        authorizeUrl.searchParams.set('access_type', 'offline');
        authorizeUrl.searchParams.set('prompt', 'consent');

        res.setHeader('Set-Cookie', stateCookie);
        return res.redirect(authorizeUrl.toString());
    } catch (err) {
        console.error('Google start error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/google/callback', async (req, res) => {
    try {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return res.status(400).json({ success: false, error: 'Google auth is not configured' });
        }

        const { code, state } = req.query || {};
        if (!code || !state) {
            return res.status(400).json({ success: false, error: 'Invalid Google callback' });
        }

        const parsedState = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'));
        const cookies = parseCookieHeader(req.headers.cookie || '');
        if (!cookies.oauth_state || cookies.oauth_state !== parsedState.nonce) {
            return res.status(400).json({ success: false, error: 'Invalid Google auth state' });
        }

        const tokenResponse = await requestJson('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: String(code),
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code',
            }).toString(),
        });

        const tokenData = tokenResponse.json;
        if (!tokenResponse.ok) {
            return res.status(400).json({ success: false, error: tokenData.error_description || tokenData.error || 'Google token exchange failed' });
        }

        const profileResponse = await requestJson('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = profileResponse.json;
        if (!profileResponse.ok) {
            return res.status(400).json({ success: false, error: profile.error || 'Failed to fetch Google profile' });
        }

        const email = normalizeEmail(profile.email);
        let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });
        if (!user) {
            user = await User.create({
                name: profile.name || profile.given_name || 'Google User',
                email,
                googleId: profile.sub,
                avatarUrl: profile.picture || null,
                provider: 'google'
            });
        } else {
            user.googleId = user.googleId || profile.sub;
            user.avatarUrl = user.avatarUrl || profile.picture || null;
            user.provider = user.provider === 'local' ? 'google' : user.provider;
            user.name = user.name || profile.name || 'Google User';
            user.email = user.email || email;
            await user.save();
        }

        const token = issueAuthToken(user);
        const returnTo = typeof parsedState.returnTo === 'string' && parsedState.returnTo.startsWith('/')
            ? parsedState.returnTo
            : '/multiplayer';

        res.setHeader('Set-Cookie', buildSetCookie('oauth_state', '', { sameSite: 'Lax', maxAge: 0 }));
        return res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(returnTo)}`);
    } catch (err) {
        console.error('Google callback error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
