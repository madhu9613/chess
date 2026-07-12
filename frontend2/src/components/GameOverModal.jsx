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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="surface-panel relative mx-4 w-full max-w-md overflow-hidden rounded-[2rem] p-8 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient text-[#130f08] shadow-lg shadow-black/20">
                    <Trophy size={30} />
                </div>
                <h2 className="mb-2 text-3xl font-semibold text-white">Game Over</h2>
                <p className="mb-6 text-lg text-white/72">{getMessage()}</p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onNewGame}
                        className="flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/15 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-amber-300/25"
                    >
                        <RefreshCw size={18} />
                        New Game
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 font-semibold text-white/85 transition-colors hover:bg-white/10"
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