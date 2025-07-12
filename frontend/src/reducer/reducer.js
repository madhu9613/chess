// src/reducer/reducer.js
import { getInitialBoardPosition } from "../utils";
import actionTypes from "./actionTypes"

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.NEW_MOVE: {
      console.log(state);
      const { newPosition, newMove } = action.payload
      const newHistory = [...state.gameHistory, { position: newPosition, move: newMove }];
      return {
        ...state,
        position: [...state.position, newPosition],
        movesList: [...state.movesList, newMove],
        turn: state.turn === 'w' ? 'b' : 'w',
        gameHistory: newHistory
      }
    }

    case actionTypes.CASTLING_MOVE: {
      const { castle, color } = action.payload;
      const row = color === 'w' ? 7 : 0;
      const newPosition = state.position[state.position.length - 1].map(row => [...row]);

      if (castle === 'kingSide') {
        newPosition[row][6] = newPosition[row][4]; // king to g1/g8
        newPosition[row][5] = newPosition[row][7]; // rook to f1/f8
        newPosition[row][4] = '';
        newPosition[row][7] = '';
      } else if (castle === 'queenSide') {
        newPosition[row][2] = newPosition[row][4]; // king to c1/c8
        newPosition[row][3] = newPosition[row][0]; // rook to d1/d8
        newPosition[row][4] = '';
        newPosition[row][0] = '';
      }

      const san = castle === 'kingSide' ? 'O-O' : 'O-O-O';

      return {
        ...state,
        position: [...state.position, newPosition],
        movesList: [
          ...state.movesList,
          {
            from: { row, col: 4 },
            to: { row, col: castle === 'kingSide' ? 6 : 2 },
            piece: `${color}k`,
            san,
            castle
          }
        ],
        castlingRights: {
          ...state.castlingRights,
          [color]: { kingSide: false, queenSide: false }
        },
        turn: color === 'w' ? 'b' : 'w'
      };
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

      newPosition[from.row][from.col] = '';
      newPosition[to.row][to.col] = promotedPiece;

      const san = (originalPiece[1] === 'p' ? '' : originalPiece[1].toUpperCase())
        + (captured ? 'x' : '')
        + String.fromCharCode(97 + to.col)
        + (8 - to.row)
        + '=' + promotedPiece[1].toUpperCase();

      const move = {
        from,
        to,
        piece: originalPiece,
        captured,
        promotion: true,
        promotedTo: promotedPiece,
        san
      };

      const newHistory = [...state.gameHistory, { position: newPosition, move }];

      return {
        ...state,
        position: [...state.position, newPosition],
        movesList: [...state.movesList, move],
        turn: state.turn === 'w' ? 'b' : 'w',
        promotion: null,
        gameHistory: newHistory
      };
    }


    case actionTypes.SET_CHECK_STATUS: {
      return {
        ...state,
        isCheck: action.payload
      };
    }
    case actionTypes.CHECKMATE:
      return {
        ...state,
        isCheckmate: action.payload // 'w' or 'b'
      };

    case actionTypes.STALEMATE:
      return {
        ...state,
        isStalemate: true
      };

    case actionTypes.RESET_FOR_REPLAY:
      return {
        ...state,
        position: [state.position[0]], // Start from initial position
        movesList: [],
        turn: 'w',
        isCheckmate: null,
        isStalemate: false,
        isCheck: {},
        promotion: null,
        candidateMoves: [],
        gameHistory: action.payload.gameHistory,
      };

      case actionTypes.SET_PLAYER_COLOR:
  return {
    ...state,
    playerColor: action.payload, // 'w' or 'b'
  };

case actionTypes.SET_OPPONENT_JOINED:
  return {
    ...state,
    opponentJoined: action.payload, // true/false
  };


case actionTypes.SET_INITIAL_STATE: {
  const isValidPayload = Array.isArray(action.payload) && 
                         action.payload.length === 8 &&
                         Array.isArray(action.payload[0]);

  return {
    ...state,
    position: [isValidPayload ? action.payload : getInitialBoardPosition()],
    movesList: [],
    turn: 'w',
    gameHistory: []
  };
}

case 'SET_MOVES_LIST':
  return {
    ...state,
    movesList: action.payload
  };





    default:
      return state
  }
}