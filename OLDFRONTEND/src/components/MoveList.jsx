import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { makeTakeBack } from '../reducer/actions/move';

const MoveList = ({ isMultiplayer, onJumpToMove, onSavePGN, onLoadFEN }) => {
  const { appstate, dispatch } = useContext(AppContext);
  const movesList = appstate.movesList;
  const currentMoveIndex = appstate.currentMoveIndex ?? (movesList.length - 1);

  const [reversed, setReversed] = useState(false);
  const moveContainerRef = useRef(null);
  const currentMoveRef = useRef(null);

  const movePairs = [];
  for (let i = 0; i < movesList.length; i += 2) {
    movePairs.push({
      white: { ...movesList[i], index: i },
      black: movesList[i + 1] ? { ...movesList[i + 1], index: i + 1 } : null,
      number: Math.floor(i / 2) + 1
    });
  }

  const lastMoveIndex = movesList.length - 1;

  const isLastMove = (move) => move && move.index === lastMoveIndex;
  const isCurrentMove = (move) => move && move.index === currentMoveIndex;

  const handleMoveClick = useCallback((index) => {
    if (typeof onJumpToMove === 'function') {
      onJumpToMove(index);
    } else {
      dispatch({ type: 'JUMP_TO_MOVE', payload: { index } });
    }
  }, [dispatch, onJumpToMove]);

  const handleTakeBack = () => {
    if (!isMultiplayer) {
      dispatch(makeTakeBack());
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      .scrollbar-hidden::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Auto-scroll to current move (smooth preview style)
  useEffect(() => {
    if (currentMoveRef.current && moveContainerRef.current) {
      const container = moveContainerRef.current;
      const element = currentMoveRef.current;
      const offsetTop = element.offsetTop;
      const scrollBuffer = 50;

      if (
        offsetTop < container.scrollTop + scrollBuffer ||
        offsetTop > container.scrollTop + container.clientHeight - scrollBuffer
      ) {
        container.scrollTo({
          top: offsetTop - scrollBuffer,
          behavior: 'smooth'
        });
      }
    }
  }, [currentMoveIndex, reversed]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' && currentMoveIndex > 0) {
        handleMoveClick(currentMoveIndex - 1);
      } else if (e.key === 'ArrowRight' && currentMoveIndex < lastMoveIndex) {
        handleMoveClick(currentMoveIndex + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentMoveIndex, lastMoveIndex, handleMoveClick]);

  return (
    <div className="w-full max-w-[500px] flex flex-col">
      <div className="bg-stone-800/90 backdrop-blur-sm rounded-xl shadow-xl p-4 text-stone-100 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
            Move History {reversed && <span className="text-xs text-stone-400">(reversed)</span>}
          </h3>
          <button 
            onClick={() => setReversed(!reversed)} 
            className="text-xs bg-stone-700 hover:bg-amber-600 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            {reversed ? 'Normal Order' : 'Reverse Order'}
          </button>
        </div>

        {/* PGN + FEN Buttons */}
        <div className="flex gap-2 mb-3">
          <button 
            onClick={onSavePGN} 
            className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg font-semibold transition-colors"
          >
            Save PGN
          </button>
          <button 
            onClick={onLoadFEN} 
            className="flex-1 text-xs bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-semibold transition-colors"
          >
            Load FEN
          </button>
        </div>

        {/* Move List */}
        <div 
          ref={moveContainerRef} 
          className="h-[420px] overflow-y-auto scrollbar-hidden pr-2 rounded-lg bg-stone-900/50 p-2 border border-stone-700"
        >
          {movePairs.length > 0 ? (
            <div className="grid grid-cols-12 gap-1.5 text-sm">
              {(reversed ? [...movePairs].reverse() : movePairs).map(pair => (
                <React.Fragment key={`${pair.number}-${reversed}`}>
                  <div className="col-span-2 text-right pr-2 py-2 text-stone-400 font-mono font-bold">
                    {pair.number}.
                  </div>
                  {pair.white && (
                    <div
                      ref={isCurrentMove(pair.white) ? currentMoveRef : null}
                      onClick={() => handleMoveClick(pair.white.index)}
                      className={`cursor-pointer col-span-5 rounded-lg p-2.5 font-medium transition-all
                        ${isLastMove(pair.white) ? 'bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-400' : 'bg-stone-700 hover:bg-stone-600'}
                        ${isCurrentMove(pair.white) ? 'ring-2 ring-amber-300' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-stone-800 text-amber-300 rounded-full flex justify-center items-center text-xs font-bold">W</span>
                        <span className="font-chess font-semibold">
                          {pair.white.san}
                          {pair.white.checkState === 'check' && <span className="text-amber-300">+</span>}
                          {pair.white.checkState === 'checkmate' && <span className="text-red-400">#</span>}
                        </span>
                        {pair.white.captured && <span className="ml-auto bg-red-500/90 text-[10px] px-2 py-0.5 rounded-full font-bold">Capture</span>}
                      </div>
                    </div>
                  )}
                  {pair.black && (
                    <div
                      ref={isCurrentMove(pair.black) ? currentMoveRef : null}
                      onClick={() => handleMoveClick(pair.black.index)}
                      className={`cursor-pointer col-span-5 rounded-lg p-2.5 font-medium transition-all
                        ${isLastMove(pair.black) ? 'bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-400' : 'bg-stone-700 hover:bg-stone-600'}
                        ${isCurrentMove(pair.black) ? 'ring-2 ring-amber-300' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-stone-800 text-amber-300 rounded-full flex justify-center items-center text-xs font-bold">B</span>
                        <span className="font-chess font-semibold">
                          {pair.black.san}
                          {pair.black.checkState === 'check' && <span className="text-amber-300">+</span>}
                          {pair.black.checkState === 'checkmate' && <span className="text-red-400">#</span>}
                        </span>
                        {pair.black.captured && <span className="ml-auto bg-red-500/90 text-[10px] px-2 py-0.5 rounded-full font-bold">Capture</span>}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-center py-8">
              <p>No moves recorded yet</p>
              <p className="text-xs mt-2">Make a move to start the game</p>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="mt-3 pt-3 border-t border-stone-700">
          <div className="flex gap-2">
            <button 
              onClick={handleTakeBack} 
              disabled={movesList.length === 0}
              className="flex-1 flex items-center justify-center gap-1 text-sm bg-red-600/90 hover:bg-red-700 px-3 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <span>⬅</span> Take Back
            </button>
            <button 
              onClick={() => handleMoveClick(currentMoveIndex - 1)} 
              disabled={currentMoveIndex <= 0}
              className="flex-1 text-sm bg-blue-600/90 hover:bg-blue-700 px-3 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              ◀ Prev Move
            </button>
            <button 
              onClick={() => handleMoveClick(currentMoveIndex + 1)} 
              disabled={currentMoveIndex >= lastMoveIndex}
              className="flex-1 text-sm bg-blue-600/90 hover:bg-blue-700 px-3 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Next Move ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveList;
