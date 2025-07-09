const getRookMoves = (from, board, turn) => {
  const directions = [

    // for a rook i have thease four directions allowed and i can jump any number of square its easy so
    { dR: 0, dC: 1 },  // right
    { dR: 0, dC: -1 }, // left
    { dR: 1, dC: 0 },  // down
    { dR: -1, dC: 0 }  // up
  ]

  const moves = []
  for (let { dR, dC } of directions) {
    let r = from.row + dR
    let c = from.col + dC

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
      r += dR
      c += dC
    }
  }
  return moves
}

export {
    getRookMoves,

}