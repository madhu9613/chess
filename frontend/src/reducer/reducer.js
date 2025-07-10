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






    default:
      return state
  }
}
