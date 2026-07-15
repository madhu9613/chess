import express from 'express';
import cors from 'cors';
import WorkerPool from './pool.js';

const app = express();
app.use(cors());
app.use(express.json());

// using worker 2  for docker
const pool = new WorkerPool(2); 

app.post('/move', async (req, res) => {
    const { fen, level = 'medium' } = req.body || {};
    if (!fen) {
        return res.status(400).json({ success: false, error: 'FEN is required' });
    }

    try {
        const result = await pool.execute({ fen, level, multiPV: 1, mode: 'move' });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[Stockfish] /move error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Stockfish failed' });
    }
});

app.post('/analyze', async (req, res) => {
    const { fen, level = 'hard' } = req.body || {};
    if (!fen) {
        return res.status(400).json({ success: false, error: 'FEN is required' });
    }

    try {
        const result = await pool.execute({ fen, level, multiPV: 3, mode: 'analysis' });
        // result contains .analysis with all needed fields
        return res.json({ success: true, analysis: result.analysis });
    } catch (error) {
        console.error('[Stockfish] /analyze error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Stockfish failed' });
    }
});

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'stockfish-service',
        status: 'ok',
        workers: pool.getStatus()
    });
});

app.listen(PORT, () => {
    console.log(`Stockfish service running on port ${PORT} with 1 workers`);
});