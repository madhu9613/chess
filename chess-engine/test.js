// test.js - Complete Test Suite for ChessGame

import { ChessGame } from './src/core/ChessGame.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('              CHESS ENGINE TEST SUITE v2.0');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, errorMessage) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
        return true;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   ${errorMessage}`);
        failed++;
        return false;
    }
}

function assertEqual(actual, expected, testName) {
    const condition = actual === expected;
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual:   ${actual}`);
        failed++;
    }
    return condition;
}

// ========== TEST 1: Initialization ==========
console.log('📋 TEST GROUP 1: Initialization');
console.log('─────────────────────────────────');

const game = new ChessGame();
assert(game !== null, 'Game constructor creates instance', 'Constructor returned null');
assertEqual(game.getTurn(), 'w', 'Initial turn is white');
assertEqual(game.getBoard().length, 8, 'Board has 8 rows');
assertEqual(game.getBoard()[0].length, 8, 'Board has 8 columns');
assertEqual(game.getPieceAt('a1'), 'wr', 'Piece at a1 is white rook');
assertEqual(game.getPieceAt('e1'), 'wk', 'Piece at e1 is white king');
assertEqual(game.getPieceAt('a8'), 'br', 'Piece at a8 is black rook');
assertEqual(game.getPieceAt('e8'), 'bk', 'Piece at e8 is black king');
assertEqual(game.getPieceAt('d2'), 'wp', 'Piece at d2 is white pawn');
assertEqual(game.getPieceAt('d7'), 'bp', 'Piece at d7 is black pawn');
assert(!game.isGameOver(), 'Game not over at start');
assert(!game.isCheck(), 'Not in check at start');
assert(!game.isCheckmate(), 'Not checkmate at start');
assert(!game.isStalemate(), 'Not stalemate at start');

console.log('');

// ========== TEST 2: Move Execution ==========
console.log('📋 TEST GROUP 2: Move Execution');
console.log('────────────────────────────────');

const game2 = new ChessGame();

// Test e4 move
const move1 = game2.move('e2e4');
assert(move1.success, 'Move e2e4 is valid', 'e2e4 should be valid');
assertEqual(move1.san, 'e4', 'SAN for e2e4 is e4');
assertEqual(move1.piece, 'wp', 'Piece moved is white pawn');
assert(!move1.capture, 'e2e4 is not a capture');
assert(!move1.check, 'e2e4 does not give check');
assert(!move1.checkmate, 'e2e4 is not checkmate');

assertEqual(game2.getTurn(), 'b', 'After e4, turn is black');
assertEqual(game2.getPieceAt('e4'), 'wp', 'Pawn moved to e4');
assertEqual(game2.getPieceAt('e2'), '', 'e2 is now empty');
assertEqual(game2.getMoveCount(), 1, 'Move count is 1');

// Test Nf6 move
const move2 = game2.move('g8f6');
assert(move2.success, 'Move g8f6 is valid', 'g8f6 should be valid');
assertEqual(move2.san, 'Nf6', 'SAN for g8f6 is Nf6');
assertEqual(move2.piece, 'bn', 'Piece moved is black knight');
assertEqual(game2.getTurn(), 'w', 'After Nf6, turn is white');

// Test invalid move
const invalidMove = game2.move('e2e5');
assert(!invalidMove.success, 'Invalid move e2e5 is rejected', 'Should reject illegal move');
assertEqual(invalidMove.error, 'Illegal move', 'Error message is correct');

console.log('');

// ========== TEST 3: Capture Moves ==========
console.log('📋 TEST GROUP 3: Capture Moves');
console.log('───────────────────────────────');

const game3 = new ChessGame();
game3.move('e2e4');  // e4
game3.move('d7d5');  // d5
const capture = game3.move('e4d5');  // exd5

assert(capture.success, 'Capture move exd5 is valid', 'Should capture');
assert(capture.capture, 'Move is recognized as capture', 'capture flag should be true');
assertEqual(capture.san, 'exd5', 'SAN for capture is exd5');
assertEqual(game3.getPieceAt('d5'), 'wp', 'White pawn now on d5');
assertEqual(game3.getPieceAt('d7'), '', 'd7 is empty');
assertEqual(game3.getPieceAt('e4'), '', 'e4 is empty');

console.log('');

