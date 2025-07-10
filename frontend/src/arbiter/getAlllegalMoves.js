// utils/getAllLegalMoves.js
import { getValidMoves } from '../arbiter/getMoves';
import { isSquareAttacked } from '../utils';

export const getAllLegalMoves = (board, turn, lastMove, castlingRights) => {
  const legalMoves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece[0] !== turn) continue;

      const moves = getValidMoves({ row, col }, board, turn, lastMove, castlingRights);

      for (const move of moves) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = '';
        newBoard[move.row][move.col] = piece;

        // Find king after this move
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (newBoard[r][c] === turn + 'k') {
              kingPos = { row: r, col: c };
              break;
            }
          }
        }

        const inCheck = isSquareAttacked(kingPos, newBoard, turn === 'w' ? 'b' : 'w', { from: { row, col }, to: { row: move.row, col: move.col } }, castlingRights);

        if (!inCheck) {
          legalMoves.push({ from: { row, col }, to: { row: move.row, col: move.col }, ...move });
        }
      }
    }
  }

  return legalMoves;
};
