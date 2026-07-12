import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Bot, Crown } from 'lucide-react';
import Board from '../components/Board/Board';
import MoveList from '../components/MoveList';
import GameControls from '../components/GameControls';
import { makeMove, resetGame, selectFEN, selectIsGameOver, selectMoveHistory, selectTurn } from '../store/gameSlice';
import socket from '../socket/socket';

const LEVELS = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
];

const Practice = () => {
    const dispatch = useDispatch();
    const fen = useSelector(selectFEN);
    const turn = useSelector(selectTurn);
    const isGameOver = useSelector(selectIsGameOver);
    const moveHistory = useSelector(selectMoveHistory);

    const [difficulty, setDifficulty] = useState('medium');
    const [aiThinking, setAiThinking] = useState(false);
    const [status, setStatus] = useState('Play white against Stockfish.');

    useEffect(() => {
        let cancelled = false;
        let timeoutId = null;

        const playAIMove = async () => {
            if (turn !== 'b' || isGameOver || aiThinking) return;

            setAiThinking(true);
            setStatus('Stockfish is thinking...');

            if (!socket.connected) {
                setStatus('Socket is disconnected. Waiting for reconnect...');
                setAiThinking(false);
                return;
            }

            timeoutId = window.setTimeout(() => {
                if (!cancelled) {
                    setStatus('Stockfish is taking too long. Try again or refresh the board.');
                    setAiThinking(false);
                }
            }, 20000);

            try {
                const data = await new Promise((resolve) => {
                    socket.emit('requestAIMove', { fen, level: difficulty }, (response) => resolve(response));
                });

                if (!data?.success || !data.move) {
                    throw new Error(data?.error || 'Stockfish did not return a move');
                }

                if (!cancelled) {
                    dispatch(makeMove(data.move));
                    setStatus(`Stockfish played ${data.analysis?.bestMove?.san || `${data.move.from}-${data.move.to}`}.`);
                }
            } catch (error) {
                if (!cancelled) {
                    setStatus(error.message || 'Stockfish move failed');
                }
            } finally {
                if (!cancelled) {
                    if (timeoutId) {
                        window.clearTimeout(timeoutId);
                    }
                    setAiThinking(false);
                }
            }
        };

        playAIMove();

        return () => {
            cancelled = true;
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [aiThinking, difficulty, dispatch, fen, isGameOver, turn]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="space-y-4">
                <div className="surface-panel rounded-[1.75rem] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                                <Bot size={20} />
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.35em] text-white/40">Practice vs AI</div>
                                <h2 className="text-xl font-semibold text-white">Train against Stockfish.</h2>
                                <p className="text-sm text-white/55">You play White. The engine responds automatically.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{turn === 'w' ? 'White to move' : 'Black to move'}</span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{moveHistory.length} moves</span>
                            {aiThinking && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">Thinking</span>}
                        </div>
                    </div>
                </div>

                <div className="surface-panel rounded-[1.75rem] p-5">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-[0.35em] text-white/40">Board</div>
                            <h3 className="mt-1 text-2xl font-semibold text-white">Centered board with automatic engine replies.</h3>
                        </div>
                        <div className="text-sm text-white/60">{status}</div>
                    </div>

                    <div className="flex justify-center">
                        <Board practiceColor="w" />
                    </div>
                </div>
            </div>

            <div className="w-full space-y-4 lg:w-[380px] lg:justify-self-end">
                <div className="surface-panel-soft rounded-3xl p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Engine Level</h3>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/35">Stockfish strength</p>
                        </div>
                        <button
                            onClick={() => {
                                dispatch(resetGame());
                                setStatus('Practice board reset.');
                            }}
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
                        >
                            Reset
                        </button>
                    </div>
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

                <GameControls />

                <MoveList title="Practice Move List" />

                <div className="surface-panel-soft rounded-3xl p-4 text-sm text-white/70">
                    <div className="flex items-center gap-2 text-white">
                        <Crown size={18} className="text-amber-300" />
                        Play flow
                    </div>
                    <div className="mt-2 leading-6">
                        White is controlled by you. After every legal white move, Stockfish replies automatically at the selected strength.
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Practice;