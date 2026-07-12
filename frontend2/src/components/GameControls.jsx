import { useDispatch, useSelector } from 'react-redux';
import { undoMove, redoMove, resetGame, selectCanUndo, selectCanRedo } from '../store/gameSlice';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const GameControls = ({ isMultiplayer = false }) => {
    const dispatch = useDispatch();
    const canUndo = useSelector(selectCanUndo);
    const canRedo = useSelector(selectCanRedo);

    const buttons = [
        { icon: Undo2, label: 'Undo', action: () => dispatch(undoMove()), disabled: isMultiplayer || !canUndo },
        { icon: Redo2, label: 'Redo', action: () => dispatch(redoMove()), disabled: isMultiplayer || !canRedo },
        { icon: RotateCcw, label: 'Reset', action: () => dispatch(resetGame()), disabled: isMultiplayer },
    ];

    return (
        <div className="surface-panel-soft rounded-3xl p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-white">Game Controls</h3>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/35">Move management</p>
                </div>
                <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                    {isMultiplayer ? 'Locked' : 'Available'}
                </div>
            </div>
            <div className="flex gap-2">
                {buttons.map((btn) => (
                    <motion.button
                        key={btn.label}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={btn.action}
                        disabled={btn.disabled}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold transition-all duration-200 cursor-pointer ${
                                btn.disabled
                            ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/30 opacity-60'
                            : 'border border-amber-300/20 bg-gradient-to-r from-amber-300/15 to-orange-400/15 text-white hover:border-amber-300/40 hover:from-amber-300/25 hover:to-orange-400/25'
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