import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-auth-secret-change-me';
const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 14);

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

export const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
    const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
    return { salt, hash };
};

export const verifyPassword = (password, salt, expectedHash) => {
    if (!salt || !expectedHash) return false;
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
};

export const issueAuthToken = (user) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: String(user._id || user.id),
        email: user.email,
        name: user.name,
        provider: user.provider || 'local',
        avatarUrl: user.avatarUrl || null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyAuthToken = (token) => {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
    }

    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload));
        if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
};

export const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice(7).trim();
    }
    return req.headers['x-auth-token'] || null;
};

export const requireAuth = (req, res, next) => {
    const token = getTokenFromRequest(req);
    const payload = verifyAuthToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    req.auth = payload;
    return next();
};

export const optionalAuth = (req, _res, next) => {
    const token = getTokenFromRequest(req);
    req.auth = verifyAuthToken(token);
    return next();
};

export const parseCookieHeader = (cookieHeader = '') => cookieHeader.split(';').reduce((accumulator, entry) => {
    const [rawKey, ...rest] = entry.trim().split('=');
    if (!rawKey) return accumulator;
    accumulator[rawKey] = decodeURIComponent(rest.join('=') || '');
    return accumulator;
}, {});

export const createRandomState = () => crypto.randomBytes(16).toString('hex');

export const buildSetCookie = (name, value, options = {}) => {
    const segments = [`${name}=${encodeURIComponent(value)}`];
    segments.push(`Path=${options.path || '/'}`);
    if (options.httpOnly !== false) segments.push('HttpOnly');
    if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
    if (options.maxAge) segments.push(`Max-Age=${options.maxAge}`);
    if (options.secure) segments.push('Secure');
    return segments.join('; ');
};
