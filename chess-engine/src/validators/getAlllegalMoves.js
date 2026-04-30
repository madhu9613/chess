// src/validators/getAllLegalMoves.js

import { getValidMoves } from './getMoves.js';
import { isSquareAttacked } from '../utils/attackUtils.js';
import { copyBoard } from '../utils/boardUtils.js';
import { executeMove } from '../core/executeMove.js';


export const getAllLegalMoves = (board, turn, lastMove, castlingRights) => {
  const legalMoves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece[0] !== turn) continue;

      const moves = getValidMoves({ row, col }, board, turn, lastMove, castlingRights);
      if (moves.length === 0) continue;

      for (const move of moves) {
        // Create complete move object
        const fullMove = {
          from: { row, col },
          to: { row: move.row, col: move.col },
          capture: move.capture || false,
          promotion: move.promotion || false,
          enPassant: move.enPassant || false,
          castle: move.castle || null
        };

        // Execute the move on a copy of the board
        const { newBoard } = executeMove(
          copyBoard(board),
          fullMove,
          piece,
          castlingRights
        );

        // Find king position after move
        let kingPos = null;
        if (piece[1] === 'k') {
          // King moved to new position
          kingPos = { row: move.row, col: move.col };
        } else {
          // Find king in new board
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (newBoard[r][c] === turn + 'k') {
                kingPos = { row: r, col: c };
                break;
              }
            }
          }
        }

        // Check if king is in check after move
        const inCheck = isSquareAttacked(
          kingPos,
          newBoard,
          turn === 'w' ? 'b' : 'w',
          fullMove,
          castlingRights
        );

        if (!inCheck) {
          legalMoves.push({
            from: { row, col },
            to: { row: move.row, col: move.col },
            piece: piece,
            capture: move.capture || false,
            promotion: move.promotion || false,
            enPassant: move.enPassant || false,
            castle: move.castle || null,
            ...move
          });
        }
      }
    }
  }

  return legalMoves;
};

export const isMoveLegalQuick = ({ from, to, board, turn, lastMove, castlingRights }) => {
  const piece = board[from.row][from.col];
  if (!piece || piece[0] !== turn) return false;

  const moves = getValidMoves(from, board, turn, lastMove, castlingRights);
  const isValid = moves.some(m => m.row === to.row && m.col === to.col);

  if (!isValid) return false;

  // Verify king doesn't move into check
  const fullMove = { from, to };
  const { newBoard } = executeMove(copyBoard(board), fullMove, piece, castlingRights);

  let kingPos = null;
  if (piece[1] === 'k') {
    kingPos = { row: to.row, col: to.col };
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c] === turn + 'k') {
          kingPos = { row: r, col: c };
          break;
        }
      }
    }
  }

  return !isSquareAttacked(
    kingPos,
    newBoard,
    turn === 'w' ? 'b' : 'w',
    fullMove,
    castlingRights
  );
};