const getRookMoves = (from, board, turn) => {
  const directions = [
    { dRow: 0, dCol: 1 },  // right
    { dRow: 0, dCol: -1 }, // left
    { dRow: 1, dCol: 0 },  // down
    { dRow: -1, dCol: 0 }  // up
  ]

  const moves = []
  for (let { dRow, dCol } of directions) {
    let r = from.row + dRow
    let c = from.col + dCol

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c]
      if (!target) {
        moves.push({ row: r, col: c })
      } else {
        if (target[0] !== turn) {
          moves.push({ row: r, col: c }) // capture
        }
        break // blocked
      }
      r += dRow
      c += dCol
    }
  }
  return moves
}

export {
    getRookMoves,
    
}