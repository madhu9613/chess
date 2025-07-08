import React from 'react';
import Pieces from '../Pieces/Pieces';

const Board = () => {
  const rows = Array(8).fill().map((_, i) => 8 - i);
  const cols = Array(8).fill().map((_, i) => i);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 p-4 min-h-screen bg-[var(--color-bg-color)] overflow-x-hidden">
      {/* Board container */}
      <div className="relative w-fit h-fit">
        <div className="grid grid-cols-8 grid-rows-8 border-4 border-black">
          {rows.map((row) =>
            cols.map((col) => {
              const isWhite = (row + col) % 2 === 0;
              const tileColor = isWhite
                ? 'bg-[var(--color-lighttile)]'
                : 'bg-[var(--color-blacktile)]';

              const fileLetter = String.fromCharCode(97 + col);
              const showRank = col === 0;
              const showFile = row === 1;

              return (
                <div
                  key={`${row}-${col}`}
                  className={`tile-size relative flex items-center justify-center ${tileColor}`}
                >
                  {showRank && (
                    <span className="absolute top-1 left-1 text-[10px] text-black/50 font-bold">
                      {row}
                    </span>
                  )}
                  {showFile && (
                    <span className="absolute bottom-1 right-1 text-[10px] text-black/50 font-bold">
                      {fileLetter}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <Pieces />
      </div>

      {/* Right Panel / Sidebar */}
      <div className="bg-stone-800 rounded-md shadow-md w-[90vw] sm:w-[400px] h-[300px] sm:h-[500px] p-4">
        {/* Sidebar content here */}
      </div>
    </div>
  );
};

export default Board;
