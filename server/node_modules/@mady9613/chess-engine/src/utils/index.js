// src/utils/index.js

// Board utilities
export {
    getInitialBoardPosition,
    getEmptyBoard,
    copyBoard,
    algebraicToCoord,
    coordToAlgebraic,
    isValidCoord,
    getPieceAt
} from './boardUtils.js';

// Attack utilities
export {
    isSquareAttacked,
    doesPieceAttackSquare
} from './attackUtils.js';

// Notation utilities
export {
    getSAN,
    getDetailedSAN,
    parseSAN
} from './notationUtils.js';

// FEN utilities
export {
    boardToFEN,
    FENToBoard,
    getStartingFEN,
    isValidFEN
} from './fen.js';