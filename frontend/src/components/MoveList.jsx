// src/components/MoveList.jsx
import React, { useContext, useRef, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { makeTakeBack } from '../reducer/actions/move';

const MoveList = () => {
  const { appstate, dispatch } = useContext(AppContext);
  const movesList = appstate.movesList;

  const [reversed, setReversed] = useState(false);
  const moveContainerRef = useRef(null);

  // Create move pairs with indices
  const movePairs = [];
  for (let i = 0; i < movesList.length; i += 2) {
    const pair = {
      white: { ...movesList[i], index: i },
      number: Math.floor(i / 2) + 1
    };
    if (i + 1 < movesList.length) {
      pair.black = { ...movesList[i + 1], index: i + 1 };
    }
    movePairs.push(pair);
  }

  const lastMoveIndex = movesList.length > 0 ? movesList.length - 1 : -1;

  useEffect(() => {
    if (moveContainerRef.current) {
      if (reversed) {
        moveContainerRef.current.scrollTop = 0;
      } else {
        moveContainerRef.current.scrollTop = moveContainerRef.current.scrollHeight;
      }
    }
  }, [movesList, reversed]);

  const handleTakeBack = () => {
    dispatch(makeTakeBack());
  };

  // Helper to determine move highlight status
  const isLastMove = (move) => {
    return move && move.index === lastMoveIndex;
  };

  return (
    <div className="w-full max-w-xs flex flex-col gap-4 min-h-screen overflow-hidden">
      <div className="bg-stone-800 rounded-xl shadow-xl p-5 text-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-amber-300 border-b border-amber-500 pb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Move History
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setReversed(!reversed)}
              className="flex items-center gap-1 text-xs bg-stone-700 hover:bg-stone-600 px-2 py-1 rounded font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {reversed ? 'Chronological' : 'Reverse'}
            </button>
            <button
              onClick={handleTakeBack}
              className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded font-semibold transition-colors"
              disabled={movesList.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Take Back
            </button>
          </div>
        </div>

        <div
          className="max-h-[420px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-stone-700 rounded"
          ref={moveContainerRef}
        >
          {movePairs.length > 0 ? (
            <div className="grid grid-cols-12 gap-1 text-sm">
              {(reversed ? [...movePairs].reverse() : movePairs).map((pair) => (
                <React.Fragment key={`${pair.number}-${reversed ? 'rev' : 'norm'}`}>
                  <div className="col-span-2 text-right pr-3 py-2 text-stone-400 font-mono">
                    {pair.number}.
                  </div>
                  <div className={`col-span-5 rounded p-2 font-medium transition-all ${
                    reversed ? 'bg-stone-700/80 hover:bg-stone-600/90' : 'bg-stone-700 hover:bg-stone-600'
                  } ${isLastMove(pair.white) ? 'ring-2 ring-amber-400' : ''}`}>
                    {pair.white && (
                      <div className="flex items-center gap-2">
                        <span className="bg-stone-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-amber-300">W</span>
                        <span className="font-chess">
                          {pair.white.san}
                          {pair.white.checkState === 'check' && <span className="text-amber-400">+</span>}
                          {pair.white.checkState === 'checkmate' && <span className="text-red-500">#</span>}
                        </span>
                        {pair.white.captured && (
                          <span className="ml-auto bg-red-500/80 text-xs px-1.5 py-0.5 rounded-full">Capture</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`col-span-5 rounded p-2 font-medium transition-all ${
                    reversed ? 'bg-stone-700/80 hover:bg-stone-600/90' : 'bg-stone-700 hover:bg-stone-600'
                  } ${isLastMove(pair.black) ? 'ring-2 ring-amber-400' : ''}`}>
                    {pair.black && (
                      <div className="flex items-center gap-2">
                        <span className="bg-stone-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-amber-300">B</span>
                        <span className="font-chess">
                          {pair.black.san}
                          {pair.black.checkState === 'check' && <span className="text-amber-400">+</span>}
                          {pair.black.checkState === 'checkmate' && <span className="text-red-500">#</span>}
                        </span>
                        {pair.black.captured && (
                          <span className="ml-auto bg-red-500/80 text-xs px-1.5 py-0.5 rounded-full">Capture</span>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400 italic">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No moves recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveList;