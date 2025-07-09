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


    default:
      return state
  }
}
