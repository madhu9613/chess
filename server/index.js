import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import gameHandler from './sockets/gameHandler.js';

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

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    gameHandler(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));