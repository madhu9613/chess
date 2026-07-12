import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BookOpenText, History, Radar, RotateCcw } from 'lucide-react';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import { selectFEN, syncGameState } from '../store/gameSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LEVELS = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
];

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
    const [selectedGame, setSelectedGame] = useState(null);
    const [reviewFen, setReviewFen] = useState('');
    const [reviewLabel, setReviewLabel] = useState('');
    const [baselineFen] = useState(fen);

    const boardHistory = selectedGame?.moveHistory || [];

    const loadAnalysis = async (targetFen, label) => {
        if (!targetFen) return;

        setAnalysisLoading(true);
        setAnalysisError('');

        try {
            const response = await fetch(`${API_URL}/api/ai/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fen: targetFen, level: difficulty }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            setAnalysis(data.analysis);
            setReviewFen(targetFen);
            setReviewLabel(label);
        } catch (error) {
            setAnalysis(null);
            setAnalysisError(error.message || 'Analysis failed');
        } finally {
            setAnalysisLoading(false);
        }
    };

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

    const inspectGame = (game) => {
        setSelectedGame(game);
        dispatch(syncGameState({ fen: game.currentFen }));
        loadAnalysis(game.currentFen, game.roomCode);
    };

    const importFen = () => {
        dispatch(syncGameState({ fen: reviewFen.trim() }));
        loadAnalysis(reviewFen.trim(), 'Imported position');
    };

    const clearReview = () => {
        setSelectedGame(null);
        setReviewFen('');
        setReviewLabel('');
        setAnalysis(null);
        setAnalysisError('');
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
                            {selectedGame && (
                                <button
                                    onClick={clearReview}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
                                >
                                    <RotateCcw size={16} />
                                    Clear review
                                </button>
                            )}
                            <div className="text-sm text-white/60">{selectedGame ? (analysisLoading ? 'Stockfish is evaluating...' : 'Review ready.') : 'Select or import a game to start review.'}</div>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <Board isSpectator />
                    </div>

                    {selectedGame ? (
                        <div className="mt-4">
                            <MoveList title={`${selectedGame.roomCode} Move List`} moves={boardHistory} />
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
                        <BookOpenText size={18} className="text-amber-300" />
                        <h3 className="text-lg font-semibold text-white">Position Readout</h3>
                    </div>

                    {!selectedGame && !analysis ? (
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
                                            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">Winner: {game.winner || 'pending'}</div>
                                        </div>
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