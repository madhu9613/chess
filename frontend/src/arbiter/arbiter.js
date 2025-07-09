import { getValidMoves } from './getMoves'

export const isMoveLegal = ({ from, to, board, turn }) => {
  const legalMoves = getValidMoves(from, board, turn)
  return legalMoves.some(move => move.row === to.row && move.col === to.col)
}
