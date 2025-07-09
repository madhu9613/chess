import { getInitialBoardPosition,Status}  from "../utils.js"

export const initialState = {
  position: [getInitialBoardPosition()],
  movesList: [],
  turn: 'w',
  candidateMoves: [],
  promotionSquare: null,
   status : Status.ongoing,
  castleDirection : {
        w : 'both',
        b : 'both'
    }, 
}
