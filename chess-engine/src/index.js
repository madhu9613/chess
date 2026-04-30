// src/index.js


export { ChessGame } from './core/ChessGame.js';


export {
    getValidMoves,
    getAllLegalMoves,
    isMoveLegal,
    isMoveLegalBasic,
    isMoveLegalQuick
} from './validators/index.js';


export { getPawnMoves } from './pieces/pawn.js';
export { getKnightMoves } from './pieces/knight.js';
export { getBishopMoves } from './pieces/bishop.js';
export { getRookMoves } from './pieces/rook.js';
export { getQueenMoves } from './pieces/queen.js';
export { getKingMoves } from './pieces/king.js';


export {
    getInitialBoardPosition,
    getEmptyBoard,
    copyBoard,
    algebraicToCoord,
    coordToAlgebraic,
    isValidCoord,
    getPieceAt,
    isSquareAttacked,
    doesPieceAttackSquare,
    getSAN,
    getDetailedSAN,
    parseSAN,
    boardToFEN,
    FENToBoard,
    getStartingFEN,
    isValidFEN
} from './utils/index.js';

export {
    executeMove,
    isCaptureMove,
    isPromotionMove,
    getMoveSAN
} from './core/executeMove.js';