// ========== TEST 4: Pawn Promotion ==========
console.log('📋 TEST GROUP 4: Pawn Promotion');
console.log('────────────────────────────────');

const game4 = new ChessGame();
// Setup promotion position
game4.loadFEN('8/1P6/8/8/8/8/8/k1K5 w - - 0 1');
const promotion = game4.move('b7b8q');

assert(promotion.success, 'Pawn promotion is valid', 'Should promote');
assert(promotion.promotion, 'Move includes promotion', 'promotion flag should be true');
assertEqual(promotion.san, 'b8=Q', 'SAN for promotion is b8=Q');
assertEqual(game4.getPieceAt('b8'), 'wq', 'Pawn promoted to queen');
assertEqual(game4.getPieceAt('b7'), '', 'b7 is empty');

// Test promotion with explicit piece
const game4b = new ChessGame();
game4b.loadFEN('8/1P6/8/8/8/8/8/k1K5 w - - 0 1');
const promotionRook = game4b.move('b7b8r');
assertEqual(promotionRook.san, 'b8=R', 'SAN for rook promotion is b8=R');
assertEqual(game4b.getPieceAt('b8'), 'wr', 'Pawn promoted to rook');

console.log('');

// ========== TEST 5: Castling ==========
console.log('📋 TEST GROUP 5: Castling');
console.log('──────────────────────────');

const game5 = new ChessGame();
game5.move('e2e4');  // e4
game5.move('e7e5');  // e5
game5.move('f1c4');  // Bc4
game5.move('f8c5');  // Bc5
game5.move('g1f3');  // Nf3
game5.move('g8f6');  // Nf6
const castle = game5.move('e1g1');  // O-O

assert(castle.success, 'Kingside castling is valid', 'Should castle');
assertEqual(castle.san, 'O-O', 'SAN for castling is O-O');
assertEqual(game5.getPieceAt('g1'), 'wk', 'King moved to g1');
assertEqual(game5.getPieceAt('f1'), 'wr', 'Rook moved to f1');
assertEqual(game5.getPieceAt('e1'), '', 'e1 is empty');
assertEqual(game5.getPieceAt('h1'), '', 'h1 is empty');

// Queenside castling
const game5b = new ChessGame();
game5b.loadFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
const queenCastle = game5b.move('e1c1');
assert(queenCastle.success, 'Queenside castling is valid', 'Should castle queenside');
assertEqual(queenCastle.san, 'O-O-O', 'SAN for queenside castling is O-O-O');
assertEqual(game5b.getPieceAt('c1'), 'wk', 'King moved to c1');
assertEqual(game5b.getPieceAt('d1'), 'wr', 'Rook moved to d1');

console.log('');

// ========== TEST 6: En Passant ==========
console.log('📋 TEST GROUP 6: En Passant');
console.log('────────────────────────────');

const game6 = new ChessGame();
game6.move('e2e4');  // e4
game6.move('d7d5');  // d5
game6.move('e4d5');  // exd5
game6.move('c7c5');  // c5
const enPassant = game6.move('d5c6');  // en passant capture

assert(enPassant.success, 'En passant capture is valid', 'Should capture en passant');
assert(enPassant.capture, 'Move is recognized as capture', 'capture flag should be true');
assertEqual(enPassant.san, 'dxc6', 'SAN for en passant is dxc6');
assertEqual(game6.getPieceAt('c6'), 'wp', 'White pawn now on c6');
assertEqual(game6.getPieceAt('c5'), '', 'Black pawn captured from c5');

console.log('');

// ========== TEST 7: Check and Checkmate ==========
console.log('📋 TEST GROUP 7: Check and Checkmate');
console.log('─────────────────────────────────────');

const game7 = new ChessGame();
// Fool's mate position
game7.loadFEN('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 0 1');

assert(game7.isCheck(), 'Black king is in check', 'Should detect check');
assert(game7.isCheckmate(), 'Black is checkmated', 'Should detect checkmate');
assert(game7.isGameOver(), 'Game is over after checkmate', 'Checkmate ends game');
assertEqual(game7.getWinner(), 'b', 'Winner is black');

const game7b = new ChessGame();
const result = game7b.move('f2f3');  // f3
game7b.move('e7e6');  // e6
game7b.move('g2g4');  // g4
game7b.move('d8h4');  // Qh4#

