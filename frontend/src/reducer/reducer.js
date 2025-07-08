// src/reducer/reducer.js
import actionTypes from "./actionTypes"

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.NEW_MOVE: {
      const { newPosition, newMove } = action.payload
      return {
        ...state,
        position: [...state.position, newPosition],
        movesList: [...state.movesList, newMove],
        turn: state.turn === 'w' ? 'b' : 'w'
      }
    }

    default:
      return state
  }
}
