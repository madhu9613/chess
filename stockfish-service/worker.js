import stockfish from 'stockfish';
import { ChessGame } from '@mady9613/chess-engine';

// ----- constants & helpers -----
const LEVELS = {
    easy: { skillLevel: 4, depth: 6 },
    medium: { skillLevel: 10, depth: 10 },
    hard: { skillLevel: 18, depth: 14 },
};

const toAlgebraic = (row, col) => `${String.fromCharCode(97 + col)}${8 - row}`;
const fromUciMove = (uciMove) => {
    if (!uciMove || uciMove.length < 4) return null;
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove.slice(4, 5) : undefined;
    return { from, to, promotion };
};

const moveToSan = (fen, uciMove) => {
    const parsedMove = fromUciMove(uciMove);
    if (!parsedMove) return uciMove;
    const game = new ChessGame();
    game.loadFEN(fen);
    const result = game.move(parsedMove);
    return result.success ? result.san : uciMove;
};

const getLevelSettings = (level) => LEVELS[level] || LEVELS.medium;

// ----- engine initialization (silent) -----
let engine = null;
let engineReady = false;

const initializeEngine = () => {
    return new Promise((resolve, reject) => {
        const originalLog = console.log;

        console.log = (...args) => {
            const line = args.map(String).join(' ');

            if (
                line.startsWith('option name') ||
                line.startsWith('id ') ||
                line.startsWith('uciok') ||
                (line.includes('Stockfish') && line.includes('WASM'))
            ) {
                return; // suppress
            }

            if (line === 'readyok') {
                engineReady = true;
                console.log = originalLog; // restore
                resolve();
                return;
            }

            originalLog(...args);
        };

        stockfish()
            .then((eng) => {
                engine = eng;
                engine.sendCommand('uci');
                engine.sendCommand('setoption name Threads value 1');
                // for production changing hash to 8 as its a free deployment 
                engine.sendCommand('setoption name Hash value 8');
                engine.sendCommand('setoption name UCI_ShowWDL value true');
                engine.sendCommand('isready');
            })
            .catch((err) => {
                console.log = originalLog;
                reject(err);
            });
    });
};

const parseScore = (line) => {
    const mateMatch = line.match(/score mate (-?\d+)/);
    if (mateMatch) return { mate: Number(mateMatch[1]), cp: null };
    const cpMatch = line.match(/score cp (-?\d+)/);
    return { mate: null, cp: cpMatch ? Number(cpMatch[1]) : null };
};

const parseInfoLine = (line) => {
    const multipvMatch = line.match(/ multipv (\d+)/);
    const depthMatch = line.match(/ depth (\d+)/);
    const pvMatch = line.match(/ pv (.+)$/);
    const score = parseScore(line);
    return {
        multipv: multipvMatch ? Number(multipvMatch[1]) : 1,
        depth: depthMatch ? Number(depthMatch[1]) : null,
        score,
        pv: pvMatch ? pvMatch[1].trim().split(/\s+/) : [],
        raw: line,
    };
};

const buildNotes = (result) => {
    const notes = [];
    if (result.bestMove) notes.push(`Best line starts with ${result.bestMove.san || `${result.bestMove.from}-${result.bestMove.to}`}.`);
    if (result.topMoves?.[0]?.score >= 100000) notes.push('Stockfish found a mating sequence.');
    notes.push(`Stockfish depth ${result.depth}.`);
    notes.push(`${result.topMoves?.length || 0} principal lines shown.`);
    return notes;
};

// ----- search execution (console.log interception) -----
const collectSearch = async ({ fen, level, multiPV = 1, mode = 'move' }) => {
    if (!engineReady) {
        await initializeEngine();
    }

    const settings = getLevelSettings(level);
    const previousLog = console.log;
    const infoByPv = new Map();
    let finished = false;

    return new Promise((resolve, reject) => {
        const timeoutMs = mode === 'analysis' ? 20000 : 15000;
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Stockfish timed out'));
        }, timeoutMs);

        const cleanup = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            console.log = previousLog;
        };

        // Override console.log to capture engine output
        console.log = (...args) => {
            const line = args.map(String).join(' ');

            if (line.startsWith('info ')) {
                const parsed = parseInfoLine(line);
                infoByPv.set(parsed.multipv, parsed);
                // optionally pass through if you want to see analysis in logs
                // previousLog(...args);
                return;
            }

            if (line.startsWith('bestmove ')) {
                const bestMoveText = line.split(' ')[1];
                const bestMove = fromUciMove(bestMoveText);
                const parsedInfo = Array.from(infoByPv.values()).sort((a, b) => a.multipv - b.multipv);

                const topMoves = parsedInfo
                    .slice(0, multiPV)
                    .map((info, index) => ({
                        multipv: info.multipv || index + 1,
                        uci: info.pv[0] || bestMoveText,
                        san: moveToSan(fen, info.pv[0] || bestMoveText),
                        score: info.score.mate !== null
                            ? (info.score.mate > 0 ? 100000 - info.score.mate : -100000 - info.score.mate)
                            : (info.score.cp ?? 0),
                        depth: info.depth,
                    }));

                const bestInfo = topMoves[0] || null;
                const evaluation = bestInfo
                    ? {
                        score: bestInfo.score,
                        label: bestInfo.score > 80 ? 'White is better' : bestInfo.score < -80 ? 'Black is better' : 'Balanced',
                        perspective: fen.split(' ')[1] || 'w',
                    }
                    : {
                        score: 0,
                        label: 'Balanced',
                        perspective: fen.split(' ')[1] || 'w',
                    };

                cleanup();
                // Compute legal move count for analysis
                const game = new ChessGame();
                game.loadFEN(fen);
                const legalMoveCount = game.getAllValidMoves().length;

                resolve({
                    bestMove,
                    bestMoveUci: bestMoveText,
                    topMoves,
                    evaluation,
                    turn: fen.split(' ')[1] || 'w',
                    depth: settings.depth,
                    legalMoveCount,
                });
                return;
            }

            // Pass through other logs (e.g., errors, warnings)
            previousLog(...args);
        };

        try {
            engine.sendCommand(`setoption name Skill Level value ${settings.skillLevel}`);
            engine.sendCommand(`setoption name MultiPV value ${multiPV}`);
            engine.sendCommand('ucinewgame');
            engine.sendCommand('isready');
            engine.sendCommand(`position fen ${fen}`);
            engine.sendCommand(`go depth ${mode === 'analysis' ? settings.depth : Math.max(4, settings.depth - 2)}`);
        } catch (error) {
            cleanup();
            reject(error);
        }
    });
};

// ----- message handler from parent -----
process.on('message', async (msg) => {
    const { id, fen, level, multiPV, mode } = msg;
    try {
        const result = await collectSearch({ fen, level, multiPV, mode });

        const bestMoveSummary = result.bestMoveUci
            ? {
                uci: result.bestMoveUci,
                san: moveToSan(fen, result.bestMoveUci),
                score: result.evaluation.score,
            }
            : null;

        const analysis = {
            evaluation: result.evaluation,
            bestMove: bestMoveSummary,
            topMoves: result.topMoves || [],
            notes: buildNotes(result),
            turn: result.turn,
            legalMoveCount: result.legalMoveCount,
        };

        const response = {
            move: result.bestMove,
            analysis,
        };

        process.send({ id, result: response });
    } catch (error) {
        process.send({ id, error: error.message });
    }
});

// Boot the engine when worker starts
initializeEngine()
    .then(() => console.log('Worker ready'))
    .catch((err) => {
        console.error('Worker init error:', err);
        process.exit(1);
    });