// src/components/Board/Board.jsx
import React, { useContext, useRef, useEffect, useState } from 'react';
import Pieces from '../Pieces/Pieces';
import { AppContext } from '../../context/AppContext';
import { makeTakeBack } from '../../reducer/actions/move';
import MoveList from '../MoveList';

const Board = () => {
  const ranks = Array(8).fill().map((_, i) => 8 - i);
  const files = Array(8).fill().map((_, i) => String.fromCharCode(97 + i));
  const { appstate, dispatch } = useContext(AppContext);
  const movesList = appstate.movesList;

  const [reversed, setReversed] = useState(false);
  const moveContainerRef = useRef(null);

  useEffect(() => {
    if (moveContainerRef.current) {
      if (reversed) {
        moveContainerRef.current.scrollTop = 0;
      } else {
        moveContainerRef.current.scrollTop = moveContainerRef.current.scrollHeight;
      }
    }
  }, [movesList, reversed]);

  // Format move notation
  
  // Group moves into pairs
  const movePairs = [];
  for (let i = 0; i < movesList.length; i += 2) {
    movePairs.push({
      white: movesList[i],
      black: movesList[i + 1],
      number: Math.floor(i / 2) + 1
    });
  }

 

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 p-4 min-h-screen bg-gradient-to-br from-stone-100 to-stone-500">
      {/* Chessboard */}
      <div className="relative w-fit h-fit rounded-xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-8 grid-rows-8">
          {ranks.map((_, rowIndex) =>
            files.map((_, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const tileColor = isLight ? 'bg-[#e0d9b5]' : 'bg-[#b58863]';

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
        <Pieces />
      </div>

      {/* Move History Panel */}
      <MoveList />
    </div>
  );
};

export default Board;