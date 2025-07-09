import { getRookMoves } from "./PiecesLogic/rook"

export const getValidMoves = (from, board, turn) => {
  const piece = board[from.row][from.col]
  if (!piece || piece[0] !== turn) return []

  const type = piece[1]
  switch (type) {
    case 'r': return getRookMoves(from, board, turn)
    // TODO: Add logic for other pieces
    default: return []
  }
}


