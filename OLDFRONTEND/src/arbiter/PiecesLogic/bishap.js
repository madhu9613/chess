export const getBishapMoves = (from, board, turn) => {
  const moves = [];
  const directions = [

    //bishap can move diagonally only
    { dr: 1, dc: 1 }, //upper right diagnal 
        { dr: 1, dc: -1 },  //lower
          { dr: -1, dc: 1 }, 
    { dr: -1, dc: -1 }   
  ];

  for (const { dr, dc } of directions) {
    let r = from.row + dr;
    let c = from.col + dc;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];

      if (target === '') {
        moves.push({ row: r, col: c, capture: false });
      } else {
        if (target[0] !== turn) {
          moves.push({ row: r, col: c, capture: true });
        }
        break; // cannot go beyond any piece
      }

      r += dr;
      c += dc;
    }
  }

  return moves;
};
