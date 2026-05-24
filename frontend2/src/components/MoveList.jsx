import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectMoveHistory, selectHistoryIndex, goToMove } from '../store/gameSlice';

const MoveList = () => {
    const dispatch = useDispatch();
    const moveHistory = useSelector(selectMoveHistory);
    const historyIndex = useSelector(selectHistoryIndex);
    const moveContainerRef = useRef(null);

    useEffect(() => {
        const isAtLatest = historyIndex === moveHistory.length;
        if (moveContainerRef.current && isAtLatest) {
            moveContainerRef.current.scrollTop = moveContainerRef.current.scrollHeight;
        }
    }, [moveHistory, historyIndex]);

    const moves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
        moves.push({
            number: Math.floor(i / 2) + 1,
            white: moveHistory[i]?.san || null,
            black: moveHistory[i + 1]?.san || null,
            whiteIndex: i + 1,
            blackIndex: i + 2,
        });
    }

    return (
        <div className="bg-gray-900 text-white rounded-md border border-gray-800">
            <div className="flex items-center gap-2 p-3 border-b border-gray-800">
                <h3 className="text-md font-semibold">Move History</h3>
            </div>

            <div ref={moveContainerRef} className="max-h-96 overflow-y-auto p-3">
                {moves.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 text-sm">
                        No moves yet
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left font-semibold border-b border-gray-800">
                                <th className="py-2 px-2 w-8">#</th>
                                <th className="py-2 px-2">White</th>
                                <th className="py-2 px-2">Black</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moves.map((move) => (
                                <tr key={move.number} className="border-b border-gray-800">
                                    <td className="py-2 px-2 text-center">{move.number}</td>
                                    <td className="py-2 px-2 font-mono">
                                        {move.white ? (
                                            <button
                                                type="button"
                                                onClick={() => dispatch(goToMove(move.whiteIndex))}
                                                className={`cursor-pointer ${historyIndex === move.whiteIndex ? 'text-yellow-300' : 'text-white'}`}
                                            >
                                                {move.white}
                                            </button>
                                        ) : '—'}
                                    </td>
                                    <td className="py-2 px-2 font-mono">
                                        {move.black ? (
                                            <button
                                                type="button"
                                                onClick={() => dispatch(goToMove(move.blackIndex))}
                                                className={`cursor-pointer ${historyIndex === move.blackIndex ? 'text-yellow-300' : 'text-white'}`}
                                            >
                                                {move.black}
                                            </button>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default MoveList;