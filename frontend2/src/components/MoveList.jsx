import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectMoveHistory } from '../store/gameSlice';
import { Clock } from 'lucide-react';

const MoveList = ({ title = 'Move History', moves = null }) => {
    const liveMoveHistory = useSelector(selectMoveHistory);
    const moveHistory = moves || liveMoveHistory;
    const moveContainerRef = useRef(null);

    useEffect(() => {
        if (moveContainerRef.current) {
            moveContainerRef.current.scrollTop = moveContainerRef.current.scrollHeight;
        }
    }, [moveHistory]);

    const groupedMoves = useMemo(() => {
        const groupedMoves = [];
        for (let i = 0; i < moveHistory.length; i += 2) {
            groupedMoves.push({
                number: Math.floor(i / 2) + 1,
                white: moveHistory[i]?.san || null,
                black: moveHistory[i + 1]?.san || null
            });
        }
        return groupedMoves;
    }, [moveHistory]);

    const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

    return (
        <div className="surface-panel-soft overflow-hidden rounded-3xl shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 p-4">
                <Clock size={18} className="text-amber-300" />
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <span className="ml-auto text-xs uppercase tracking-[0.3em] text-white/40">
                    {moveHistory.length} moves
                </span>
            </div>

            <div ref={moveContainerRef} className="max-h-96 overflow-y-auto p-3">
                {latestMove && (
                    <div className="mb-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                        Latest: {latestMove.san}
                    </div>
                )}
                {groupedMoves.length === 0 ? (
                    <div className="py-8 text-center text-sm text-white/45">
                        <div className="mb-2 text-2xl text-amber-300">♔</div>
                        No moves yet
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#121826]">
                            <tr className="border-b border-white/10 font-semibold text-white/60">
                                <th className="text-left py-3 px-3 w-8">#</th>
                                <th className="text-left py-3 px-3 flex-1">White</th>
                                <th className="text-left py-3 px-3 flex-1">Black</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedMoves.map((move, idx) => (
                                <tr key={move.number} className={`hover:bg-accent/15 transition-all duration-200 border-b border-white/5 ${
                                    idx % 2 === 0 ? 'bg-white/3' : 'bg-white/1'
                                }`}>
                                    <td className="py-3 px-3 text-center font-bold text-amber-200/80">{move.number}</td>
                                    <td className="py-3 px-3 font-mono font-semibold text-white/88">{move.white || '—'}</td>
                                    <td className="py-3 px-3 font-mono font-semibold text-white/60">{move.black || '—'}</td>
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