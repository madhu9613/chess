import { getValidMoves } from './getMoves';

export const isMoveLegal = ({ from, to, board, turn }) => {
  const legalMoves = getValidMoves(from, board, turn);

  const move = legalMoves.find(
    (m) => m.row === to.row && m.col === to.col
  );

  if (move) {
    if (move.capture) {
      console.log('Captured piece at:', to);
    } else {
      console.log('Normal move to:', to);
    }
    return true;
  }

  return false;
};
