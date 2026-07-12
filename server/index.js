import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import gameHandler from './sockets/gameHandler.js';
import gameRoutes from './routes/games.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import roomRoutes from './routes/rooms.js';
import { verifyAuthToken } from './utils/auth.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', 
        methods: ['GET', 'POST']
    }
});

// Database connection
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Chess Server Running'));
app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rooms', roomRoutes);

app.use((err, req, res, _next) => {
    console.error('HTTP error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        socket.data.authUser = null;
        return next();
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
        socket.data.authUser = null;
        return next();
    }

    socket.data.authUser = payload;
    return next();
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    gameHandler(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));