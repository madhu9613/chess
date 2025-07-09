export const getPawnMoves = (from, board, turn, lastMove = null) => {
  const moves = [];
  const direction = turn === 'w' ? -1 : 1;
  const startRow = turn === 'w' ? 6 : 1;
  const promotionRow = turn === 'w' ? 0 : 7;
  const enPassantRow = turn === 'w' ? 3 : 4;

  const oneStepRow = from.row + direction;
  const twoStepRow = from.row + 2 * direction;

  // Single forward move
  if (oneStepRow >= 0 && oneStepRow < 8 && board[oneStepRow][from.col] === '') {
    if (oneStepRow === promotionRow) {
      moves.push({ row: oneStepRow, col: from.col, capture: false, promotion: true });
    } else {
      moves.push({ row: oneStepRow, col: from.col, capture: false });
    }

    // Double move from starting position
    if (from.row === startRow && board[twoStepRow][from.col] === '') {
      moves.push({ row: twoStepRow, col: from.col, capture: false });
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const r = oneStepRow;
    const c = from.col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target !== '' && target[0] !== turn) {
        if (r === promotionRow) {
          moves.push({ row: r, col: c, capture: true, promotion: true });
        } else {
          moves.push({ row: r, col: c, capture: true });
        }
      }
    }
  }

  // En passant
  if (from.row === enPassantRow && lastMove) {
    const { from: lastFrom, to: lastTo, piece: lastPiece } = lastMove;

    if (
      lastPiece[1] === 'p' &&
      Math.abs(lastFrom.row - lastTo.row) === 2 &&
      Math.abs(lastTo.col - from.col) === 1 &&
      lastTo.row === from.row
    ) {
      moves.push({
        row: from.row + direction,
        col: lastTo.col,
        capture: true,
        enPassant: true
      });
    }
  }

  return moves;
};
