import React from 'react';

const Board = () => {
  const rows = Array(8).fill().map((_, i) => 8 - i); // 8 to 1
  const cols = Array(8).fill().map((_, i) => i);     // 0 to 7

  return (
    <div className="flex justify-center items-center  min-h-screen">
      <div className="grid grid-cols-8 grid-rows-8 border-4 border-black">
        {rows.map((row, i) =>
          cols.map((col, j) => {
            const isWhite = (row + col) % 2 === 0;
            const tileColor = isWhite
              ? 'bg-[var(--color-lighttile)]'
              : 'bg-[var(--color-blacktile)]';

            const fileLetter = String.fromCharCode(97 + col); // a–h
            const rankNumber = row;

            // Show rank on the left column tiles
            const showRank = col === 0;
            // Show file on the bottom row tiles
            const showFile = row === 1;

            return (
              <div
                key={`${row}-${col}`}
                className={`tile-size relative flex items-center justify-center ${tileColor}`}
              >
                {/* <span className="absolute top-1 left-1 text-[10px] text-black/40">{fileLetter}{rankNumber}</span> */}

                {showRank && (
                  <span className="absolute top-1 left-1 text-[20px] text-black/50 font-bold">
                    {rankNumber}
                  </span>
                )}

                {showFile && (
                  <span className="absolute bottom-1 right-1 text-[20px] text-black/50 font-bold">
                    {fileLetter}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Board;
