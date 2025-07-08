import React from 'react';
import Pieces from '../Pieces/Pieces';

const Board = () => {
  const ranks = Array(8).fill().map((_, i) => 8 - i); // 8 to 1
  const files = Array(8).fill().map((_, i) => String.fromCharCode(97 + i)); // a to h

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 p-4 min-h-screen bg-gradient-to-br from-stone-100 to-stone-200">
      {/* Board Container */}
      <div className="relative w-fit h-fit rounded-xl overflow-hidden shadow-2xl">
        {/* Board Grid */}
        <div className="grid grid-cols-8 grid-rows-8">
          {ranks.map((_, rowIndex) =>
            files.map((_, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const tileColor = isLight
                ? 'bg-[#f0d9b5]'
                : 'bg-[#b58863]';

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`tile-size ${tileColor} transition-colors duration-300`}
                />
              );
            })
          )}
        </div>

        {/* Coordinates - Ranks */}
        <div className="absolute top-0 left-0 h-full flex flex-col-reverse text-stone-700 font-medium pointer-events-none">
          {ranks.map((rank) => (
            <div 
              key={`rank-${rank}`} 
              className="tile-size flex items-start justify-start px-2 pt-1 text-xs"
            >
              {rank}
            </div>
          ))}
        </div>

        {/* Coordinates - Files */}
        <div className="absolute bottom-0 right-0 w-full flex  text-stone-700 font-medium pointer-events-none">
          {files.map((file) => (
            <div 
              key={`file-${file}`} 
              className="tile-size flex items-end justify-center pb-1 text-xs"
            >
              {file}
            </div>
          ))}
        </div>

        {/* Piece Layer */}
        <Pieces />
      </div>

      {/* Sidebar */}
      <div className="bg-stone-800 rounded-xl shadow-xl w-full max-w-md p-6 text-stone-100">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Chess Board</h2>
        <p className="mb-4">
          Drag and drop pieces to play. Last move is highlighted with green (from) 
          and yellow (to) squares.
        </p>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Features:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Smooth drag & drop animations</li>
            <li>Move highlighting</li>
            <li>Responsive design</li>
            <li>Visual feedback on interaction</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Board;