// actions/move.js
import actionTypes from "../actionTypes";

export const makeNewMove = ({ newPosition, newMove }) => {
  return {
    type: 'NEW_MOVE',
    payload: { newPosition, newMove }
  };
};

export const setCandidateMoves = (moves) => ({
  type: 'SET_CANDIDATE_MOVES',
  payload: moves
});





export const makeTakeBack = () => ({
  type: actionTypes.TAKE_BACK
})