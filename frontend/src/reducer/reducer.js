// src/reducer/reducer.js
import actionTypes from "./actionTypes"

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.NEW_MOVE: {
      console.log(state);
      const { newPosition, newMove } = action.payload
      return {
        ...state,
        position: [...state.position, newPosition],
        movesList: [...state.movesList, newMove],
        turn: state.turn === 'w' ? 'b' : 'w'
      }
    }

    case actionTypes.TAKE_BACK: {
      const newMovesList = [...state.movesList]
      const newPosition = [...state.position]

      if (newMovesList.length === 0 || newPosition.length <= 1) return state

      newMovesList.pop()
      newPosition.pop()

      return {
        ...state,
        movesList: newMovesList,
        position: newPosition,
        turn: state.turn === 'w' ? 'b' : 'w'
      }
    }

    case actionTypes.SET_CANDIDATE_MOVES: {
      return {
        ...state,
        candidateMoves: action.payload
      };
    }

    case actionTypes.SET_PROMOTION:
      {
        return {
          ...state,
          promotion: action.payload, // { from, to, piece, captured, san }
        };
      }

    case actionTypes.COMPLETE_PROMOTION: {
  const { to, from, promotedPiece, captured, originalPiece } = action.payload;
  const newPosition = state.position[state.position.length - 1].map(row => [...row]);

  // Place promoted piece at destination
  newPosition[from.row][from.col] = '';
  newPosition[to.row][to.col] = promotedPiece;

  const san = (originalPiece[1] === 'p' ? '' : originalPiece[1].toUpperCase())
    + (captured ? 'x' : '')
    + String.fromCharCode(97 + to.col)
    + (8 - to.row)
    + '=' + promotedPiece[1].toUpperCase();

  return {
    ...state,
    position: [...state.position, newPosition],
    movesList: [
      ...state.movesList,
      {
        from,
        to,
        piece: originalPiece,
        captured,
        promotion: true,
        promotedTo: promotedPiece,
        san
      }
    ],
    turn: state.turn === 'w' ? 'b' : 'w',
    promotion: null,
  };
}




    default:
      return state
  }
}
