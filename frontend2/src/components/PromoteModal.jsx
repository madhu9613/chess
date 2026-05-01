import React from 'react';
import { motion } from 'framer-motion';

const PromoteModal = ({ onSelect, onClose, color }) => {
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-dark rounded-2xl p-6 border border-white/20 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4 text-center">Promote Pawn</h3>
                <div className="flex gap-4">
                    {pieces.map((piece) => (
                        <button
                            key={piece.type}
                            onClick={() => onSelect(piece.type)}
                            className="w-16 h-16 bg-white/10 rounded-xl hover:bg-accent/20 transition-all hover:scale-110 flex items-center justify-center"
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