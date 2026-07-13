# @mady9613/chess-engine

Comprehensive chess engine for move validation and game state management.

- **npm:** https://www.npmjs.com/package/@mady9613/chess-engine  
- **Author:** [mady9613](https://www.npmjs.com/~mady9613)

---

## Chess Engine v2.0.0 - Initial Release

A complete chess engine for move validation, FEN support, and utility helpers.

### Highlights

- Full legal move validation for standard chess play.
- FEN loading and exporting for saving or restoring positions.
- Board, notation, and move-history utilities for application integration.
- Promotion, check, checkmate, stalemate, and draw state handling.
- Clean programmatic API for local games, practice modes, and analysis tooling.

---

## Installation

```bash
npm install @mady9613/chess-engine
```

---

## Quick Start

```js
import { ChessGame } from '@mady9613/chess-engine';

const game = new ChessGame();

const move = game.move('e2e4');
console.log(move.success); // true
console.log(move.san);     // "e4"
console.log(game.getFEN()); // Current FEN
```

---

## Main Class: `ChessGame`

### Create game

```js
const game = new ChessGame();           // start position
const gameFromFen = new ChessGame(fen); // from FEN
```

### Common methods

- `move(move, promotionPiece?)`
- `undo()`, `redo()`, `canUndo()`, `canRedo()`
- `reset()`
- `loadFEN(fen)`, `getFEN()`
- `loadPGN(pgn)`, `getPGN()`
- `getBoard()`, `getPieceAt(square)`, `getTurn()`
- `getValidMoves(square)`, `getAllValidMoves()`
- `isValidMove(move)`
- `isCheck()`, `isCheckmate()`, `isStalemate()`, `isDraw()`, `isGameOver()`
- `isThreefoldRepetition()`, `isFiftyMoveRule()`, `isInsufficientMaterial()`
- `getWinner()`, `getResult()`
- `getMoveHistory()`, `getMoves()`, `getLastMove()`, `getMoveCount()`
- `goToMove(index)`, `goToStart()`, `goToEnd()`
- `toJSON()`, `toObject()`, `clone()`, `fromJSON(data)`

### Static utility

- `ChessGame.isValidFEN(fen)`

---

## Move Input Format

Supported move input styles:

- UCI-like string: `"e2e4"`, `"e7e8q"`
- Object format: `{ from: 'e2', to: 'e4' }`
- Object with promotion: `{ from: 'e7', to: 'e8', promotion: 'q' }`

Promotion pieces: `q`, `r`, `b`, `n`

---

## Move Result Shape

`game.move(...)` returns:

```js
{
  success: true,
  san: 'e4',
  piece: 'wp',
  capture: false,
  check: false,
  checkmate: false,
  stalemate: false,
  promotion: null
}
```

If invalid:

```js
{ success: false, error: 'Illegal move' }
```

---

## Named Exports

The package also exposes lower-level helpers from `src/index.js`.

### Validators
- `getValidMoves`
- `getAllLegalMoves`
- `isMoveLegal`
- `isMoveLegalBasic`
- `isMoveLegalQuick`

### Piece move generators
- `getPawnMoves`
- `getKnightMoves`
- `getBishopMoves`
- `getRookMoves`
- `getQueenMoves`
- `getKingMoves`

### Board / notation / FEN utilities
- `getInitialBoardPosition`
- `getEmptyBoard`
- `copyBoard`
- `algebraicToCoord`
- `coordToAlgebraic`
- `isValidCoord`
- `getPieceAt`
- `isSquareAttacked`
- `doesPieceAttackSquare`
- `getSAN`
- `getDetailedSAN`
- `parseSAN`
- `boardToFEN`
- `FENToBoard`
- `getStartingFEN`
- `isValidFEN`

### Core move helpers
- `executeMove`
- `isCaptureMove`
- `isPromotionMove`
- `getMoveSAN`

---

## Example: Validate & Play Loop

```js
import { ChessGame } from '@mady9613/chess-engine';

const game = new ChessGame();
const moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6'];

for (const m of moves) {
  const result = game.move(m);
  if (!result.success) {
    console.log('Invalid:', result.error);
    break;
  }
  console.log(result.san, game.getFEN());
}
```

---

## License

MIT
