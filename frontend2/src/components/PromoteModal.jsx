import { motion } from 'framer-motion';

const PromoteModal = ({ onSelect, onClose }) => {
    const pieces = [
        { type: 'q', name: 'Queen', symbol: '♕' },
        { type: 'r', name: 'Rook', symbol: '♖' },
        { type: 'b', name: 'Bishop', symbol: '♗' },
        { type: 'n', name: 'Knight', symbol: '♘' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="surface-panel rounded-[1.75rem] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="mb-4 text-center text-xl font-semibold text-white">Promote Pawn</h3>
                <div className="flex gap-4">
                    {pieces.map((piece) => (
                        <button
                            key={piece.type}
                            onClick={() => onSelect(piece.type)}
                            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:scale-110 hover:bg-amber-300/15"
                        >
                            <span className="text-4xl">{piece.symbol}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PromoteModal;