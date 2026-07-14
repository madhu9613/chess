import { useContext } from 'react';
import { getBishapMoves } from './PiecesLogic/bishap';
import { getKingMoves } from './PiecesLogic/king';
import { getKnightMoves } from './PiecesLogic/knight';
import { getPawnMoves } from './PiecesLogic/pawn';
import { getQueenMoves } from './PiecesLogic/queen';
import { getRookMoves } from './PiecesLogic/rook';
import { AppContext } from '../context/AppContext';

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
      return getBishapMoves(from, board, turn);
    case 'n':
      return getKnightMoves(from, board, turn);
    case 'p':
      return getPawnMoves(from, board, turn, lastMove);
    default:
      return [];
  }
};
