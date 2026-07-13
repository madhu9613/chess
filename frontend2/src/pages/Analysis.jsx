import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BookOpenText, FileText, History, Radar, RotateCcw } from 'lucide-react';
import { ChessGame } from '@mady9613/chess-engine';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import { selectFEN, syncGameState } from '../store/gameSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const LEVELS = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
];

const normalizeSan = (san = '') => String(san).replace(/[+#?!]/g, '').trim();

const coordToSquare = (coord) => {
    if (!coord || typeof coord.row !== 'number' || typeof coord.col !== 'number') return null;
    return `${String.fromCharCode(97 + coord.col)}${8 - coord.row}`;
};

const qualityTheme = (quality) => {
    if (quality === 'Best Move') {
        return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
    }
    if (quality === 'Good Move') {
        return 'border-blue-400/30 bg-blue-500/10 text-blue-200';
    }
    if (quality === 'Inaccuracy') {
        return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
    }
    return 'border-red-400/30 bg-red-500/10 text-red-200';
};

const classifyMove = (san, bestMove, topMoves) => {
    const cleanSan = normalizeSan(san);
    const cleanBest = normalizeSan(bestMove?.san || '');

    if (cleanSan && cleanBest && cleanSan === cleanBest) {
        return {
            quality: 'Best Move',
            explanation: `Excellent choice. This matches Stockfish best move ${bestMove.san}.`,
        };
    }

    const rank = (topMoves || []).findIndex((move) => normalizeSan(move.san) === cleanSan);
    if (rank === 1) {
        return {
            quality: 'Good Move',
            explanation: `Solid move. Engine slightly preferred ${bestMove?.san || 'another line'}.`,
        };
    }

    if (rank === 2) {
        return {
            quality: 'Inaccuracy',
            explanation: `Playable, but not precise. Better continuation: ${bestMove?.san || 'engine line unavailable'}.`,
        };
    }

    return {
        quality: 'Bad Move',
        explanation: `This loses quality compared to engine lines. Stronger move: ${bestMove?.san || 'engine line unavailable'}.`,
    };
};

const winnerLabel = (value) => {
    if (value === 'w') return 'White';
    if (value === 'b') return 'Black';
    if (value === 'draw') return 'Draw';
    return value || 'pending';
};

const reasonLabel = (value) => {
    if (!value) return 'in progress';
    if (value === 'resignation') return 'resignation';
    if (value === 'timeout') return 'timeout';
    return value;
};

const Analysis = () => {
    const dispatch = useDispatch();
    const fen = useSelector(selectFEN);

    const [difficulty, setDifficulty] = useState('hard');
    const [analysis, setAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [recentGames, setRecentGames] = useState([]);
    const [recentGamesLoading, setRecentGamesLoading] = useState(false);
    const [recentGamesError, setRecentGamesError] = useState('');
    const [reviewGame, setReviewGame] = useState(null);
    const [reviewFen, setReviewFen] = useState('');
    const [reviewLabel, setReviewLabel] = useState('');
    const [pgnInput, setPgnInput] = useState('');
    const [pgnError, setPgnError] = useState('');
    const [moveReviews, setMoveReviews] = useState([]);
    const [moveReviewsLoading, setMoveReviewsLoading] = useState(false);
    const [moveReviewsError, setMoveReviewsError] = useState('');
    const [reviewProgress, setReviewProgress] = useState({ current: 0, total: 0 });
    const [selectedMoveIndex, setSelectedMoveIndex] = useState(null);
    const [baselineFen] = useState(fen);
    const reviewRunRef = useRef(0);

    const boardHistory = reviewGame?.moves || [];
    const selectedMoveReview = useMemo(() => {
        if (selectedMoveIndex === null) return null;
        return moveReviews[selectedMoveIndex] || null;
    }, [moveReviews, selectedMoveIndex]);

    const analyzeFen = useCallback(async (targetFen) => {
        const response = await fetch(`${API_URL}/api/ai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fen: targetFen, level: difficulty }),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Analysis failed');
        }

        return data.analysis;
    }, [difficulty]);

    const loadAnalysis = useCallback(async (targetFen, label) => {
        if (!targetFen) return;

        setAnalysisLoading(true);
        setAnalysisError('');

        try {
            const analysisData = await analyzeFen(targetFen);
            setAnalysis(analysisData);
            setReviewFen(targetFen);
            setReviewLabel(label);
        } catch (error) {
            setAnalysis(null);
            setAnalysisError(error.message || 'Analysis failed');
        } finally {
            setAnalysisLoading(false);
        }
    }, [analyzeFen]);

    const buildReviewGameFromServer = (game) => ({
        label: game.roomCode,
        startFen: game.startFen || START_FEN,
        finalFen: game.currentFen,
        moves: (game.moveHistory || []).map((move) => ({
            from: move.from || null,
            to: move.to || null,
            promotion: move.promotion || null,
            san: move.san || 'Unknown',
            fen: move.fen,
            turn: move.turn || null,
        })),
    });

    const buildReviewGameFromPgn = (pgnText) => {
        const game = new ChessGame();
        game.loadPGN(pgnText);
        const history = game.getMoveHistory();
        const initialFen = ChessGame.getStartingFEN ? ChessGame.getStartingFEN() : START_FEN;

        return {
            label: 'Imported PGN',
            startFen: initialFen,
            finalFen: history.length ? history[history.length - 1].fen : initialFen,
            moves: history.map((entry) => ({
                from: coordToSquare(entry.move?.from),
                to: coordToSquare(entry.move?.to),
                promotion: entry.move?.promotion || null,
                san: entry.san || 'Unknown',
                fen: entry.fen,
                turn: null,
            })),
        };
    };

    const analyzeGameMoves = useCallback(async (gameData) => {
        const moves = gameData?.moves || [];
        if (!moves.length) {
            setMoveReviews([]);
            return;
        }

        const runId = reviewRunRef.current + 1;
        reviewRunRef.current = runId;

        setMoveReviewsLoading(true);
        setMoveReviewsError('');
        setReviewProgress({ current: 0, total: moves.length });

        try {
            const reviews = [];
            let beforeFen = gameData.startFen || START_FEN;

            for (let index = 0; index < moves.length; index += 1) {
                if (reviewRunRef.current !== runId) {
                    return;
                }

                const move = moves[index];
                const positionAnalysis = await analyzeFen(beforeFen);
                const mover = beforeFen.split(' ')[1] === 'w' ? 'White' : 'Black';
                const { quality, explanation } = classifyMove(move.san, positionAnalysis.bestMove, positionAnalysis.topMoves || []);

                reviews.push({
                    index,
                    ply: index + 1,
                    moveNumber: Math.floor(index / 2) + 1,
                    side: mover,
                    san: move.san,
                    beforeFen,
                    afterFen: move.fen,
                    quality,
                    explanation,
                    evaluation: positionAnalysis.evaluation,
                    bestMove: positionAnalysis.bestMove,
                    suggestions: (positionAnalysis.topMoves || []).slice(0, 3),
                    notes: positionAnalysis.notes || [],
                    legalMoveCount: positionAnalysis.legalMoveCount,
                    move,
                });

                beforeFen = move.fen || beforeFen;
                setReviewProgress({ current: index + 1, total: moves.length });
            }

            if (reviewRunRef.current !== runId) {
                return;
            }

            setMoveReviews(reviews);
            setSelectedMoveIndex(0);

            if (reviews[0]?.afterFen) {
                dispatch(syncGameState({ fen: reviews[0].afterFen }));
                setAnalysis({
                    evaluation: reviews[0].evaluation,
                    bestMove: reviews[0].bestMove,
                    topMoves: reviews[0].suggestions,
                    notes: reviews[0].notes,
                    legalMoveCount: reviews[0].legalMoveCount,
                    turn: reviews[0].beforeFen.split(' ')[1],
                });
                setReviewFen(reviews[0].afterFen);
                setReviewLabel(`${gameData.label} - move 1`);
            }
        } catch (error) {
            setMoveReviews([]);
            setSelectedMoveIndex(null);
            setMoveReviewsError(error.message || 'Failed to analyze move list');
        } finally {
            if (reviewRunRef.current === runId) {
                setMoveReviewsLoading(false);
            }
        }
    }, [analyzeFen, dispatch]);

    useEffect(() => {
        const loadRecentGames = async () => {
            setRecentGamesLoading(true);
            setRecentGamesError('');

            try {
                const response = await fetch(`${API_URL}/api/games/recent`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Failed to load recent games');
                }

                setRecentGames(data.games || []);
            } catch (error) {
                setRecentGames([]);
                setRecentGamesError(error.message || 'Failed to load recent games');
            } finally {
                setRecentGamesLoading(false);
            }
        };

        loadRecentGames();
    }, []);

    useEffect(() => {
        if (!reviewGame?.moves?.length) return;
        analyzeGameMoves(reviewGame);
    }, [difficulty]);

    const inspectGame = (game) => {
        const nextReviewGame = buildReviewGameFromServer(game);
        setReviewGame(nextReviewGame);
        setMoveReviews([]);
        setMoveReviewsError('');
        setSelectedMoveIndex(null);
        dispatch(syncGameState({ fen: game.currentFen }));
        loadAnalysis(game.currentFen, game.roomCode);
        analyzeGameMoves(nextReviewGame);
    };

    const importFen = () => {
        dispatch(syncGameState({ fen: reviewFen.trim() }));
        loadAnalysis(reviewFen.trim(), 'Imported position');
    };

    const importPgn = () => {
        setPgnError('');

        if (!pgnInput.trim()) {
            setPgnError('Paste a PGN first.');
            return;
        }

        try {
            const nextReviewGame = buildReviewGameFromPgn(pgnInput.trim());
            if (!nextReviewGame.moves.length) {
                setPgnError('No moves found in PGN.');
                return;
            }

            setReviewGame(nextReviewGame);
            setMoveReviews([]);
            setMoveReviewsError('');
            setSelectedMoveIndex(null);
            dispatch(syncGameState({ fen: nextReviewGame.finalFen }));
            loadAnalysis(nextReviewGame.finalFen, 'Imported PGN position');
            analyzeGameMoves(nextReviewGame);
        } catch (error) {
            setPgnError(error.message || 'Invalid PGN');
        }
    };

    const jumpToMove = (review) => {
        if (!review?.afterFen) return;
        setSelectedMoveIndex(review.index);
        dispatch(syncGameState({ fen: review.afterFen }));
        setReviewFen(review.afterFen);
        setReviewLabel(`${reviewGame?.label || 'Review'} - move ${review.ply}`);
        setAnalysis({
            evaluation: review.evaluation,
            bestMove: review.bestMove,
            topMoves: review.suggestions,
            notes: review.notes,
            legalMoveCount: review.legalMoveCount,
            turn: review.beforeFen.split(' ')[1],
        });
    };

    const clearReview = () => {
        reviewRunRef.current += 1;
        setReviewGame(null);
        setReviewFen('');
        setReviewLabel('');
        setPgnInput('');
        setPgnError('');
        setAnalysis(null);
        setAnalysisError('');
        setMoveReviews([]);
        setMoveReviewsLoading(false);
        setMoveReviewsError('');
        setSelectedMoveIndex(null);
        setReviewProgress({ current: 0, total: 0 });
        dispatch(syncGameState({ fen: baselineFen }));
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div className="space-y-4">
                <div className="surface-panel rounded-[1.75rem] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                                <Radar size={20} />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.35em] text-white/40">Analysis</div>
                                <h2 className="text-xl font-semibold text-white">Review positions, move lists, and recent games.</h2>
                                <p className="text-sm text-white/55">Stockfish analysis is separate from practice mode.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Review only on selection/import</span>
                            {reviewLabel && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">{reviewLabel}</span>}
                            {moveReviewsLoading && <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-blue-100">Reviewing {reviewProgress.current}/{reviewProgress.total}</span>}
                        </div>
                    </div>
                </div>

                <div className="surface-panel rounded-[1.75rem] p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Board</div>
                            <h3 className="mt-1 text-2xl font-semibold text-white">Centered analysis board</h3>
                        </div>
                        <div className="flex gap-2">
                            {reviewGame && (
                                <button
                                    onClick={clearReview}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                                >
                                    <RotateCcw size={16} />
                                    Clear review
                                </button>
                            )}
                            <div className="text-sm text-white/60">{reviewGame ? (analysisLoading || moveReviewsLoading ? 'Stockfish is evaluating move quality...' : 'Review ready.') : 'Select or import a game to start review.'}</div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <Board isSpectator />
                    </div>

                    {reviewGame ? (
                        <div className="mt-4">
                            <MoveList title={`${reviewGame.label} Move List`} moves={boardHistory} />
                        </div>
                    ) : (
                        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">
                            No review is loaded yet. Pick a recent game or import a FEN to inspect a position.
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full space-y-4 lg:w-[420px] lg:justify-self-end">
                <div className="surface-panel-soft rounded-3xl p-4">
                    <h3 className="mb-2 text-lg font-semibold text-white">Stockfish Depth</h3>
                    <div className="flex gap-2">
                        {LEVELS.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => setDifficulty(level.id)}
                                className={`flex-1 cursor-pointer rounded-2xl py-2 capitalize transition-colors ${difficulty === level.id
                                    ? 'border border-amber-300/20 bg-amber-300/15 text-white'
                                    : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="surface-panel-soft rounded-3xl p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Radar size={18} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Import FEN</h3>
                    </div>
                    <textarea
                        value={reviewFen}
                        onChange={(event) => setReviewFen(event.target.value)}
                        rows={4}
                        placeholder="Paste a FEN to review"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <button
                        onClick={importFen}
                        disabled={!reviewFen.trim()}
                        className="mt-3 w-full rounded-2xl border border-amber-300/20 bg-amber-300/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-300/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Review imported position
                    </button>
                </div>

                <div className="surface-panel-soft rounded-3xl p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Import PGN</h3>
                    </div>
                    <textarea
                        value={pgnInput}
                        onChange={(event) => setPgnInput(event.target.value)}
                        rows={6}
                        placeholder="Paste PGN text. Example: 1. e4 e5 2. Nf3 Nc6"
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <button
                        onClick={importPgn}
                        disabled={!pgnInput.trim() || moveReviewsLoading}
                        className="mt-3 w-full rounded-2xl border border-emerald-300/20 bg-emerald-300/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Import PGN and review every move
                    </button>
                    {pgnError && <div className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{pgnError}</div>}
                </div>

                <div className="surface-panel-soft rounded-3xl p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <BookOpenText size={18} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Position Readout</h3>
                    </div>

                    {!reviewGame && !analysis ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                            Select a game or import a FEN to see a review.
                        </div>
                    ) : analysisLoading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">Analyzing current position...</div>
                    ) : analysisError ? (
                        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{analysisError}</div>
                    ) : analysis ? (
                        <div className="space-y-3 text-sm text-white/75">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs uppercase tracking-[0.3em] text-white/35">Evaluation</div>
                                <div className="mt-1 text-lg font-semibold text-white">{analysis.evaluation.label}</div>
                                <div className="text-white/55">Score: {analysis.evaluation.score}</div>
                                <div className="text-white/55">Turn: {analysis.turn === 'w' ? 'White' : 'Black'}</div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs uppercase tracking-[0.3em] text-white/35">Best Move</div>
                                <div className="mt-1 text-lg font-semibold text-white">{analysis.bestMove?.san || 'No move available'}</div>
                                <div className="text-white/55">{analysis.legalMoveCount} legal moves</div>
                                {selectedMoveReview && <div className="text-white/55">Move under review: {selectedMoveReview.moveNumber}{selectedMoveReview.side === 'White' ? '.' : '...'} {selectedMoveReview.san}</div>}
                            </div>

                            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs uppercase tracking-[0.3em] text-white/35">Top Lines</div>
                                {analysis.topMoves.map((move) => (
                                    <div key={`${move.multipv}-${move.san}-${move.uci}`} className="rounded-2xl border border-white/10 bg-white/5 p-2">
                                        <div className="font-semibold text-white">{move.san}</div>
                                        <div className="text-xs text-white/50">Score {Math.round(move.score)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="text-xs uppercase tracking-[0.3em] text-white/35">Notes</div>
                                {analysis.notes.map((note) => (
                                    <div key={note} className="text-white/70">{note}</div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">Move the board or load a recent game to review the line.</div>
                    )}
                </div>

                <div className="surface-panel-soft rounded-3xl p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Radar size={18} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Move-by-Move Review</h3>
                    </div>

                    {!reviewGame ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                            Load a recent game or import PGN to get good move, bad move, and suggestion details for every move.
                        </div>
                    ) : moveReviewsLoading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">
                            Reviewing moves with Stockfish... {reviewProgress.current}/{reviewProgress.total}
                        </div>
                    ) : moveReviewsError ? (
                        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{moveReviewsError}</div>
                    ) : moveReviews.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">No move review available.</div>
                    ) : (
                        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                            {moveReviews.map((review) => (
                                <button
                                    key={`${review.ply}-${review.san}`}
                                    onClick={() => jumpToMove(review)}
                                    className={`w-full rounded-2xl border p-3 text-left transition-colors hover:bg-white/10 ${selectedMoveReview?.index === review.index ? 'border-amber-300/30 bg-amber-300/10' : 'border-white/10 bg-black/20'}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-white">{review.moveNumber}{review.side === 'White' ? '.' : '...'} {review.san}</div>
                                        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${qualityTheme(review.quality)}`}>
                                            {review.quality}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-white/70">{review.explanation}</div>
                                    <div className="mt-2 text-xs text-white/55">Engine best: {review.bestMove?.san || 'N/A'} | Eval: {Math.round(review.evaluation?.score || 0)}</div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/65">
                                        {(review.suggestions || []).map((suggestion) => (
                                            <span key={`${review.ply}-${suggestion.uci}-${suggestion.multipv}`} className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                                {suggestion.san} ({Math.round(suggestion.score)})
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="surface-panel-soft rounded-3xl p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <History size={18} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Recent Games</h3>
                    </div>

                    {recentGamesLoading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">Loading recent games...</div>
                    ) : recentGamesError ? (
                        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{recentGamesError}</div>
                    ) : recentGames.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/55">No recent games available yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {recentGames.map((game) => {
                                const movePreview = (game.moveHistory || []).slice(-6).map((move) => move.san).join(' · ');
                                return (
                                    <button
                                        key={game.roomCode}
                                        onClick={() => inspectGame(game)}
                                        className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition-transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-xs uppercase tracking-[0.35em] text-white/35">Room</div>
                                                <div className="mt-1 text-lg font-semibold text-white">{game.roomCode}</div>
                                            </div>
                                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">{game.status}</div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-white/70">
                                            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">Moves: {game.moveCount || 0}</div>
                                            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">Winner: {winnerLabel(game.winner)}</div>
                                        </div>
                                        <div className="mt-2 text-xs uppercase tracking-[0.25em] text-white/45">Result: {reasonLabel(game.resultReason)}</div>
                                        <div className="mt-3 text-sm text-white/55">{movePreview || 'No SAN preview available.'}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Analysis;