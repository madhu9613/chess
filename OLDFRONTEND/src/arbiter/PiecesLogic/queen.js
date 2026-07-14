export const getQueenMoves = (from, board, turn) => {
  const moves = [];
  const directions = [
    { dr: -1, dc: 0 },  // up
    { dr: 1, dc: 0 },   // down
    { dr: 0, dc: -1 },  // left
    { dr: 0, dc: 1 },   // right
    { dr: -1, dc: -1 }, // up-left
    { dr: -1, dc: 1 },  // up-right
    { dr: 1, dc: -1 },  // down-left
    { dr: 1, dc: 1 }    // down-right
  ];

  for (const { dr, dc } of directions) {
    let r = from.row + dr;
    let c = from.col + dc;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];

      if (target === '') {
        moves.push({
          from: { row: from.row, col: from.col },
          row: r,
          col: c,
          capture: false
        });
      } else {
        if (target[0] !== turn) {
          moves.push({
            from: { row: from.row, col: from.col },
            row: r,
            col: c,
            capture: true
          });
        }
        break;
      }

      r += dr;
      c += dc;
    }
  }

  return moves;
};