assert(game7b.isCheck(), 'White king in check', 'Should detect check');
assert(game7b.isCheckmate(), 'White is checkmated', 'Should detect checkmate');
assert(game7b.isGameOver(), 'Game is over', 'Checkmate ends game');
assertEqual(game7b.getWinner(), 'b', 'Winner is black');

console.log('');

// ========== TEST 8: Stalemate ==========
console.log('📋 TEST GROUP 8: Stalemate');
console.log('───────────────────────────');

const game8 = new ChessGame();
game8.loadFEN('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1');

assert(!game8.isCheck(), 'Side to move is not in check', 'No check');
assert(game8.isStalemate(), 'Stalemate detected', 'Should detect stalemate');
assert(game8.isDraw(), 'Game is a draw', 'Stalemate is draw');
assert(game8.isGameOver(), 'Game is over', 'Stalemate ends game');
assertEqual(game8.getWinner(), null, 'No winner in stalemate');

console.log('');

// ========== TEST 9: Undo and Redo ==========
console.log('📋 TEST GROUP 9: Undo and Redo');
console.log('───────────────────────────────');

const game9 = new ChessGame();
game9.move('e2e4');  // e4
game9.move('e7e5');  // e5
game9.move('g1f3');  // Nf3

const beforeUndo = game9.getFEN();
assert(game9.canUndo(), 'Can undo after moves', 'Should be undoable');

const undoResult = game9.undo();
assert(undoResult, 'Undo successful', 'Should undo Nf3');
assertEqual(game9.getTurn(), 'w', 'After undo, turn is white');
assertEqual(game9.getPieceAt('g1'), 'wn', 'Knight back to g1');
assertEqual(game9.getPieceAt('f3'), '', 'f3 is empty');

assert(game9.canRedo(), 'Can redo after undo', 'Should be redoable');
game9.redo();
assertEqual(game9.getPieceAt('f3'), 'wn', 'After redo, knight on f3');
assertEqual(game9.getTurn(), 'b', 'After redo, turn is black');

console.log('');

// ========== TEST 10: FEN Import/Export ==========
console.log('📋 TEST GROUP 10: FEN Import/Export');
console.log('────────────────────────────────────');

const game10 = new ChessGame();
game10.move('e2e4');
const fen = game10.getFEN();
assert(typeof fen === 'string', 'getFEN returns string', 'Should return FEN string');
assert(fen.length > 10, 'FEN string is valid', 'FEN should not be empty');

const game10b = new ChessGame(fen);
assertEqual(game10b.getPieceAt('e4'), 'wp', 'Loaded FEN has pawn on e4');
assertEqual(game10b.getTurn(), 'b', 'Loaded FEN has correct turn');

// Test invalid FEN
const isValid = ChessGame.isValidFEN('invalid fen');
assert(!isValid, 'Invalid FEN rejected', 'Should return false for invalid FEN');

console.log('');

// ========== TEST 11: Move History and Navigation ==========
console.log('📋 TEST GROUP 11: Move History and Navigation');
console.log('──────────────────────────────────────────────');

const game11 = new ChessGame();
game11.move('e2e4');  // 1. e4
game11.move('e7e5');  // 1... e5
game11.move('g1f3');  // 2. Nf3
game11.move('b8c6');  // 2... Nc6

const history = game11.getMoveHistory();
assertEqual(history.length, 4, 'History has 4 moves', 'Should track all moves');
assertEqual(history[0].san, 'e4', 'First move SAN is e4');
assertEqual(history[1].san, 'e5', 'Second move SAN is e5');
assertEqual(history[2].san, 'Nf3', 'Third move SAN is Nf3');
assertEqual(history[3].san, 'Nc6', 'Fourth move SAN is Nc6');

game11.goToMove(2);
assertEqual(game11.getPieceAt('e4'), 'wp', 'After goToMove(2), pawn on e4');
assertEqual(game11.getPieceAt('g1'), 'wn', 'Knight still on g1');
assertEqual(game11.getTurn(), 'w', 'Turn is white after goToMove(2)');

game11.goToEnd();
assertEqual(game11.getPieceAt('c6'), 'bn', 'After goToEnd, knight on c6');

game11.goToStart();
assertEqual(game11.getPieceAt('e2'), 'wp', 'After goToStart, pawn on e2');
assertEqual(game11.getPieceAt('g1'), 'wn', 'After goToStart, knight on g1');

