import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { undoMove, redoMove, resetGame, selectCanUndo, selectCanRedo } from '../store/gameSlice';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';

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
        <div className="bg-gray-900 text-white rounded-md border border-gray-800 p-4">
            <h3 className="text-md font-semibold mb-3">Game Controls</h3>
            <div className="flex gap-2">
                {buttons.map((btn) => (
                    <button
                        key={btn.label}
                        onClick={btn.action}
                        disabled={btn.disabled}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium cursor-pointer border ${
                                btn.disabled
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
                                : 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                            }`}
                    >
                        <btn.icon size={18} />
                        <span className="hidden sm:inline text-sm">{btn.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GameControls;