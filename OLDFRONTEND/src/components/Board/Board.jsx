// src/components/Board/Board.jsx
import React, { useContext, useState } from 'react';
import Pieces from '../Pieces/Pieces';
import { AppContext } from '../../context/AppContext';

const Board = ({ isMyTurn, myColor, roomId, setIsMyTurn, reversed }) => {
  const { appstate } = useContext(AppContext);
  const [playAs, setPlayAs] = useState(myColor || 'white');

  const boardReversed = reversed || playAs === 'black';
  const ranks = boardReversed ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = boardReversed
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 w-fit rounded-lg bg-black/90 backdrop-blur-sm">
      <div className="relative w-fit h-fit rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/20">
        <div className="grid grid-cols-8 grid-rows-8">
          {Array(8).fill().map((_, rowIdx) =>
            Array(8).fill().map((_, colIdx) => {
              const logicalRow = boardReversed ? 7 - rowIdx : rowIdx;
              const logicalCol = boardReversed ? 7 - colIdx : colIdx;
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

        {/* Ranks */}
        <div className="absolute top-0 left-0 h-full flex flex-col text-stone-700 font-medium pointer-events-none">
          {ranks.map(rank => (
            <div key={rank} className="tile-size flex items-start justify-start px-2 pt-1 text-xs">{rank}</div>
          ))}
        </div>

        {/* Files */}
        <div className="absolute bottom-0 right-0 w-full flex text-stone-700 font-medium pointer-events-none">
          {files.map(file => (
            <div key={file} className="tile-size flex items-end justify-center pb-1 text-xs">{file}</div>
          ))}
        </div>

        {/* Render Pieces */}
        <Pieces
          reversed={boardReversed}
          isMyTurn={isMyTurn}
          myColor={myColor}
          roomId={roomId}
          setIsMyTurn={setIsMyTurn}
        />
      </div>
    </div>
  );
};

export default Board;