console.log('');

// ========== TEST 12: Draw Detection ==========
console.log('📋 TEST GROUP 12: Draw Detection');
console.log('─────────────────────────────────');

// Threefold repetition
const game12 = new ChessGame();
game12.move('g1f3');  // Nf3
game12.move('g8f6');  // Nf6
game12.move('f3g1');  // Ng1
game12.move('f6g8');  // Ng8
game12.move('g1f3');  // Nf3
game12.move('g8f6');  // Nf6
game12.move('f3g1');  // Ng1
game12.move('f6g8');  // Ng8

const isThreefold = game12.isThreefoldRepetition();
assert(isThreefold, 'Threefold repetition detected', 'Should detect repetition');

// Insufficient material - King vs King
const game12b = new ChessGame();
game12b.loadFEN('k7/8/8/8/8/8/8/K7 w - - 0 1');
assert(game12b.isInsufficientMaterial(), 'Insufficient material detected', 'K vs K is draw');

// King + Bishop vs King
const game12c = new ChessGame();
game12c.loadFEN('k7/8/8/8/8/8/3b4/K7 w - - 0 1');
assert(game12c.isInsufficientMaterial(), 'K+B vs K is draw', 'King and bishop only');

console.log('');

// ========== TEST 13: PGN Export ==========
console.log('📋 TEST GROUP 13: PGN Export');
console.log('─────────────────────────────');

const game13 = new ChessGame();
game13.move('e2e4');
game13.move('e7e5');
game13.move('g1f3');
game13.move('b8c6');
const pgn = game13.getPGN();
assert(pgn.includes('e4'), 'PGN has first move', 'Should show 1. e4');
assert(pgn.includes('e5'), 'PGN has second move', 'Should show 1... e5');
assert(pgn.includes('Nf3'), 'PGN has third move', 'Should show 2. Nf3');
assert(pgn.includes('Nc6'), 'PGN has fourth move', 'Should show 2... Nc6');

console.log('');

// ========== TEST 14: Clone ==========
console.log('📋 TEST GROUP 14: Clone');
console.log('────────────────────────');

const game14 = new ChessGame();
game14.move('e2e4');
game14.move('e7e5');

const clone = game14.clone();
assert(clone !== game14, 'Clone is different object', 'Should be new instance');
assertEqual(clone.getFEN(), game14.getFEN(), 'Clone has same position', 'Should match');
assertEqual(clone.getTurn(), game14.getTurn(), 'Clone has same turn', 'Should match');
assertEqual(clone.getPieceAt('e4'), game14.getPieceAt('e4'), 'Clone has same pieces', 'Should match');

// Verify modifying clone doesn't affect original
clone.move('g1f3');
assert(game14.getPieceAt('g1') !== '', 'Original unaffected by clone move', 'Should remain independent');

console.log('');

// ========== TEST 15: Performance ==========
console.log('📋 TEST GROUP 15: Performance');
console.log('─────────────────────────────');

const game15 = new ChessGame();
const startTime = performance.now();

for (let i = 0; i < 1000; i++) {
    const moves = game15.getAllValidMoves();
    if (moves.length > 0) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const from = game15._rowColToAlgebraic(randomMove.from.row, randomMove.from.col);
        const to = game15._rowColToAlgebraic(randomMove.to.row, randomMove.to.col);
        game15.move(`${from}${to}`);
    }
    if (game15.isGameOver()) {
        game15.reset();
    }
}

const endTime = performance.now();
const duration = endTime - startTime;
assert(duration < 5000, `Performance: 1000 moves in ${duration.toFixed(2)}ms`, `Took ${duration.toFixed(2)}ms (should be <5000ms)`);
console.log(`   ⚡ ${(duration / 1000).toFixed(2)}ms per move on average`);

console.log('');

// ========== TEST RESULTS ==========
console.log('═══════════════════════════════════════════════════════════');
console.log('                    TEST RESULTS');
console.log('═══════════════════════════════════════════════════════════');
console.log(`\n✅ PASSED: ${passed}`);
console.log(`❌ FAILED: ${failed}`);
console.log(`📊 TOTAL:  ${passed + failed}`);
console.log(`🎯 RATE:   ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your chess engine is ready for production! 🎉');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
} else {
    console.log('\n⚠️ Some tests failed. Please fix the issues above. ⚠️');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
}