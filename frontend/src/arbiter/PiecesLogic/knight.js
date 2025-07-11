export const getKnightMoves = (from, board, turn) => {
  const moves = [];
  const knightJumps = [
    { dr: -2, dc: -1 },
    { dr: -2, dc: 1 },
    { dr: -1, dc: -2 },
    { dr: -1, dc: 2 },
    { dr: 1, dc: -2 },
    { dr: 1, dc: 2 },
    { dr: 2, dc: -1 },
    { dr: 2, dc: 1 },
  ];

  for (const { dr, dc } of knightJumps) {
    const r = from.row + dr;
    const c = from.col + dc;

    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (target === '') {
        moves.push({ row: r, col: c, capture: false });
      } else if (target[0] !== turn) {
        moves.push({ row: r, col: c, capture: true });
      }
    }
  }

  return moves;
};
