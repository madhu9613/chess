// ✅ Fixed version of Pieces.jsx with full check, checkmate, stalemate detection
import React, { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  makeNewMove,
  setCandidateMoves,
  setCheckStatus,
  setCheckmate,
  setStalemate
} from '../../reducer/actions/move';
import { getValidMoves } from '../../arbiter/getMoves';
import PromoteModal from '../PromoteModal';
import { pieceImages, getSAN, isSquareAttacked } from '../../utils';
import { getAllLegalMoves } from '../../arbiter/getAlllegalMoves';

const Pieces = ({ reversed }) => {
  const { appstate, dispatch } = useContext(AppContext);
  const position = appstate.position[appstate.position.length - 1];
  const validMoves = appstate.candidateMoves;
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const lastMove = useMemo(() => appstate.movesList[appstate.movesList.length - 1], [appstate.movesList]);

  const [candidateNormalMoves, candidateCaptureMoves] = useMemo(() => {
    const normal = Array(8).fill().map(() => Array(8).fill(false));
    const capture = Array(8).fill().map(() => Array(8).fill(false));
    validMoves.forEach(move => {
      if (move.capture) capture[move.row][move.col] = true;
      else normal[move.row][move.col] = true;
    });
    return [normal, capture];
  }, [validMoves]);

  const handleMove = useCallback((fromRow, fromCol, toRow, toCol) => {
    const piece = position[fromRow][fromCol];
    if (!piece || piece[0] !== appstate.turn) return;

    const move = validMoves.find(m => m.row === toRow && m.col === toCol);
    if (!move) return;

    if (move.castle) {
      dispatch({ type: 'CASTLING_MOVE', payload: { castle: move.castle, color: appstate.turn } });
      dispatch(setCandidateMoves([]));
      setSelectedSquare(null);
      return;
    }

    if (move.promotion) {
      dispatch({
        type: 'SET_PROMOTION',
        payload: { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol }, piece, captured: move.capture || false }
      });
      return;
    }

    const newPosition = position.map(row => [...row]);
    newPosition[fromRow][fromCol] = '';
    newPosition[toRow][toCol] = piece;

    const newMove = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece,
      captured: move.capture || false,
      san: getSAN(piece, fromRow, fromCol, toRow, toCol, move.capture)
    };

    dispatch(makeNewMove({ newPosition, newMove }));
    dispatch(setCandidateMoves([]));
    setSelectedSquare(null);
  }, [position, appstate, validMoves, dispatch]);

  useEffect(() => {
    const board = appstate.position[appstate.position.length - 1];
    const enemyColor = appstate.turn;
    let kingPos = null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === enemyColor + 'k') {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return;

    const inCheck = isSquareAttacked(
      kingPos,
      board,
      enemyColor === 'w' ? 'b' : 'w',
      appstate.movesList[appstate.movesList.length - 1],
      appstate.castlingRights
    );

    dispatch(setCheckStatus({ ...appstate.isCheck, [enemyColor]: inCheck }));

    const legalMoves = getAllLegalMoves(board, enemyColor, appstate.movesList[appstate.movesList.length - 1], appstate.castlingRights);

    if (legalMoves.length === 0) {
      if (inCheck) dispatch(setCheckmate(enemyColor));
      else dispatch(setStalemate());
    }
  }, [appstate.position]);

  const handleDrop = useCallback((e, toRow, toCol) => {
    e.preventDefault();
    setHoveredSquare(null);
    const [fromRow, fromCol] = e.dataTransfer.getData('text/plain').split(',').map(Number);
    handleMove(fromRow, fromCol, toRow, toCol);
    setDraggingPiece(null);
  }, [handleMove]);

  const handleSquareClick = useCallback((rowIndex, colIndex, piece) => {
    const allMoves = getAllLegalMoves(position, appstate.turn, lastMove, appstate.castlingRights);
    const filtered = allMoves.filter(m => m.from.row === rowIndex && m.from.col === colIndex);
    if (selectedSquare) {
      if (selectedSquare.row === rowIndex && selectedSquare.col === colIndex) {
        dispatch(setCandidateMoves([]));
        setSelectedSquare(null);
      } else {
        handleMove(selectedSquare.row, selectedSquare.col, rowIndex, colIndex);
      }
    } else if (piece && piece[0] === appstate.turn) {
      dispatch(setCandidateMoves(filtered.map(({ to: { row, col }, ...rest }) => ({ ...rest, row, col }))));
      setSelectedSquare({ row: rowIndex, col: colIndex });
    } else {
      dispatch(setCandidateMoves([]));
      setSelectedSquare(null);
    }
  }, [selectedSquare, appstate, dispatch, position, handleMove, lastMove]);

  const displayBoard = reversed ? [...position].reverse().map(row => [...row].reverse()) : position;

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full grid grid-cols-8 grid-rows-8">
        {displayBoard.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const actualRow = reversed ? 7 - rowIndex : rowIndex;
            const actualCol = reversed ? 7 - colIndex : colIndex;
            const isDragging = draggingPiece === `${actualRow},${actualCol}`;
            const isHovered = hoveredSquare?.row === actualRow && hoveredSquare?.col === actualCol;
            const isFrom = lastMove?.from?.row === actualRow && lastMove?.from?.col === actualCol;
            const isTo = lastMove?.to?.row === actualRow && lastMove?.to?.col === actualCol;
            const isNormalMove = candidateNormalMoves[actualRow][actualCol];
            const isCaptureMove = candidateCaptureMoves[actualRow][actualCol];
            const isSelected = selectedSquare?.row === actualRow && selectedSquare?.col === actualCol;
            const isOwnTurnPiece = piece && piece[0] === appstate.turn;
            const isKingInCheck = piece === appstate.turn + 'k' && appstate.isCheck?.[appstate.turn];

            const highlightColor =
              isKingInCheck ? 'border-4 border-red-500'
                : isSelected && isOwnTurnPiece ? 'bg-blue-400/40'
                : isFrom ? 'bg-green-300/50'
                : isTo ? 'bg-yellow-300/50'
                : '';

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`tile-size flex items-center justify-center relative ${highlightColor} transition-colors duration-150`}
                onDrop={e => handleDrop(e, actualRow, actualCol)}
                onDragOver={e => { e.preventDefault(); setHoveredSquare({ row: actualRow, col: actualCol }); }}
                onDragEnter={() => setHoveredSquare({ row: actualRow, col: actualCol })}
                onDragLeave={() => setHoveredSquare(null)}
                onClick={() => handleSquareClick(actualRow, actualCol, piece)}
              >
                {piece && (
                  <img
                    src={pieceImages[piece]}
                    alt={piece}
                    className={`w-[98%] h-[98%] object-contain cursor-grab ${isDragging ? 'opacity-60' : 'opacity-100'}`}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', `${actualRow},${actualCol}`);
                      setDraggingPiece(`${actualRow},${actualCol}`);
                      const allMoves = getAllLegalMoves(position, appstate.turn, lastMove, appstate.castlingRights);
                      const filtered = allMoves.filter(m => m.from.row === actualRow && m.from.col === actualCol);
                      dispatch(setCandidateMoves(filtered.map(({ to: { row, col }, ...rest }) => ({ ...rest, row, col }))));
                      setSelectedSquare({ row: actualRow, col: actualCol });
                      setTimeout(() => { e.target.style.display = 'none'; }, 0);
                    }}
                    onDragEnd={e => {
                      e.target.style.display = 'block';
                      setDraggingPiece(null);
                      setHoveredSquare(null);
                    }}
                  />
                )}
                {isHovered && <div className="absolute inset-0 border-2 border-blue-400 rounded z-10 pointer-events-none"></div>}
                {isNormalMove && <div className="w-4 h-4 rounded-full bg-stone-800 opacity-70 z-10 pointer-events-none"></div>}
                {isCaptureMove && <div className="absolute inset-0 border-2 border-amber-600 rounded z-10 pointer-events-none"></div>}
              </div>
            );
          })
        )}
      </div>

      {appstate.promotion && <PromoteModal />}

      {appstate.isCheckmate && (
        <div className="absolute inset-0 bg-black/80 text-white text-3xl flex items-center justify-center z-50">
          Checkmate! {appstate.isCheckmate === 'w' ? 'White' : 'Black'} loses!
        </div>
      )}

      {appstate.isStalemate && (
        <div className="absolute inset-0 bg-black/80 text-white text-3xl flex items-center justify-center z-50">
          Stalemate!
        </div>
      )}
    </>
  );
};

export default Pieces;
