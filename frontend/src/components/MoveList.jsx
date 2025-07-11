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
    // Inject CSS to hide scrollbars globally
    const style = document.createElement('style');
    style.innerHTML = `
      .scrollbar-hidden {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
      .scrollbar-hidden::-webkit-scrollbar {
        display: none;  /* Chrome, Safari, Opera */
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  const isLastMove = (move) => {
    return move && move.index === lastMoveIndex;
  };

  return (
    <div className="w-full max-w-[500px] flex flex-col">
      <div className="bg-stone-800/90 backdrop-blur-sm rounded-xl shadow-xl p-4 text-stone-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-amber-300 pb-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Move History
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setReversed(!reversed)}
              className="flex items-center gap-1 text-xs bg-stone-700 hover:bg-amber-600 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              {reversed ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Normal
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Reverse
                </>
              )}
            </button>
            <button
              onClick={handleTakeBack}
              className="flex items-center gap-1 text-xs bg-red-600/90 hover:bg-red-700 px-3 py-1.5 rounded-lg font-semibold transition-colors"
              disabled={movesList.length === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Take Back
            </button>
          </div>
        </div>

        {/* Updated container with scrollbar-hidden class */}
        <div
          className="max-h-[420px] min-h-[420px] overflow-y-auto pr-2 scrollbar-hidden rounded-lg"
          ref={moveContainerRef}
        >
          {movePairs.length > 0 ? (
            <div className="grid grid-cols-12 gap-1.5 text-sm">
              {(reversed ? [...movePairs].reverse() : movePairs).map((pair) => (
                <React.Fragment key={`${pair.number}-${reversed ? 'rev' : 'norm'}`}>
                  <div className="col-span-2 text-right pr-2 py-2 text-stone-400 font-mono font-bold">
                    {pair.number}.
                  </div>
                  <div className={`col-span-5 rounded-lg p-2.5 font-medium transition-all ${
                    isLastMove(pair.white) 
                      ? 'bg-gradient-to-r from-amber-600/80 border border-amber-400 to-amber-700/80' 
                      : 'bg-stone-700/80 hover:bg-stone-600'
                  }`}>
                    {pair.white && (
                      <div className="flex items-center gap-2">
                        <span className="bg-stone-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-amber-300">W</span>
                        <span className="font-chess font-semibold">
                          {pair.white.san}
                          {pair.white.checkState === 'check' && <span className="text-amber-300">+</span>}
                          {pair.white.checkState === 'checkmate' && <span className="text-red-400">#</span>}
                        </span>
                        {pair.white.captured && (
                          <span className="ml-auto bg-red-500/90 text-[10px] px-2 py-0.5 rounded-full font-bold">Capture</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`col-span-5 rounded-lg p-2.5 font-medium transition-all ${
                    isLastMove(pair.black) 
                      ? 'bg-gradient-to-r border border-amber-400 from-amber-600/80 to-amber-700/80' 
                      : 'bg-stone-700/80 hover:bg-stone-600'
                  }`}>
                    {pair.black && (
                      <div className="flex items-center gap-2">
                        <span className="bg-stone-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-amber-300">B</span>
                        <span className="font-chess font-semibold">
                          {pair.black.san}
                          {pair.black.checkState === 'check' && <span className="text-amber-300">+</span>}
                          {pair.black.checkState === 'checkmate' && <span className="text-red-400">#</span>}
                        </span>
                        {pair.black.captured && (
                          <span className="ml-auto bg-red-500/90 text-[10px] px-2 py-0.5 rounded-full font-bold">Capture</span>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center py-8 text-stone-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg italic font-light">No moves recorded yet</p>
              <p className="text-sm mt-1">Make a move to start the game</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveList;