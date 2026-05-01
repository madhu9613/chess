import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GameOverModal = ({ type, winner, onNewGame, onClose }) => {
    const navigate = useNavigate();

    const getMessage = () => {
        if (type === 'checkmate') {
            return winner === 'w' ? 'White Wins by Checkmate!' : 'Black Wins by Checkmate!';
        }
        return 'Stalemate! Game is a Draw.';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gradient-to-br from-dark to-darker rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <Trophy size={48} className="text-accent mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl text-gray-300 mb-6">{getMessage()}</p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onNewGame}
                        className="flex items-center gap-2 px-5 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                    >
                        <RefreshCw size={18} />
                        New Game
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-5 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <Home size={18} />
                        Home
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GameOverModal;