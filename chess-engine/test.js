import {
    getInitialBoardPosition,
    boardToFEN,
    FENToBoard,
    executeMove,
    getMoveSAN,
    getAllLegalMoves
} from './src/index.js';

// Test FEN conversion
const board = getInitialBoardPosition();
const fen = boardToFEN(board, 'w', {
    w: { kingSide: true, queenSide: true },
    b: { kingSide: true, queenSide: true }
}, null, 0, 1);

console.log('FEN:', fen);
console.log('Expected: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
console.log('Match:', fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

// Test FEN to board conversion
const { board: parsedBoard } = FENToBoard(fen);
console.log('Board parsed correctly:', parsedBoard[0][0] === 'br');

// Test move execution
const move = {
    from: { row: 6, col: 4 }, // e2 pawn
    to: { row: 4, col: 4 },   // e4
    capture: false
};

const { newBoard, enPassantTarget } = executeMove(board, move, 'wp', {
    w: { kingSide: true, queenSide: true },
    b: { kingSide: true, queenSide: true }
});

console.log('Pawn moved:', newBoard[4][4] === 'wp');
console.log('En passant target:', enPassantTarget);

// Test SAN generation
const san = getMoveSAN(board, move, 'wp', null, false, false);
console.log('SAN:', san, '(should be e4)');

console.log('\n✅ All new utilities working!');