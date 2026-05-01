import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { undoMove, redoMove, resetGame, selectCanUndo, selectCanRedo } from '../store/gameSlice';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const GameControls = () => {
    const dispatch = useDispatch();
    const canUndo = useSelector(selectCanUndo);
    const canRedo = useSelector(selectCanRedo);

    const buttons = [
        { icon: Undo2, label: 'Undo', action: () => dispatch(undoMove()), disabled: !canUndo },
        { icon: Redo2, label: 'Redo', action: () => dispatch(redoMove()), disabled: !canRedo },
        { icon: RotateCcw, label: 'Reset', action: () => dispatch(resetGame()), disabled: false },
    ];

    return (
        <div className="bg-gradient-to-b from-white/8 to-white/4 backdrop-blur-md rounded-2xl border border-accent/30 p-4 shadow-lg">
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">Game Controls</h3>
            <div className="flex gap-2">
                {buttons.map((btn) => (
                    <motion.button
                        key={btn.label}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={btn.action}
                        disabled={btn.disabled}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                                btn.disabled
                                ? 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-accent/40 to-orange-400/40 hover:from-accent/60 hover:to-orange-400/60 text-accent border border-accent/40 hover:border-accent/60 shadow-lg hover:shadow-accent/20'
                            }`}
                    >
                        <btn.icon size={18} />
                        <span className="hidden sm:inline text-sm">{btn.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default GameControls;