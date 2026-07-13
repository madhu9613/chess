import stockfish from 'stockfish';
import { ChessGame } from '@mady9613/chess-engine';

const LEVELS = {
    easy: { skillLevel: 4, movetime: 140, depth: 8 },
    medium: { skillLevel: 10, movetime: 350, depth: 12 },
    hard: { skillLevel: 18, movetime: 900, depth: 16 },
};

const toAlgebraic = (row, col) => `${String.fromCharCode(97 + col)}${8 - row}`;

const fromUciMove = (uciMove) => {
    if (!uciMove || uciMove.length < 4) return null;
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promotion = uciMove.length > 4 ? uciMove.slice(4, 5) : undefined;
    return { from, to, promotion };
};

const fromRowColMove = (move) => ({
    from: toAlgebraic(move.from.row, move.from.col),
    to: toAlgebraic(move.to.row, move.to.col),
    promotion: move.promotion ? 'q' : undefined,
});

const toUciMove = (move) => ({
    from: fromRowColMove(move).from,
    to: fromRowColMove(move).to,
    promotion: move.promotion ? 'q' : undefined,
});

const moveToSan = (fen, uciMove) => {
    const parsedMove = fromUciMove(uciMove);
    if (!parsedMove) return uciMove;

    const game = new ChessGame();
    game.loadFEN(fen);
    const result = game.move(parsedMove);
    return result.success ? result.san : uciMove;
};

let enginePromise = null;
let searchQueue = Promise.resolve();

const getLevelSettings = (level) => LEVELS[level] || LEVELS.medium;

const initializeEngine = async () => {
    const engine = await stockfish();
    engine.sendCommand('uci');
    engine.sendCommand('setoption name Threads value 1');
    // engine.sendCommand('setoption name Hash value 32');
    engine.sendCommand('setoption name Hash value 8');
    engine.sendCommand('setoption name UCI_ShowWDL value true');
    engine.sendCommand('isready');
    return engine;
};

const getEngine = async () => {
    if (!enginePromise) {
        enginePromise = initializeEngine();
    }

    return enginePromise;
};

// enginePromise = initializeEngine().catch((error) => {
//     enginePromise = null;
//     throw error;
// });

const parseScore = (line) => {
    const mateMatch = line.match(/score mate (-?\d+)/);
    if (mateMatch) {
        return { mate: Number(mateMatch[1]), cp: null };
    }

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

const collectSearch = async ({ fen, level = 'medium', multiPV = 1, mode = 'move' }) => {
    const engine = await getEngine();
    const settings = getLevelSettings(level);
    const previousLog = console.log;
    const infoByPv = new Map();
    let finished = false;

    return await new Promise((resolve, reject) => {
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

        console.log = (...args) => {
            const line = args.map(String).join(' ');

            if (line.startsWith('info ')) {
                const parsed = parseInfoLine(line);
                infoByPv.set(parsed.multipv, parsed);
                return;
            }

            if (line.startsWith('bestmove ')) {
                const bestMoveText = line.split(' ')[1];
                const bestMove = fromUciMove(bestMoveText);
                const parsedInfo = Array.from(infoByPv.values()).sort((left, right) => left.multipv - right.multipv);

                const topMoves = parsedInfo
                    .slice(0, multiPV)
                    .map((info, index) => ({
                        multipv: info.multipv || index + 1,
                        uci: info.pv[0] || bestMoveText,
                        san: moveToSan(fen, info.pv[0] || bestMoveText),
                        score: info.score.mate !== null ? (info.score.mate > 0 ? 100000 - info.score.mate : -100000 - info.score.mate) : (info.score.cp ?? 0),
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
                resolve({
                    bestMove,
                    bestMoveUci: bestMoveText,
                    topMoves,
                    evaluation,
                    turn: fen.split(' ')[1] || 'w',
                    depth: settings.depth,
                });
                return;
            }

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

const enqueueSearch = (task) => {
    const run = searchQueue.then(task, task);
    searchQueue = run.catch(() => {});
    return run;
};

const buildNotes = (result) => {
    const notes = [];

    if (result.bestMove) {
        notes.push(`Best line starts with ${result.bestMove.san || `${result.bestMove.from}-${result.bestMove.to}`}.`);
    }

    if (result.topMoves?.[0]?.score >= 100000) {
        notes.push('Stockfish found a mating sequence.');
    }

    notes.push(`Stockfish depth ${result.depth}.`);
    notes.push(`${result.topMoves?.length || 0} principal lines shown.`);

    return notes;
};

export const chooseAIMove = async (fen, level = 'medium') => enqueueSearch(async () => {
    const analysis = await collectSearch({ fen, level, multiPV: 1, mode: 'move' });
    const aiMove = fromUciMove(analysis.bestMoveUci || '');
    const bestMoveSummary = analysis.bestMoveUci
        ? {
            uci: analysis.bestMoveUci,
            san: moveToSan(fen, analysis.bestMoveUci),
            score: analysis.evaluation.score,
        }
        : null;

    return {
        move: aiMove,
        analysis: {
            evaluation: analysis.evaluation,
            bestMove: bestMoveSummary,
            topMoves: analysis.topMoves || [],
            notes: buildNotes(analysis),
            turn: analysis.turn,
        },
    };
});

export const analyzePosition = async (fen, level = 'medium') => enqueueSearch(async () => {
    const analysis = await collectSearch({ fen, level, multiPV: 3, mode: 'analysis' });
    const game = new ChessGame();
    game.loadFEN(fen);

    return {
        evaluation: analysis.evaluation,
        bestMove: analysis.topMoves?.[0] || null,
        topMoves: analysis.topMoves || [],
        notes: buildNotes(analysis),
        legalMoveCount: game.getAllValidMoves().length,
        turn: analysis.turn,
    };
});
