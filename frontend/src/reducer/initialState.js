// import { Status } from "../constants"
import { getInitialBoardPosition}  from "../utils.js"

export const initialState = {
  position: [getInitialBoardPosition],
  movesList: [],
  turn: 'w',
  candidateMoves: [],
//   status: Status.ongoing,
  promotionSquare: null,
  castleDirection: { w: null, b: null }
}
