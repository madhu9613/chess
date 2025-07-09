import { getRookMoves } from './PiecesLogic/rook';

export const getValidMoves = (from, board, turn) => {
  const piece = board[from.row][from.col];
  if (!piece || piece[0] !== turn) return [];

  const type = piece[1]; // second letter is piece type (e.g., 'r' for rook)

  switch (type) {
    case 'r':
      return getRookMoves(from, board, turn);
    
    // You can plug more logic like:
    // case 'b': return getBishopMoves(...)
    // case 'q': return getQueenMoves(...)
    // case 'n': return getKnightMoves(...)
    // etc.

    default:
      // For testing: allow moving anywhere
      const moves = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if (row !== from.row || col !== from.col) {
            moves.push({ row, col, capture: board[row][col] !== '' && board[row][col][0] !== turn });
          }
        }
      }
      return moves;
  }
};
