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

// reducer/actions/move.js
export const setCheckStatus = (status) => ({
  type: 'SET_CHECK_STATUS',
  payload: status, // { w: true/false, b: true/false }
});



export const setCheckmate = (color) => ({
  type: 'CHECKMATE',
  payload: color
});

export const setStalemate = () => ({
  type: 'STALEMATE'
});



export const makeTakeBack = () => ({
  type: actionTypes.TAKE_BACK
})
