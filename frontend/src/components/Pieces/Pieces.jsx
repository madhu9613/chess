// src/components/Board/Pieces.jsx
import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { makeNewMove, setCandidateMoves } from '../../reducer/actions/move';
import { getValidMoves } from '../../arbiter/getMoves';
import { isMoveLegal } from '../../arbiter/arbiter';

const pieces = import.meta.glob('../../assets/pieces/*.png', {
  eager: true,
  import: 'default'
});

const pieceImages = {};
for (const path in pieces) {
  const fileName = path.split('/').pop().replace('.png', '');
  pieceImages[fileName] = pieces[path];
}

const getSAN = (piece, fromRow, fromCol, toRow, toCol, captured = false) => {
  const pieceType = piece[1].toUpperCase();
  const file = String.fromCharCode(97 + toCol);
  const rank = 8 - toRow;
  const captureSymbol = captured ? 'x' : '';
  return (pieceType === 'P' ? '' : pieceType) + captureSymbol + file + rank;
};

const Pieces = () => {
  const { appstate, dispatch } = useContext(AppContext);
  const position = appstate.position[appstate.position.length - 1];
  const validMoves = appstate.candidateMoves;

  const [draggingPiece, setDraggingPiece] = useState(null);
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);

  const handleMove = (fromRow, fromCol, toRow, toCol) => {
    if (fromRow === toRow && fromCol === toCol) return;

    const piece = position[fromRow][fromCol];
    if (!piece || piece[0] !== appstate.turn) return;

    const isLegal = isMoveLegal({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      board: position,
      turn: appstate.turn
    });

    if (!isLegal) return;

    const newPosition = position.map(row => [...row]);
    const captured = position[toRow][toCol] !== '';

    newPosition[fromRow][fromCol] = '';
    newPosition[toRow][toCol] = piece;

    const san = getSAN(piece, fromRow, fromCol, toRow, toCol, captured);

    dispatch(
      makeNewMove({
        newPosition,
        newMove: {
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol },
          piece,
          captured,
          san
        }
      })
    );

    dispatch(setCandidateMoves([]));
    setSelectedSquare(null);
  };

  const handleDrop = (e, toRow, toCol) => {
    e.preventDefault();
    setHoveredSquare(null);

    const data = e.dataTransfer.getData('text/plain');
    const [fromRow, fromCol] = data.split(',').map(Number);
    handleMove(fromRow, fromCol, toRow, toCol);
    setDraggingPiece(null);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8">
      {position.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isDragging = draggingPiece === `${rowIndex},${colIndex}`;
          const isHovered =
            hoveredSquare?.row === rowIndex && hoveredSquare?.col === colIndex;

          const lastMove = appstate.movesList[appstate.movesList.length - 1];
          const isFrom = lastMove?.from?.row === rowIndex && lastMove?.from?.col === colIndex;
          const isTo = lastMove?.to?.row === rowIndex && lastMove?.to?.col === colIndex;

          const isNormalMove = validMoves.some(
            m => m.row === rowIndex && m.col === colIndex && !m.capture
          );
          const isCaptureMove = validMoves.some(
            m => m.row === rowIndex && m.col === colIndex && m.capture
          );

          const isSelected =
            selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;

          const isOwnTurnPiece = piece && piece[0] === appstate.turn;

          const highlightColor =
            isSelected && isOwnTurnPiece
              ? 'bg-blue-400/40'
              : isFrom
                ? 'bg-green-300/50'
                : isTo
                  ? 'bg-yellow-300/50'
                  : '';


          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`tile-size flex items-center justify-center relative ${highlightColor} transition-colors duration-150`}
              onDrop={e => handleDrop(e, rowIndex, colIndex)}
              onDragOver={e => {
                e.preventDefault();
                setHoveredSquare({ row: rowIndex, col: colIndex });
              }}
              onDragEnter={() => setHoveredSquare({ row: rowIndex, col: colIndex })}
              onDragLeave={() => setHoveredSquare(null)}
              onClick={() => {
                if (selectedSquare) {
                  handleMove(selectedSquare.row, selectedSquare.col, rowIndex, colIndex);
                } else if (piece) {
                  // highlight moves only for your turn
                  if (piece[0] === appstate.turn) {
                    const moves = getValidMoves(
                      { row: rowIndex, col: colIndex },
                      position,
                      appstate.turn
                    );
                    dispatch(setCandidateMoves(moves));
                    setSelectedSquare({ row: rowIndex, col: colIndex });
                  } else {
                    // just select, no moves shown
                    setSelectedSquare({ row: rowIndex, col: colIndex });
                  }
                }
              }}
            >
              {piece && (
                <img
                  src={pieceImages[piece]}
                  alt={piece}
                  className={`w-[98%] h-[98%] object-contain cursor-grab ${isDragging ? 'opacity-60' : 'opacity-100'
                    }`}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', `${rowIndex},${colIndex}`);
                    setDraggingPiece(`${rowIndex},${colIndex}`);

                    if (piece[0] === appstate.turn) {
                      const moves = getValidMoves(
                        { row: rowIndex, col: colIndex },
                        position,
                        appstate.turn
                      );
                      dispatch(setCandidateMoves(moves));
                    } else {
                      dispatch(setCandidateMoves([]));
                    }

                    setSelectedSquare({ row: rowIndex, col: colIndex });

                    setTimeout(() => {
                      e.target.style.display = 'none';
                    }, 0);
                  }}
                  onDragEnd={e => {
                    e.target.style.display = 'block';
                    setDraggingPiece(null);
                    setHoveredSquare(null);
                  }}
                />
              )}

              {isHovered && (
                <div className="absolute inset-0 border-2 border-blue-400 rounded z-10 pointer-events-none"></div>
              )}

              {isNormalMove && (
                <div className="w-4 h-4 rounded-full bg-stone-800 opacity-70 z-10 pointer-events-none"></div>
              )}
              {isCaptureMove && (
                <div className="absolute inset-0 border-2 border-amber-600 rounded z-10 pointer-events-none"></div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Pieces;
