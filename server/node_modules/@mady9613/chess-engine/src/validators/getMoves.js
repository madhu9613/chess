import { getBishopMoves } from '../pieces/bishop.js';
import { getKingMoves } from '../pieces/king.js';
import { getKnightMoves } from '../pieces/knight.js';
import { getPawnMoves } from '../pieces/pawn.js';
import { getQueenMoves } from '../pieces/queen.js';
import { getRookMoves } from '../pieces/rook.js';

// Move handler mapping for performance
const MOVE_HANDLERS = {
  'k': getKingMoves,
  'q': getQueenMoves,
  'r': getRookMoves,
  'b': getBishopMoves,
  'n': getKnightMoves,
  'p': getPawnMoves
};


export const getValidMoves = (from, board, turn, lastMove, castlingRights) => {
  const piece = board[from.row][from.col];

  // Quick validation
  if (!piece || piece[0] !== turn) return [];

  const type = piece[1];
  const handler = MOVE_HANDLERS[type];

  if (!handler) return [];

  // Pass appropriate parameters based on piece type
  if (type === 'k') {
    return handler(from, board, turn, castlingRights, lastMove);
  }
  if (type === 'p') {
    return handler(from, board, turn, lastMove);
  }
  return handler(from, board, turn);
};