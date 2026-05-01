import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectMoveHistory } from '../store/gameSlice';
import { Clock } from 'lucide-react';

const MoveList = () => {
    const moveHistory = useSelector(selectMoveHistory);
    const moveContainerRef = useRef(null);

    useEffect(() => {
        if (moveContainerRef.current) {
            moveContainerRef.current.scrollTop = moveContainerRef.current.scrollHeight;
        }
    }, [moveHistory]);

    const moves = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
        moves.push({
            number: Math.floor(i / 2) + 1,
            white: moveHistory[i]?.san || null,
            black: moveHistory[i + 1]?.san || null,
        });
    }

    return (
        <div className="bg-gradient-to-b from-white/8 to-white/4 backdrop-blur-md rounded-2xl border border-accent/30 shadow-lg">
            <div className="flex items-center gap-2 p-4 border-b border-accent/20 bg-accent/10">
                <Clock size={18} className="text-accent" />
                <h3 className="text-lg font-bold bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">Move History</h3>
            </div>

            <div ref={moveContainerRef} className="max-h-96 overflow-y-auto p-3">
                {moves.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">
                        <div className="text-2xl mb-2">♔</div>
                        No moves yet
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-accent/20">
                            <tr className="text-accent font-bold border-b border-accent/30">
                                <th className="text-left py-3 px-3 w-8">#</th>
                                <th className="text-left py-3 px-3 flex-1">White</th>
                                <th className="text-left py-3 px-3 flex-1">Black</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moves.map((move, idx) => (
                                <tr key={move.number} className={`hover:bg-accent/15 transition-all duration-200 border-b border-white/5 ${
                                    idx % 2 === 0 ? 'bg-white/3' : 'bg-white/1'
                                }`}>
                                    <td className="py-3 px-3 text-accent/70 font-bold text-center">{move.number}</td>
                                    <td className="py-3 px-3 font-mono text-gray-200 font-semibold">{move.white || '—'}</td>
                                    <td className="py-3 px-3 font-mono text-gray-300 font-semibold">{move.black || '—'}</td>
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