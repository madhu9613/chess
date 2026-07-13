import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    selectTurn,
    selectIsCheck,
    selectIsCheckmate,
    selectIsGameOver,
    selectWinner,
    resetGame,
} from '../../store/gameSlice';
import Pieces from '../Pieces/Pieces';

const Board = ({ reversed = false, roomId = null, isMultiplayer = false, isSpectator = false, practiceColor = null, showTurnIndicator = true }) => {
    const dispatch = useDispatch();
    const turn = useSelector(selectTurn);
    const isCheck = useSelector(selectIsCheck);
    const isCheckmate = useSelector(selectIsCheckmate);
    const isGameOver = useSelector(selectIsGameOver);
    const winner = useSelector(selectWinner);

    const [showGameOver, setShowGameOver] = useState(false);

    useEffect(() => {
        if (isCheckmate || isGameOver) {
            const revealTimer = setTimeout(() => setShowGameOver(true), 0);
            const hideTimer = setTimeout(() => setShowGameOver(false), 3000);
            return () => {
                clearTimeout(revealTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [isCheckmate, isGameOver]);

    return (
        <div className="relative">
            {/* Game Over Modal */}
            <AnimatePresence>
                {(isCheckmate || showGameOver) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-lg rounded-lg flex items-center justify-center z-50"
                    >
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="text-6xl mb-4"
                            >
                                {winner === 'w' ? '👑' : winner === 'b' ? '👑' : '🤝'}
                            </motion.div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                                {winner === 'w' ? 'White Wins! 🎉' : winner === 'b' ? 'Black Wins! 🎉' : 'Game Over!'}
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => dispatch(resetGame())}
                                className="mt-6 px-8 py-3 bg-linear-to-r from-accent to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 cursor-pointer"
                            >
                                New Game
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Board */}
            <div className="board-frame relative mx-auto w-full max-w-[min(92vw,560px)] overflow-hidden rounded-[1.75rem] ring-1 ring-white/15">
                <Pieces reversed={reversed} roomId={roomId} isMultiplayer={isMultiplayer} isSpectator={isSpectator} practiceColor={practiceColor} />
            </div>

            {showTurnIndicator && (
                <div className="mt-6 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-6 py-3 rounded-xl font-bold text-lg backdrop-blur-sm border transition-all duration-300 ${
                            isCheck
                                ? 'bg-red-500/30 border-red-500/60 text-red-300 shadow-lg shadow-red-500/30 animate-pulse'
                                : 'bg-accent/20 border-accent/40 text-accent/90'
                        }`}
                    >
                        {!isGameOver && (
                            <div className="flex items-center gap-2">
                                <span>{turn === 'w' ? '⚪' : '⚫'}</span>
                                <span>{turn === 'w' ? "White's Turn" : "Black's Turn"}</span>
                                {isCheck && (
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 0.6, repeat: Infinity }}
                                        className="ml-2"
                                    >
                                         CHECK!
                                    </motion.span>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Board;
