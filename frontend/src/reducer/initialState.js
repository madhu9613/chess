import { getInitialBoardPosition,Status}  from "../utils.js"

export const initialState = {
  position: [getInitialBoardPosition()],
  movesList: [],
  turn: 'w',
  candidateMoves: [],
  promotion: null,
  status: Status.ongoing,
  castlingRights: {
    w: { kingSide: true, queenSide: true },
    b: { kingSide: true, queenSide: true }
  },
  isCheck: { w: false, b: false },
  gameHistory: [],

  // ✅ Multiplayer Info
  playerColor: null,           // 'w' or 'b'
  opponentJoined: false,       // true or false
};

