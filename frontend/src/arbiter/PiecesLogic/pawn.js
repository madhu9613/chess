export const getPawnMoves = (from, board, turn) => {
  const moves = [];
  const direction = turn === 'w' ? -1 : 1; // white moves up, black moves down
  const startRow = turn === 'w' ? 6 : 1;

  const oneStepRow = from.row + direction;
  const twoStepRow = from.row + 2 * direction;

  // Single forward move
  if (oneStepRow >= 0 && oneStepRow < 8 && board[oneStepRow][from.col] === '') {
    moves.push({ row: oneStepRow, col: from.col, capture: false });

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
        moves.push({ row: r, col: c, capture: true });
      }
    }
  }

  return moves;
};
