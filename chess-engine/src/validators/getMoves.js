
import { getBishopMoves } from '../pieces/bishop.js';
import { getKingMoves } from '../pieces/king.js';
import { getKnightMoves } from '../pieces/knight.js';
import { getPawnMoves } from '../pieces/pawn.js';
import { getQueenMoves } from '../pieces/queen.js';
import { getRookMoves } from '../pieces/rook.js';


export const getValidMoves = (from, board, turn, lastMove, castlingRights) => {
  const piece = board[from.row][from.col];
  if (!piece || piece[0] !== turn) return [];

  const type = piece[1];

  switch (type) {
    case 'k':
      return getKingMoves(from, board, turn, castlingRights, lastMove);
    case 'q':
      return getQueenMoves(from, board, turn);
    case 'r':
      return getRookMoves(from, board, turn);
    case 'b':
      return getBishopMoves(from, board, turn);
    case 'n':
      return getKnightMoves(from, board, turn);
    case 'p':
      return getPawnMoves(from, board, turn, lastMove);
    default:
      return [];
  }
};
