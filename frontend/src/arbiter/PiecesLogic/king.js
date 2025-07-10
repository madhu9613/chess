// PiecesLogic/king.js
import { isSquareAttacked } from '../../utils.js'; // Create this to check for threats

export const getKingMoves = (from, board, turn, castlingRights) => {
  const moves = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dx, dy] of directions) {
    const row = from.row + dx;
    const col = from.col + dy;

    if (row < 0 || row > 7 || col < 0 || col > 7) continue;

    const targetPiece = board[row][col];
    if (!targetPiece || targetPiece[0] !== turn) {
      moves.push({ row, col, capture: !!targetPiece });
    }
  }

  const row = turn === 'w' ? 7 : 0;
  const enemy = turn === 'w' ? 'b' : 'w';

  if (from.row === row && from.col === 4) {
    // King-side castling
    if (
      castlingRights[turn].kingSide &&
      !board[row][5] && 
      !board[row][6] &&
      !isSquareAttacked({ row, col: 4 }, board, enemy) &&
      !isSquareAttacked({ row, col: 5 }, board, enemy) &&
      !isSquareAttacked({ row, col: 6 }, board, enemy)
    ) {
      moves.push({ row, col: 6, castle: 'kingSide' });
    }

    // Queen-side castling
    if (
      castlingRights[turn].queenSide &&
      !board[row][3] && 
      !board[row][2] && 
      !board[row][1] &&
      !isSquareAttacked({ row, col: 4 }, board, enemy) &&
      !isSquareAttacked({ row, col: 3 }, board, enemy) &&
      !isSquareAttacked({ row, col: 2 }, board, enemy)
    ) {
      moves.push({ row, col: 2, castle: 'queenSide' });
    }
  }

  return moves;
};
