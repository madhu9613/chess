import { getRookMoves } from "./PiecesLogic/rook"

export const getValidMoves = (from, board, turn) => {
  const piece = board[from.row][from.col]
  if (!piece || piece[0] !== turn) return []

  const type = piece[1]

  switch (type) {
    case 'r':
      return getRookMoves(from, board, turn)
    
     
    // Allow any move for other pieces (for testing purposes)
    default: {
      const validMoves = []

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          // Allow move if it's not the same square and not a friendly piece
          const targetPiece = board[row][col]
          if (row === from.row && col === from.col) continue
          if (!targetPiece || targetPiece[0] !== turn) {
            validMoves.push({ row, col })
          }
        }
      }

      return validMoves
    }
  }
}
