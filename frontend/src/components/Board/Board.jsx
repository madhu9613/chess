// src/components/Board/Board.jsx
import React, { useContext, useRef, useEffect, useState } from 'react';
import Pieces from '../Pieces/Pieces';
import { AppContext } from '../../context/AppContext';
import MoveList from '../MoveList';

const Board = () => {
  const { appstate } = useContext(AppContext);
  const movesList = appstate.movesList;

  const [playAs, setPlayAs] = useState('white');
  const moveContainerRef = useRef(null);

  const reversed = playAs === 'black';
  const ranks = reversed ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = reversed 
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] 
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  useEffect(() => {
    if (moveContainerRef.current) {
      moveContainerRef.current.scrollTop = moveContainerRef.current.scrollHeight;
    }
  }, [movesList]);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 p-4 min-h-screen  bg-black/90 backdrop-blur-sm">
      {/* Color Switch Dropdown */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md border border-gray-300 rounded-lg shadow-lg px-4 py-2">
        <label className="mr-2 font-semibold text-stone-700">Play as:</label>
        <select
          value={playAs}
          onChange={(e) => setPlayAs(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="white">White</option>
          <option value="black">Black</option>
        </select>
      </div>

      {/* Chessboard */}
      <div className="relative w-fit h-fit rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/20">
        <div className="grid grid-cols-8 grid-rows-8">
          {Array(8).fill().map((_, rowIdx) =>
            Array(8).fill().map((_, colIdx) => {
              const logicalRow = reversed ? 7 - rowIdx : rowIdx;
              const logicalCol = reversed ? 7 - colIdx : colIdx;
              const isLight = (logicalRow + logicalCol) % 2 === 0;
              const tileColor = isLight ? 'bg-[#e0d9b5]' : 'bg-[#b58863]';

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`tile-size ${tileColor} transition-colors duration-300 hover:brightness-110`}
                />
              );
            })
          )}
        </div>

        {/* Coordinates - Ranks */}
        <div className="absolute top-0 left-0 h-full flex flex-col text-stone-700 font-medium pointer-events-none">
          {ranks.map((rank,) => (
            <div
              key={`rank-${rank}`}
              className="tile-size flex items-start justify-start px-2 pt-1 text-xs"
            >
              {rank}
            </div>
          ))}
        </div>

        {/* Coordinates - Files */}
        <div className="absolute bottom-0 right-0 w-full flex text-stone-700 font-medium pointer-events-none">
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
        <Pieces reversed={reversed} />
      </div>

      {/* Move History Panel */}
      <MoveList ref={moveContainerRef} />
    </div>
  );
};

export default Board;